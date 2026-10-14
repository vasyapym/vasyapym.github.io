<!-- lesson-meta: {"practicePrompt":"Take a small TypeScript project, turn on full strictness (strict plus noUncheckedIndexedAccess) and fix every error without reaching for as or any. Then model one real domain — an order lifecycle or a form wizard — as a discriminated union with a never-based exhaustiveness check, add a new state, and watch the compiler locate every switch that must be updated.","checkPrompt":"Without notes: state the three load-bearing ideas — type erasure, types as sets with structural assignability, deliberate unsoundness — and one concrete consequence of each; reproduce the discriminated-union pattern with assertNever; explain the difference between annotation, satisfies and as; and name three soundness holes (array covariance, method-parameter bivariance, unchecked index access) with the flags or habits that close them."} -->
<!-- lesson-theory: {"problem":"TypeScript feels like JavaScript with type stickers until production teaches otherwise: a generic that appears only in the return type lies, JSON.parse injects any into the whole graph, arr[i] assumes presence, and a green typecheck ships bugs. Without the underlying model you fix these by folklore instead of by design, and every refactor quietly misses call sites the checker was supposed to protect.","model":"Three ideas carry everything: types are erased — TypeScript is a checker bolted onto JavaScript, so beliefs at trust boundaries must be verified by runtime code; types are sets of values — assignability is subset, and compatibility is structural rather than nominal; and the system is deliberately unsound — a green check is strong evidence, not proof. Above that sit two namespaces (value space and type space), a lattice whose corners are unknown, never, any and {}, and one design principle: make illegal states unrepresentable, chiefly through discriminated unions and schema-derived types at every boundary.","mechanics":"Erasure and the boundary: annotations vanish at emit, so a return-only generic over res.json() is an assertion in disguise; the modern answer is schema libraries (Zod, Valibot, ArkType) that validate at runtime and infer the static type — parse, don't validate, at the edges only. The set model in action: unions are set unions, intersections combine properties, a wider object type is the bigger set, and Object.keys returns string[] because structural typing cannot honestly promise keyof T; branding simulates nominal typing for IDs. The checker's daily mechanisms: inference, widening and as const to stop it, contextual typing, and control-flow narrowing through typeof, instanceof, in, discriminants, type guards and assertion functions — all trusted, not verified. Soundness holes and variance: mutable arrays are covariant, method-shorthand parameters bivariant, index access assumes presence, narrowing survives mutating calls, and excess property checks apply only to fresh literals; strictFunctionTypes and noUncheckedIndexedAccess close part of the gap. The type-level toolkit: keyof and indexed access, mapped types (Partial is the homomorphic example), conditional types with infer that distribute over naked parameters — which is why Exclude works and IsNever bites — and template literal types behind typed routers, governed by the golden rule that a type parameter should appear at least twice and a hard line: clever types for libraries, boring types for application code. Toolchain reality: checking via tsc in noEmit mode is separable from emitting (esbuild, swc, Vite, Bun, native Node type stripping), which makes enums, namespaces and parameter properties non-erasable legacy; strict configs and type-aware eslint rules like no-floating-promises carry much of the real safety.","pitfalls":["Return-only generics like get<T>(): type assertions wearing a disguise.","Trusting res.json() or JSON.parse: untyped data must be validated at the boundary.","Reading {} as an empty object: it accepts every value except null and undefined.","Reaching for as or ! to silence the checker instead of fixing the model.","Writing lying type guards: a type predicate is trusted, never verified.","Assuming Object.keys gives keyof T: structural typing forbids the promise.","Forgetting that readonly is shallow and compile-time only, and that private is compile-time too.","Indexing without noUncheckedIndexedAccess: arr[5] is assumed present.","Expecting exhaustiveness without the never-typed default branch (assertNever).","Confusing annotation (widens), satisfies (checks, keeps inference) and as (asserts)."],"whenNot":"This is a practitioner's map of the language as it stands, not a JavaScript fundamentals tutorial and not a prescription for one framework's idioms; it also does not claim TypeScript is sound — the holes it documents are deliberate trade-offs, not bugs."} -->

# TypeScript, Taught by a Practitioner

This is organized around the mental models that separate people who *use* TypeScript from people who *understand* it. Vocabulary is **bolded** where it's introduced. Code is meant to be read closely, because most of the lessons live in the comments.

---

## Part 1: The Three Ideas Everything Else Hangs On

If you internalize only three things, make it these. Nearly every confusing TypeScript behavior is a consequence of one of them.

### Idea 1: Types are erased. TypeScript is a checker bolted onto JavaScript.

TypeScript does two separable jobs:

1. **Type checking.** It analyzes your code and reports errors.
2. **Emit.** It strips the type annotations and outputs JavaScript, optionally **downleveling** modern syntax for older targets.

At runtime there is no TypeScript. No types, no interfaces, no generics. The JavaScript that runs is your code with the annotations deleted. This is called **type erasure**, and it has consequences people forget constantly:

```ts
interface User { id: string; name: string }

function isUser(x: unknown) {
  return x instanceof User; // ❌ Error: 'User' only refers to a type
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  return res.json(); // res.json() returns Promise<any>, so this "works"
}
const user = await getJson<User>("/api/me"); // ⚠️ This is a lie. Nothing checked it.
```

That second function is the single most common lie in TypeScript codebases. A generic that appears only in the return type is really a **type assertion wearing a disguise**. The `<User>` does nothing at runtime. The server could return `{ error: "nope" }` and your code would happily treat it as a `User`.

**The senior instinct:** types describe what you *believe* about values. At the edges of your system (network, disk, `JSON.parse`, `localStorage`, environment variables, user input), beliefs must be verified at runtime. Part 8 covers this.

