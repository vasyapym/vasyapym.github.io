import type { LessonSection } from "../curriculum";

export const sections: readonly LessonSection[] = [
  {
    heading: "The Type System Itself",
    blocks: [
      {"kind":"p","text":"**TypeScript** is a statically typed superset of JavaScript that compiles to plain JavaScript. The crucial insight is that TypeScript's type system is *structural*, not nominal: two types are compatible if their shapes match, regardless of their declared names. This contrasts with languages like Java or C#, where identity depends on explicit declarations. At runtime, types are erased entirely — TypeScript performs no runtime checks, which is why it's often described as \"compile-time documentation that the compiler enforces.\""},
      {"kind":"p","text":"**Type inference** is the compiler's ability to deduce types without explicit annotation. A senior engineer leans on inference aggressively and annotates only at *boundaries* — function signatures, module exports, API contracts — where explicitness serves as documentation and protects against accidental widening."},
      {"kind":"p","text":"**Structural typing (duck typing, formalized)** means an object is assignable to a type if it possesses at least the required members with compatible types. The subtle consequence is that \"extra\" properties are generally allowed — except in *excess property checks* on fresh object literals, a deliberate ergonomic exception designed to catch typos."},
    ],
  },
  {
    heading: "The Special Types",
    blocks: [
      {"kind":"p","text":"**`any`** is the escape hatch that disables type checking entirely. It is *bidirectionally* assignable — anything goes in, anything comes out — which makes it viral: one `any` contaminates everything it touches. Senior answer: `any` is a deliberate opt-out, acceptable during migration, never acceptable as laziness."},
      {"kind":"p","text":"**`unknown`** is the type-safe counterpart to `any`. It accepts any value but permits no operations until you *narrow* it. It encodes the honest statement \"I don't know what this is yet,\" forcing verification before use. Prefer it for `catch` clauses, JSON parsing, and untrusted input."},
      {"kind":"p","text":"**`never`** is the *bottom type* — the type with no inhabitants. It represents unreachable code, functions that never return (they throw or loop forever), and exhausted unions. Its signature trick: assigning a value to `never` in a `switch` default produces a compile error if a union case was missed — compile-time exhaustiveness checking."},
      {"kind":"p","text":"**`void`** signifies the deliberate absence of a return value. Subtlety worth mentioning: a function *typed* as returning `void` may actually return something; the type system simply promises callers won't use it. This is why `Array.prototype.forEach` accepts callbacks that return values."},
      {"kind":"p","text":"**`null` vs `undefined`** under `strictNullChecks` become distinct, non-assignable types, transforming the \"billion-dollar mistake\" into a compiler-enforced obligation to handle absence explicitly."},
    ],
  },
  {
    heading: "Narrowing & Guards",
    blocks: [
      {"kind":"p","text":"**Type narrowing** is the compiler's refinement of a type within a control-flow branch, based on evidence: `typeof` checks, `instanceof`, equality comparisons, truthiness, and the `in` operator. TypeScript performs *control-flow analysis* — it tracks what you've proven about a variable at each point in the program."},
      {"kind":"p","text":"**Type guards (user-defined)** are functions whose return type is a *type predicate* (`value is Foo`), teaching the compiler custom narrowing logic. They're a trust boundary: the compiler believes your predicate, so a wrong guard is a lie the compiler will faithfully propagate."},
      {"kind":"p","text":"**Discriminated unions (tagged unions)** are the idiomatic TypeScript encoding of algebraic data types: a union of object types sharing a literal-typed discriminant field (commonly `kind` or `type`). Switching on the discriminant narrows automatically. This is the backbone of Redux actions, state machines, and result types."},
      {"kind":"p","text":"**Assertion functions** (`asserts value is Foo`) narrow types by *throwing* rather than returning a boolean — useful for invariant enforcement."},
    ],
  },
  {
    heading: "Generics",
    blocks: [
      {"kind":"p","text":"**Generics** are parametric polymorphism: writing code against type *variables* that are resolved at usage. The senior framing: generics express *relationships* between types — between input and output, between a container and its contents — that would otherwise be lost to `any`."},
      {"kind":"p","text":"**Generic constraints** (`T extends Shape`) bound a type parameter, granting access to the constraint's members while preserving the caller's specific type. The classic pattern `<T, K extends keyof T>` expresses \"a key that provably belongs to this object.\""},
      {"kind":"p","text":"**Variance** describes how subtyping propagates through type constructors: *covariance* (outputs — producer positions preserve subtyping direction), *contravariance* (inputs — consumer positions reverse it), and *invariance*. TypeScript checks method parameters bivariantly by default for pragmatic reasons but enforces contravariance for function-typed properties under `strictFunctionTypes` — a nuanced answer that distinguishes senior candidates."},
    ],
  },
  {
    heading: "Type-Level Programming",
    blocks: [
      {"kind":"p","text":"**`keyof`** produces a union of a type's property keys — the gateway to type-safe property access."},
      {"kind":"p","text":"**Indexed access types** (`T[K]`) look up the type of a property, enabling types that mirror runtime data access."},
      {"kind":"p","text":"**Mapped types** iterate over the keys of a type to produce a transformed type — the mechanism behind utilities like `Partial`, `Required`, `Readonly`, and `Pick`. Key remapping with `as` allows renaming or filtering keys during the mapping."},
      {"kind":"p","text":"**Conditional types** (`T extends U ? X : Y`) are type-level if-statements. Combined with the **`infer`** keyword — which introduces a type variable to be deduced from a pattern — they enable extraction types like `ReturnType<T>` and `Awaited<T>`. Conditional types *distribute* over naked union type parameters, applying the condition to each member — a behavior that is simultaneously powerful and a common source of surprise."},
      {"kind":"p","text":"**Template literal types** lift string manipulation to the type level, enabling typed event names, route parameters, and CSS-like DSLs."},
      {"kind":"p","text":"**Utility types** worth defining fluently: `Partial<T>` makes all properties optional; `Required<T>` reverses it; `Pick<T, K>` and `Omit<T, K>` select or exclude keys; `Record<K, V>` builds a dictionary type; `Exclude`/`Extract` filter unions; `NonNullable` strips `null | undefined`; `ReturnType` and `Parameters` deconstruct function signatures."},
    ],
  },
  {
    heading: "Declarations & Composition",
    blocks: [
      {"kind":"p","text":"**Interfaces vs type aliases**: interfaces are open (they support *declaration merging* — multiple declarations of the same name fuse) and are optimized for object shapes and class contracts; type aliases are closed but universal, able to name unions, intersections, tuples, primitives, and conditional types. Senior position: pick one convention per codebase; prefer interfaces for public, extendable object contracts and type aliases for everything compositional."},
      {"kind":"p","text":"**Intersection types** (`A & B`) combine members; **union types** (`A | B`) represent alternatives, and only members common to all constituents are accessible without narrowing."},
      {"kind":"p","text":"**Type assertions** (`as`) override the compiler's judgment without any runtime effect — a claim, not a conversion. `as const` is the principled variant: it freezes literals into their narrowest readonly types, invaluable for configuration objects and discriminant values. The double assertion (`as unknown as T`) is the smell that signals a design problem."},
      {"kind":"p","text":"**Enums vs union of literals**: enums generate runtime code (except `const enum`, which inlines); unions of string literals (`'a' | 'b'`) are zero-cost, erase cleanly, and compose with template literals — the modern preference in most codebases."},
      {"kind":"p","text":"**Declaration files (`.d.ts`)** describe the types of JavaScript code without implementation — the mechanism by which the untyped ecosystem (via DefinitelyTyped / `@types`) becomes type-safe."},
      {"kind":"p","text":"**Module augmentation** extends third-party type declarations from your own code — how libraries like Express get `req.user` added safely."},
    ],
  },
  {
    heading: "Configuration & Tooling (Where Senior Candidates Differentiate)",
    blocks: [
      {"kind":"p","text":"**`strict` mode** is an umbrella flag enabling `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, `strictPropertyInitialization`, and more. The senior stance: strict mode is non-negotiable for new code; for legacy migration, enable flags incrementally."},
      {"kind":"p","text":"**`satisfies`** (TS 4.9+) validates a value against a type *without widening* its inferred type — you get both the constraint check and the precise literal inference. It resolves the classic tension between annotation (loses specificity) and inference (loses validation)."},
      {"kind":"p","text":"**Type erasure's consequence**: validation at runtime boundaries (API responses, user input) requires runtime schema libraries (Zod, io-ts, Valibot) whose schemas *derive* static types — the pattern of a single source of truth for both runtime validation and compile-time safety."},
      {"kind":"p","text":"**Declaration merging, ambient declarations, and `tsconfig` fields** like `paths`, `moduleResolution`, `isolatedModules`, and `incremental` form the operational knowledge expected at senior level — less about memorization, more about understanding that TypeScript is a *build system participant*, not just a linter."},
    ],
  },
];;
