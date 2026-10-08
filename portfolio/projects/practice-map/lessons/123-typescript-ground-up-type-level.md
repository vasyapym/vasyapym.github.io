<!-- lesson-meta: {"practicePrompt":"Model one real-world state of yours (an API response, a UI screen) as a discriminated union with a literal discriminant, add a switch with a default branch assigning to never, then deliberately add a new variant and watch compilation fail exactly where the fix belongs. After that, guard one external boundary with a schema library and derive the static type from the schema instead of annotating.","checkPrompt":"Reproduce from memory: type erasure and why types vanish at runtime, the any-unknown-never trio and their set semantics, narrowing plus type predicates and exhaustiveness checking, structural typing with branding for ids, function variance (contravariant parameters, covariant returns, bivariant methods, covariant arrays), the distributivity rule for conditional types with infer, the list of unsound corners, and why parse-dont-validate closes the gap between model and reality."} -->
<!-- lesson-theory: {"problem":"Plain JavaScript fails late and far from the cause: wrong shapes flow through API boundaries, refactors silently miss call sites, and impossible states surface at runtime in front of users — because nothing checks the model before the program runs.","model":"TypeScript is JavaScript plus a static type system that is fully erased before execution: types are a model of the program, not its machinery, so data crossing boundaries must be validated by real runtime code. Types are sets of values — assignability is subset, unions are set union, never is the empty set (bottom), unknown is the top — and the checker is pragmatic rather than sound: it trades completeness for describing how JavaScript is actually written. Control flow analysis narrows types wherever you have checked them, and the type level itself is a small programmable language of mapped, conditional, template-literal and recursive types.","mechanics":"Erasure: annotations disappear before running, so runtime validation at trust boundaries is your responsibility — parse, dont validate. Narrowing and control flow analysis: typeof, instanceof, in, truthiness and user-written type predicates refine types per branch; discriminated unions with a common literal discriminant give exhaustive switch, and a default branch of never turns forgotten variants into compile errors. The set model explains surprises: object intersections shrink the set of acceptable values, keyof of a union keeps only common keys, string and number intersects to never, and any exits the lattice entirely (the dynamic type of gradual typing), which is why unknown is the honest choice. Structural typing plus branding: shapes match regardless of origin, and a phantom brand property on ids restores nominal-style safety; excess property checking is a freshness exception for literals, not a general rule. Variance: functions are covariant in returns and contravariant in parameters under strictFunctionTypes, while method syntax stays bivariant and mutable arrays stay covariant — deliberate unsoundness for usability, made safe by readonly. Type-level programming: typeof and keyof lift values into types, mapped types iterate keys, conditional types distribute over naked parameters and infer pattern-matches substructures, template literals parse strings, and tail-recursive conditionals scale recursion — Turing complete, but bought with compile time and readability. Scale discipline: strict flags from day one, @ts-expect-error over @ts-ignore, nodenext or bundler resolution, isolatedModules and verbatimModuleSyntax for per-file transpilers, project references with incremental builds in monorepos, interfaces over deep intersections, annotated return types, and the 2025 Go-native port for order-of-magnitude speedups.","pitfalls":["Reaching for any and letting it spread silently through inference instead of unknown plus narrowing","Treating x as User as a check — assertions are claims, and double assertions permit anything","Reading arr[5] as always T without noUncheckedIndexedAccess, the optimistic indexed-access default","Assigning a type to JSON.parse or fetch().json() output and calling the boundary validated","Forgetting method parameters stay bivariant even under strictFunctionTypes, unlike function-typed properties","Losing literal precision through plain annotations where const, as const or satisfies would keep it","Confusing optional x?: T with absent keys until exactOptionalPropertyTypes tightens the model","Stacking clever conditional types that buy precision at the price of unreadable errors and compile time","Trusting declaration files: a .d.ts is a human promise never verified against the implementation"],"whenNot":"Not worth it for genuinely throwaway scripts, or where runtime shapes never cross a boundary and no team will maintain the code. And none of the static machinery removes the duty of runtime validation for external data — the compiled output is still JavaScript doing exactly what it always did."} -->

# TypeScript, From the Ground Up to the Type Level

*A prose tour of the core ideas and vocabulary, written for newcomers and veterans alike.*

---

## Part I: What TypeScript Actually Is