A corollary: because the two jobs are separable, modern toolchains split them. **esbuild, swc, Babel, Bun, Deno, and now Node itself** strip types without checking them, and `tsc` runs separately for checking. Part 9 covers this.

### Idea 2: Types are sets of values. Compatibility is structural.

Think of a type as the **set of values it admits**:

- `string` is the set of all strings.
- `"GET"` is a set with one member. This is a **literal type**.
- `"GET" | "POST"` is the union of two sets.
- `{ name: string }` is the set of all objects that have a `name` property holding a string. That includes objects with *extra* properties.

"Is A **assignable** to B?" means "is set A a subset of set B?" That one relation, **assignability**, is the heart of the checker.

TypeScript's type system is **structural**: compatibility is decided by shape, not by declared name. Java and C# are **nominal**: a `Dog` is only an `Animal` if it explicitly declares so.

```ts
interface Point { x: number; y: number }
class Vec { constructor(public x: number, public y: number, public z = 0) {} }

const p: Point = new Vec(1, 2); // ✅ Vec never mentions Point, but it fits the shape
```

The set view explains things that otherwise feel arbitrary:

- **Wider object types have *fewer* properties.** `{ name: string }` is a *bigger* set than `{ name: string; age: number }`, because fewer constraints admit more values. People invert this constantly.
- **Intersection (`A & B`) of object types *combines* properties.** A value must be in both sets, so it must have both sets of properties. "Intersection = more properties" confuses people until they think in sets.
- **`Object.keys(obj)` returns `string[]`, not `(keyof T)[]`.** Because typing is structural, an object typed as `Point` might really be a `Vec` with a `z` key. TypeScript cannot honestly promise you only get `"x" | "y"`. This is a top-five "why is TypeScript so annoying" question, and the answer is "because the alternative would be a lie."

### Idea 3: TypeScript is deliberately unsound. Its goal is usefulness, not proof.

A **sound** type system guarantees that if the program typechecks, no type error can occur at runtime. TypeScript explicitly does *not* aim for soundness. Its design goals favor productivity and fitting real JavaScript patterns. There are known holes, catalogued in Part 7.

What this means in practice: **a green typecheck is strong evidence, not proof.** Seniors know where the holes are and avoid stepping in them. Juniors think "it compiles" means "it's correct."

---

## Part 2: Two Namespaces (Value Space and Type Space)

TypeScript has two parallel worlds:

- **Value space**: things that exist at runtime, such as variables, functions, and classes.
- **Type space**: things that exist only at compile time, such as types, interfaces, and type aliases.

The same identifier can live in both:

```ts
// A very common idiom: the same name in both spaces
const User = z.object({ id: z.string(), name: z.string() }); // value: a runtime schema
type User = z.infer<typeof User>;                              // type: derived from it

// A class lives in BOTH spaces at once
class Account { balance = 0 }
const a: Account = new Account();  // `Account` as a type = the instance shape
type Ctor = typeof Account;        // `typeof Account` = the constructor's type
type Inst = InstanceType<typeof Account>; // back to the instance type
```

Key operators that bridge the two:

| Syntax | Space | Meaning |
|---|---|---|
| `typeof x` (in a type position) | value → type | "the type of this value" |
| `typeof x` (in an expression) | runtime JS | returns `"string"`, `"object"`, etc. *Different operator, same keyword.* |
| `keyof T` | type → type | union of T's keys |
| `T[K]` | type → type | **indexed access type**: the type of property K |
| `enum`, `class` | both | emit runtime code *and* declare a type |

Once you see the two namespaces, a whole category of errors becomes readable. "'X' only refers to a type, but is being used as a value here" means exactly what it says.

---

## Part 3: The Type Lattice (Top, Bottom, and the Weird Ones)

Arrange types by the subset relation and you get a lattice. Knowing its corners precisely is a credibility marker.

| Type | Set meaning | Notes |
|---|---|---|
| `unknown` | **Top type**: every value | Safe. You must narrow before you can use it. |
| `never` | **Bottom type**: the empty set | Assignable to everything. Nothing is assignable to it. |
| `any` | Not a set. An **opt-out**. | Acts as both top *and* bottom, so it disables checking and **spreads** silently. |
| `{}` | Every value except `null`/`undefined` | Does *not* mean "empty object." Big misconception. |
| `object` | Every non-primitive value | Use this for "some object." |
| `Object` | Basically the same as `{}` | Never use it. Linters ban it. |
| `void` | "Return value should be ignored" | Not quite `undefined`. See below. |
| `null`, `undefined` | Their single values | Only distinct from everything else under `strictNullChecks`. |

The subtle points:

**`any` vs `unknown`.** Both accept anything. The difference is what you can *do* with the result:

```ts
const a: any = JSON.parse(input);
a.foo.bar.baz();          // ✅ compiles, 💥 maybe crashes
const n: number = a;      // ✅ any flows into everything and infects it

const u: unknown = JSON.parse(input);
u.foo;                    // ❌ must narrow first
if (typeof u === "object" && u !== null && "foo" in u) { /* now usable */ }
```

`any` is contagious. One `any` from `JSON.parse` or an untyped library flows through assignments and silently turns large regions of code unchecked. Experienced reviewers hunt `any` the way they hunt unhandled errors.

**`never` is useful, not just theoretical.** It is:

- the return type of functions that never return (they throw or loop forever),
- what you get when narrowing eliminates every possibility,
- the result of impossible intersections like `string & number`,
- the identity element for unions (`T | never` is just `T`), which conditional types use to filter.

**`void` is special in function types.** A function that returns something *is* assignable to `() => void`:

```ts
const nums: number[] = [];
[1, 2, 3].forEach(n => nums.push(n)); // push returns number; forEach expects a void callback. ✅ Intentional.
```

`void` means "the caller promises not to use the return value," not "this returns undefined."

