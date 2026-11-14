<!-- lesson-meta: {"practicePrompt":"Pick three contested pairs the essay takes a stance on — any versus unknown, enums versus unions of literals, annotation versus satisfies — and write the two-sided answer for each: what the weaker choice is still for, and why the senior stance prefers the other. Then open a real file in your project and find one place where your own code violates the stance you just wrote.","checkPrompt":"Without notes, explain why one any contaminates everything it touches, why forEach accepts callbacks that return values, and what a wrong type predicate does to the compiler. State the interfaces-versus-aliases position and the reason satisfies exists."} -->
<!-- lesson-theory: {"problem":"Reciting feature names passes a junior interview but collapses at the contested points — variance, void, enums, satisfies — where the question is really whether you hold a position or just remember syntax.","model":"The lesson treats each definition as a claim plus a stance: what the concept is, and the senior answer about where it belongs. TypeScript is compile-time documentation that the compiler enforces and erases at runtime, so every senior stance traces back to that one fact. Interview depth shows in the nuance, not the inventory: method bivariance, the viral spread of any, and the boundary where runtime validation must replace static types.","mechanics":"any is bidirectionally assignable and viral: operations on it yield any again, so a single escape hatch contaminates every inferred return type downstream. unknown accepts everything but permits nothing until narrowed — it encodes the honest claim «I don't know what this is yet», which is why it belongs in catch clauses, JSON parsing, and untrusted input. never is the bottom type, and assigning a value to never in a switch default turns a missed union case into a compile error — exhaustiveness checking with no runtime cost. void promises only that callers will not use the result, so a function typed as returning void may actually return something, which is why forEach accepts callbacks that return values. Control-flow narrowing refines types per branch from evidence like typeof, instanceof, and truthiness, but a user-defined predicate is a trust boundary: the compiler believes a wrong guard and faithfully propagates the lie. And because types are erased, runtime boundaries need schema libraries such as Zod, io-ts, or Valibot whose schemas derive the static type — a single source of truth for both checks.","pitfalls":["Leaving any in place after a migration ends, treating the deliberate opt-out as a permanent habit.","Trusting a type predicate whose body checks too little: the compiler believes the guard and propagates the lie faithfully.","Choosing enum machinery where a union of string literals is zero-cost, erases cleanly, and composes with template literals.","Annotating every variable and losing literal precision, instead of annotating only at boundaries where widening would happen.","Reaching for the double assertion through unknown routinely, though it is the smell that signals a design problem.","Expecting excess property checks on every assignment, when only fresh object literals get the special typo-catching rule.","Missing the method bivariance exception: a callback declared with method shorthand escapes strictFunctionTypes checking.","Treating satisfies as cosmetic, rather than the resolution of the tension between annotation losing specificity and inference losing validation.","Assuming runtime data is safe because it compiles, ignoring that erasure means API responses need schema validation at the boundary."],"whenNot":"The lesson is framed for interview preparation and review judgment, not for learning syntax from scratch, and its type-level programming coverage is a catalog of tools rather than a guide to composing them."} -->

# TypeScript: Core Definitions & Concepts

## The Type System Itself

**TypeScript** is a statically typed superset of JavaScript that compiles to plain JavaScript. The crucial insight is that TypeScript's type system is *structural*, not nominal: two types are compatible if their shapes match, regardless of their declared names. This contrasts with languages like Java or C#, where identity depends on explicit declarations. At runtime, types are erased entirely — TypeScript performs no runtime checks, which is why it's often described as "compile-time documentation that the compiler enforces."

**Type inference** is the compiler's ability to deduce types without explicit annotation. A senior engineer leans on inference aggressively and annotates only at *boundaries* — function signatures, module exports, API contracts — where explicitness serves as documentation and protects against accidental widening.

**Structural typing (duck typing, formalized)** means an object is assignable to a type if it possesses at least the required members with compatible types. The subtle consequence is that "extra" properties are generally allowed — except in *excess property checks* on fresh object literals, a deliberate ergonomic exception designed to catch typos.

## The Special Types

**`any`** is the escape hatch that disables type checking entirely. It is *bidirectionally* assignable — anything goes in, anything comes out — which makes it viral: one `any` contaminates everything it touches. Senior answer: `any` is a deliberate opt-out, acceptable during migration, never acceptable as laziness.

**`unknown`** is the type-safe counterpart to `any`. It accepts any value but permits no operations until you *narrow* it. It encodes the honest statement "I don't know what this is yet," forcing verification before use. Prefer it for `catch` clauses, JSON parsing, and untrusted input.

**`never`** is the *bottom type* — the type with no inhabitants. It represents unreachable code, functions that never return (they throw or loop forever), and exhausted unions. Its signature trick: assigning a value to `never` in a `switch` default produces a compile error if a union case was missed — compile-time exhaustiveness checking.

**`void`** signifies the deliberate absence of a return value. Subtlety worth mentioning: a function *typed* as returning `void` may actually return something; the type system simply promises callers won't use it. This is why `Array.prototype.forEach` accepts callbacks that return values.

**`null` vs `undefined`** under `strictNullChecks` become distinct, non-assignable types, transforming the "billion-dollar mistake" into a compiler-enforced obligation to handle absence explicitly.

## Narrowing & Guards