The single most clarifying sentence about TypeScript is this: **TypeScript is JavaScript plus a static type system, and the types disappear before your code runs.** Everything else follows from that.

JavaScript is a **dynamically typed** language. Values carry types at runtime: a number knows it is a number. Variables do not; any variable can hold anything at any moment. TypeScript adds **static types**, descriptions of what values *should* flow through your program, checked by a tool (the compiler, `tsc`) *before* execution. When checking is finished, the compiler performs **type erasure**. It strips the annotations and emits plain JavaScript. No type information survives into the running program. You cannot ask at runtime "is this value a `User`?" in the TypeScript sense, because `User` no longer exists. This is the deepest difference between TypeScript and languages like Java or C#, where types persist at runtime and can be reflected upon.

Two consequences follow. First, TypeScript is **a superset of JavaScript**. Valid JavaScript is, modulo some strictness settings, valid TypeScript. Second, TypeScript's types are a *model* of your program, not its machinery. When the model and reality disagree (say, an API returns something other than what you declared), the type system cannot save you. It has already finished its work. Experienced TypeScript engineers internalize this as a discipline. Types are trusted *inside* the program, and data crossing the program's boundary (network, disk, user input) must be validated by actual runtime code.

TypeScript's designers made a deliberate philosophical choice: **soundness is not the goal.** A *sound* type system guarantees that if a program type-checks, no type error can occur at runtime. TypeScript explicitly trades some soundness for usability and for compatibility with the vast, wild ecosystem of existing JavaScript idioms. It aims to catch the overwhelming majority of real bugs while still being able to describe how JavaScript is actually written. Understanding *where* it is unsound, which we'll cover later, separates intermediate users from experts.

---

## Part II: The Basic Vocabulary

**Type annotations** are the colon-syntax you attach to variables, parameters, and return values: `let age: number = 30`. But you'll write far fewer of these than you'd think, thanks to **type inference**. The compiler deduces types from context. Write `let age = 30` and TypeScript already knows `age` is a `number`. Good TypeScript style annotates at boundaries (function parameters, exported APIs) and lets inference handle the interior.

The **primitive types** mirror JavaScript's runtime primitives: `string`, `number`, `boolean`, `bigint`, `symbol`, `null`, and `undefined`. **Object types** describe shapes, like `{ name: string; age: number }`. **Arrays** are written `string[]` or `Array<string>`. **Tuples** are fixed-length arrays where each position has its own type: `[string, number]` describes a pair like `["Ada", 36]`.

Three special types deserve early attention because they anchor the whole system:

- **`any`** turns the checker off. A value of type `any` can be used as anything and assigned to anything. It is the escape hatch, and it is contagious: `any` flowing into an expression often makes the result `any` too, silently spreading unchecked territory through your code.
- **`unknown`** is the *safe* counterpart. Anything can be assigned *to* `unknown`, but you can do almost nothing *with* an `unknown` value until you've proven what it is. It means "I genuinely don't know yet, so make me check."
- **`never`** is the type with no values at all. A function that always throws returns `never`. A variable narrowed past every possibility has type `never`. It sounds useless and turns out to be one of the most powerful tools in the language.

**Literal types** are types inhabited by exactly one value. `"north"` is a type, distinct from `string`, whose only member is the string `"north"`. Literal types become powerful when combined with **union types**, written with `|`: `type Direction = "north" | "south" | "east" | "west"`. A union means "one of these." Its partner, the **intersection type**, written with `&`, means "all of these at once." `A & B` has every property of `A` and every property of `B`.

**Type aliases** (`type Point = { x: number; y: number }`) give names to types. **Interfaces** (`interface Point { x: number; y: number }`) do something similar for object shapes. For everyday use they're nearly interchangeable. The differences matter in specialized situations: interfaces can be extended and *merged*, while aliases can name any type, including unions and primitives. We'll revisit this in the large-codebase section, where it has performance implications.

Properties can be **optional** (`email?: string`) or **readonly** (`readonly id: string`). Functions have types too: `(a: number, b: number) => number`. Functions can declare **overloads**, multiple call signatures for different argument patterns, though modern code often prefers unions or generics.