---

## Part 4: What the Checker Does All Day

Most TypeScript you write has few annotations. The checker fills in types through four mechanisms. Knowing them by name lets you predict behavior instead of guessing.

### Inference

The checker infers types from initializers, return statements, and generic arguments. Good TypeScript code is annotated mostly at **boundaries**: function parameters, exported APIs, and data models. Internals are left to inference. Over-annotating everything is a beginner tell.

### Widening (and how to stop it)

Literals **widen** when the binding is mutable:

```ts
const a = "GET";        // type: "GET"     (const can't change, so keep the literal)
let b = "GET";          // type: string    (widened, since b could be reassigned)
const o = { method: "GET" };  // { method: string }  (properties are mutable, so widened)

const o2 = { method: "GET" } as const; // { readonly method: "GET" }
```

`as const` creates a **const context**. Literals stay literal, objects and arrays become `readonly`, and arrays become **tuples**. It's one of the most-used tools in modern TypeScript.

### Contextual typing

Sometimes type information flows *inward*, from where an expression is used:

```ts
window.addEventListener("click", e => { e.clientX }); // e inferred as MouseEvent from the "click" overload
const handlers: Record<string, (n: number) => void> = {
  log: n => console.log(n.toFixed(2)),               // n: number, from the annotation
};
```

This is why extracting an inline callback into a separate `const` sometimes suddenly produces "implicitly has an any type." You broke the context.

### Narrowing (control flow analysis)

The checker tracks how a variable's type shrinks through branches. This is **control flow analysis**, and each branch has a **narrowed** type.

```ts
function f(x: string | number | null) {
  if (x === null) return;            // equality narrowing
  if (typeof x === "string") {       // typeof narrowing
    x.toUpperCase();
  } else {
    x.toFixed();                     // x: number
  }
}
```

Narrowing tools, roughly in order of how often you'll use them:

- `typeof`, `instanceof`, equality checks, truthiness
- `in` (`"swim" in animal`)
- **discriminated unions** (next section; this is the big one)
- **user-defined type guards**: `function isFish(x): x is Fish`
- **assertion functions**: `function assert(c: unknown): asserts c`

```ts
function assert(cond: unknown, msg = "Assertion failed"): asserts cond {
  if (!cond) throw new Error(msg);
}
assert(user != null);
user.name; // narrowed below this line
```

> **Footgun:** type guards and assertion functions are *trusted, not verified*. This compiles fine:
> ```ts
> function isString(x: unknown): x is string { return typeof x === "number"; } // a lie TS accepts
> ```
> A type predicate is effectively a type assertion you've hidden inside a function. Keep them tiny and obviously correct.

A nice modern improvement (TS 5.5): **inferred type predicates**. `arr.filter(x => x !== undefined)` now correctly narrows to `T[]`. For years it didn't, and you'll still see the old workaround (`.filter((x): x is T => ...)`) everywhere in older code.

---

## Part 5: Modeling Data (Where Most of the Real Value Is)

Type-level wizardry gets attention. **Data modeling** is where TypeScript actually pays its rent. The guiding principle comes from typed functional programming: **make illegal states unrepresentable.**

### Discriminated unions

This is the most important pattern in the language. Learn it cold.

```ts
// ❌ Sloppy: a "bag of optionals". Allows nonsense like { status: "success", error: ... }
type RequestStateBad = {
  status: "idle" | "loading" | "success" | "error";
  data?: User;
  error?: Error;
};

// ✅ Discriminated union: each state carries exactly its own data
type RequestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: User }
  | { status: "error"; error: Error };

function render(s: RequestState): string {
  switch (s.status) {           // `status` is the **discriminant** (or "tag")
    case "idle":    return "—";
    case "loading": return "…";
    case "success": return s.data.name;     // narrowed: data exists
    case "error":   return s.error.message; // narrowed: error exists
    default:        return assertNever(s);  // exhaustiveness check
  }
}

function assertNever(x: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(x)}`);
}
```

The `assertNever` trick is **exhaustiveness checking**. If someone adds `{ status: "cancelled" }` to the union, `s` in the `default` branch is no longer `never`, and the compiler flags every switch that forgot to handle it. This turns "find all the places I need to update" from a grep into a compile error. The typescript-eslint rule `switch-exhaustiveness-check` does something similar.

Also called **tagged unions** or **sum types**. Saying "sum type" signals you know where the idea comes from (ML, Haskell, Rust's enums).

### Optional vs. `undefined`

```ts
type A = { name?: string };           // key may be ABSENT (or, by default, present with undefined)
type B = { name: string | undefined }; // key must be PRESENT; value may be undefined
```

By default TypeScript blurs these. Under `exactOptionalPropertyTypes`, `name?: string` forbids explicitly assigning `undefined`. That matters for things like `Object.keys`, spreading, and APIs that distinguish "not provided" from "set to nothing" (PATCH semantics, for example).

### `readonly` (and its limits)

```ts
type Config = { readonly url: string; readonly tags: readonly string[] };
```

- `readonly` is compile-time only. `Object.freeze` is the runtime equivalent.
- It's **shallow**. `readonly user: User` doesn't make `user.name` readonly.
- `readonly string[]` (or `ReadonlyArray<string>`) removes `push`, `splice`, and other mutating methods. Accept `readonly T[]` in function parameters; it's more permissive for callers, since mutable arrays are assignable to readonly ones.
- Footgun: a mutable alias can still mutate it. `readonly` constrains *this reference*, not the object.

### `satisfies` (TS 4.9) vs. annotation vs. `as`

These three get confused constantly. They do very different things:

```ts
type Color = "red" | "green" | "blue";

