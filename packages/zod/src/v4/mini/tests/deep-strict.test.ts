import { describe, expect, expectTypeOf, test } from "vitest";
import * as z from "zod/mini";

describe("mini deepStrict", () => {
  test("rejects unknown keys at every level", () => {
    const strict = z.deepStrict(z.object({ a: z.string(), nested: z.object({ b: z.number() }) }));
    expectTypeOf(strict).toExtend<z.ZodMiniObject>();
    expect(z.parse(strict, { a: "x", nested: { b: 1 } })).toEqual({ a: "x", nested: { b: 1 } });
    expect(z.safeParse(strict, { a: "x", nested: { b: 1, extra: 1 } }).success, "nested").toBe(false);
  });

  test("keeps loose objects loose", () => {
    const strict = z.deepStrict(z.object({ loose: z.looseObject({ a: z.string() }) }));
    expect(z.parse(strict, { loose: { a: "x", extra: 1 } })).toEqual({ loose: { a: "x", extra: 1 } });
  });
});