**Enums** (`enum Color { Red, Green }`) are one of the few TypeScript features that *emit runtime code*. That makes them philosophically awkward in a language whose identity is "types that erase." Many teams avoid them in favor of unions of string literals, which give the same safety with zero runtime footprint. The trend has become official: recent TypeScript versions include an `erasableSyntaxOnly` flag that forbids enums and other non-erasable constructs. It aligns with Node.js's ability to run TypeScript by simply stripping types.

---

## Part III: Narrowing and Control Flow Analysis

Here is where TypeScript stops being "Java syntax on JavaScript" and becomes something genuinely clever.

Suppose a parameter has type `string | number`. You can't call `.toUpperCase()` on it, because numbers don't have that method. But inside `if (typeof x === "string") { ... }`, TypeScript knows `x` is a `string`. This is **narrowing**: refining a broad type to a more specific one based on runtime checks the compiler can see. The machinery behind it is **control flow analysis**. The checker follows every branch, return, and assignment, tracking what each variable's type must be at each point in the code.

Many checks narrow: `typeof`, `instanceof`, the `in` operator, equality comparisons, truthiness checks, and assignments. You can also write your own **type guards**, functions whose return type is a **type predicate** like `value is User`. They tell the compiler: "if I return true, trust that the argument is a `User`." **Assertion functions** (`asserts value is User`) do the same for functions that throw on failure.

The crown jewel of this system is the **discriminated union** (also called a *tagged union*, or a *sum type* in functional-programming vocabulary). You model a value that can be one of several shapes, each carrying a common literal-typed field, the **discriminant**:

```ts
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number };
```

Switch on `shape.kind` and, in each branch, TypeScript knows exactly which shape you hold and which fields exist. Add a `default` branch that assigns the value to a variable of type `never`, and you get **exhaustiveness checking**. If someone later adds a `"triangle"` variant and forgets to handle it, the leftover type is no longer `never`, and compilation fails at precisely the spot needing attention. This one pattern prevents an enormous class of bugs. It is the single most valuable idiom for modeling domain logic in TypeScript, and the basis of the principle known as "make illegal states unrepresentable."

---

## Part IV: Types as Sets

Now we shift from vocabulary to mental model. The most productive way to think about TypeScript types is **as sets of values**.

The type `string` is the set of all strings. The literal type `"north"` is a set with one element. A union `A | B` is the *set union*; an intersection `A & B` is the *set intersection*. `never` is the **empty set**, so it's called the **bottom type**. `unknown` is the set of all values, the **top type**.

**Assignability**, TypeScript's core relation, is (approximately) *subset*. A value of type `A` can go where type `B` is expected if `A`'s set fits inside `B`'s. `"north"` is assignable to `string`. `never` is assignable to everything, because the empty set is a subset of every set. Everything is assignable to `unknown`.

This model explains some initially baffling facts:

- **`string & number` is `never`.** No value is both, so the intersection is empty.
- **Object intersections combine properties.** `{a: string} & {b: number}` requires both properties. That seems like it "adds" things, but in set terms it *shrinks* the set of acceptable values, because fewer objects satisfy both constraints. More properties means a smaller set, which means a more specific type.
- **`keyof (A | B)` gives only the keys common to both.** If you only know a value is *one of* A or B, you can only safely access keys that both share.