// 1) Annotation: checks, then the variable HAS the annotated (wider) type
const p1: Record<Color, string | number[]> = { red: "#f00", green: [0,255,0], blue: "#00f" };
p1.green.map(x => x); // ❌ string | number[], so you lost the specific info

// 2) satisfies: checks conformance, but KEEPS the inferred (narrower) type
const p2 = { red: "#f00", green: [0,255,0], blue: "#00f" } satisfies Record<Color, string | number[]>;
p2.green.map(x => x); // ✅ number[]
// also catches typos: a key `bleu` would error

// 3) as: an assertion. "Trust me." Little checking.
const p3 = {} as Record<Color, string>; // ✅ compiles, and is completely false
```

Vocabulary nuance: people say "cast," but TypeScript's `as` is a **type assertion**. It converts nothing at runtime. It's a claim. Saying "assertion" in a review is a quiet signal of understanding. `as` is allowed only when the types overlap at all. The escape hatch `x as unknown as Y` (a "double assertion") is a code-review red flag.

Rule of thumb: **prefer `satisfies` for config-like literals, annotations at API boundaries, and `as` almost never** (DOM queries and test fixtures are the common legitimate exceptions).

### Branded types (simulating nominal typing)

Structural typing means `UserId` and `OrderId`, both strings, are interchangeable. That's a real bug source. **Branding** fixes it:

```ts
type Brand<T, B extends string> = T & { readonly __brand: B };
type UserId  = Brand<string, "UserId">;
type OrderId = Brand<string, "OrderId">;

function getUser(id: UserId) { /* ... */ }

const raw = "abc";
getUser(raw);                  // ❌ string is not UserId
const id = raw as UserId;      // the ONE place you assert, ideally inside a validator
getUser(id);                   // ✅
declare const oid: OrderId;
getUser(oid);                  // ❌ can't mix them up
```

The brand property never exists at runtime; it's a phantom. Pair branding with validation (`parseEmail(s): Email | null`) and you get "this value has been validated" encoded in the type. That idea, **"parse, don't validate,"** is worth knowing by name.

### Enums vs. union-of-literals

Modern consensus leans away from `enum`:

```ts
// Legacy-ish
enum Status { Active = "active", Inactive = "inactive" }

// Modern idiom: union of literals, with an optional runtime object if you need iteration
const Status = { Active: "active", Inactive: "inactive" } as const;
type Status = (typeof Status)[keyof typeof Status]; // "active" | "inactive"
```

Why the shift:

- Enums **emit runtime code**. They're one of the few TypeScript features that isn't pure erasure, so they break type-stripping tools (Part 9).
- Numeric enums generate reverse mappings and have historically had loose assignability.
- String enums are *nominal*. You can't pass the literal `"active"` where `Status` is expected, which surprises people who chose TypeScript for structural typing.
- `const enum` interacts badly with `isolatedModules` and with library publishing.

This is still contested (Part 11), but if you're starting fresh, unions are the safer default.

---

## Part 6: Generics, and Then the Type-Level Toolkit

### Generics: functions over types

A generic is a function at the type level. You pass types in, you get types out. It's not mystical.

```ts
function first<T>(arr: readonly T[]): T | undefined { return arr[0]; }

// Constraints: T must be a subset of something
function pick<T, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> {
  const out = {} as Pick<T, K>;          // a justified, local assertion
  for (const k of keys) out[k] = obj[k];
  return out;
}
const u = pick({ id: 1, name: "a", age: 3 }, "id", "name"); // { id: number; name: string }
```

**The golden rule of generics** (straight from the TypeScript handbook): *a type parameter should appear at least twice.* Its job is to *relate* two things, such as an input to an output or one parameter to another. If it appears once, you don't need it:

```ts
function log<T>(x: T): void {}       // ❌ pointless: use `unknown`
function parse<T>(s: string): T {}   // ❌ return-only generic = a disguised `as`
```

Inference controls worth knowing (all relatively recent, all signal currency):

```ts
// const type parameters (5.0): infer literals/tuples as if the caller wrote `as const`
function routes<const T extends readonly string[]>(r: T): T { return r; }
const r = routes(["home", "about"]); // readonly ["home", "about"], not string[]

// NoInfer (5.4): stop a parameter from being an inference site
function createFSM<S extends string>(states: S[], initial: NoInfer<S>) {}
createFSM(["idle", "busy"], "oops"); // ❌ good: "oops" isn't allowed to widen S
```

### The type-level toolkit

These are the building blocks. Every utility type in the standard library is made from them.

```ts
type User = { id: string; name: string; age: number };

// keyof + indexed access
type Keys = keyof User;           // "id" | "name" | "age"
type Name = User["name"];         // string
type Vals = User[keyof User];     // string | number

// Mapped types: iterate over keys
type Optional<T> = { [K in keyof T]?: T[K] };   // this is literally Partial<T>
type Mutable<T> = { -readonly [K in keyof T]: T[K] }; // `-` removes modifiers

// Key remapping with `as` (4.1)
type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };
// { getId: () => string; getName: () => string; getAge: () => number }

// Conditional types + infer: pattern-match on types
type Awaited1<T> = T extends Promise<infer U> ? U : T;
type ElementOf<T> = T extends readonly (infer E)[] ? E : never;

// Template literal types: string manipulation at the type level
type ParamNames<P extends string> =
  P extends `${string}:${infer Name}/${infer Rest}` ? Name | ParamNames<Rest>
  : P extends `${string}:${infer Name}` ? Name
  : never;
