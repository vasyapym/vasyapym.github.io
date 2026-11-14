<!-- lesson-meta: {"practicePrompt":"Pick five entries from different sections — say type erasure, discriminated union, `satisfies`, contravariance, and runtime validation — and write a two-sentence answer for each in your own words. Then compare against the entry and mark whether you included the senior detail: what is erased, what is merely checked, and what survives to run time.","checkPrompt":"Be able, without notes, to define a type as a set of values and derive assignability, intersection, and never from that model; to say for any keyword whether it emits anything at run time; and to give the senior detail for the edge types — unknown as the top, never as the bottom, void versus undefined."} -->
<!-- lesson-theory: {"problem":"Knowing a keyword's name is not knowing the concept: a code review or interview asks what erasure, variance, or `satisfies` actually change, and a half-remembered definition collapses at exactly the point where the senior detail lives.","model":"One model carries the whole list: a type is the set of values it admits, so assignable means subset, an intersection demands more and therefore admits fewer, never is the empty set, and unknown is everything — and each entry adds the single detail that separates a junior answer from a senior one.","mechanics":"The set model does the arithmetic: `number` is all numbers, a literal type is a set of one member, A is assignable to B means A is a subset of B — which is why an intersection `A & B` looks like more but is a smaller set, and never vanishes from a union the way zero vanishes from a sum. Erasure is the master rule downstream of everything: TypeScript `private`, the readonly of `as const`, and a branded tag are compile-time bans the engine never enforces, while enums and `#name` fields emit real runtime objects — so which rules survive decides what you may rely on. Narrowing works by control-flow analysis: typeof, instanceof, `in`, equality and truthiness refine a value inside a region, a guard typed `value is T` is believed without the body being verified, and assigning the leftover branch to never turns exhaustiveness into a compile error the day someone adds a member. The type level is a small functional language: `keyof`, indexed access, mapped and conditional types with `infer` as pattern matching, distributivity running a conditional once per union member with a tuple wrapper to switch it off, and utility types like Partial as one-liners a senior candidate writes from scratch. Variance follows positions, not vibes: producers are covariant, consumers are contravariant, mutable arrays ought to be invariant but are treated covariant, method-syntax parameters stay bivariant for compatibility — and each of these, plus `any`, assertions, and unchecked index lookups, is a named place where TypeScript lets falsehoods through on purpose. The runtime boundary makes tooling necessary rather than optional: erasure is why `.d.ts` files describe JavaScript that lives elsewhere, why schema libraries like Zod define the validator once and derive the type from it so the two cannot drift, and why isolatedModules matters when esbuild and swc strip types per file without checking them, leaving `tsc --noEmit` as the separate checking step.","pitfalls":["Treating an intersection as a bigger set because the object ends up with more properties.","Expecting TypeScript `private` or a readonly property to protect anything once the JavaScript is running.","Reaching for `any` on data of uncertain origin instead of unknown, and letting it contaminate everything derived from it.","Being surprised that a value-returning arrow function is allowed where a void-returning callback is expected.","Trusting a type guard the compiler never verified, though a wrong guard is a lie it will believe.","Using `as` as if it were a cast that converts or checks anything at run time.","Confusing `satisfies` with an annotation, which would replace the precise inferred type with the declared one.","Assuming arrays must be invariant for safety while the compiler keeps treating them as covariant.","Shipping a type annotation as the only proof of network data, forgetting erasure leaves nothing to vouch for it at run time."],"whenNot":"This is a glossary, not a course: it states definitions and their senior details without worked examples, and it explicitly does not claim the type system is sound — several entries exist precisely to name the places where that guarantee is given up."} -->

# Senior TypeScript: the definitions

Each entry says what the concept is in plain terms, then adds the detail that marks a senior answer. The order runs from foundations upward, so later entries lean on earlier ones.

## Foundations

**TypeScript.** A superset of JavaScript that adds a static type system, meaning rules about which values may go where that are checked before the program runs. It is two tools in one: a type checker that reports errors and a compiler that removes the types and emits plain JavaScript.

