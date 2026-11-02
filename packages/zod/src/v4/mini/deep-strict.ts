import * as core from "../core/index.js";
import { visit } from "../core/visit.js";
import * as schemas from "./schemas.js";

/** Mini counterpart of `classic/deep-strict.ts`'s `DeepStrict`. */
// biome-ignore format: preserve vertical layout for readability.
export type DeepStrict<T extends core.SomeType> =
  T extends schemas.ZodMiniObject<infer Shape, infer Config>
    ? schemas.ZodMiniObject<{ -readonly [K in keyof Shape]: DeepStrict<Shape[K]> }, Config>
  // Must precede ZodMiniUnion, which it extends structurally.
  : T extends schemas.ZodMiniDiscriminatedUnion<infer Options, infer Disc>
    ? schemas.ZodMiniDiscriminatedUnion<
        { -readonly [I in keyof Options]: Options[I] extends core.SomeType ? DeepStrict<Options[I]> : Options[I] },
        Disc
      >
  : T extends schemas.ZodMiniUnion<infer Options>
    ? schemas.ZodMiniUnion<
        { -readonly [I in keyof Options]: Options[I] extends core.SomeType ? DeepStrict<Options[I]> : Options[I] }
      >
  : T extends schemas.ZodMiniArray<infer El>
    ? schemas.ZodMiniArray<DeepStrict<El>>
  : T extends schemas.ZodMiniTuple<infer Items, infer Rest>
    ? schemas.ZodMiniTuple<
        { -readonly [K in keyof Items]: Items[K] extends core.SomeType ? DeepStrict<Items[K]> : Items[K] },
        Rest extends core.SomeType ? DeepStrict<Rest> : Rest
      >
  : T extends schemas.ZodMiniIntersection<infer A, infer B>
    ? schemas.ZodMiniIntersection<DeepStrict<A>, DeepStrict<B>>
  : T extends schemas.ZodMiniRecord<infer K, infer V>
    ? schemas.ZodMiniRecord<K, DeepStrict<V>>
  : T extends schemas.ZodMiniMap<infer K, infer V>
    ? schemas.ZodMiniMap<K, DeepStrict<V>>
  : T extends schemas.ZodMiniSet<infer El>
    ? schemas.ZodMiniSet<DeepStrict<El>>
  : T extends schemas.ZodMiniOptional<infer Inner>
    ? schemas.ZodMiniOptional<DeepStrict<Inner>>
  : T extends schemas.ZodMiniNullable<infer Inner>
    ? schemas.ZodMiniNullable<DeepStrict<Inner>>
  : T extends schemas.ZodMiniDefault<infer Inner>
    ? schemas.ZodMiniDefault<DeepStrict<Inner>>
  : T extends schemas.ZodMiniPrefault<infer Inner>
    ? schemas.ZodMiniPrefault<DeepStrict<Inner>>
  : T extends schemas.ZodMiniNonOptional<infer Inner>
    ? schemas.ZodMiniNonOptional<DeepStrict<Inner>>
  : T extends schemas.ZodMiniCatch<infer Inner>
    ? schemas.ZodMiniCatch<DeepStrict<Inner>>
  : T extends schemas.ZodMiniReadonly<infer Inner>
    ? schemas.ZodMiniReadonly<DeepStrict<Inner>>
  : T extends schemas.ZodMiniSuccess<infer Inner>
    ? schemas.ZodMiniSuccess<DeepStrict<Inner>>
  : T extends schemas.ZodMiniPromise<infer Inner>
    ? schemas.ZodMiniPromise<DeepStrict<Inner>>
  // Must precede ZodMiniPipe, which it extends structurally.
  : T extends schemas.ZodMiniCodec<infer A, infer B>
    ? schemas.ZodMiniCodec<DeepStrict<A>, DeepStrict<B>>
  : T extends schemas.ZodMiniPipe<infer A, infer B>
    ? schemas.ZodMiniPipe<DeepStrict<A>, DeepStrict<B>>
  : T extends schemas.ZodMiniLazy<infer Inner>
    ? schemas.ZodMiniLazy<DeepStrict<Inner>>
  : T;

/** See `classic/deep-strict.ts`. */
export function deepStrict<T extends core.SomeType>(schema: T): DeepStrict<T> {
  return visit(schema, {
    object: (s) =>
      s._zod.def.catchall === undefined
        ? core.util.clone(s, core.util.mergeDefs(s._zod.def, { catchall: schemas.never() }))
        : s,
  }) as unknown as DeepStrict<T>;
}