type Params<P extends string> = { [K in ParamNames<P>]: string };
type X = Params<"/users/:userId/posts/:postId">; // { userId: string; postId: string }
```

That last example is how typed routers (TanStack Router, Hono, Express types) derive parameter types from path strings.

Built-in utility types you should know without looking them up:

- `Partial`, `Required`, `Readonly`
- `Pick`, `Omit`, `Record`
- `Exclude`, `Extract`, `NonNullable`
- `ReturnType`, `Parameters`, `InstanceType`
- `Awaited`, `NoInfer`

**Footgun:** `Omit<T, K>` isn't type-safe on `K`. `Omit<User, "nmae">` compiles silently, because `K extends keyof any`. Some teams define a `StrictOmit`.

### Distributive conditional types (an interview favorite)

When a conditional type checks a **naked type parameter**, it distributes over unions:

```ts
type ToArray<T> = T extends unknown ? T[] : never;
type A = ToArray<string | number>;      // string[] | number[]    (distributed)

type ToArrayND<T> = [T] extends [unknown] ? T[] : never;
type B = ToArrayND<string | number>;    // (string | number)[]    (wrapping in a tuple disables it)
```

This is *why* `Exclude<T, U> = T extends U ? never : T` works: it runs per union member, and the `never` results vanish. It's also why `never` passed to a distributive conditional produces `never` (it's an empty union, so there's nothing to distribute over). That one bites people writing `IsNever<T>`.

A **homomorphic mapped type** is one of the form `{ [K in keyof T]: ... }`. It preserves `readonly` and optional modifiers and maps over arrays and tuples nicely. Knowing the term helps when reading TypeScript issue threads.

### When to stop

Type-level programming is Turing-complete-ish and addictive. Experienced people draw a hard line:

- **Library code** (routers, ORMs, validation libraries) earns complex types, because thousands of users get the inference payoff.
- **Application code** should be boring. If a teammate can't read your type in 30 seconds, it's probably debt. Complex types also produce awful error messages and slow the compiler.

A small trick for readable hover output when intersections pile up:

```ts
type Prettify<T> = { [K in keyof T]: T[K] } & {};
```

---

## Part 7: Soundness Holes and Variance

This section is what lets you explain *why* a bug got through the type checker. That's a very senior conversation to be able to have.

### Variance in one paragraph

Given `Dog` ⊂ `Animal`, how do container or function types relate?

- **Covariant** (preserves direction): producers and outputs. `() => Dog` is assignable to `() => Animal`. `readonly Dog[]` is assignable to `readonly Animal[]`.
- **Contravariant** (reverses direction): consumers and inputs. `(a: Animal) => void` is assignable to `(d: Dog) => void`. A function that handles any animal can certainly handle a dog.
- **Invariant**: both reading and writing. A *mutable* `Dog[]` shouldn't be an `Animal[]`, because someone could push a `Cat` into it.
- **Bivariant**: either direction allowed. This is unsound, and TypeScript does it in specific places.

TypeScript infers variance automatically. Since 4.7 you can annotate it explicitly with `in`/`out` on type parameters (`interface Producer<out T>`), mostly for performance and clarity in libraries.

### The known holes

```ts
interface Animal { name: string }
interface Dog extends Animal { bark(): void }

// 1) Arrays are covariant even though they're mutable
const dogs: Dog[] = [];
const animals: Animal[] = dogs;     // ✅ allowed
animals.push({ name: "Cat" });      // ✅ allowed
dogs[0].bark();                     // 💥 runtime crash

// 2) Method-shorthand parameters are bivariant
interface HandlerM { handle(a: Animal): void }      // method syntax
interface HandlerP { handle: (a: Animal) => void }  // property syntax
const h1: HandlerM = { handle(d: Dog) { d.bark(); } };       // ✅ allowed (unsound)
const h2: HandlerP = { handle: (d: Dog) => d.bark() };       // ❌ caught under strictFunctionTypes
// ...which is why some style guides prefer property syntax for callbacks.

// 3) Index access assumes presence (unless noUncheckedIndexedAccess)
const arr: string[] = [];
arr[5].toUpperCase();               // ✅ compiles, 💥 crashes

// 4) Narrowing isn't invalidated by function calls
function f(o: { v: string | null }, reset: () => void) {
  if (o.v !== null) {
    reset();                        // might set o.v = null
    o.v.length;                     // ✅ compiles, possibly 💥
  }
}

// 5) The explicit escape hatches: any, as, !, @ts-ignore, lying type guards
const el = document.getElementById("x")!; // non-null assertion: "trust me"
```

Why accept these? Making arrays invariant or method parameters contravariant would break enormous amounts of real JavaScript patterns, including DOM event handler typings. The team chose usability. Knowing *which* holes exist, and enabling the flags that close some of them, is part of operating at a senior level.

### Excess property checks (a "hole" in the other direction)

```ts
type Point = { x: number; y: number };
const p: Point = { x: 1, y: 2, z: 3 };   // ❌ excess property 'z'
const tmp = { x: 1, y: 2, z: 3 };
const q: Point = tmp;                    // ✅ fine
```

Structurally, extra properties are always allowed. But object literals assigned directly get an additional **excess property check** (the literal is "**fresh**"), because a direct extra property is almost always a typo. This is a lint-like heuristic, not a type-system rule. Knowing that resolves a lot of "why does it error here but not there?" confusion.

---

## Part 8: The Boundary (Runtime Validation)

Because types are erased (Idea 1), anything entering your program from outside is effectively `unknown`, whatever the code claims. The modern pattern is a **schema library** that validates at runtime *and* infers the static type, giving you one source of truth:

```ts
import { z } from "zod";

const User = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  role: z.enum(["admin", "member"]),
});
type User = z.infer<typeof User>;

