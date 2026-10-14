<!--
lesson-meta: {"practicePrompt":"Take one fetch call you own: route the response through unknown, validate it with a Zod schema and z.infer, and brand the id type so the classic swapped-string-ids bug becomes a compile error. Then rewrite a boolean-soup state object as a discriminated union with a never-based exhaustive switch, add a new variant, and count every place the compiler flags — that count is the value of the pattern.","checkPrompt":"Without notes, state the four-way difference between annotation, satisfies, as and as const on the same object literal, and explain why a lying type predicate or a parse<T>(json): T generic compiles anyway. Define in one sentence each: assignable, widening, narrowing, discriminated union, exhaustiveness, type predicate and branded type — and say where the checker's known unsoundness lives (covariant arrays, bivariant methods, assertions)."}
-->
<!-- lesson-theory: {"problem":"Without this model TypeScript reads as an unreliable horror: types lie at boundaries, errors look like noise, and any plus assertions hide the bugs the compiler was supposed to catch. The cost lands at runtime, in production, exactly where you thought you were safe — because nobody could say where checking stops.","model":"TypeScript is a compile-time system for describing sets of JavaScript values: it checks your program against those sets, then erases itself completely. Types are sets — assignability is subset inclusion, unknown is the universal set, never the empty set, any a hole that silences the checker transitively — and structural typing means shape, not names. Senior practice is three questions asked constantly: what values can actually be here at runtime, what can the compiler prove at this exact point of control flow, and where does untrusted data enter — because types offer zero runtime protection there.","mechanics":"Two programs per file: the runtime JavaScript and the type program checked then deleted, so tsc is the only checker while bundlers merely strip types. Set semantics: unions, intersections, literal singletons, unknown, never and any, with strictNullChecks removing null and undefined from every set. Structural typing with two declaration spaces (a value and a type may share one name), excess property checking only on fresh object literals, and private fields making classes partially nominal. Control-flow narrowing: typeof, instanceof, in and truthiness, discriminated unions, exhaustive never switches, type predicates and assertion functions whose word the compiler takes — with narrowing that does not survive into closures over let. The pin-down quartet: annotation widens, satisfies checks and keeps the narrow type, as asserts with the proof on you, as const freezes the deepest literals — plus widening as the default behavior to manage. Type-level toolbox: constraints via K extends keyof T, indexed access T[K], distribution over naked type parameters, infer, mapped types with key remapping, template literal types, shallow Partial and Readonly, Omit's unconstrained keys. Boundaries: validate once at the edge with Zod and z.infer, brand the validated result with one quarantined assertion, respect the erasable-syntax limits (enums, namespaces, parameter properties), and run the strict bundle plus tsc --noEmit in CI with typescript-eslint catching floating promises.","pitfalls":["Believing an API response typed User is a User before runtime validation.","Reaching for any where unknown plus narrowing is the honest move.","Expecting private or readonly to do anything at runtime.","Casting Object.keys(obj) to keyof typeof obj and calling it sound.","Trusting arr[0] without noUncheckedIndexedAccess.","Writing parse<T>(json): T — an assertion wearing a generic costume.","Making a type parameter appear only in the return position.","Forgetting that Partial and Readonly are shallow.","Suppressing with @ts-ignore instead of @ts-expect-error and letting stale suppressions rot.","Fighting the model with as unknown as T instead of fixing the types."],"whenNot":"The lesson covers the language and its toolchain, not any framework's typing conventions (React, Angular and Nest appear only as class- and decorator-context). It explicitly does not promise soundness — it names the holes — and it does not prescribe schema validation between your own internal functions, only at trust boundaries; where the honest answer is team consistency, it says so instead of picking sides."} -->

# TypeScript: A Senior Practitioner's Lesson

## The Thesis

If you remember one sentence, make it this:

> **TypeScript is a compile-time system for describing sets of JavaScript values. It checks your program, then erases itself completely.**

Senior TypeScript work is not about memorizing clever type tricks. It's about three questions, asked constantly:

1. **What values can actually be here at runtime?**
2. **Can the compiler *prove* what I think it knows, at this exact point in the control flow?**
3. **Where does untrusted data enter, and have I validated it there — or am I lying to the compiler?**

Everything below is in service of those three questions.

---

## Part I — The Mental Model

### 1. Two programs, one file

Every `.ts` file contains two superimposed programs:

- The **runtime program**: values, functions, classes — actual JavaScript that executes.
- The **type program**: a description of which sets of values may flow where, checked statically, then **deleted**.