**Type.** A set of possible values. `number` is the set of all numbers, `"GET"` is a set with a single member, and "A is assignable to B" means "A is a subset of B." Most of the type system's behavior follows from this one model.

**Type erasure.** The rule that types exist only at compile time and are deleted from the emitted JavaScript. A type therefore cannot be inspected at run time or change how the program behaves, and nothing in the type system can vouch for data that arrives while the program is running.

**Structural typing.** Compatibility decided by shape instead of by name: a value that has every member a type requires counts as that type, whatever it was declared as. It is duck typing verified at compile time, in contrast to the nominal typing of Java or C#, where two types are related only if a declaration says so.

**Type inference.** The compiler working out types you did not write, from initial values, return statements, and surrounding context, as when a callback's parameter types come from the function receiving it. The senior habit is to annotate boundaries such as exported function signatures and let inference cover the interior.

## Combining types

**Literal type.** A type containing exactly one value, such as `"GET"` or `42`. A `const` variable gets one by inference, while a `let` variable is widened to `string` or `number` because it may be reassigned.

**Union type.** Written `A | B`: a value that belongs to at least one of the listed types. Until a check establishes which member it is, only operations valid for every member are allowed.

**Intersection type.** Written `A & B`: a value that belongs to every listed type at once. For objects this means having the properties of both, which looks like more but is a smaller set, since fewer values meet more requirements.

## The edge types

**`any`.** The opt-out type: compatible with everything in both directions, with every operation allowed, so checking is switched off wherever it flows. It is contagious, because whatever is derived from an `any` value is also `any`.

**`unknown`.** The top type, meaning the set of all values: anything can be assigned to it, but nothing can be done with it until a check proves what it is. It is the safe replacement for `any` and the right type for data of uncertain origin, such as parsed JSON or a caught error.

**`never`.** The bottom type, meaning the empty set: no value has it. It is the return type of a function that always throws, the type left over in a branch the compiler has proven unreachable, and the result of intersecting incompatible types such as `string & number`. In a union it disappears the way zero disappears from a sum.

**`void`.** The return type of a function whose result is meant to be ignored. It differs from `undefined` in one way that matters: a callback typed as returning `void` may in fact return a value, which the caller agrees not to use. This is why an arrow function that returns something can still be passed to `forEach`.

**`strictNullChecks`.** The compiler setting under which `null` and `undefined` are separate types instead of hidden members of every type. Absence must then be declared, as in `string | undefined`, and handled before the value is used.

## Declaring shapes

**Tuple.** An array type of fixed length in which each position has its own type, such as `[string, number]`. Positions can be optional, named, or variadic, which is why a function's parameter list is itself represented as a tuple type.

**Index signature.** A declaration that an object may have any number of keys of one type, all mapping to values of another: a dictionary. By default lookups are assumed to succeed; the `noUncheckedIndexedAccess` option adds `undefined` to every result.

**Interface.** A named description of an object's shape, which other interfaces can extend and classes can implement. Interfaces are open: two declarations with the same name are merged into one.

**Type alias.** A name for any type at all, where an interface can describe only objects and functions; unions, primitives, and computed types need an alias. It cannot be reopened once declared. The working rule is interfaces for object contracts meant to be extended, aliases for everything else, applied consistently.

**Declaration merging.** The compiler combining several declarations of the same name into a single definition. It makes module augmentation possible, where you add to types you do not own, such as a `user` field on Express's `Request`.

**Enum.** A named set of constants that, unusually for TypeScript, emits a real object at run time. Many teams prefer a union of string literals, which is erased completely. Enums are not erasable syntax, so they fail under tools that only strip types, such as Node's built-in TypeScript support.

**Const assertion (`as const`).** A marker requesting the narrowest type for a literal expression: strings and numbers stay literal, object properties become `readonly`, and arrays become read-only tuples. It lets one runtime constant be the single source from which types are derived. `readonly` itself is only a compile-time ban on writes; nothing is frozen at run time.

