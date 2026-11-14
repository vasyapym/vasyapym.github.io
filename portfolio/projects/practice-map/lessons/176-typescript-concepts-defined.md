<!-- lesson-meta: {"practicePrompt":"Choose five definitions you cannot yet say cleanly — for instance type erasure, bivariance, homomorphic mapped types, satisfies, and the gradual typing contract — and write each as two spoken sentences: what it is, and what consequence it causes. Then check against the compiler whether your example code actually behaves the way your sentence claims.","checkPrompt":"Without notes, define any, unknown, never, and void in one sentence each, explain why method parameters stay bivariant while function-typed properties do not, and say what satisfies does that neither an annotation nor an assertion does."} -->
<!-- lesson-theory: {"problem":"Daily TypeScript use builds recognition, not definition: asked what never is or why declaration merging works, most people gesture at behavior they have seen rather than stating the concept precisely.","model":"The lesson treats TypeScript as a vocabulary where every definition has the same shape: what the thing is, what it causes, and which quirk of the language it explains. Types exist only at compile time and are then erased, so each feature is either a proof the compiler makes or a promise the author takes responsibility for. The goal is being able to say each definition aloud — precise enough for a compiler engineer, plain enough for a newcomer — and to know where the system deliberately stops proving.","mechanics":"Type erasure strips every annotation, interface and generic during compilation, leaving only constructs with runtime semantics like enums and parameter properties — which is why an interface cannot survive an instanceof check and why runtime validation libraries exist. Assignability is the engine's one core relation: the compiler's entire job reduces to checking, at every boundary, that every value of S can be used where a T is expected, decided by shape rather than name. Control-flow analysis keeps a per-point record of what has been proven about a variable, so a typeof or discriminant check refines the type only inside the branch where the proof holds. Variance is measured per type parameter: method parameters stay bivariant even in strict mode so that Array of Dog remains assignable to Array of Animal, while function-typed properties get true contravariance — which is why declaring callbacks as properties buys stricter checking. Distributive conditional types apply a naked type parameter to each union member separately, which is why Exclude filters unions and why wrapping the parameter in a one-element tuple switches distribution off. And satisfies validates an expression against a contract without widening it, preserving the literal types a plain annotation would have destroyed.","pitfalls":["Treating types as runtime objects and trying an instanceof check against an interface that erasure has already removed.","Reading readonly as a guarantee of immutability, when it is shallow, erased at runtime, and only a promise checked through one reference.","Assuming structural typing allows extra properties everywhere, forgetting that fresh object literals face the excess property check to catch typos.","Declaring callbacks with method shorthand, then wondering why strictFunctionTypes enforces no contravariance on them.","Confusing void and never: a void result may exist but be ignored by callers, while a never function cannot return at all.","Using a double assertion through unknown as a routine escape, when it exists to be suspicious and routes around the comparability check entirely.","Believing satisfies or a const assertion freezes or validates data, when both change only what the compiler infers and emit nothing.","Letting recursive conditional types and enormous unions spend the type-level complexity budget: slower builds and errors nobody can read later.","Treating enum as the default for finite sets, though numeric enums are bidirectionally mapped and historically unsound, while literal unions erase cleanly."],"whenNot":"This is a definitions course, not a tutorial: it does not walk through beginner syntax or build setup, and it does not claim TypeScript is sound — it names the holes as deliberate seams of a gradually typed system."} -->

# TypeScript — The Concepts, Defined

*Each entry is a definition you can say aloud in an interview: precise enough for a compiler engineer, plain enough for a newcomer.*

---

## I. Foundations of the Type System

**TypeScript** is a statically typed superset of JavaScript that adds a compile-time type layer and then erases it, emitting ordinary JavaScript. Its purpose is not to change what your program does at runtime but to prove things about it before it runs. The key consequence is that types have zero runtime cost and zero runtime presence — a fact that explains most of the language's quirks.