async function getUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  return User.parse(await res.json()); // throws on mismatch; now the type is TRUE
}
```

The landscape:

- **Zod**: the default choice. v4 shipped in 2025 with large performance gains.
- **Valibot**: modular and tree-shakeable, so bundles stay small.
- **ArkType**: type-syntax strings, very fast.
- **Effect Schema**: part of the Effect ecosystem.
- **Standard Schema**: a shared interface these libraries implement, so frameworks can accept any of them. Worth knowing the name.

Related pattern: **end-to-end type safety**. tRPC, GraphQL codegen, OpenAPI codegen (`openapi-typescript`), and ORMs like Prisma and Drizzle generate or share types across the network boundary.

The senior's principle: **validate at the edges, trust inside.** Don't sprinkle defensive checks everywhere internally. Do make sure every entry point either validates or is generated from a contract.

Two small, high-leverage hygiene habits:

- **`useUnknownInCatchVariables`** (part of `strict`) makes `catch (e)` produce `e: unknown`. That's correct, because JavaScript can throw anything, not just `Error`s.
- **`ts-reset`** (by Matt Pocock) makes `JSON.parse` and `.json()` return `unknown` instead of `any`, among other fixes. Some teams love it; some find it too opinionated for libraries.

---

## Part 9: Tooling and Configuration (Current State)

### The compiler, a layer down

`tsc` runs a pipeline:

1. **Scanner/parser** turns source into an abstract syntax tree (AST).
2. **Binder** creates **symbols** (declarations) and builds the control-flow graph used for narrowing.
3. **Checker** computes types lazily, on demand, and caches assignability results. This is ~most of the code and most of the runtime cost.
4. **Emitter** strips types and downlevels syntax to produce JavaScript, plus `.d.ts` **declaration files**.

Your editor runs the same checker through **tsserver**, the language service. That's why editor feedback and `tsc` agree, and why a slow type in a big project makes your editor sluggish too.

Practical consequences:

- **Type-checking performance is a real engineering concern** in large codebases. Tools: `tsc --extendedDiagnostics` and `tsc --generateTrace`. Common culprits include huge unions, deep conditional or recursive types, large intersections, and missing return-type annotations on exported functions (which force re-inference everywhere). The TypeScript wiki's performance page recommends `interface extends` over `&` intersections for this reason: interfaces are cached by name.
- **Errors like "Type instantiation is excessively deep and possibly infinite"** mean you hit the checker's recursion limits. Usually that signals the types are too clever.
- **Native port.** In 2025 Microsoft announced a port of the compiler to Go, codenamed **Project Corsa**, with previews available as `tsgo`. It's planned to ship as **TypeScript 7** with roughly 10× faster checks, with TypeScript 6.x as a transition release. Same language semantics, faster tool. Knowing this exists is current-awareness credibility.

### The split: checking vs. emitting

Modern setups typically look like this:

- **`tsc --noEmit`** in CI and in the editor for checking only.
- **A fast transpiler or bundler** for producing JavaScript. Examples: Vite (esbuild/Rollup), esbuild, swc, Bun, `tsx` for running scripts, and `tsup`/`tsdown` for building libraries.
- **Node.js now strips types natively.** It's unflagged since Node 23.6 and backported to 22.18. `node file.ts` works, *if* your TypeScript uses only **erasable syntax**.

That last point drives a significant current trend. **Erasable syntax** is TypeScript that can be removed by simply deleting annotations. Non-erasable features generate runtime code:

- `enum`
- `namespace` with values
- **parameter properties** (`constructor(private x: number)`)
- legacy `import x = require()`

TS 5.8 added **`--erasableSyntaxOnly`** to ban these. That's another reason enums and namespaces are trending toward legacy status.

**`isolatedModules`** means "every file must be transpilable on its own, without type information," which is how esbuild and swc work. It forbids a few things, such as re-exporting a type without marking it. **`verbatimModuleSyntax`** (5.0) goes further and makes you write `import type { Foo }` explicitly for type-only imports, so tools know exactly what to erase. Both are standard in modern configs.

### A sane modern `tsconfig` (2025)

```jsonc
{
  "compilerOptions": {
    // Language & environment
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],          // drop DOM for pure Node
    "moduleDetection": "force",

    // Modules: pick ONE pattern
    "module": "NodeNext",              // Node apps/libraries that tsc emits...
    // "module": "Preserve", "moduleResolution": "Bundler",  // ...or apps built by a bundler

    // Strictness
    "strict": true,                    // non-negotiable
    "noUncheckedIndexedAccess": true,  // arr[i] is T | undefined; strongly recommended
    "exactOptionalPropertyTypes": true,// contested; great for new code, painful to retrofit
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,

    // Interop with transpilers
    "verbatimModuleSyntax": true,
    "isolatedModules": true,

    // Practicalities
    "skipLibCheck": true,              // don't typecheck node_modules .d.ts; near-universal
    "noEmit": true                     // if a bundler emits for you
  }
}
```

`strict: true` bundles `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, `useUnknownInCatchVariables`, and more. A codebase without it is playing a different game. **`strictNullChecks` off is effectively a different language**, because without it `null` is assignable to everything.

### The module-system swamp (ESM vs. CommonJS)

This is the most painful real-world area, and acknowledging that honestly is itself credible.

- In Node ESM with `module: NodeNext`, relative imports need extensions, and you write **`.js` in your `.ts` source** (`import { x } from "./util.js"`), because that's the path that will exist at runtime. Everyone finds this weird. TS 5.7's `rewriteRelativeImportExtensions` lets you write `.ts` and have it rewritten on emit.
- `"type": "module"` in `package.json` decides whether `.js` files are treated as ESM or CommonJS.
- Library authors deal with **dual packages**, `exports` maps with `"types"` conditions, and making sure the declarations match each format. The tool **"Are The Types Wrong?"** (`arethetypeswrong`/`attw`) exists purely because this is so easy to get wrong.
- **`esModuleInterop`** papers over default-import differences with CommonJS. You'll see it in older configs. `module: NodeNext` handles the semantics more precisely.

### Declaration files and third-party types