```ts
type User = { id: string; name: string };

function greet(user: User): string {
  return `Hello ${user.name}`;
}
```

Compiles to roughly:

```js
function greet(user) {
  return `Hello ${user.name}`;
}
```

There is no `User` at runtime. No reflection, no registry, no way to ask "is this a `User`?" unless *you* write runtime code that checks. The compiler (parser → binder, which builds symbols and control-flow graphs → checker → emitter) verifies the type program and emits JS plus optionally `.d.ts` declaration files and source maps.

**Consequences seniors internalize:**

- `tsc` is the only common tool that *type-checks*. Vite, esbuild, swc, and Babel merely **strip types syntactically** — fast, but they will happily compile nonsense. That's why real projects run `tsc --noEmit` separately in CI even when a bundler builds the app.
- Types offer **zero runtime protection**. An API response typed as `User` is a `User` only in your imagination until validated (Part IV).
- Some syntax *can't* be merely stripped because it generates JS: enums, namespaces, constructor parameter properties. Modern tooling (including Node's native type-stripping, which only supports "erasable" syntax; TS 5.8 added an `erasableSyntaxOnly` flag to enforce this) pushes you away from those features. More in Part IV.

### 2. Types are sets of values

This is the single most productive mental model. Read `A extends B` and `x: A` assignability as set inclusion: **A is assignable to B iff every value of A is also a value of B — A ⊆ B.**

- **Union** `A | B` = set union ("or"). `'idle' | 'loading'` is the set of two strings.
- **Intersection** `A & B` = set intersection ("and"). `{ id: string } & { admin: true }` has both.
- **`unknown`** = the universal set. Everything is assignable *to* it; nothing can be done with it until narrowed. It's the honest type for "data from outside."
- **`never`** = the empty set. Assignable to everything; nothing (except `never`) is assignable to it. Functions that always throw return `never`.
- **`any`** = a hole in the universe. Assignable to and from everything, and it *silences the checker transitively* — operations on `any` produce `any`. It's not a type; it's an opt-out.
- Literal types are singleton sets: `'idle'` is the set containing one string, and `'idle' ⊆ string`, which is why a literal is assignable where a `string` is expected but not vice versa.

When an error says *"Type X is not assignable to type Y,"* translate: "the compiler found a value in set X that isn't in set Y." That translation makes most intimidating errors mundane.

`strict` mode's `strictNullChecks` just removes `null` and `undefined` from every set by default, so `string` no longer secretly includes them. Before that flag existed (pre-TS 2), null-dereference was TypeScript's billion-dollar inheritance from JS.

### 3. Structural typing (duck typing, formalized)

Java and C# are **nominal**: two classes with identical fields are different types because they have different *names*. TypeScript is **structural**: only the *shape* matters.

```ts
type Point = { x: number; y: number };
type Vector = { x: number; y: number };

const p: Point = { x: 1, y: 2 };
const v: Vector = p; // fine — same shape, name irrelevant
```

Extra properties are normally fine too: a value with *more* than the target shape is still a member of the target set. The one exception is **excess property checking** on *fresh object literals* — a usability guard, not a soundness rule:

```ts
const config = { host: "x", prot: 8080 }; // typo lives here
connect(config); // OK — structural, no complaint

connect({ host: "x", prot: 8080 }); // Error: 'prot' is not a known property
```

Same values, different verdicts — because freshness is about catching typos at the call site. Seniors recognize this asymmetry instead of being confused by it.

Two corollaries worth knowing for interviews and code review:

- TypeScript has **two declaration spaces**: types and values are separate namespaces. That's why this idiom works — a value `Role` and a type `Role` coexist:

```ts
const Role = { Admin: "admin", User: "user" } as const;
type Role = (typeof Role)[keyof typeof Role]; // "admin" | "user"
```

- Classes create *both* a value (the constructor) and a type (the instance shape). Interfaces create only a type. Members declared with TS's `private` keyword make a class partially **nominal** — two structurally identical classes with a `private` field from different declarations are incompatible, because the field's *origin* matters.

### 4. TypeScript is deliberately unsound

A *sound* type system guarantees that well-typed programs can't have certain runtime errors. TypeScript **chooses not to be sound** — it chooses to model real JavaScript idioms productively. Knowing the known holes is senior-level knowledge:

**Covariant mutable arrays:**
```ts
type Animal = { name: string };
type Dog = Animal & { goodBoy: boolean };

const dogs: Dog[] = [];
const animals: Animal[] = dogs;      // allowed, but unsound
animals.push({ name: "Whiskers" });   // a "cat" is now in Dog[]
```

