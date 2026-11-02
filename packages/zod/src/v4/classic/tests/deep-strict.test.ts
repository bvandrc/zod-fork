import { describe, expect, expectTypeOf, test } from "vitest";
import * as z from "zod";

describe("deepStrict", () => {
  const issueCodes = (schema: z.ZodType, input: unknown) => schema.safeParse(input).error?.issues.map((i) => i.code);

  test("rejects unknown keys at every level", () => {
    const strict = z.deepStrict(z.object({ a: z.string(), nested: z.object({ b: z.number() }) }));
    expect(strict.parse({ a: "x", nested: { b: 1 } })).toEqual({ a: "x", nested: { b: 1 } });
    expect(issueCodes(strict, { a: "x", extra: 1, nested: { b: 1 } }), "top level").toEqual(["unrecognized_keys"]);
    expect(issueCodes(strict, { a: "x", nested: { b: 1, extra: 1 } }), "nested").toEqual(["unrecognized_keys"]);
  });

  test("recurses through arrays, records, unions, wrappers and lazy schemas", () => {
    const Leaf = z.object({ id: z.number() });
    const Node: z.ZodType = z.object({ leaf: Leaf, children: z.array(z.lazy(() => Node)) });
    const positions = {
      array: z.array(Leaf),
      record: z.record(z.string(), Leaf),
      union: z.union([Leaf, z.string()]),
      discriminatedUnion: z.discriminatedUnion("id", [z.object({ id: z.literal(1) })]),
      optional: Leaf.optional(),
      default: Leaf.default({ id: 0 }),
      tuple: z.tuple([Leaf]),
    };
    const extra = { id: 1, extra: true };
    const inputs = {
      array: [extra],
      record: { k: extra },
      union: extra,
      discriminatedUnion: extra,
      optional: extra,
      default: extra,
      tuple: [extra],
    } satisfies Record<keyof typeof positions, unknown>;
    for (const [position, schema] of Object.entries(positions)) {
      expect(z.deepStrict(schema).safeParse(inputs[position as keyof typeof inputs]).success, position).toBe(false);
    }
    const strictNode = z.deepStrict(Node);
    expect(strictNode.safeParse({ leaf: { id: 1 }, children: [{ leaf: { id: 2 }, children: [] }] }).success).toBe(true);
    expect(strictNode.safeParse({ leaf: { id: 1 }, children: [{ leaf: extra, children: [] }] }).success, "lazy").toBe(
      false
    );
  });

  test("keeps an object's own unknown-key handling", () => {
    const strict = z.deepStrict(
      z.object({
        loose: z.looseObject({ a: z.string() }),
        catchall: z.object({ a: z.string() }).catchall(z.number()),
      })
    );
    expect(strict.parse({ loose: { a: "x", extra: 1 }, catchall: { a: "x", n: 1 } })).toEqual({
      loose: { a: "x", extra: 1 },
      catchall: { a: "x", n: 1 },
    });
    expect(
      strict.safeParse({ loose: { a: "x" }, catchall: { a: "x", n: "nope" } }).success,
      "catchall still applies"
    ).toBe(false);
  });

  test("intersections accept keys either side declares and reject the rest", () => {
    const strict = z.deepStrict(
      z.object({ both: z.intersection(z.object({ a: z.string() }), z.object({ b: z.string() })) })
    );
    expect(strict.parse({ both: { a: "x", b: "y" } }), "each side sees the other's keys").toEqual({
      both: { a: "x", b: "y" },
    });
    expect(issueCodes(strict, { both: { a: "x", b: "y", c: 1 } }), "a key neither side declares").toEqual([
      "unrecognized_keys",
    ]);
  });

  test("leaves the source schema untouched", () => {
    const schema = z.object({ nested: z.object({ a: z.string() }) });
    z.deepStrict(schema);
    expect(schema.parse({ nested: { a: "x", extra: 1 } })).toEqual({ nested: { a: "x" } });
  });

  test("keeps the schema types", () => {
    const strict = z.deepStrict(
      z.object({ nested: z.object({ a: z.string() }), list: z.array(z.object({ b: z.number() })) })
    );
    expectTypeOf(strict).toExtend<z.ZodObject>();
    expectTypeOf(strict.shape.nested.shape.a).toEqualTypeOf<z.ZodString>();
    expectTypeOf<z.output<typeof strict>>().toEqualTypeOf<{ nested: { a: string }; list: { b: number }[] }>();
    const du = z.deepStrict(z.discriminatedUnion("t", [z.object({ t: z.literal("a") })]));
    expectTypeOf(du).toExtend<z.ZodDiscriminatedUnion>();
  });
});
