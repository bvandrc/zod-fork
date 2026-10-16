import * as core from "../core/index.js";
import { visit } from "../core/visit.js";
import * as schemas from "./schemas.js";

/** Distributes `.strict()` through every object in a schema type, preserving the wrappers around them. */
// biome-ignore format: preserve vertical layout for readability.
export type DeepStrict<T extends core.SomeType> =
  T extends schemas.ZodObject<infer Shape, infer Config>
    ? schemas.ZodObject<{ -readonly [K in keyof Shape]: DeepStrict<Shape[K]> }, Config>
  // Must precede ZodUnion, which it extends structurally, or the subtype is lost.
  : T extends schemas.ZodDiscriminatedUnion<infer Options, infer Disc>
    ? schemas.ZodDiscriminatedUnion<
        { -readonly [I in keyof Options]: Options[I] extends core.SomeType ? DeepStrict<Options[I]> : Options[I] },
        Disc
      >
  : T extends schemas.ZodUnion<infer Options>
    ? schemas.ZodUnion<
        { -readonly [I in keyof Options]: Options[I] extends core.SomeType ? DeepStrict<Options[I]> : Options[I] }
      >
  : T extends schemas.ZodArray<infer El>
    ? schemas.ZodArray<DeepStrict<El>>
  : T extends schemas.ZodTuple<infer Items, infer Rest>
    ? schemas.ZodTuple<
        { -readonly [K in keyof Items]: Items[K] extends core.SomeType ? DeepStrict<Items[K]> : Items[K] },
        Rest extends core.SomeType ? DeepStrict<Rest> : Rest
      >
  : T extends schemas.ZodIntersection<infer A, infer B>
    ? schemas.ZodIntersection<DeepStrict<A>, DeepStrict<B>>
  : T extends schemas.ZodRecord<infer K, infer V>
    ? schemas.ZodRecord<K, DeepStrict<V>>
  : T extends schemas.ZodMap<infer K, infer V>
    ? schemas.ZodMap<K, DeepStrict<V>>
  : T extends schemas.ZodSet<infer El>
    ? schemas.ZodSet<DeepStrict<El>>
  : T extends schemas.ZodOptional<infer Inner>
    ? schemas.ZodOptional<DeepStrict<Inner>>
  : T extends schemas.ZodNullable<infer Inner>
    ? schemas.ZodNullable<DeepStrict<Inner>>
  : T extends schemas.ZodDefault<infer Inner>
    ? schemas.ZodDefault<DeepStrict<Inner>>
  : T extends schemas.ZodPrefault<infer Inner>
    ? schemas.ZodPrefault<DeepStrict<Inner>>
  : T extends schemas.ZodNonOptional<infer Inner>
    ? schemas.ZodNonOptional<DeepStrict<Inner>>
  : T extends schemas.ZodCatch<infer Inner>
    ? schemas.ZodCatch<DeepStrict<Inner>>
  : T extends schemas.ZodReadonly<infer Inner>
    ? schemas.ZodReadonly<DeepStrict<Inner>>
  : T extends schemas.ZodSuccess<infer Inner>
    ? schemas.ZodSuccess<DeepStrict<Inner>>
  : T extends schemas.ZodPromise<infer Inner>
    ? schemas.ZodPromise<DeepStrict<Inner>>
  // Must precede ZodPipe, which both extend structurally, or the subtype is lost.
  : T extends schemas.ZodCodec<infer A, infer B>
    ? schemas.ZodCodec<DeepStrict<A>, DeepStrict<B>>
  : T extends schemas.ZodPreprocess<infer B>
    ? schemas.ZodPreprocess<DeepStrict<B>>
  : T extends schemas.ZodPipe<infer A, infer B>
    ? schemas.ZodPipe<DeepStrict<A>, DeepStrict<B>>
  : T extends schemas.ZodLazy<infer Inner>
    ? schemas.ZodLazy<DeepStrict<Inner>>
  : T;

/**
 * Returns a copy of the schema with every nested object rejecting unknown keys.
 *
 * Objects that already set their own unknown-key handling (`.loose()`, `.catchall()`) keep it.
 */
export function deepStrict<T extends core.SomeType>(schema: T): DeepStrict<T> {
  return visit(schema, {
    object: (s) =>
      s._zod.def.catchall === undefined
        ? core.util.clone(s, core.util.mergeDefs(s._zod.def, { catchall: schemas.never() }))
        : s,
  }) as unknown as DeepStrict<T>;
}