**Method bivariance:** under `strictFunctionTypes`, function-type parameters are checked *contravariantly* (sound direction), but parameters of methods declared with method syntax are *bivariant* (either direction accepted) for compatibility with common JS patterns.

**`any`, type assertions, and type predicates** are all places where *you* assert and the compiler trusts you (Part II.9–10).

Don't fight this. The design goal — stated by the team for a decade — is a pragmatic balance. Your job is to know where the holes are and not fall in casually.

---

## Part II — The Everyday Language (90% of your work)

### 5. The primitive landscape, with the traps marked

- `string`, `number` (IEEE-754 double; `NaN` is a `number`; integers don't exist as a type), `bigint`, `boolean`, `symbol`, `null`, `undefined`. Use the lowercase spellings; `String`, `Number`, `Boolean` are boxed wrapper object types — almost never what you want.
- **`void`**: "return value is ignored." Subtly *not* the same as `undefined`: a `() => void` slot accepts a function returning anything, because callers promise to ignore it. This bites people who assume `void` means "returns undefined."
- **`object`**: any non-primitive. Prefer concrete shapes.
- **`{}`**: "any non-nullish value" — includes `'string'`! Avoid as an annotation; you almost always mean `Record<string, unknown>` or `object`. Likewise avoid the bare `Function` type and `any[]` where `unknown[]` is honest.
- Catch variables are `unknown` under `strict` (`useUnknownInCatchVariables`): `catch (e) { e instanceof Error ? e.message : String(e) }` is the idiomatic dance.
- `JSON.parse` returns `any`. Immediately laundering it — `const data: unknown = JSON.parse(raw)` — is a senior reflex.

### 6. Objects: `type` vs `interface`, optional, readonly

For object shapes, `type` aliases and `interface` are ~95% interchangeable today. Real differences:

| | `interface` | `type` |
|---|---|---|
| Unions, tuples, mapped/conditional types | ✗ | ✓ |
| **Declaration merging** (same name re-opened and merged) | ✓ | ✗ |
| `extends` performance in huge codebases | slightly better (cached relationships) | intersections recomputed |

House rule that most teams converge on: **interface for public object shapes you might extend or merge; type for everything else.** The contested dogma matters less than team consistency. Legacy giveaway: prefixing interfaces with `I` (`IUser`) — that's imported C# style, now broadly considered noise.

Key modifiers and their precise meanings:

- `readonly x: string` — *shallow*, compile-time only. Prevents reassignment through *this* reference; doesn't freeze anything, doesn't affect nested objects, doesn't exist at runtime. Still valuable: marking function parameters `readonly T[]` advertises "I won't mutate your array," and `T[]` is assignable to `readonly T[]` (not the reverse).
- `x?: string` means the property **may be absent**. Under the opt-in `exactOptionalPropertyTypes`, that's distinguished from `x: string | undefined` (present but undefined). Most codebases don't enable it — it fights with common library types — but know the distinction exists.
- **Index signatures**: `{ [key: string]: unknown }`, a.k.a. `Record<string, unknown>`. All named properties must conform to the index type. And remember `Object.keys(obj)` returns `string[]`, *not* `(keyof typeof obj)[]` — deliberately, because at runtime the object may carry extra properties. Casting that result is a small lie seniors notice in review.

### 7. Arrays and tuples

`T[]` and `Array<T>` are identical; the postfix form dominates. A **tuple** is a fixed-length, positionally-typed array: `[string, number]`. Labeled tuples (`[id: string, count: number]`) are documentation the compiler shows in tooltips — use labels. Rest/spread in tuple types (`[...prefix: string[], last: number]`) powers a lot of library typing. Under `noUncheckedIndexedAccess` — an opt-in flag beyond `strict` that many senior teams enable — `arr[0]` has type `T | undefined`, which is runtime-honest but noisy with known-safe indexing.

### 8. Functions

- Annotate **parameters**; let **return types infer** for internal functions, but write explicit return types on exported/public APIs. Inference leaking across a module boundary makes refactors silently change your public contract, slows declaration emit, and produces unreadable errors for consumers.
- **Overloads** exist (multiple call signatures, one implementation signature that is *not itself callable*), but prefer union parameters or generics. Reach for overloads mainly when the return type genuinely depends on argument *types* in a way unions can't express, and in library typings.
- A generic that appears only in the return position is a red flag:

```ts
function parse<T>(json: string): T { return JSON.parse(json); } // lie
```
The caller can demand *any* `T` and the compiler believes it. This is an assertion wearing a generic costume. Fine as a deliberate, contained escape hatch; sloppy as a habit. **Rule of thumb: a type parameter should appear at least twice** (two parameters, or parameter + return), tying things together — that's what generics are *for*.

### 9. Narrowing: where seniors actually live

The checker performs **control flow analysis**: it tracks how a value's type refines through branches. The toolkit:

- `typeof x === "string"` (beware: `typeof null === "object"`, arrays are `"object"` — use `Array.isArray`)
- `instanceof` for classes, `Date`, `Error`
- `in` operator for discriminating unions by property presence
- truthiness (also eliminates `""`, `0`, `NaN` — sometimes more than you wanted)
- equality checks against literals and other variables
- **discriminated unions** — the crown jewel:
- custom **type predicates** and **assertion functions**

The pattern that separates professional TypeScript from typed JavaScript is **making illegal states unrepresentable**. Sloppy:

```ts
interface State { isLoading: boolean; error?: Error; data?: User[] }
```
Four booleans-and-optionals encode ~a dozen combinations, most invalid: loading *and* error? data *and* loading? The type permits nonsense, so every consumer defensively checks. Professional:

```ts
type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: User[] }
  | { status: "error"; error: Error };

switch (state.status) {
  case "success": return render(state.data); // data provably exists here
  // ...
  default:
    const _exhaustive: never = state; // compile error when a variant is added
    throw new Error(`Unhandled state: ${JSON.stringify(_exhaustive)}`);
}
```

That `never` assignment is **exhaustive checking**: add a `"retrying"` variant next year and every non-exhaustive `switch` in the codebase turns red at compile time. This is the vocabulary word — *exhaustiveness* — you'll hear in good reviews.

Custom guards bridge runtime checks into the type world:

```ts
function isUser(x: unknown): x is User {           // type predicate
  return typeof x === "object" && x !== null && "id" in x;
}
function assertUser(x: unknown): asserts x is User { // assertion function
  if (!isUser(x)) throw new Error("Not a user");
}
```

Understand: **the compiler takes your word** in that `x is User`. A predicate that lies compiles beautifully. Guards are assertions with homework attached. (Since TS 5.5, simple arrow predicates like `.filter(x => x !== undefined)` get their predicate *inferred* automatically — nice, but not magic; it only fires for simple directly-returned boolean expressions.)

One more flow nuance that surprises everyone once: narrowing on a mutable `let` **does not survive into closures**, because the callback might run after reassignment. `const` bindings keep their narrowing. Prefer `const` is not just style advice here.

### 10. The four ways to pin down a value — know the differences cold

This quartet is probably the most-asked senior distinction:

```ts
const a: Config = { theme: "dark" };        // (1) annotation
const b = { theme: "dark" } satisfies Config; // (2) satisfies
const c = { theme: "dark" } as Config;       // (3) assertion
const d = { theme: "dark" } as const;        // (4) const assertion
```

1. **Annotation** — checks assignability, then the variable's type *is* `Config`. Specific literal info is **widened away** (`b.theme`-style precision lost; `theme` becomes `string`).
2. **`satisfies`** (TS 4.9) — checks assignability but keeps the *inferred, narrow* type. The canonical win: `const palette = { red: [255,0,0], green: "#00ff00" } satisfies Record<string, string | number[]>` — validated against the contract, yet `palette.red` is still `number[]`, so `.map` works. With an annotation it would be `string | number[]` and `.map` would error.
3. **`as`** — an *assertion*: no real checking (only a weak "comparability" sanity check), no runtime effect, no conversion (`x as number` does not do `Number(x)`). It moves the proof obligation from the compiler to you. Legit uses: values the compiler can't model after you've genuinely validated them, DOM APIs (`document.querySelector<HTMLInputElement>("#x")` — though narrow with `instanceof` when you can), test setup. The double assertion `as unknown as T` is a code smell that should always carry a comment. The non-null assertion `foo!` is the same bargain in miniature: fine when an invariant is truly guaranteed (and often better replaced by an explicit `if (!foo) throw`), a bug farm when sprinkled to silence errors.
4. **`as const`** — infers the *deepest literal type*: readonly properties, literal strings, readonly tuples. The way to build runtime enums-with-types (the `Role` idiom in §3).

**Widening** is the default behavior to manage: `let s = "hi"` gives `string`; `const s = "hi"` gives `"hi"`; `{ status: "idle" }` widens the property to `string` because object properties are mutable. `as const`, literal context, and generic `const` type parameters (TS 5.0's `<const T>`, which makes a generic infer as if `as const`) are your widening controls.

---

## Part III — Generics and the Type-Level Toolbox

### 11. Generics, properly

A generic function is a function *over types*, with the type inferred from arguments:

```ts
function pluck<T, K extends keyof T>(rows: readonly T[], key: K): T[K][] {
  return rows.map(r => r[key]);
}
pluck(users, "name"); // string[] — T and K solved by inference
```

Vocabulary, used precisely:

- `extends` in `K extends keyof T` is a **constraint**: K must be a key of T. Inference failure usually means the constraint is doing its job.
- **Indexed access** `T[K]` — the type of property `K` on `T`. `keyof T` — the union of T's keys.
- **Generic defaults** (`T = string`) and descriptive parameter names: `T`/`K`/`V` for tiny scopes, `TItem`, `TInput` when scope grows. Single letters stop being cute past ten lines.
- `NoInfer<T>` (TS 5.4) marks a position as "use for checking, don't infer from here" — library-author territory, but recognize it.
- **Variance annotations** (TS 4.7): type parameters in interfaces/type aliases can be marked `in`/`out` (contravariant/covariant) to state and check how subtyping flows, e.g. `interface Producer<out T>`. You mostly *read* these in library types.

Don't over-genericize. A generic used once is often a concrete type pretending to be flexible, and it taxes every reader. The senior instinct is: concrete first, generic when two call sites genuinely share structure.

### 12. The type-level programming language

TypeScript's type system is a (Turing-complete, please-don't) functional language evaluated at compile time. You need to *read* it fluently; you should *write* it rarely and reluctantly.

**Conditional types** — `T extends U ? X : Y`. When the checked type is a *naked type parameter*, conditionals **distribute** over unions:

```ts
type ToArray<T> = T extends unknown ? T[] : never;
type R = ToArray<string | number>; // string[] | number[]
```
Wrapping in tuples — `[T] extends [unknown] ? ...` — disables distribution. This distribution gotcha explains a third of all "weird" library types, and `boolean` distributing into `true | false` is the classic trap.

**`infer`** — pattern-match and extract a sub-type inside a conditional:

```ts
type ElementOf<T> = T extends readonly (infer U)[] ? U : never;
type ReturnOf<F> = F extends (...args: never[]) => infer R ? R : never;
```
This is how `ReturnType`, `Parameters`, `Awaited` are built.

**Mapped types** — transform object types key-by-key, with `+`/`-` modifiers for `readonly` and `?`, and key remapping via `as` (TS 4.1):

```ts
type Nullable<T> = { [K in keyof T]: T[K] | null };
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K]
};
```

**Template literal types** — string manipulation at the type level: `` type Route = `/users/${number}` ``, with intrinsics `Uppercase`, `Capitalize`, etc. Powers router/ORM typings; also the fastest route to unreadable code and slow compiles when abused.

**Built-in utilities** you should know by implementation, not just name: `Partial`, `Required`, `Readonly`, `Pick`, `Record`, `Exclude`, `Extract`, `NonNullable`, `ReturnType`, `Parameters`, `Awaited`, `InstanceType`. Caveats seniors cite: `Partial`/`Readonly` are **shallow**; `Omit` is built on `Pick`+`Exclude` and its key parameter is *not* constrained to keys of `T`, so typos in `Omit<T, "nmae">` silently do nothing.

Type complexity has real cost: deep conditional recursion hits instantiation limits ("Type instantiation is excessively deep and possibly infinite") and can make IDE hover take seconds. In public APIs, prefer boring overloads or interfaces over a 40-line conditional — your consumers' editors will thank you. A handy debugging trick: `type Prettify<T> = { [K in keyof T]: T[K] } & {};` forces the IDE to display an expanded, flattened shape.

---

## Part IV — Boundaries, Legacy Features, and the Real World

### 13. The runtime boundary: where senior TypeScript is won or lost

Types end at every system edge: network, disk, `localStorage`, URL params, environment variables (`process.env.X` is `string | undefined` — hence the many dubious `!`s), user input, third-party webhooks. The professional pattern is **validate once at the boundary, then trust internally**:

```ts
const data: unknown = await response.json();  // launder the `any`
const user = UserSchema.parse(data);           // throws if shape is wrong
// from here, `user: User` is *earned*, not asserted
```

The mainstream way to do this is a schema library — **Zod** is the default choice (alternatives: Valibot, ArkType) — where one schema is the single source of truth and the static type is *derived*: `type User = z.infer<typeof UserSchema>`. Hand-written type guards are fine for small cases; the principle (parse, don't validate-and-hope) is what matters. Trade-off to articulate: schema libraries cost bundle size and a parsing pass; pay it at trust boundaries, not between your own functions.

**Branded types** recover a little *nominal* typing where a primitive needs identity:

```ts
type Branded<T, B> = T & { readonly __brand: B };
type UserId = Branded<string, "UserId">;

function toUserId(raw: string): UserId {
  if (!raw.startsWith("usr_")) throw new Error("Bad id");
  return raw as UserId; // the one justified assertion: validation happened above
}
```

Now `getUser(id: UserId)` can't be called with an arbitrary `string` or, worse, an `OrderId` — the classic "two string IDs swapped" bug becomes a compile error. The cast is quarantined to the single creation point where checking occurred. That's the pattern: *assertions concentrated at validated boundaries, never scattered.*

### 14. Classes, enums, namespaces, decorators — the legacy minefield

TypeScript predates several ES standards, and its early inventions now range from "fine" to "avoid in new code":

- **Classes**: real JS classes plus types. `public`/`private`/`protected`/`readonly` modifiers are TS-only: `private` is **compile-time only** — the property is fully accessible at runtime (`(u as any).db` works). Use it as a signal, or use ECMAScript `#private` when you need genuine runtime privacy (note `#private` has different semantics: brand-checked, invisible to reflection/JSON). `implements` only *checks* a class against an interface; it adds nothing. `abstract` classes are both a runtime base and a type. Prefer plain objects and functions unless you need identity, `instanceof`, or a framework demands classes — this remains genuinely contested, framework-dependent territory (Angular/Nest are class-centric; React has moved away).
- **Enums**: *legacy-leaning*. Numeric enums emit a real runtime object with reverse mappings; they're not erasable syntax, they behave oddly with `isolatedModules`, and they interop poorly with string-based data. The modern default is a **union of literals** (`type Status = "idle" | "done"`) when you only need the type, or the `const` object + `typeof` idiom (§3) when you need runtime values. `const enum` is effectively deprecated by tooling constraints — avoid.
- **Namespaces**: pre-ES-modules organization. Dead for application code (use ES modules); you'll still meet them in `.d.ts` files and global library typings.
- **Constructor parameter properties** (`constructor(private repo: Repo) {}`): non-erasable shorthand that declares *and* assigns a property. Compact, but magic; many modern style guides (and the erasable-syntax direction) say write the field explicitly. Framework DI systems are the exception that keeps it alive.
- **Decorators**: two incompatible species. The old `experimentalDecorators` (with `reflect-metadata`) underpins Angular, Nest, TypeORM — alive and entrenched *in those ecosystems*. The TC39 **standard decorators** are supported by TS 5.0+ and are the future, but framework support is still catching up. "Which decorators?" is a framework question, not a language question — check before opining.

### 15. Modules, declarations, and shipping types

- Use **ES modules** everywhere modern. `import type { User }` (or inline `import { type User, fetchUser }`) for type-only imports — required correctness under `isolatedModules`/`verbatimModuleSyntax`, because a per-file transpiler can't know a name is type-only and might emit a broken runtime import.
- **`.d.ts` files** are type-only declarations: how libraries ship types, how you type untyped JS (`declare module "*.svg" { ... }`), ambient globals, and Vite's `ImportMetaEnv`. For libraries, the package's `exports` map needs a `"types"` condition (first, or resolvers miss it); older packages rely on `@types/*` from DefinitelyTyped — when you install `@types/node` you're consuming community-authored declarations.
- **Declaration merging / module augmentation** (`declare module "express" { interface Request { user?: User } }`) is the sanctioned way to extend others' types — powerful, and a global-pollution hazard, so scope it deliberately and put it in a dedicated file.
- Suppress with **`@ts-expect-error`**, not `@ts-ignore`: if the error disappears, `expect-error` itself errors, so stale suppressions can't rot in place. `@ts-nocheck` on a whole file is a migration confession, not a destination.

### 16. `tsconfig` and tooling as actually practiced

`strict: true` is a *bundle*: `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictPropertyInitialization`, `useUnknownInCatchVariables`, and friends. Non-negotiable for new code; adopting it incrementally in a legacy codebase (per-file, tightening over time) is a normal senior project. Beyond `strict`, know these by effect:

- `noUncheckedIndexedAccess` — indexing yields `T | undefined`. Runtime-honest; expect friction.
- `exactOptionalPropertyTypes` — distinguishes absent from `undefined`. Principled; fights much of the ecosystem. Genuinely "it depends."
- `verbatimModuleSyntax` + `isolatedModules` — enforce type-import hygiene; standard in modern templates.
- `module` / `moduleResolution` — must match your runtime: `"bundler"` for Vite-style apps, `"NodeNext"` when authoring for Node, where file extensions in imports become mandatory. Copying a config across these contexts is a classic source of a wasted afternoon.
- `target` (syntax level emitted) vs `lib` (which ambient APIs — `DOM`, `ES2022` — the checker assumes). They are independent knobs; confusing them causes "Property 'at' does not exist" mysteries.
- `skipLibCheck: true` — nearly universal; checking every dependency's internal consistency is slow and noisy. Know it also hides real errors *in your own* `.d.ts` files.

The daily toolchain: **`tsc --noEmit`** for truth; **typescript-eslint** (successor to the long-dead TSLint) with type-aware rules — `no-floating-promises` and `no-misused-promises` catch a whole species of async bug that the compiler alone allows; **Prettier** (or the fast-rising Biome) so formatting is never a review topic; **Vitest/Jest** for tests, with `expectTypeOf`/`tsd` when the *types themselves* are the product; **tsx** to run TS in dev (successor to the slower, ESM-painful `ts-node`). For libraries: `tsc` declaration emit or `tsup`-style bundlers, plus explicit types on exports (required by the emerging `isolatedDeclarations` fast-path for generating `.d.ts` without a full checker).

One direction to be aware of: Microsoft is porting the compiler to Go (the `tsgo` preview, slated to become TypeScript 7) for roughly an order-of-magnitude speed-up. Same language, faster engine — don't learn a new dialect, but expect "the type-check takes 4 minutes" to stop being an acceptable excuse.

---

## Part V — Practice: Good vs. Sloppy, and Judgment Calls

### 17. The same function, twice

Sloppy (compiles, lies three times):

```ts
async function getUser(id: any): Promise<any> {
  const res = await fetch(`/api/users/${id}`);
  return res.json() as any;
}
```

Credible:

```ts
async function getUser(id: UserId): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data: unknown = await res.json();
  return UserSchema.parse(data); // boundary validated; type earned
}
```

The differences are the whole lesson: precise input type (branded ID), `unknown` at the boundary, validation instead of assertion, failures handled explicitly. Note also what credible code *doesn't* do: no assertion on `document.title!` equivalents, no gratuitous generics, no `any` "for flexibility."

Review vocabulary you'll hear (and can now use): *"that assertion moves the proof obligation onto us"* · *"this widens to `string` at the boundary"* · *"make the illegal state unrepresentable"* · *"validate once, brand the result"* · *"that generic appears once — simplify"* · *"add the `never` check so the next variant breaks here, loudly."*

### 18. The contested "it depends" list — with senior defaults

- **`interface` vs `type`** → Consistency wins; interfaces for extensible public object shapes, `type` for unions/compositions. Anyone dogmatic either way is selling something.
- **Enum vs union** → Union (or `as const` object) by default; enums only to match an existing codebase/framework convention.
- **Is `any` ever OK?** → During JS migration, at genuinely dynamic seams (plugin systems), in test mocks — localized, commented, with lint disabled *on that line*. `unknown` is the default for "I don't know yet"; `any` is "I've decided not to care," and should look like a decision.
- **Assertions (`as`, `!`)** → Acceptable where the invariant is provable by a human and inexpressible to the checker (DOM structure your HTML guarantees, post-validation branding). Unacceptable as error-silencers. In tests, latitude expands.
- **Stricter-than-strict flags** → `noUncheckedIndexedAccess` earns its noise in data-heavy code; `exactOptionalPropertyTypes` often doesn't survive contact with third-party types. Evaluate per codebase, not per ideology.
- **Schema validation everywhere?** → At trust boundaries, yes. Between your own functions, types suffice; duplicating schemas internally is cost without safety.
- **`Result` types vs exceptions** → Exceptions for unrecoverable/programmer errors; explicit `Result<T, E>` discriminated unions for *expected* failures callers must handle (validation, not-found, payment declined). Codebase consistency matters more than the choice.
- **Type-level cleverness** → Every conditional/mapped type is a maintenance tax on future readers and compile times. The senior question is never "can I compute this type?" but "will the person debugging this at 2 a.m. curse my name?" Usually: derive types from a single source (`z.infer`, `typeof`, `keyof`) rather than hand-computing parallel hierarchies that drift apart.

### 19. Debugging type errors like a practitioner

1. **Read the last lines first.** TS errors are chains: the outermost line is the crime scene, the indented tail is the motive. The actual mismatch is usually deepest.
2. **Hover both sides** and expand: assign temporary names — `const check: Target = source;` — to force a clean, minimal error message.
3. **Flatten for inspection** with the `Prettify<T>` mapped-type trick when faced with impenetrable intersections or giant conditional results.
4. **Bisect conditionals.** When a conditional type misbehaves, test each branch with literal inputs (`type T1 = MyType<"a">`) and check whether unwanted *distribution* is the culprit.
5. **Suspect widening and freshness** before suspecting the checker: literal became `string`? Fresh literal tripping excess property checks where the variable version passes? These explain a quarter of beginner confusion.

Common footguns, rapid-fire: assuming `private`/`readonly` do something at runtime · `Object.keys` cast to `keyof` · `arr[0]` trusted without `noUncheckedIndexedAccess` · non-null assertions on `process.env` and `querySelector` · `catch (e) { e.message }` on an `unknown` · believing `Partial` is deep · mutating a `readonly` array through a second, mutable alias · reaching for `as unknown as T` instead of fixing the model · forgetting that `tsconfig` `types`/`lib` settings silently change which globals exist (`DOM` types leaking into a Node project, or vice versa).

### 20. Current vs. legacy, in one view

| Legacy / fading | Current default |
|---|---|
| TSLint | typescript-eslint |
| Enums, `const enum` | Literal unions, `as const` objects |
| Namespaces for app code | ES modules |
| Parameter properties | Explicit fields (framework DI excepted) |
| `experimentalDecorators` | Standard decorators (framework adoption pending) |
| `ts-node` | `tsx`, native type-stripping |
| `@ts-ignore` | `@ts-expect-error` |
| `React.FC<Props>` (implicit `children`, awkward generics) | Plain function with an explicit props type; `ReactNode` for children |
| Hand-maintained DTO types + hope | Schema-derived types at boundaries |
| Non-strict, or strict someday | `strict` from day one, opt-ins evaluated deliberately |

---

## Exercises (do these; they're the lesson in disguise)

1. **Model, don't boolean.** Rewrite `{ loading: boolean; user?: User; error?: string }` as a discriminated union and write a renderer with a `never`-based exhaustive `switch`. Add a `"refreshing"` variant — count how many places the compiler flags. That count is the value of the pattern.
2. **Boundary audit.** Take any `fetch` call you own: route the JSON through `unknown`, hand-write a type guard *without* cheating in the predicate body, then replace it with a Zod schema and `z.infer`. Feel where the assertion moved.
3. **The quartet.** For `const routes = { home: "/", user: "/users/:id" }`, predict the type of `routes.home` under annotation (`Record<string, string>`), `satisfies`, `as`, and `as const` — then verify by hovering. Explain *why* `satisfies` preserves what annotation widens.
4. **Generic or lie?** Classify: (a) `function first<T>(xs: readonly T[]): T | undefined`, (b) `function parse<T>(s: string): T`, (c) `pluck` from §11. For (b), write the honest signature.
5. **Find the hole.** `const cats: Cat[] = dogs;` — construct the unsound push, then fix it with `readonly` and explain why `readonly Animal[]` blocks the exploit even though subtyping still applies.

**Self-test, vocabulary round:** define, without notes — *assignable, widening, narrowing, structural, discriminated union, exhaustiveness, type predicate, assertion function, naked type parameter, distribution, covariance, branded type, declaration merging, erasable syntax*. If each takes you one crisp sentence, you're conversant at the level this lesson aimed for.

## The Cheat Sheet to Keep

- Types are **sets**; assignability is **⊆**; errors are set-theoretic statements.
- Everything is **erased**; runtime safety exists only where you wrote runtime checks.
- `unknown` in, validation at the boundary, branded confidence inside; `any` is a signed confession.
- Prefer **discriminated unions + exhaustive `never`** over boolean-soup state.
- **Annotation** widens, **`satisfies`** checks-and-keeps, **`as`** asserts (proof on you), **`as const`** freezes literals.
- Generics must **relate at least two things**; type-level cleverness is a cost center with good PR.
- The compiler is a **pragmatic, unsound** ally. Senior TypeScript is knowing exactly where it stops proving things — and standing guard precisely there.