**Type narrowing** is the compiler's refinement of a type within a control-flow branch, based on evidence: `typeof` checks, `instanceof`, equality comparisons, truthiness, and the `in` operator. TypeScript performs *control-flow analysis* — it tracks what you've proven about a variable at each point in the program.

**Type guards (user-defined)** are functions whose return type is a *type predicate* (`value is Foo`), teaching the compiler custom narrowing logic. They're a trust boundary: the compiler believes your predicate, so a wrong guard is a lie the compiler will faithfully propagate.

**Discriminated unions (tagged unions)** are the idiomatic TypeScript encoding of algebraic data types: a union of object types sharing a literal-typed discriminant field (commonly `kind` or `type`). Switching on the discriminant narrows automatically. This is the backbone of Redux actions, state machines, and result types.

**Assertion functions** (`asserts value is Foo`) narrow types by *throwing* rather than returning a boolean — useful for invariant enforcement.

## Generics

**Generics** are parametric polymorphism: writing code against type *variables* that are resolved at usage. The senior framing: generics express *relationships* between types — between input and output, between a container and its contents — that would otherwise be lost to `any`.

**Generic constraints** (`T extends Shape`) bound a type parameter, granting access to the constraint's members while preserving the caller's specific type. The classic pattern `<T, K extends keyof T>` expresses "a key that provably belongs to this object."

**Variance** describes how subtyping propagates through type constructors: *covariance* (outputs — producer positions preserve subtyping direction), *contravariance* (inputs — consumer positions reverse it), and *invariance*. TypeScript checks method parameters bivariantly by default for pragmatic reasons but enforces contravariance for function-typed properties under `strictFunctionTypes` — a nuanced answer that distinguishes senior candidates.

## Type-Level Programming

**`keyof`** produces a union of a type's property keys — the gateway to type-safe property access.

**Indexed access types** (`T[K]`) look up the type of a property, enabling types that mirror runtime data access.

**Mapped types** iterate over the keys of a type to produce a transformed type — the mechanism behind utilities like `Partial`, `Required`, `Readonly`, and `Pick`. Key remapping with `as` allows renaming or filtering keys during the mapping.

**Conditional types** (`T extends U ? X : Y`) are type-level if-statements. Combined with the **`infer`** keyword — which introduces a type variable to be deduced from a pattern — they enable extraction types like `ReturnType<T>` and `Awaited<T>`. Conditional types *distribute* over naked union type parameters, applying the condition to each member — a behavior that is simultaneously powerful and a common source of surprise.

**Template literal types** lift string manipulation to the type level, enabling typed event names, route parameters, and CSS-like DSLs.

**Utility types** worth defining fluently: `Partial<T>` makes all properties optional; `Required<T>` reverses it; `Pick<T, K>` and `Omit<T, K>` select or exclude keys; `Record<K, V>` builds a dictionary type; `Exclude`/`Extract` filter unions; `NonNullable` strips `null | undefined`; `ReturnType` and `Parameters` deconstruct function signatures.

## Declarations & Composition

**Interfaces vs type aliases**: interfaces are open (they support *declaration merging* — multiple declarations of the same name fuse) and are optimized for object shapes and class contracts; type aliases are closed but universal, able to name unions, intersections, tuples, primitives, and conditional types. Senior position: pick one convention per codebase; prefer interfaces for public, extendable object contracts and type aliases for everything compositional.

**Intersection types** (`A & B`) combine members; **union types** (`A | B`) represent alternatives, and only members common to all constituents are accessible without narrowing.

**Type assertions** (`as`) override the compiler's judgment without any runtime effect — a claim, not a conversion. `as const` is the principled variant: it freezes literals into their narrowest readonly types, invaluable for configuration objects and discriminant values. The double assertion (`as unknown as T`) is the smell that signals a design problem.

**Enums vs union of literals**: enums generate runtime code (except `const enum`, which inlines); unions of string literals (`'a' | 'b'`) are zero-cost, erase cleanly, and compose with template literals — the modern preference in most codebases.

**Declaration files (`.d.ts`)** describe the types of JavaScript code without implementation — the mechanism by which the untyped ecosystem (via DefinitelyTyped / `@types`) becomes type-safe.

**Module augmentation** extends third-party type declarations from your own code — how libraries like Express get `req.user` added safely.

## Configuration & Tooling (Where Senior Candidates Differentiate)

**`strict` mode** is an umbrella flag enabling `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, `strictPropertyInitialization`, and more. The senior stance: strict mode is non-negotiable for new code; for legacy migration, enable flags incrementally.

**`satisfies`** (TS 4.9+) validates a value against a type *without widening* its inferred type — you get both the constraint check and the precise literal inference. It resolves the classic tension between annotation (loses specificity) and inference (loses validation).

**Type erasure's consequence**: validation at runtime boundaries (API responses, user input) requires runtime schema libraries (Zod, io-ts, Valibot) whose schemas *derive* static types — the pattern of a single source of truth for both runtime validation and compile-time safety.

**Declaration merging, ambient declarations, and `tsconfig` fields** like `paths`, `moduleResolution`, `isolatedModules`, and `incremental` form the operational knowledge expected at senior level — less about memorization, more about understanding that TypeScript is a *build system participant*, not just a linter.