**Type erasure** is the principle that all type annotations, interfaces, type aliases, and generics vanish during compilation. Only constructs with runtime semantics — enums, namespaces with values, decorators, parameter properties — survive. This is why you cannot check `instanceof` against an interface, and why runtime validation libraries exist.

**Structural typing** (duck typing with proofs) means type compatibility is decided by shape, not by name. If a value has every member a type requires, with compatible types, it *is* that type, regardless of what it was declared as. This contrasts with **nominal typing** (Java, C#), where two identically shaped classes with different names are unrelated.

**Assignability** is the core compatibility relation: a type `S` is assignable to `T` when every value of `S` can be used where a `T` is expected. The compiler's entire job reduces to checking assignability at every boundary — assignments, arguments, returns, property writes.

**Soundness** describes a type system where, if the program type-checks, no type error can occur at runtime. TypeScript is deliberately *unsound*: it trades guarantees for ergonomics and JavaScript compatibility. Known holes include method parameter bivariance, unchecked array indexing, `any`, type assertions, and mutable covariant arrays.

**Type widening** is the compiler's tendency to generalize a literal to its base type when inferring a mutable binding — writing `let x = "hi"` yields `string`, not `"hi"` — because mutability implies future reassignment. **Type narrowing** is the opposite: refining a broader type to a more specific one within a control-flow region based on checks the compiler can see.

**Control-flow analysis** is the mechanism by which the compiler tracks the type of a variable through branches, loops, early returns, and assignments, so that a `typeof`, `in`, `instanceof`, equality check, or truthiness test refines what the variable is known to be at each point.

---

## II. The Top and Bottom of the Lattice

**`any`** is the escape hatch: a type that is assignable to and from everything, which switches off checking for whatever touches it. It is contagious — operations on `any` yield `any` — and it represents a promise the compiler cannot verify.

**`unknown`** is the type-safe top type: everything is assignable *to* it, but it is assignable to nothing (except `any` and `unknown`) until narrowed. It forces the consumer to prove what a value is before using it, making it the correct type for untrusted input such as JSON, `catch` clause errors, and external APIs.

**`never`** is the bottom type: the type with no values, assignable to everything but receiving nothing. It appears as the return type of functions that never return (infinite loops, thrown errors), as the result of exhaustive narrowing, and as the identity element in union algebra — a union with `never` is unchanged, which makes it the "empty set" in type-level programming.

**`void`** denotes the absence of a meaningful return value. It is weaker than `undefined` in one important way: a function type returning `void` accepts callbacks that return anything, because the caller promises to ignore the result. This is why `forEach` can take `arr.map`-style callbacks.

**Exhaustiveness checking** is the technique of assigning a narrowed value to `never` in the default branch of a `switch` or `if` chain, so that adding a new union member produces a compile error at every site that failed to handle it.

---

## III. Declaring Shapes

**Interface** is a named, open contract describing an object's shape. Interfaces support declaration merging, can be extended by other interfaces and implemented by classes, and produce clearer error messages because they retain their name in diagnostics.

**Type alias** is a name for any type expression — object shapes, unions, intersections, tuples, primitives, mapped and conditional types. Aliases are closed (they cannot merge) and strictly more expressive than interfaces. The senior answer to "interface or type?" is: interfaces for public object contracts that others may extend; aliases for everything an interface cannot express; and consistency within a codebase above all.

**Declaration merging** is the compiler's behavior of combining multiple declarations with the same name into one — interfaces merge their members, namespaces merge their exports, and an interface can merge with a class or function. It underpins global augmentation and plugin-style library extension.

**Module augmentation** is declaration merging applied across module boundaries: a `declare module "lib"` block inside a module file adds members to that library's existing types without modifying its source, as when adding custom fields to Express's `Request`.

**Declaration files** (`.d.ts`) contain only type information with no implementation, describing the shape of JavaScript code to the compiler. They are what libraries ship so consumers get types, and what DefinitelyTyped (`@types/*`) provides for libraries that do not.

**Ambient declarations** (`declare`) tell the compiler a value or type exists somewhere at runtime without providing it, as with globals injected by a script tag or build tool.

**Index signature** declares that an object may have arbitrary keys of a given type mapping to values of a given type. It is a blunt instrument: it asserts every key exists, which is why `noUncheckedIndexedAccess` makes reads yield `T | undefined`.

**Optional property** (`?`) means a key may be absent — and, by default, may also be present with value `undefined`. The `exactOptionalPropertyTypes` flag separates these two notions, making "missing" and "explicitly undefined" distinct, as they are at runtime.

**Readonly** is a compile-time-only modifier preventing reassignment of a property or array element through that type. It is shallow, it is erased, and it is not a guarantee of immutability — merely a promise checked at this reference.

**Excess property checking** is the special rule that an object *literal* assigned directly to a typed location may not contain properties the type doesn't declare, even though structural typing would otherwise permit it. It catches typos while preserving structural flexibility for values that arrive indirectly.

---

## IV. Composing Types

**Union type** (`A | B`) is a value that is one of several types. The compiler permits only operations valid on *every* member until the union is narrowed. Unions are the idiomatic replacement for enums, flags, and nullable values.

**Intersection type** (`A & B`) is a value that satisfies all constituent types simultaneously. For object types it merges members; for incompatible primitives it collapses to `never`. Intersections are the mechanism for mixins, branded types, and combining partial contracts.

**Discriminated union** (tagged union, algebraic data type) is a union of object types that each carry a literal-typed property — the discriminant — allowing the compiler to narrow the whole object by inspecting one field. It is the single most important modeling pattern in TypeScript, replacing class hierarchies and optional-field soup with states that cannot be mixed.

**Literal type** is a type inhabited by exactly one value — the string `"GET"`, the number `404`, the boolean `true`. Unions of literals model finite domains with full compiler enforcement and no runtime artifact.

**Tuple type** is a fixed-length array where each position has its own type. Tuples support optional elements, rest elements, and labels, and are how function parameter lists are represented at the type level.

**Variadic tuple types** allow spreading a generic tuple type inside another tuple, enabling types that concatenate, shift, or otherwise manipulate parameter lists generically — the foundation of typing `curry`, `pipe`, and `bind`.

**`keyof`** produces the union of a type's property names. **`typeof`** (in type position) produces the type of a runtime value. Together they let types be derived from values rather than duplicated, enforcing a single source of truth.

**Indexed access type** (`T[K]`) looks up the type of a property, with `K` possibly a union, producing a union of the corresponding value types. It is the type-level analogue of bracket notation.

**`const` assertion** (`as const`) tells the compiler to infer the narrowest possible type: literals stay literal, arrays become readonly tuples, objects become readonly. It is how a plain configuration object becomes a precise type without annotation.

**Enum** is one of the few TypeScript constructs with runtime output. Numeric enums are bidirectionally mapped and historically unsound; string enums are nominal and safer; `const enum` is inlined and fragile across module boundaries. The modern consensus favors unions of string literals or `as const` objects, which are erased, structural, and tree-shakeable.

**Branded (nominal) type** simulates nominal typing in a structural system by intersecting a primitive with a phantom property that exists only at the type level — e.g., a `UserId` that is a `string` but not interchangeable with an `OrderId`. It prevents the class of bugs where two identically typed values have different meanings.

---

## V. Generics

**Generic** is a type or function parameterized over types it does not yet know, allowing a single definition to be reused across many concrete types while preserving the relationships between inputs and outputs. The principle: a generic should be used when a type parameter appears at least twice, linking things; otherwise `unknown` is usually the honest choice.

**Type parameter inference** is the compiler's deduction of generic arguments from the values passed, so that callers rarely write angle brackets. Inference flows from arguments to parameters and, in some positions, from the expected return type backward.

**Generic constraint** (`extends`) restricts what a type parameter may be, both admitting only valid arguments and granting the body permission to use the constrained members.

**Default type parameter** supplies a type when none is inferred or provided, playing the same role as a default function argument.

**`infer`** is a keyword usable only inside a conditional type's `extends` clause that introduces a new type variable to be deduced from the matched structure — the mechanism behind `ReturnType`, `Parameters`, and extracting element types from arrays or promises.

**Higher-kinded types** — types parameterized over type constructors rather than types — are not directly supported. Their absence is why generic abstractions over "any container" require workarounds and why some functional patterns feel heavier than in Haskell or Scala.

**Generic variance** describes how subtyping of a type argument affects subtyping of the generic type that contains it. The compiler measures variance per type parameter and uses it to speed up and decide assignability between instantiations.

---

## VI. Variance and Function Types

**Covariance** means the relationship is preserved: if `Dog` is a `Animal`, then `ReadonlyArray<Dog>` is a `ReadonlyArray<Animal>`. Return types and read-only positions are covariant.

**Contravariance** means the relationship is reversed: a function that accepts `Animal` can be used where a function accepting `Dog` is needed, because it handles everything the latter would receive. Parameter positions are contravariant — under `strictFunctionTypes`.

**Bivariance** means both directions are accepted, which is unsound. TypeScript applies it to *method* parameters (declared with method shorthand) even in strict mode, a deliberate concession so that `Array<Dog>` remains assignable to `Array<Animal>`. The senior insight: declare callbacks as function-typed properties, not methods, when you want contravariance enforced.

**Invariance** means neither direction is accepted; mutable containers are invariant in a sound system because they can both produce and consume their element type. TypeScript treats arrays covariantly anyway — a known, accepted hole.

**Function type compatibility** follows parameter bivariance/contravariance plus the rule that a function with *fewer* parameters is assignable to one expecting more, since JavaScript callers may pass extra arguments harmlessly.

**Function overloads** are multiple call signatures declared above a single implementation signature, letting the compiler pick a precise return type based on argument types. The implementation signature is invisible to callers and must be compatible with every overload. Overloads are often replaceable by generics with conditional types, which compose better.

**`this` parameter** is a pseudo-parameter declaring the expected type of `this` when a function is called, enabling type-checked method borrowing and catching unbound-method mistakes.

**Polymorphic `this` type** is the type of the current class instance as seen through inheritance, so a method returning `this` in a base class correctly returns the subclass type in fluent APIs.

---

## VII. Type-Level Programming

**Conditional type** (`T extends U ? X : Y`) is a type-level ternary: it selects between two types based on an assignability test. It is the control flow of the type system.

**Distributive conditional type** is the behavior whereby a conditional type whose checked type is a *naked* type parameter is applied to each member of a union separately and the results are unioned. This is why `Exclude` works and why wrapping the parameter in a one-element tuple (`[T] extends [U]`) turns distribution off.

**Mapped type** iterates over a union of keys to construct a new object type, optionally adding or removing `readonly` and `?` modifiers. It is the type-level `for…in`, and the engine behind `Partial`, `Required`, `Readonly`, `Pick`, and `Record`.

**Key remapping** (`as` in a mapped type) transforms each key during mapping, allowing renaming, filtering (map to `never` to drop), and prefixing — typically combined with template literal types to generate `getX`/`setX` style APIs.

**Template literal type** builds string literal types by interpolation, producing unions of all combinations when the parts are unions, and matching patterns with `infer` to parse strings at the type level — routes, event names, CSS units, dotted paths.

**Homomorphic mapped type** is a mapped type over `keyof T` that preserves `T`'s modifiers and, when applied to a primitive or array, passes them through intelligently. Non-homomorphic mapped types lose these properties.

**Recursive type** is a type alias that references itself, bounded by the compiler's instantiation depth limits. Recursion enables deep partials, JSON types, path types, and type-level arithmetic, at the cost of compile-time performance when abused.

**Utility types** are the built-in library of mapped and conditional types — `Partial`, `Required`, `Readonly`, `Pick`, `Omit`, `Record`, `Exclude`, `Extract`, `NonNullable`, `ReturnType`, `Parameters`, `Awaited`, `InstanceType` and so on. A senior engineer knows not only their names but roughly how each is implemented.

**Type instantiation** is the substitution of concrete types for type parameters, performed lazily and cached. "Type instantiation is excessively deep" is the compiler refusing to continue — a signal that a recursive type needs a tail-recursive formulation or a tighter bound.

---

## VIII. Guards, Assertions, and Trust Boundaries

**Type guard** is any expression the compiler recognizes as narrowing: `typeof`, `instanceof`, `in`, equality against a literal, truthiness, or a discriminant check.

**Type predicate** (`x is T`) is a return-type annotation on a boolean-returning function that teaches the compiler to narrow its argument when the function returns true. Correctness is the author's responsibility; the compiler trusts the predicate completely.

**Inferred type predicate** is the compiler's newer ability to deduce `x is T` automatically from a function body that is a simple narrowing check, removing the need to write the predicate by hand in trivial cases.

**Assertion function** (`asserts x is T` or `asserts condition`) is a function that throws if a condition fails, and whose signature tells the compiler that, after a successful call, the condition holds. It is how runtime validation feeds back into static narrowing.

**Type assertion** (`as T`) overrides the compiler's judgment within limits: the target must be comparable to the source in at least one direction. It is not a cast — nothing happens at runtime — and it is a declared lie that the author takes responsibility for.

**Non-null assertion** (`!`) asserts a value is neither `null` nor `undefined`. It is a documented place where you have knowledge the compiler lacks, and a search target in code review.

**Double assertion** (`as unknown as T`) routes through the top type to bypass the comparability check entirely. It is sometimes necessary and always suspicious.

**`satisfies`** checks that an expression conforms to a type *without* widening the expression to that type, preserving the precise inferred literal types. It solves the long-standing tension between "validate this config against a contract" and "keep the specific keys and values I wrote."

**Runtime validation** is the practice of checking external data against a schema at the boundary — with libraries such as Zod, Valibot, io-ts, or ArkType — and deriving the static type from the schema so that the compile-time and runtime views cannot drift apart. The principle is that types are proofs about code you control, and data from outside must be checked, not trusted.

---

## IX. Classes and Object-Oriented Features

**Class** in TypeScript compiles to a JavaScript class and additionally declares an instance type and a constructor type. Classes are structural like everything else — two unrelated classes with identical members are interchangeable — except where `private` or `#private` members introduce nominal behavior.

**Access modifiers** (`public`, `protected`, `private`) are compile-time only and erased; **ECMAScript private fields** (`#name`) are enforced at runtime by the engine. The former is a documentation and tooling tool; the latter is actual encapsulation.

**Parameter properties** are constructor parameters prefixed with a modifier, which declares and assigns a member in one step. They are one of the few constructs that emit code the author did not visibly write, and some teams disable them for that reason.

**Abstract class** is a class that cannot be instantiated and may declare abstract members that subclasses must implement, offering shared implementation plus a contract — a middle ground between an interface and a concrete base.

**`implements`** asserts that a class conforms to an interface's shape. It affects checking only, not the instance type, and it does not propagate declarations into the class.

**Mixin** is a function that takes a constructor and returns a subclass of it, typed via a generic constructor-type constraint, allowing composition of behaviors without deep inheritance chains.

**Decorator** is a function applied to a class or its members at definition time. TypeScript supports both the legacy experimental decorators (metadata-driven, used by Angular and NestJS) and the standardized TC39 decorators, which have different signatures and capabilities. A senior engineer knows which one a project uses and why.

**Definite assignment** (`!` after a property name) tells the compiler a property is initialized outside the constructor, suppressing the strict initialization error while preserving the responsibility to actually initialize it.

---

## X. Modules, Resolution, and the Compiler

**ES modules vs. CommonJS** is the runtime module-system split that TypeScript must model. The `module` and `moduleResolution` settings determine how imports are emitted and how specifiers are resolved, and mismatches between them and the runtime are the leading cause of "works in dev, breaks in prod" errors.

**Module resolution** is the algorithm by which an import specifier becomes a file path. The modern modes — `node16`/`nodenext` and `bundler` — respect `package.json` `exports`, conditional exports, and file extensions, replacing the legacy `node` (now `node10`) heuristics.

**Type-only imports and exports** (`import type`) signal that a binding is used solely in type positions, guaranteeing it is erased and preventing side-effect imports and circular-dependency surprises under `isolatedModules`.

**`isolatedModules`** restricts the language to constructs that can be transpiled one file at a time without whole-program knowledge, which is a requirement of fast transpilers like esbuild, SWC, and Babel. It forbids things like `const enum` export and re-exporting types without `type`.

**`verbatimModuleSyntax`** makes import and export emission literal: what you write is what remains, with only `type`-marked imports removed. It eliminates a category of ambiguity about elision.

**Project references** split a large codebase into separately compiled sub-projects with explicit dependencies, enabling incremental builds (`tsc --build`) and enforcing architectural boundaries at the compiler level.

**Declaration emit** is the generation of `.d.ts` files from source, required for publishing libraries. `isolatedDeclarations` is the newer constraint requiring explicit types on exported APIs so declarations can be produced without full type-checking.

**Strict mode** (`strict: true`) is an umbrella flag enabling the family of soundness-improving checks: `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitAny`, `noImplicitThis`, `useUnknownInCatchVariables`, and `alwaysStrict`. Enabling it is not optional for a serious codebase; the opt-in flags beyond it (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`) are where senior judgment is exercised.

**`strictNullChecks`** removes `null` and `undefined` from every type unless explicitly included, turning the billion-dollar mistake into a compile error. It is the single most valuable flag in the language.

**Language Service** is the long-lived compiler instance that powers editor features — completions, diagnostics, refactors, go-to-definition. **Compiler API** exposes the same infrastructure programmatically for building linters, codegen tools, and custom transformers.

**Type-checking performance** degrades with deep conditional recursion, enormous unions, excessive intersection of large object types, and barrel files that force whole-graph loading. Senior engineers diagnose this with `--extendedDiagnostics`, `--generateTrace`, and `skipLibCheck`, and design types with instantiation cost in mind.

---

## XI. Judgment and Philosophy

**Making illegal states unrepresentable** is the design principle of shaping types so that invalid combinations of data cannot be constructed at all — through discriminated unions instead of optional fields, branded types instead of raw primitives, and `never` to close off impossible branches. The goal is to move bugs from runtime to compile time to, ideally, nonexistence.

**Parse, don't validate** is the discipline of transforming untrusted input into a richer type once, at the boundary, so that downstream code receives proof rather than re-checking. It is the reason to prefer returning a narrowed type over returning a boolean.

**Inference over annotation** is the preference for letting the compiler derive types from implementation wherever the result is correct and readable, annotating only public boundaries, function signatures, and places where inference would widen or where documentation value is high.

**Type-level complexity budget** is the recognition that the type system is Turing-complete and that cleverness has costs: slower builds, opaque errors, and maintenance by people who were not present at creation. A senior engineer can write the recursive template-literal parser and knows when a comment and a simpler type serve the team better.

**The gradual typing contract** is the understanding that TypeScript exists to be adopted incrementally and to interoperate with an untyped world. `any`, assertions, and declaration files are not failures of the system — they are the seams that let it exist. Mastery lies in knowing where those seams are, keeping them few, and labeling them honestly.