## Narrowing and assertions

**Narrowing.** The compiler refining a value's type inside a region of code, based on checks it understands: `typeof`, `instanceof`, `in`, equality, and truthiness. It works by control-flow analysis, following the program's branches, so a single variable can have different types on different lines.

**Type guard.** A function whose return type is written `value is T`, telling the compiler that a `true` result proves the argument has type `T`. The compiler does not verify the function body, so a wrong guard is a lie it will believe. An assertion function, written `asserts value is T`, is the throwing variant: if it returns at all, the value is narrowed from then on.

**Discriminated union.** A union of object types that share one property holding a different literal value in each member, called the discriminant or tag, such as `status: "loading"` versus `status: "done"`. Checking the tag narrows to exactly one member, which makes this the standard way to model states and results so that invalid combinations cannot be written. Type theory calls it a sum type.

**Exhaustiveness checking.** Making the compiler prove that every member of a union has been handled, usually by assigning the leftover value to a variable of type `never` in the final branch. When someone adds a member later, every unhandled site becomes a compile error.

**Type assertion (`as`).** A claim to the compiler that a value has a certain type, with no check or conversion at run time; it is not a cast. The postfix `!` makes the same kind of claim about `null` and `undefined`. Each one overrules the checker, so each should have a reason.

**`satisfies`.** An operator that checks an expression against a type while leaving the expression's own inferred type intact. An annotation would replace the precise inferred type with the declared one, and `as` could hide a mismatch; `satisfies` validates and keeps the precision.

## Generics and type-level programming

**Generics.** Type parameters: placeholders that the caller or inference fills in, so one definition serves many types and keeps track of how they relate. The formal name is parametric polymorphism. The practical point is that a generic remembers the type that went in, where `any` forgets it.

**Generic constraint.** A bound written `T extends U` that restricts a type parameter to types assignable to `U`, which in turn lets the generic code safely use whatever `U` guarantees.

**`keyof` and `typeof`.** Two operators that derive types from things already written. `keyof T` gives the union of `T`'s property names as literal types, so for an object type with properties `a` and `b` it gives `"a" | "b"`. `typeof x`, used in a type position, gives the static type of the variable `x`, carrying information from the value world into the type world.

**Indexed access type.** Written `T[K]`: the type of property `K` on type `T`, a property lookup performed on types. `T[number]` gives the element type of an array.

**Mapped type.** A type built by looping over a union of keys and producing one property per key, written `{ [K in keyof T]: ... }`. Along the way it can add or remove `readonly` and `?` and rename keys with an `as` clause. `Partial` and `Readonly` are one-line mapped types.

**Conditional type.** Written `T extends U ? X : Y`: an if-expression on types, resolving to `X` when `T` is assignable to `U` and to `Y` otherwise.

**Distributive conditional type.** The rule that a conditional type testing a bare type parameter, when handed a union, runs once per member and unions the results. It is how `Exclude` filters a union, and wrapping both sides in a tuple, `[T] extends [U]`, turns it off.

**`infer`.** A keyword, allowed only in the `extends` clause of a conditional type, that introduces a type variable to be filled in by pattern matching. It is destructuring for types, and it is how `ReturnType` pulls the return type out of a function type.

**Template literal type.** A string type built with template syntax, such as `` `on${Capitalize<E>}` ``, that generates or matches string patterns. With `infer` it can parse strings at compile time, for example extracting parameter names from a route path.

**Utility types.** The built-in generic type transformations, among them `Partial`, `Required`, `Readonly`, `Pick`, `Omit`, `Record`, `Exclude`, `Extract`, `NonNullable`, `ReturnType`, `Parameters`, and `Awaited`. Nearly all are ordinary mapped or conditional types, and a senior candidate is expected to be able to write them from scratch.