- `.d.ts` files contain types only. They are how JavaScript libraries describe themselves.
- **DefinitelyTyped** is the community repository behind `@types/*` packages. Modern libraries increasingly ship their own types.
- **Ambient declarations** (`declare const __DEV__: boolean;`, `declare module "*.svg"`) describe things that exist without TypeScript seeing their source.
- **Module augmentation** and **declaration merging** extend existing types. For example, you might add a `user` field to Express's `Request`:

```ts
declare module "express-serve-static-core" {
  interface Request { user?: User }
}
```

- **`isolatedDeclarations`** (5.5) requires explicit types on exports so `.d.ts` files can be generated per file without the checker. Monorepos use it to parallelize builds.
- **Project references** (`composite`, `tsc -b`) split big monorepos into incrementally built units.

### Linting and the surrounding ecosystem

- **typescript-eslint**, with its *type-aware* rules, is where much of the real safety lives:
  - `no-floating-promises` catches forgotten `await`s, a huge class of bugs.
  - `no-misused-promises`
  - the `no-unsafe-*` family tracks `any` spreading.
  - `switch-exhaustiveness-check`
  - `consistent-type-imports`
- **Biome** and **oxlint** are faster Rust-based alternatives, with growing but less complete type-aware coverage.
- **`@ts-expect-error` over `@ts-ignore`.** The former errors when the suppression becomes unnecessary, so it doesn't rot. Always add a comment explaining why.

### Classes: a few TypeScript-specific traps

- **`private` is compile-time only.** At runtime the field is public. **`#field`** is real JavaScript privacy. Prefer `#` when privacy actually matters.
- **`useDefineForClassFields`** defaults to true for modern targets. It changes field initialization to match the JavaScript standard, which can break older code relying on parameter-property ordering or legacy decorators.
- **Decorators.** TS 5.0 implemented **standard (TC39) decorators**. The older `experimentalDecorators` plus `emitDecoratorMetadata` is a different, incompatible system, still used by Angular (historically), NestJS, TypeORM, and similar frameworks. Know which one a codebase uses.
- **`using`** declarations (5.2) handle explicit resource management, with `Symbol.dispose` providing deterministic cleanup. New, and gaining adoption.

---

## Part 10: Current vs. Legacy, at a Glance

| Legacy / avoid | Current / prefer |
|---|---|
| `namespace` for code organization | ES modules |
| `/// <reference path>` | `import` / `import type` |
| `enum`, `const enum` | literal unions plus `as const` objects |
| `strict: false`, gradually-loose configs | `strict` + `noUncheckedIndexedAccess` |
| `any` as a default escape | `unknown` + narrowing / schema validation |
| `@ts-ignore` | `@ts-expect-error` with a reason |
| `experimentalDecorators` (new code) | standard decorators |
| `I`-prefixed interfaces (`IUser`) | just `User` |
| `moduleResolution: "node"` (node10) | `NodeNext` or `Bundler` |
| `esModuleInterop` hacks | correct `module` setting + `verbatimModuleSyntax` |
| tsc for emit in apps | bundler/transpiler emit, tsc for checking |
| `ts-node` | `tsx`, Bun, Deno, or native Node type stripping |
| TSLint | typescript-eslint (or Biome) |
| `.filter((x): x is T => ...)` boilerplate | inferred type predicates (5.5+) |
| `as Type` on config literals | `satisfies Type` |

---

## Part 11: The "It Depends" Debates (with My Positions)

Being able to argue both sides of these, and then state a reasoned default, is what "senior" sounds like.

**1. `interface` vs. `type`.**
- `interface` supports declaration merging (good for augmentation, surprising otherwise), `extends` gives clearer errors and better checker caching, and it can only describe object shapes.
- `type` can express unions, mapped types, conditional types, and tuples.
- *My take:* it matters less than the internet claims. A common sane convention is "`interface` for object shapes you'll extend or that are public API; `type` for everything else," or "`type` everywhere, except where you need merging." Pick one and enforce it with lint (`consistent-type-definitions`). Don't argue it in code review.

**2. Explicit return types.**
- For: stable API contracts, faster checking, better errors at the definition rather than the call site, and required by `isolatedDeclarations`.
- Against: noise and duplication, and inferred types are often more precise.
- *My take:* annotate exported or public functions; let inference handle internal ones.

**3. Enums.**
- Pro: familiar to Java and C# developers, a namespaced runtime object, easy refactoring.
- Con: everything in Part 5, plus incompatibility with erasable-only tooling.
- *My take:* unions for new code. Don't rewrite working enums for sport.

**4. How clever should the types be?**
- Library authors versus application developers live in different worlds (Part 6).
- *My take:* in application code, optimize for the teammate reading it at 2 a.m. Accept a little imprecision over an unreadable type.

**5. Strictness beyond `strict`.**
- `noUncheckedIndexedAccess`: almost always worth it, though it forces `!` or checks in index-heavy code.
- `exactOptionalPropertyTypes`: correct but noisy, and some libraries' types don't comply.
- typescript-eslint's `strict-boolean-expressions` is divisive. It bans `if (str)`, which catches `0` and `""` bugs but annoys people.

**6. Exceptions vs. Result types.**
- TypeScript can't type what a function throws (there are no checked exceptions).
- Some teams use `Result<T, E>` unions (neverthrow, or Effect for a full ecosystem) to make failures visible in types.
- *My take:* discriminated-union results are excellent for *expected* failures like validation and "not found." Exceptions remain fine for genuinely exceptional ones. Effect is powerful but a big paradigm commitment for a team.

**7. Barrel files** (`index.ts` that re-exports everything).
- Convenient imports, but they can hurt tree-shaking, create circular-import hazards, and slow down tooling and tests.
- The trend is away from them in applications. They're still reasonable at package boundaries.