**`any` breaks the set model.** It behaves as both top and bottom simultaneously: assignable to everything *and* from everything. In the academic literature on **gradual typing** (Siek and Taha's work), `any` corresponds to the *dynamic type*, often written `?`. It isn't a set at all. It's a signal that says "suspend checking here." That's why `unknown` is preferred whenever you mean "could be anything." `unknown` stays honest within the lattice, while `any` exits it.

## Structural Typing

TypeScript's subtyping is **structural**, not **nominal**. In nominal systems (Java, C#), a `Dog` is an `Animal` only if it explicitly declares `extends Animal`. In TypeScript, a type is compatible with another if it *has the right shape*. Any object with a `name: string` property satisfies `{ name: string }`, regardless of where it came from or what it's called. This is sometimes described as statically checked duck typing. It's a natural fit for JavaScript, where objects are routinely created ad hoc as literals.

The cost is that two conceptually different things with identical shapes are interchangeable. A `UserId` and an `OrderId`, both strings, can be swapped without complaint. The idiomatic remedy is **branding**: intersecting with a phantom property that never exists at runtime, such as `type UserId = string & { readonly __brand: "UserId" }`. You only produce branded values through a validating function, which gives you nominal-style safety in a structural world. (Classes with `private` or `#private` members also behave quasi-nominally, since private members are compared by declaration origin.)

A related subtlety is **excess property checking**. Normally, extra properties are fine structurally, because an object with more fields is still in the set. But when you pass a *fresh object literal* directly to a typed location, TypeScript flags unexpected properties, on the theory that you probably made a typo. This "freshness" rule is a pragmatic exception layered over the structural model, and it confuses people precisely because it isn't consistent with pure set reasoning.

## Widening, `as const`, and `satisfies`

When you write `let d = "north"`, TypeScript infers `string`, not `"north"`. This is **widening**: since `let` variables can be reassigned, the compiler generalizes the literal to its base type. With `const d = "north"`, it keeps the literal type because the binding can't change. The **`as const`** assertion pushes this further. It makes an entire object or array deeply readonly with all literals preserved, which is essential for deriving types from data.

The **`satisfies`** operator (TypeScript 4.9) solves a long-standing tension. You often want to check that a value conforms to a type *without* losing the more precise inferred type. Annotating `const config: Config = {...}` widens everything to `Config`. Writing `const config = {...} satisfies Config` validates conformance while preserving the exact inferred shape. It's a small feature with large ergonomic consequences.

---

## Part V: Variance

Variance answers a deceptively simple question: if `Dog` is a subtype of `Animal`, what's the relationship between `Box<Dog>` and `Box<Animal>`?

- **Covariant:** the relationship is preserved, so `Box<Dog>` is assignable to `Box<Animal>`. This holds for things you *read from* (producers, outputs).
- **Contravariant:** the relationship flips, so `Consumer<Animal>` is assignable to `Consumer<Dog>`. This holds for things you *write to* (consumers, inputs). The intuition: a function that can handle *any* animal can certainly handle a dog, so a handler of the broader type safely substitutes for a handler of the narrower one.
- **Invariant:** neither direction is safe. This applies to things both read and written.
- **Bivariant:** both directions are allowed. This is unsound in general.

Function types are *covariant in their return type* and *contravariant in their parameters*. That's the correct, sound rule. Under `strictFunctionTypes`, TypeScript enforces it, **but only for function-typed properties, not for method syntax.** Methods declared as `method(x: T): void` remain **bivariant** in their parameters. That's a deliberate unsoundness kept so that common patterns (like DOM event handler hierarchies and array methods) remain usable.

Similarly, **arrays are covariant**: `Dog[]` is assignable to `Animal[]`. That's unsound, because you could then push a `Cat` into what is really a `Dog[]`. TypeScript accepts the hole because the alternative, invariant arrays, would make enormous amounts of reasonable read-only code fail to compile. Using `readonly Dog[]` (or `ReadonlyArray`) makes the covariance genuinely safe.

TypeScript normally *infers* variance by measuring how a type parameter is used. TypeScript 4.7 added explicit **variance annotations**, `in` and `out` on type parameters (`interface Producer<out T>`). They mostly serve to document intent and to speed up checking in complex generic hierarchies.

---

## Part VI: Generics

**Generics** are type parameters, variables at the type level. `function first<T>(xs: T[]): T` says "for any type `T`, give me an array of `T` and I'll return a `T`." In type theory this is **parametric polymorphism**: one definition works uniformly across all types. The compiler infers `T` from the arguments at each call site.

**Constraints** bound what a type parameter can be: `<T extends { id: string }>` accepts any type with a string `id`. Type parameters can have **defaults** (`<T = string>`). TypeScript 5.0 added **`const` type parameters**, which ask inference to keep literal types as narrow as possible, as if the caller had written `as const`. TypeScript 5.4 added the **`NoInfer<T>`** utility, which blocks a particular position from contributing to inference. That's useful when you want one argument to determine `T` and another merely to be checked against it.

A key concept here is **inference sites and candidates.** When a type parameter appears in multiple argument positions, TypeScript collects candidate types from each and tries to unify them. Most "why did it infer *that*?" frustrations come from this process. The fix is usually reshaping the signature so the "authoritative" position is unambiguous.

---

## Part VII: Type-Level Programming

This is where TypeScript becomes unusual among mainstream languages. Its type system is expressive enough that you can **write programs that run inside the compiler**, computing types from other types. The type checker is, in fact, Turing complete; this was demonstrated publicly in 2017. Here are the building blocks, roughly in order of power.

**`typeof`** (in type position) lifts a value's type into the type world: `type Config = typeof defaultConfig`. This inverts the usual flow. Instead of writing types and then values, you write a value and *derive* its type, keeping a single source of truth.

**`keyof T`** produces the union of `T`'s property keys. **Indexed access types** look up property types: `User["email"]` is the type of `User`'s `email` field, and `T[keyof T]` is the union of all of `T`'s value types.

**Mapped types** iterate over keys to build new object types. Think of them as a `for` loop over properties: `{ [K in keyof T]: T[K] | null }` makes every property nullable. You can add or remove modifiers (`readonly`, `?`) with `+` and `-`. With **key remapping** via `as`, you can rename or filter keys during the iteration. Many of TypeScript's built-in **utility types** are just short mapped types: `Partial`, `Required`, `Readonly`, `Pick`, `Record`, and `Omit` (which is `Pick` combined with `Exclude`).

**Conditional types** are the type-level `if`: `T extends U ? X : Y`. Read it as "if `T` is assignable to `U`, the result is `X`, otherwise `Y`." Two properties make them powerful and occasionally surprising.

First, **distributivity.** When the checked type is a *naked type parameter* and you instantiate it with a union, the conditional is applied to each member separately and the results are re-unioned. `Exclude<T, U>` is literally `T extends U ? never : T`, which works *because* of distribution. Each union member either survives or becomes `never`, and `never` vanishes from unions (it's the empty set, the identity element of union). To *suppress* distribution, wrap both sides in a tuple: `[T] extends [U] ? ...`. A notorious corner case follows directly: instantiating a distributive conditional with `never` (the empty union) yields `never`, because there are zero members to map over.

Second, **`infer`**, which is pattern matching. Inside the `extends` clause you can declare a type variable to be captured: `T extends Promise<infer V> ? V : T` extracts the resolved type of a promise. Built-ins like `ReturnType`, `Parameters`, and `Awaited` are written this way. `infer` turns conditional types into destructuring, so you can pull apart function signatures, tuples, and string patterns.

**Template literal types** (TypeScript 4.1) bring string manipulation to the type level: `` `on${Capitalize<K>}` `` turns `"click"` into `"onClick"`. Combined with `infer`, you can *parse* strings at compile time. Libraries use this to type route parameters directly from a URL pattern like `"/users/:id/posts/:postId"`, to type-check SQL fragments, or to validate format strings.

**Recursive types** let type aliases refer to themselves, enabling `DeepReadonly`, JSON types, and recursive descent over tuples. Since TypeScript 4.5, the compiler optimizes **tail-recursive conditional types**, allowing much deeper recursion (on the order of a thousand levels instead of roughly fifty), provided the recursive call sits in tail position. Type-level programmers write accumulator-style recursion for exactly this reason, just as functional programmers do at the value level.

Put together, these form a small purely functional language. Its values are types; its functions are generic type aliases; its pattern matching is `infer`; its loops are recursion and mapped types; its strings are template literals. Enthusiasts implement arithmetic by representing numbers as tuple lengths (adding two numbers means concatenating tuples and reading `["length"]`), and have built type-level parsers, interpreters, and even toy games. This is a delightful demonstration of expressiveness, and also a warning.

## What the Type Level Lacks

TypeScript has no **higher-kinded types**. You cannot write a type parameter that is itself a *type constructor*, like `F<_>`, and abstract over "any container." That rules out expressing a general `Functor` or `Monad` interface directly, the way Haskell or Scala can. Functional libraries work around this with encodings. One approach maps string "URIs" to concrete types through an augmentable interface (the approach popularized by fp-ts). Another is a defunctionalization trick using interfaces with a `this`-typed slot, effectively emulating type-level lambdas (the style used in Effect). These workarounds succeed, but you can feel the strain.

## The Ethics of Cleverness

Professional type-level programming is governed by a simple tension. Every bit of type-level computation buys *precision* (fewer impossible states, better autocomplete) and costs *comprehensibility* and *compile time*. Error messages emerging from a six-layer conditional type can be inscrutable. The mature practice is to concentrate the cleverness in a small number of well-tested library types, expose simple names to everyday code, and write **type tests** (assertions that certain types are equal or that certain code fails to compile, often via `// @ts-expect-error` or tools like `expect-type`) so that library types are verified like any other code.

---

## Part VIII: Where the Type System Lies to You

An expert knows the unsound corners by heart:

1. **`any`** suppresses all checking and propagates silently.
2. **Type assertions** (`x as User`) are claims, not checks. The compiler permits assertions between sufficiently related types and simply believes you. The double assertion `x as unknown as Whatever` permits anything.
3. **Indexed access defaults are optimistic.** `arr[5]` has type `T`, not `T | undefined`, unless you enable `noUncheckedIndexedAccess`. The same applies to dictionary-style records.
4. **Method parameter bivariance** and **covariant mutable arrays**, discussed above.
5. **Optional vs. `undefined`.** By default, `{ x?: number }` permits explicitly setting `x: undefined`, which differs from the key being absent (consider `"x" in obj`). The `exactOptionalPropertyTypes` flag tightens this.
6. **Narrowing invalidation.** A narrowed property can be changed by a function call the checker doesn't track. TypeScript keeps narrowings across calls for pragmatic reasons, accepting the theoretical hole.
7. **Declaration files** can simply be wrong. A `.d.ts` file describing a library is a promise made by a human, never verified against the implementation.
8. **Runtime boundaries.** `JSON.parse` returns `any`, and `fetch(...).json()` returns `Promise<any>`. Whatever type you assign the result is fiction until checked.

The last point inspires the most important architectural principle in serious TypeScript: **"parse, don't validate."** At every trust boundary, run real runtime validation with a schema library like Zod, Valibot, or ArkType, and derive the static type *from the schema*. The schema then becomes the single source of truth for both the runtime check and the compile-time type, and the gap between model and reality closes.

---

## Part IX: Declarations and the Ecosystem

**Declaration files** (`.d.ts`) contain only types, with no implementations. They describe the shape of JavaScript code: the compiler emits them for your libraries, and you consume them for others'. **DefinitelyTyped** is the vast community repository that publishes types for untyped JavaScript packages under the `@types/` npm scope.

**Ambient declarations** (`declare const VERSION: string`) tell the compiler that something exists at runtime without defining it. This is useful for globals injected by bundlers or environments. **Declaration merging** lets multiple declarations of the same interface or namespace combine into one. **Module augmentation** applies this to modules you don't own. You can add a property to a library's `Request` type, for instance, by reopening its interface in your own code. That's powerful, global, and occasionally surprising: a reason to keep augmentations centralized and documented.

---

## Part X: TypeScript in Large Codebases

At scale, TypeScript becomes an engineering-systems problem as much as a language one. The relevant vocabulary shifts toward configuration, build topology, and performance.

## Configuration and Strictness

`tsconfig.json` governs everything. The **`strict`** flag is an umbrella enabling a family of checks: `strictNullChecks` (without which `null` and `undefined` are silently assignable to everything, the infamous "billion-dollar mistake"), `noImplicitAny`, `strictFunctionTypes`, `useUnknownInCatchVariables`, and others. New projects should begin strict. Legacy migrations typically enable flags incrementally, sometimes per directory.

Directives like `// @ts-ignore` silence errors on the next line. **`// @ts-expect-error` is strictly better**, because it *fails* if there's no error to suppress. Suppressions therefore expire automatically when the underlying issue is fixed, instead of rotting forever.

## Module Systems

**Module resolution**, meaning how an import string becomes a file, is a genuine source of pain because the JavaScript world has two module systems (CommonJS and ES modules) and multiple resolution algorithms. The modern settings are `"module": "nodenext"` (mirroring Node's actual rules, including `package.json` `"exports"` maps) and `"moduleResolution": "bundler"` (mirroring tools like Vite and esbuild). Choosing the setting that matches your real runtime is essential. Mismatches produce code that type-checks but fails to load.

## Isolated Compilation

Modern toolchains often skip `tsc` for *emitting* code, using fast transpilers (esbuild, SWC, Babel) that process each file independently without type information. This requires your code to be compilable file by file. **`isolatedModules`** enforces that, flagging constructs like re-exporting a type without the `type` keyword, which a single-file transpiler couldn't know to erase. **`verbatimModuleSyntax`** makes this explicit and predictable: imports marked `import type` are erased, and everything else is kept as written.

**`isolatedDeclarations`** (TypeScript 5.5) applies the same idea to declaration files. It requires explicit type annotations on exports so that `.d.ts` files can be generated per file, without whole-program inference. That enables parallel builds and makes your public API's types visible in the source rather than implied by inference.

## Project References and Incrementality

In a monorepo, type-checking everything as one giant program becomes slow and memory-hungry. **Project references** split the codebase into sub-projects, each with its own `tsconfig.json` marked `"composite": true`, declaring dependencies on one another. Building with `tsc --build` compiles them in dependency order, and each project consumes its dependencies' *declaration files* rather than re-checking their source. Combined with **`incremental`** builds (which cache results in `.tsbuildinfo` files), this turns full rebuilds into targeted ones. The architectural benefit is equally real: references enforce dependency direction, so a low-level package cannot accidentally import from a high-level one.

## Type-Checker Performance

The compiler's performance depends heavily on how you write types. The team's own guidance includes several points:

- **Prefer interfaces with `extends` over deep intersections** for object composition. Interfaces are named and cached, while intersections are often recomputed structurally.
- **Annotate return types** of exported functions. This saves the checker from re-inferring complex types and keeps declaration output simple.
- **Name complex types** rather than inlining them, so the compiler can cache them.
- **Beware enormous unions** (thousands of members) and deep conditional-type recursion. Some operations are quadratic in union size.
- Use **`skipLibCheck`** to avoid re-checking every dependency's declaration files.
- Diagnose with **`--extendedDiagnostics`** and **`--generateTrace`**. The latter produces a trace viewable in a profiler, showing exactly which types are expensive.

A watershed moment: in 2025 the TypeScript team announced a **native port of the compiler to Go** (released as previews under the name `tsgo`, slated to become TypeScript 7). It brings roughly order-of-magnitude speedups through native execution and shared-memory parallelism. The language semantics are intended to stay the same; the cost of checking a large codebase drops dramatically.

## Architecture and Culture

In large systems, the type system becomes a **communication medium**. Types at module boundaries are contracts between teams. A few practices recur in healthy codebases:

- Domain states modeled as discriminated unions, with exhaustive handling.
- Branded types for identifiers and units, so IDs and quantities can't be confused.
- Runtime validation at every external boundary, with static types derived from schemas.
- `any` banned by lint rules, using `unknown` plus narrowing instead.
- Clever type-level machinery confined to small, tested utility modules.
- **typescript-eslint** with type-aware rules (like `no-floating-promises`, which catches un-awaited async calls) layered on top of the compiler.

Migration from JavaScript is itself a craft. Teams typically use `allowJs` and `checkJs` (with JSDoc annotations) to type-check existing JavaScript, convert file by file, start lenient, and ratchet strictness upward with tooling that prevents regressions.

---

## Part XI: The Big Picture

Step back and TypeScript reveals itself as an unusual artifact in programming-language history. Most type systems are designed alongside their languages and shape how programs are written. TypeScript was designed *after* its language, to describe code that already existed, written by millions of people with no thought for static types. This explains nearly all of its distinctive features. Its structural typing matches JavaScript's ad hoc objects. Its control flow analysis matches JavaScript's habit of checking types at runtime with `typeof`. Its literal and template literal types match JavaScript's string-keyed, configuration-heavy style. Its deliberate unsoundness keeps it compatible with what people actually do. And the enormous expressiveness of its type level is what it takes to describe the dynamic patterns of real libraries.

The loose Curry–Howard intuition still applies. Types are propositions about your program, and type-checking is a kind of lightweight proof. But TypeScript's proofs are *pragmatic*, not *absolute*. Their value comes not from mathematical guarantees but from making your editor understand your code: autocomplete that knows every field, refactors that update every call site, and errors that appear the moment you misread your own data model. The beginner experiences TypeScript as "JavaScript that catches my typos." The expert experiences it as a modeling language for designing systems where wrong states cannot be expressed, wrapped around a runtime that, in the end, will still do exactly what JavaScript does.

Both views are correct, and the whole art of TypeScript lies in holding them together.