**Type-level programming.** Using generics, conditional types, mapped types, and recursion (types that refer to themselves) as a small functional language evaluated by the compiler. That language is Turing-complete, and the senior skill is restraint, since elaborate types slow compilation and produce unreadable errors.

## Assignability, variance, and soundness

**Assignability.** The relation deciding whether a value of one type may be used where another is expected. It is subtyping, where `S` is a subtype of `T` if every value of `S` is also a value of `T`, plus a few pragmatic exceptions such as `any`.

**Excess property checking.** An extra check applied only to object literals written directly where a type is expected: properties the type does not mention are errors, even though structural typing would accept them. It exists to catch typos and stops applying once the object has passed through a variable.

**Variance.** The rule for how subtyping between composite types, such as functions or containers, follows from subtyping between their parts. The next three entries assume `Dog` is a subtype of `Animal`.

**Covariance.** The relationship is preserved. It applies to positions that only produce values, such as return types: a function that returns a `Dog` can stand in for one that returns an `Animal`, because every caller expecting an animal gets one.

**Contravariance.** The relationship reverses. It applies to positions that consume values, such as function parameters: a function that accepts any `Animal` can stand in for one that accepts only `Dog`s, because it will cope with whatever it is given, but not the other way round.

**Invariance and bivariance.** Invariance means neither direction is allowed, which is what safety demands of anything both read and written, such as a mutable array; TypeScript treats arrays as covariant anyway. Bivariance means both directions are accepted, which is unsound. TypeScript compares function parameters contravariantly under `strictFunctionTypes` but keeps parameters declared with method syntax bivariant for compatibility with existing code.

**Function overloads.** Several call signatures declared for one function, backed by a single implementation whose own signature callers never see. The compiler uses the first signature that matches, so they are listed from most specific to most general. A union or a generic is often simpler.

**Branded type.** A way to imitate nominal typing: a base type intersected with a phantom tag that exists only in the type system, such as `string & { __brand: "UserId" }`. It stops structurally identical values, like a user ID and an order ID, from being swapped, and makes a validating function the only legitimate way to obtain the type.

**Soundness.** The guarantee that a program which type-checks never holds, at run time, a value that contradicts its static type. TypeScript gives this up on purpose: `any`, type assertions, covariant arrays, bivariant methods, and unchecked index lookups all let falsehoods through, a trade made for productivity and compatibility with JavaScript.

## Classes

**Access modifiers.** `public`, `protected`, and `private` are visibility rules checked at compile time and then erased, so a TypeScript `private` member is still reachable at run time. JavaScript's `#name` fields are the ones the engine itself enforces.

**Abstract class.** A class that cannot be instantiated and may declare members its subclasses must implement. Unlike an interface, it exists at run time and can carry shared implementation.

**Decorator.** A function attached with `@` syntax to a class or class member to observe, wrap, or replace it. Two incompatible versions exist: the legacy experimental kind that Angular and NestJS were built on, and the standard ECMAScript kind supported since TypeScript 5.0.

## The runtime boundary and tooling

**Declaration file (`.d.ts`).** A file containing only type information, describing JavaScript that lives elsewhere. Libraries ship their own or get them from the community `@types` packages. The `declare` keyword inside them asserts that something exists at run time without emitting any code for it.

**Runtime validation.** Checking with real code that data crossing a trust boundary, such as a network response or user input, has the shape its type claims; erasure makes this necessary. Schema libraries such as Zod define the validator once and derive the static type from it, so the two cannot drift apart.

**`strict`.** A switch in `tsconfig.json`, the project's configuration file, that turns on the core safety checks together, including `strictNullChecks`, `noImplicitAny`, and `strictFunctionTypes`. It is the baseline for serious code; without it, several definitions above stop being true.

**Isolated modules.** The constraint, enforced by the `isolatedModules` option, that every file can be compiled on its own without knowledge of other files. It matters because fast build tools such as esbuild and swc convert one file at a time, stripping types without checking them and leaving type checking as a separate `tsc --noEmit` step. `import type` supports this by marking imports that are certain to be erased.