**8. Classes vs. functions plus data.**
- Idiomatic modern TypeScript leans toward plain objects, discriminated unions, and functions.
- Classes are fine (frameworks like NestJS and Angular are class-heavy). Deep inheritance hierarchies are the smell, not classes as such.

**9. TypeScript syntax vs. JSDoc types.**
- Some library authors (Svelte, famously) moved their *internal* source to JavaScript plus JSDoc annotations, still checked by `tsc`, to skip a build step.
- Native type stripping weakens that argument. Still, it's a legitimate option, especially for libraries.

**10. `skipLibCheck: true`.**
- Near-universal, and it speeds builds a lot. The cost is that conflicts in dependency types go unnoticed.
- Library authors sometimes run a separate check without it.

---

## Part 12: Footgun Checklist

Scan this list when debugging or reviewing:

1. **`any` leaks** from `JSON.parse`, `res.json()`, untyped libraries, or `catch` (without `strict`).
2. **Return-only generics** like `get<T>()` are assertions in disguise.
3. **`as` and `!`** silence the checker rather than satisfying it.
4. **Lying type guards and assertion functions** are never verified.
5. **`arr[i]` and `record[key]`** are assumed present unless `noUncheckedIndexedAccess` is on.
6. **`Object.keys` / `Object.entries`** return `string`-keyed results, by design.
7. **`{}` means "non-nullish,"** not "empty object." Use `Record<string, never>` for a truly empty object, or `object` for "any object."
8. **Mutable array covariance** and **method-parameter bivariance** are both unsound.
9. **Narrowing survives function calls** that might mutate the object.
10. **Excess property checks only apply to fresh literals.** Don't mistake them for exactness.
11. **`readonly` is shallow** and compile-time only. TypeScript's `private` isn't private at runtime.
12. **`Omit` doesn't validate its keys**, so typos are silent.
13. **Forgotten `await`**: the code typechecks and the bug ships. Turn on `no-floating-promises`.
14. **Truthiness narrowing drops `0` and `""`**: `if (count)` is a classic bug.
15. **`.js` extensions in ESM imports** in `.ts` files, plus ESM/CommonJS interop surprises.
16. **`const enum` and enums** break under isolated-module and erasable-only tooling.
17. **Distributive conditional types** surprise you with unions and `never`.
18. **Optional (`?:`) vs. `| undefined`** differ, especially under `exactOptionalPropertyTypes`.
19. **Typechecking ≠ transpiling.** If CI only runs the bundler, type errors can ship. Always run `tsc --noEmit`.
20. **Legacy and standard decorators** are incompatible. Check which one the codebase uses before writing either.

---

## Part 13: What Good Looks Like in Real Work

**In code review, seniors look for:**

- **Types modeled as discriminated unions**, not bags of optionals.
- **Validation at every I/O boundary**, with types derived from schemas or contracts rather than hand-written twice.
- **Zero unexplained `any`, `as`, `!`, or `@ts-expect-error`.** Each one carries a comment saying why.
- **Exhaustive switches** over unions.
- **Inference used internally, annotations at boundaries.**
- **Generics that relate things**, not decorative ones.
- **Boring types in app code.** Cleverness lives in shared utilities with tests (yes, you can test types: `expectTypeOf` in Vitest, `tsd`, or `@ts-expect-error` lines in test files).
- **A strict tsconfig** and type-aware lint rules running in CI.

**Sloppy signals:**

- `as any` to "fix" errors
- interfaces mirroring API responses that nobody validates
- `Function` or `object` as parameter types
- `// @ts-ignore` with no comment
- `strict: false`
- copy-pasted types instead of derived ones (`Pick`, `typeof`, `z.infer`)

**How to talk about it.** Use the precise vocabulary:

- **assignability** (not "compatible")
- **narrowing** and **widening**
- **type assertion** (not "cast")
- **discriminant** and **exhaustiveness**
- **structural vs. nominal**, **branding**
- **erasure** and **erasable syntax**
- **soundness**, **variance**
- **distributive conditional**
- **contextual typing**
- **declaration merging**, **module augmentation**
- **excess property check**

Precision in these words is noticeable, and it makes your explanations in issue threads and PR comments faster to understand.

---

## Part 14: A Short Practice Path

1. **Turn on full strictness** (`strict`, `noUncheckedIndexedAccess`) in a small project. Fix every error *without* `as` or `any`. You'll learn more from this than from any article.
2. **Model a real domain** (an order lifecycle, a form wizard) as discriminated unions with `assertNever`. Add a state and watch the compiler find every place to update.
3. **Put Zod (or Valibot) at every boundary** of a small API client. Derive all types from schemas.
4. **Re-implement** `Partial`, `Pick`, `Omit`, `ReturnType`, `Awaited`, and `Exclude` from scratch. Then write `ParamNames` from Part 6 yourself. The **type-challenges** repository on GitHub is the standard gym for this. Do the easy and medium levels; the extreme ones are party tricks.
5. **Read real `.d.ts` files**: `lib.es5.d.ts` (yes, the built-in one), and the types for Zod or TanStack Query. That's where you'll see professional type design.
6. **Configure a project two ways**, once with `module: NodeNext` emitting via tsc and once as a Vite app with `module: Preserve`/`Bundler`. Understanding *why* they differ demystifies most module errors.
7. **Follow the release notes.** Each TypeScript release blog post is excellent and explains the *why*. Reading the last six or so (5.4 through 5.9, plus the TS 7 native-port announcements) will make you more current than many working developers.

The meta-lesson: TypeScript is a set of *claims about JavaScript* that a pragmatic checker verifies as best it can. Experts keep the claims honest at the boundaries, model data so wrong states can't be written down, know exactly where the checker can be fooled, and keep the types only as clever as the problem demands.
