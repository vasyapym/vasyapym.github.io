<!-- lesson-meta: {"practicePrompt":"Write three deliberate bugs and predict each from the label model before running: mutate a parameter inside a function, capture i in [lambda: i for i in range(3)], and reuse a mutable default list across calls. Then run, check your predictions, and correct the model where it missed.","checkPrompt":"Without notes, recite the attribute lookup order from data descriptors down to __getattr__, and explain why the GIL serializes bytecode but not compound logic. Then state the mocking rule: patch where the name is looked up, not where it is defined."} -->
<!-- lesson-theory: {"problem":"Python usually works, so its failures feel arbitrary: a list that refills itself between calls, three lambdas all returning 2, a counter that races under threads despite the GIL.","model":"Everything is an object on the heap; names are labels bound to objects; behaviour comes from protocols, the special methods the interpreter calls on your behalf. Almost every odd result falls out of that sentence, and the lesson pairs each feature with its cost and failure mode.","mechanics":"Name binding is heap state: assignment rebinds a label to an existing object, never copies, so mutating a parameter is visible to the caller while rebinding it is not. Dunder dispatch is type state: len(x) calls type(x).__len__(x), and a + b falls back to b.__radd__(a) only when a.__add__(b) returns NotImplemented, which is why setting __len__ on an instance does nothing. Attribute lookup is ordered-walk state: the MRO is scanned for data descriptors first, then the instance __dict__, then non-data descriptors like functions, whose __get__ builds the bound method carrying self. Scope is compile-time state: an assignment anywhere in a body makes the name local throughout, and closures capture cells holding variables rather than values, so three lambdas share one late-bound i. Memory is refcount state: an object frees at refcount zero, cycles need the separate collector, and the GIL exists because refcounting is not thread-safe — yet it serializes bytecode execution only, not compound logic, so counter += 1 still races.","pitfalls":["Debating pass by value or by reference; the working rule is call by sharing, where mutation leaks and rebinding does not.","Using is on numbers because small ints from −5 to 256 are cached; the shortcut fails for larger values and literals now draw a SyntaxWarning.","Calling a tuple containing a list immutable; the inner list can still be mutated and the tuple is unhashable because hashing recurses.","Writing [[]] * 3 for three empty lists and getting three references to the same inner list.","Raising NotImplementedError where NotImplemented belongs, or returning the value instead of raising, so the other operand never gets its turn.","Defining __eq__ without __hash__ and expecting instances to work in sets; Python then sets __hash__ to None.","Trusting the GIL to make counter += 1 atomic; a switch can land between bytecodes, and only a Lock settles it.","Putting lru_cache on a method for free speed; it pins self in the cache and quietly leaks memory.","Patching requests.get after a module did from requests import get; the patch must land where the name is looked up, app.get."],"whenNot":"The lesson describes CPython 3 as it stands — 3.13 and 3.14 current, free-threading real but not the default build — and not PyPy or MicroPython; on contested ground such as async versus threads it names the deciding axis rather than a verdict."} -->

# Python: A Lesson in Compact Definitions

## The core mental model

Experienced Python people hold one picture above all others. Everything is an object living on the heap. Names are labels bound to those objects. Behaviour comes from protocols, which are special methods the interpreter calls on your behalf.

Almost every "weird" Python behaviour falls out of that sentence. The rest of this lesson unpacks it layer by layer. It moves from the language model, to what CPython does underneath, to how working teams actually build, test and ship Python today.

## 1. Objects, names, and identity

**Object.** Every value carries three things:

- an **identity** (in CPython, its memory address, exposed by `id()`),
- a **type** (fixed, available via `type()`),
- a **value**.

Integers, functions, classes, modules and exceptions are all objects. Classes are themselves instances of `type`.

**Name binding.** Assignment never copies. `b = a` makes a second label point at the same object. A variable is not a box holding a value; it is a sticky note on an object. This is why "pass by value or by reference?" is the wrong question. Python uses **call by sharing** (also called pass-by-object-reference). The function receives a new name bound to the caller's object:

- Mutating that object is visible to the caller.
- Rebinding the parameter name is not.

**Mutability.** Mutable objects can change in place:

- mutable: `list`, `dict`, `set`, most user classes, `bytearray`
- immutable: `int`, `float`, `str`, `tuple`, `frozenset`, `bytes`

The footgun is that a tuple is only shallowly immutable. A tuple containing a list can still have that list mutated. Such a tuple is also unhashable, because hashing recurses into its contents.

**`is` vs `==`.**

- `is` compares identity.
- `==` calls `__eq__` and compares value.

Use `is` only for singletons: `None`, `True`, `False`, and sentinel objects you create yourself. CPython caches small integers from −5 to 256 and interns many strings. As a result, `a is b` can appear to "work" for small numbers and then fail for large ones. Modern Python emits a `SyntaxWarning` for `is` against a literal.

**Shallow vs deep copy.**

- `copy.copy`, `list(x)`, `x[:]` and `dict.copy()` create a new outer container whose elements are the same objects.
- `copy.deepcopy` recursively copies, tracking a memo dict to handle cycles.

The classic footgun is `[[]] * 3`. It produces three references to one inner list. Use `[[] for _ in range(3)]` instead.

**Truthiness.** Objects are falsy if their `__bool__` returns False. Failing that, they are falsy if `__len__` returns 0. Empty containers, `0`, `0.0`, `None` and `""` are falsy.

The footgun is `if x:` when you meant `if x is not None:`. The two differ the moment `0` or an empty list is a valid value.

## 2. The data model: protocols and dunders

**Data model.** This is the set of special ("dunder") methods through which objects plug into syntax and builtins:

- `len(x)` calls `type(x).__len__(x)`.
- `x[k]` calls `__getitem__`.
- `for` calls `__iter__`.
- `with` calls `__enter__`/`__exit__`.
- `a + b` tries `a.__add__(b)`, then falls back to `b.__radd__(a)` if the first returns `NotImplemented`.

Note that special methods are looked up on the type, not the instance. Assigning `obj.__len__ = ...` does nothing for `len(obj)`.

**`NotImplemented` vs `NotImplementedError`.**

- `NotImplemented` is a value returned from binary dunders. It means "I can't handle this operand; let the other side try."
- `NotImplementedError` is an exception for abstract or unfinished methods.

Confusing them is a common tell of shallow knowledge.

**Duck typing.** Code depends on what an object can do (its protocol), not on what class it is. "File-like," "iterable," "mapping" and "awaitable" are all protocols, not base classes.

**Hash/equality contract.** Objects that compare equal must have equal hashes. If you define `__eq__` without `__hash__`, Python sets `__hash__` to `None`, making instances unhashable. That is correct for mutable objects. If you mutate an object while it sits in a set or serves as a dict key, you corrupt lookups silently. String hashes are randomized per process (`PYTHONHASHSEED`) to resist hash-flooding attacks. That is why set iteration order of strings varies between runs.

**`__repr__` vs `__str__`.**

- `__repr__` is for developers: unambiguous, ideally eval-able.
- `__str__` is for end users.
- If you only write one, write `__repr__`; `str()` falls back to it.

## 3. Classes, attribute lookup, and metaprogramming

**Attribute lookup** (what `obj.attr` actually does). `object.__getattribute__` runs these steps in order:

1. Search `type(obj).__mro__` for `attr`. If the hit is a **data descriptor** (defines `__set__` or `__delete__`), call its `__get__` and stop.
2. Otherwise check the instance's `__dict__`.
3. Otherwise, if the class hit was a **non-data descriptor** (only `__get__`), call it. If it was a plain class attribute, return it.
4. If all of that fails with `AttributeError`, call `__getattr__` if one is defined.

So `__getattr__` is a fallback for missing attributes, while `__getattribute__` intercepts everything. Overriding `__getattribute__` is rarely wise and easy to make infinitely recursive.

**Descriptor.** Any object with `__get__`/`__set__`/`__delete__` stored as a class attribute. Descriptors are the machinery beneath most of the class system:

- `property`, `classmethod` and `staticmethod`.
- ORM fields such as Django model fields and SQLAlchemy columns.
- Methods themselves. A plain function is a non-data descriptor whose `__get__` returns a **bound method**: a small object pairing the function with the instance. That is how `self` gets passed.

`functools.cached_property` is a non-data descriptor. It works by writing the computed value into the instance `__dict__`, which then shadows the descriptor on later lookups. Consequently it doesn't work with `__slots__`, which provide no `__dict__`.

**MRO (method resolution order).** The linear order of classes searched for attributes, computed by **C3 linearization**. C3 preserves local precedence order and monotonicity. Inspect it with `Cls.__mro__`.

**`super()`.** Returns a proxy that continues lookup at the next class in the MRO of the instance's actual type, not "the parent class." In diamond hierarchies, `super()` can therefore call a sibling. **Cooperative multiple inheritance** requires that:

- every class in the chain calls `super()`,
- every class accepts and forwards `**kwargs`.

Mixins depend on this.

**Class-level vs instance-level state.** A mutable class attribute such as `items = []` is shared by all instances until an instance assigns its own. This is a common footgun. Mutating through `self.items.append(...)` mutates the shared list.

**`__slots__`.** Declares a fixed attribute set. Instances store attributes in a compact array instead of a per-instance `__dict__`. The benefits are lower memory use, slightly faster access, and typos that raise errors. The costs:

- no dynamic attributes,
- awkward multiple inheritance,
- weakref support needs `__weakref__` in the slots.

Today `@dataclass(slots=True)` (3.10+) is the easy way to get them.

**Metaclass.** The class of a class (default `type`). It controls class creation via `__new__`/`__init__`/`__prepare__`. Metaclasses are powerful but rarely the right tool now. Prefer the lighter mechanisms that cover most former metaclass uses:

- **`__init_subclass__`** (3.6+): hook subclass creation, e.g. for plugin registration or validation.
- **`__set_name__`**: lets descriptors learn their attribute name.
- **class decorators**: post-process a class.

The senior heuristic: reach for a metaclass only when you must control the class namespace or the creation protocol itself.

**`__new__` vs `__init__`.**

- `__new__` constructs the object (a static method receiving the class).
- `__init__` initializes an already-constructed instance.

You override `__new__` for immutable subclasses (subclassing `int` or `tuple`), singletons and caching. Otherwise you override `__init__`.

**ABC vs Protocol.**

- `abc.ABC` with `@abstractmethod` gives **nominal** typing. Subclasses must inherit, and you can't instantiate until abstract methods are implemented.
- `typing.Protocol` gives **structural** typing. Any class with matching methods satisfies it for the type checker, with no inheritance needed.

Protocols match Python's duck-typing culture and are increasingly preferred at API boundaries. ABCs still earn their place when you want runtime enforcement or shared mixin implementations, as `collections.abc.MutableMapping` provides.

**Composition over inheritance.** Deep inheritance trees are considered a smell in modern Python. The idiomatic default:

- small classes, dataclasses and functions,
- protocols for polymorphism,
- inheritance mainly for genuine "is-a" relationships and framework extension points.

## 4. Functions, scope, closures, decorators

**First-class functions.** Functions are objects. They carry `__name__`, `__defaults__`, `__closure__` and `__code__`, can be passed around, and can carry attributes.

**LEGB.** Name resolution order: Local, Enclosing function, Global (module), Builtins.

Scope is decided at compile time. If a function assigns to a name anywhere in its body, that name is local throughout the whole function. Reading it before the assignment raises **`UnboundLocalError`**, even if a global of the same name exists.

- `global x` rebinds the module-level name.
- `nonlocal x` rebinds the enclosing function's name.

You need neither of these merely to mutate an object, only to rebind the name.

**Closure.** A function that references variables from an enclosing scope. Those variables live in **cells** that outlive the outer call.

The famous footgun is **late binding**: closures capture variables, not values. So `[lambda: i for i in range(3)]` yields three functions all returning 2. Two fixes:

- a default argument, `lambda i=i: i`,
- `functools.partial`.

**Mutable default argument.** Defaults are evaluated once, at `def` time, and stored on the function. So `def f(x, acc=[])` shares one list across all calls. The idiom is `acc=None` followed by `if acc is None: acc = []`.

**Parameter kinds.** In `def f(a, b, /, c, *, d, **kw)`:

- `a` and `b` are **positional-only** (`/`, 3.8+). This lets you rename them later without breaking callers.
- `c` is positional-or-keyword.
- `d` is **keyword-only**, because it follows `*`.

`*args` collects extra positionals into a tuple, and `**kwargs` collects extra keywords into a dict. Keyword-only flags (`*, strict=False`) are good API hygiene, since they prevent mysterious boolean positional arguments.

**Decorator.** A callable that takes a function (or class) and returns a replacement. `@d` above `def f` means `f = d(f)`, executed at definition time. Parameterized decorators add a layer: `@retry(3)` means `retry(3)` returns the actual decorator.

Always apply `functools.wraps` in your wrapper. Without it, the wrapped function's name, docstring and signature are lost. That breaks introspection, debugging, and frameworks that inspect signatures (FastAPI, pytest, Click).

**Useful `functools` tools.**

- `lru_cache(maxsize=...)` and `cache` (unbounded, 3.9+) memoize on hashable arguments. Using them on methods keeps `self` alive in the cache, which effectively leaks memory.
- `partial` fixes arguments.
- `singledispatch` gives type-based function overloading.
- `reduce` exists but is usually less readable than a loop.

**Lambda.** An anonymous function restricted to a single expression. Prefer `def` for anything you'd want to name or debug. Tracebacks show `<lambda>`.

## 5. Iteration, generators, context managers

**Iterable vs iterator.**

- An **iterable** has `__iter__` returning an iterator. Examples: lists, dicts, files, ranges.
- An **iterator** has `__next__`, raises `StopIteration` when done, and returns itself from `__iter__`.

Iterators are single-pass. The exhaustion footgun: passing a generator to two consumers means the second consumer sees nothing. `range` is a lazy iterable, not an iterator, so it can be reused.

**`for` loop, a layer down.** `it = iter(x)`, then call `next(it)` repeatedly until `StopIteration` is caught.

**Generator.** A function containing `yield`. Calling it returns a generator object without running the body. Each `next()` resumes execution until the next `yield`, preserving the frame (locals and instruction pointer) between steps. Generators give you:

- lazy, constant-memory pipelines,
- infinite sequences,
- streaming.

`yield from sub` delegates to a sub-generator and forwards `send`/`throw` to it. Generators also support `.send(value)` and `.close()`. Before `async`/`await` existed, coroutines were built on these.

**Generator expression vs list comprehension.**

- `(x*x for x in xs)` is lazy.
- `[x*x for x in xs]` is eager.

Pass a generator expression straight into aggregators, as in `sum(x*x for x in xs)`. Comprehension variables don't leak into the enclosing scope in Python 3. Since 3.12, comprehensions are inlined (PEP 709) for speed, with no visible semantic change in normal code.

**itertools.** The standard toolbox for lazy iteration:

- `chain`, `islice`, `groupby`, `accumulate`, `product`, `pairwise` (3.10), `batched` (3.12).
- `groupby` footgun: it groups only consecutive equal keys, so sort first.

**Context manager.** An object with `__enter__`/`__exit__`, used by `with`. `__exit__` receives the exception type, value and traceback, and can suppress the exception by returning truthy. This guarantees cleanup of files, locks, transactions and temporary state.

- `contextlib.contextmanager` turns a generator into a context manager. Code before `yield` is setup, code after is teardown. Wrap the yield in `try/finally` or the teardown is skipped on error.
- `ExitStack` manages a dynamic number of contexts.
- `suppress` swallows specified exceptions.
- Async versions are `async with`, `__aenter__`/`__aexit__` and `asynccontextmanager`.

## 6. Exceptions

**Hierarchy.**

- `BaseException` is the root. Its direct children include `SystemExit`, `KeyboardInterrupt` and `GeneratorExit`, which you usually should not catch.
- `Exception` is the base for normal errors.

That is why a bare `except:` is wrong: it swallows Ctrl-C and interpreter shutdown. Even `except Exception:` should be narrow and deliberate, typically at process boundaries, where you log and re-raise or translate.

**try/except/else/finally.**

- `else` runs only if no exception occurred. It keeps the `try` block minimal, so you don't accidentally catch errors from code you didn't mean to guard.
- `finally` always runs.

A `return` inside `finally` silently swallows exceptions. Python 3.14 warns about this (PEP 765).

**Chaining.**

- `raise NewError(...) from e` sets `__cause__`: "this was caused by that."
- Raising inside an `except` block without `from` sets `__context__`: "during handling, another error occurred."
- `from None` suppresses the chain.

Seniors translate low-level exceptions into domain exceptions at layer boundaries and use `from` to preserve the cause.

**Scope of the bound name.** The name bound by `except E as e` is deleted at the end of the block, to break a reference cycle through the traceback.

**EAFP vs LBYL.**

- EAFP: "Easier to ask forgiveness than permission." Try it and catch the failure.
- LBYL: "Look before you leap." Check first.

Python idiom favours EAFP. It avoids race conditions such as check-then-open on a file, and it's fast when exceptions are rare. Since 3.11, entering a `try` costs essentially nothing ("zero-cost exceptions"), though raising is still relatively expensive.

**ExceptionGroup and `except*`** (3.11). These represent multiple simultaneous failures, typically from concurrent tasks in `asyncio.TaskGroup`. `except* ValueError` handles the matching subset of a group and lets the rest propagate.

`add_note()` (3.11) attaches context to an exception without wrapping it.

## 7. What CPython actually does underneath

**CPython** is the reference implementation, written in C. Alternatives exist:

- **PyPy**: tracing JIT, often much faster for pure-Python loops, with weaker C-extension compatibility.
- **MicroPython**, and historically Jython and IronPython.

"Python" in job contexts means CPython unless stated otherwise.

**Execution pipeline.** Source is parsed into an AST (by a PEG parser since 3.9), then compiled to **bytecode**: code objects cached as `.pyc` files in `__pycache__`. A C evaluation loop then executes that bytecode in **frames**. `dis.dis(f)` shows the bytecode.

Since 3.11, the **specializing adaptive interpreter** (PEP 659) rewrites hot instructions into type-specialized versions at runtime. For example, `BINARY_OP` becomes an int-add fast path. This is the main source of the roughly 1.25x speedup in 3.11.

3.13 added an experimental **copy-and-patch JIT**, off by default. It is not yet a big win for most workloads.

**Memory management.** The primary mechanism is **reference counting**. Every object has a refcount, and when it hits zero the object is freed immediately. This deterministic destruction is why CPython closes files promptly even when you forget to.

A supplementary **cyclic garbage collector** finds unreachable reference cycles, which refcounting alone can't free. The `gc` module exposes it. `__del__` finalizers run at unpredictable times, so don't rely on them for resource management; use context managers. `weakref` gives references that don't keep objects alive, useful for caches and observer patterns. Small objects come from a specialized allocator (pymalloc), so freed memory is often retained by the process rather than returned to the OS. "My RSS didn't drop" is usually that, not a leak.

**Immortal objects** (3.12, PEP 683). Objects like `None` and small ints have refcounts that never change, which helps both multi-core work and fork-based memory sharing.

**The GIL (Global Interpreter Lock).** A mutex that lets only one thread execute Python bytecode at a time. It exists because refcounting and much of the C API aren't otherwise thread-safe. Consequences:

- Threads give no parallel speedup for CPU-bound pure-Python code.
- Threads work well for I/O-bound code. The GIL is released during blocking I/O, and many C extensions release it during heavy computation. NumPy, hashlib and compression libraries do this, which is why NumPy-heavy threads can scale.

The crucial misconception: **the GIL does not make your code thread-safe**. A thread switch can occur between bytecodes (CPython requests a switch every 5 ms by default, `sys.getswitchinterval`). So `counter += 1` is a read-modify-write race, and you still need `threading.Lock`. Individual operations on builtins, like `list.append` or `dict[k] = v`, happen to be atomic in CPython, but compound logic is not.

**Free-threaded Python** (PEP 703). An optional build without the GIL:

- 3.13: experimental, `python3.13t`.
- 3.14: officially supported (PEP 779), but still not the default build.

It brings single-thread overhead and requires C extensions to opt in. It is real and progressing, not yet the norm. Saying exactly that is the credible senior position.

**Builtin data structure costs.** Know these cold.

| Structure | Implementation | Key costs |
|---|---|---|
| `list` | dynamic array of pointers | index O(1); amortized `append` O(1) via over-allocation; `insert(0, x)`/`pop(0)` O(n); `x in list` O(n) |
| `collections.deque` | doubly linked blocks | O(1) at both ends; use for queues |
| `dict` | hash table | average O(1) get/set/delete |
| `set` | hash table without values | O(1) membership; frozensets are hashable |
| `str` | immutable sequence of code points | repeated `+=` in a loop is potentially O(n²); use `"".join(parts)` |

More details:

- **dict**: since 3.6 it is "compact" (a dense entries array plus a sparse index table). Insertion order is guaranteed by the language since 3.7. `OrderedDict` remains useful mainly for `move_to_end` and order-sensitive equality.
- **str**: CPython has an in-place `+=` optimization in some cases, but don't rely on it. Internally, PEP 393 stores strings as 1, 2 or 4 bytes per char depending on the widest character.
- **heapq**: provides a binary min-heap on a list.
- **bisect**: binary search on sorted lists.
- **Sorting**: `sorted` and `list.sort` are **stable**, using Timsort (with Powersort merge policy since 3.11), O(n log n), and very fast on partially ordered data. Sort by `key=`, which is computed once per element, not by comparator. `functools.cmp_to_key` adapts old-style comparators.

**Performance practice.** Measure before optimizing.

- `timeit` for micro-benchmarks.
- `cProfile`/`pstats` for deterministic profiling.
- **py-spy** (a sampling profiler that attaches to live processes without code changes) and **Scalene** (CPU, memory and GPU) in practice.
- `tracemalloc` and memray for memory.

The usual wins come in roughly this order:

1. A better algorithm or data structure, such as a set instead of a list for membership.
2. Pushing loops into C: builtins, comprehensions, NumPy/Polars vectorization.
3. Caching.
4. Only then compiled extensions: Cython, mypyc, or Rust via **PyO3/maturin**, which is the current fashionable and genuinely good path.

Attribute and global lookups in tight loops cost something. Binding to locals is a micro-optimization that matters less after 3.11.

## 8. Concurrency and parallelism

**Concurrency vs parallelism.**

- Concurrency means structuring many tasks that make progress in overlapping time.
- Parallelism means literally executing simultaneously on multiple cores.

**threading.** OS threads with shared memory and preemptive scheduling. Use threads for I/O-bound work and for calling GIL-releasing libraries. You must synchronize with:

- `Lock`/`RLock` (reentrant, so the same thread can re-acquire),
- `Condition`, `Event`, `Semaphore`,
- `queue.Queue`, which is the idiomatic thread-safe handoff.

**multiprocessing.** Separate processes, each with its own interpreter and GIL, giving true CPU parallelism. The costs:

- process startup,
- inter-process communication via pickling (functions and arguments must be picklable, so no lambdas or local functions),
- duplicated memory.

**Start methods** decide how child processes are created:

- **fork** copies the parent's memory. It is fast but unsafe if the parent has threads, because locks get copied in a held state.
- **spawn** starts a fresh interpreter. It is safe but slower, and it re-imports your main module. That is why the `if __name__ == "__main__":` guard is mandatory there.
- **forkserver** forks from a clean server process.

The default is spawn on macOS and Windows. On Linux, 3.14 moved the default from fork to forkserver. Code that silently relied on fork-inherited globals breaks there.

**concurrent.futures.** The high-level, preferred API: `ThreadPoolExecutor` and `ProcessPoolExecutor`, with `submit`, `map` and `as_completed`. Futures represent pending results.

**asyncio.** Single-threaded **cooperative** concurrency.

- An `async def` function returns a **coroutine** object when called. Nothing runs until it is awaited or scheduled.
- `await` suspends the coroutine and yields control to the **event loop**, which multiplexes many sockets via OS readiness APIs (epoll, kqueue, IOCP).
- A **Task** wraps a coroutine to run it concurrently.
- `asyncio.run()` is the entry point.

Modern structure (3.11+) uses **`asyncio.TaskGroup`** for **structured concurrency**. If a child fails, its siblings are cancelled and errors surface as an ExceptionGroup. Use `asyncio.timeout()` for deadlines. `gather` still works but has weaker failure semantics.

asyncio footguns:

- **Blocking the loop.** A synchronous call (`time.sleep`, `requests.get`, a CPU-heavy loop, a sync DB driver) freezes every task. Offload with `await asyncio.to_thread(...)` or an executor, and use async-native libraries (`httpx`, `aiohttp`, `asyncpg`).
- **Forgetting `await`.** The coroutine never runs, and you get a "coroutine was never awaited" warning.
- **Fire-and-forget tasks.** The loop holds only weak references, so un-referenced tasks can be garbage-collected mid-flight. Keep references, or use a TaskGroup.
- **Swallowing cancellation.** Cancellation arrives as `CancelledError`, a BaseException subclass since 3.8. Swallowing it breaks shutdown and timeouts.
- **"Function colouring."** Async is viral: async functions can only be awaited from async code.

Alternatives: **Trio** (which pioneered structured concurrency), and **AnyIO**, a compatibility layer used by Starlette and FastAPI.

**Choosing a model** is the standard "it depends":

- I/O-bound with a few dozen concurrent operations: threads are simpler and work with sync libraries.
- I/O-bound with thousands of connections: asyncio.
- CPU-bound: processes, or vectorized and native code that releases the GIL. Possibly free-threaded builds in the future.
- Heavy, distributed or durable background work leaves the process entirely: Celery, RQ, Dramatiq, or Temporal for durable workflows.

## 9. Typing and data modelling

**Gradual typing.** Type hints are annotations that the interpreter does not enforce at runtime. Static checkers enforce them:

- **mypy**: the original.
- **pyright**: fast; powers VS Code's Pylance.
- Newer Rust-based checkers: Astral's **ty** and Meta's **pyrefly**, both young.

Untyped code is implicitly `Any`, so adoption can be incremental via per-module strictness.

**`Any` vs `object`.**

- `Any` turns checking off: anything goes in either direction.
- `object` is the top type: you can pass anything in, but can do almost nothing with it without narrowing.

Prefer `object` (or a Protocol) when you mean "accepts anything."

**Modern syntax, and what's legacy.**

| Modern | Since | Replaces |
|---|---|---|
| `list[int]`, `dict[str, int]` | 3.9 | `typing.List`, `typing.Dict` |
| `X \| None` | 3.10 | `Optional[X]`, `Union` |
| `def first[T](xs: list[T]) -> T` and `type Alias = ...` | 3.12 (PEP 695) | explicit `TypeVar` boilerplate |
| `collections.abc.Iterable`, `Callable`, etc. | — | their `typing` aliases |

Other tools worth knowing:

- `Self` (3.11), `TypedDict` for dict-shaped JSON, `Literal`, `Final`.
- `@override` (3.12).
- `TypeGuard`/`TypeIs` for custom narrowing.
- `ParamSpec` for typing decorators.

Variance matters here. `list[int]` is not a `list[float]` for the checker because lists are mutable and therefore invariant. Accept `Sequence[float]` (read-only, covariant) in function parameters instead. That habit, "accept abstract, return concrete," is a mark of experience.

**Annotation evaluation.**

- `from __future__ import annotations` (PEP 563) stringified all annotations to avoid forward-reference and import-cycle problems. It confused runtime consumers like Pydantic.
- Python 3.14 makes annotations **lazily evaluated** by default (PEP 649/749), with `annotationlib` for introspection.

The future import is now on the legacy path. Use `if TYPE_CHECKING:` for imports needed only by the type checker.

**Data containers.**

- **`dataclasses.dataclass`** generates `__init__`, `__repr__` and `__eq__`. Options:
  - `frozen=True` gives immutability and hashability.
  - `slots=True` and `kw_only=True` (3.10).
  - `field(default_factory=list)` handles mutable defaults. Writing `= []` raises an error, a guardrail against the mutable-default footgun.
  - It does no validation.
- **`typing.NamedTuple`** is a tuple subclass with named fields. It is immutable, lightweight, and unpacks positionally, which can be either a feature or a hazard.
- **attrs** is the more powerful predecessor of dataclasses, with validators and converters.
- **Pydantic** (v2, Rust core) does **runtime validation and parsing** from type hints. It is the standard for API boundaries, config (`pydantic-settings`) and FastAPI.
- **msgspec** is a very fast alternative.

The working convention: Pydantic (or similar) at trust boundaries where external data enters, and plain dataclasses internally. Validating everything everywhere is wasteful.

**Structural pattern matching** (3.10). `match`/`case` matches on structure:

- sequences, mappings, class patterns via `__match_args__`,
- guards (`case X if cond`),
- captures.

It is not a switch statement. A bare name in a pattern *captures* rather than compares, so `case RED:` binds a new variable called `RED`. Use dotted names (`Color.RED`) to compare against constants. It shines for ASTs, protocol messages and tagged unions, and is overkill for simple branching.

**Enum.** `enum.Enum`, plus `StrEnum` (3.11), `IntEnum` and `Flag`. Prefer enums over magic strings.

## 10. Modules, imports, and project structure

**Import system.** `import x` works in steps:

1. Check the `sys.modules` cache.
2. If not cached, finders search `sys.path` and create a module object.
3. Execute the module's top-level code once, and cache the result.

Consequences:

- Module top-level code is effectively a singleton initializer.
- Import-time side effects (network calls, heavy computation, reading config) are a smell.
- Circular imports fail when a module asks for a name from a partially initialized module. Fix them by restructuring, moving the import into a function, or importing the module rather than the name.

**Package.** A directory of modules, conventionally with `__init__.py`. **Namespace packages** (no `__init__.py`) can span directories. They're useful for plugin ecosystems but cause confusing behaviour when you forgot an `__init__.py` by accident.

**`__name__ == "__main__"`.** True when a file runs as a script rather than being imported. It guards script entry code. `python -m pkg.module` runs a module with proper package context. That is the reliable way to execute modules inside packages and avoid relative-import errors.

**Relative vs absolute imports.** `from . import x` works only inside packages. Absolute imports are generally preferred for clarity.

**`__all__`.** Defines what `from m import *` exports, and signals the public API.

## 11. Tooling and real-world conventions

**Environments.**

- A **virtual environment** (`venv`) is an isolated `site-packages` plus an interpreter symlink. Always use one per project.
- System Pythons on modern Linux distros refuse global `pip install` (PEP 668, "externally-managed-environment"), and they're right to.
- **pipx** installs CLI tools in their own isolated environments.

**pyproject.toml.** The single modern project config file:

- `[build-system]` (PEP 517/518),
- `[project]` metadata (PEP 621),
- `[tool.*]` sections for ruff, mypy, pytest and others.

The legacy items: `setup.py` executed as a script (`python setup.py install` is deprecated and dangerous), `setup.cfg`, `requirements.txt` as the source of truth, and `distutils` (removed in 3.12). setuptools still works as a backend. hatchling, flit and pdm-backend are common, plus maturin for Rust.

**Distributions.**

- A **wheel** (`.whl`) is a pre-built, install-by-unzip distribution. Platform wheels carry compiled code. **manylinux** tags denote broadly compatible Linux builds.
- An **sdist** is source that must be built.

Missing wheels for your platform are why installs sometimes try to compile C.

**Package managers.**

- **uv** (Astral, written in Rust) has rapidly become the default recommendation for new projects. It does dependency resolution, a universal lock file (`uv.lock`), venv management, Python version installation, and tool running, at extreme speed.
- **Poetry** is the established alternative, with a large install base.
- pip-tools and plain pip with constraints files persist in legacy and enterprise settings.
- **conda/mamba/pixi** dominate where non-Python binary dependencies matter: scientific computing, CUDA.

Applications should commit lock files. Libraries should declare loose, compatible version ranges, and should not pin exact versions, which would cause dependency hell for users.

**Linting and formatting.**

- **Ruff** (Astral) is now the default. It replaces flake8 plus dozens of plugins, isort, pyupgrade, and largely Black (`ruff format` is Black-compatible).
- **Black** is still widespread.
- **pre-commit** runs these on commit.
- **CI** runs lint, type checks and tests on every PR.

PEP 8 is the style baseline, but in practice "whatever the formatter does" ends style debates.

**Testing.** **pytest** is the de facto standard; `unittest` is legacy and stdlib-only. Core concepts:

- plain `assert` with assertion rewriting for rich failure messages,
- **fixtures** (dependency-injected setup/teardown, scoped per function, module or session; defined in `conftest.py`),
- `@pytest.mark.parametrize`,
- `tmp_path` and `monkeypatch`.

Plugins: pytest-cov, pytest-xdist (parallel runs), pytest-asyncio or anyio, and hypothesis (property-based testing). **tox/nox** run test matrices across Python versions.

**Mocking.** `unittest.mock`: `Mock`, `MagicMock`, `patch`. The key rule is **patch where the name is looked up, not where it is defined**. If `app.py` does `from requests import get`, patch `app.get`, not `requests.get`. Use `autospec=True` so mocks enforce real signatures. The senior opinion is that heavy mocking means tight coupling. Prefer dependency injection, fakes, and testing at seams.

**Logging.** Use the `logging` module, never bare `print`, in libraries and services:

- Create a module logger with `logger = logging.getLogger(__name__)`.
- Configure handlers only at the application entry point; libraries shouldn't configure logging.
- Pass arguments lazily: `logger.info("x=%s", x)`, not an f-string, so formatting is skipped when the level is disabled.
- `logger.exception` inside `except` includes the traceback.
- Structured (JSON) logging via **structlog** is common in services.

**Other stdlib to know.**

- `pathlib` over `os.path`.
- `subprocess.run([...], check=True)`. Avoid `shell=True` with untrusted input, which risks injection.
- `tomllib` (3.11), `zoneinfo` (3.9).
- `secrets` for tokens, not `random`.
- `argparse`, or Typer/Click for CLIs.

**Datetime and numeric footguns.**

- `datetime.utcnow()` returns a naive datetime and is deprecated as of 3.12. Use `datetime.now(timezone.utc)`, and store timezone-aware UTC.
- Floats are IEEE 754 binary: `0.1 + 0.2 != 0.3`. Use `math.isclose`, `decimal.Decimal` for money, and `fractions` for exact rationals.
- Integers are arbitrary precision.
- `round` uses banker's rounding: `round(2.5) == 2`.

**Strings and bytes.**

- `str` is Unicode text; `bytes` is raw octets.
- Convert explicitly with `.encode()`/`.decode()` and an explicit encoding.
- Always pass `encoding="utf-8"` to `open()` for portability. 3.15 makes UTF-8 the default.
- f-strings are the standard formatting tool. 3.12 lifted their quoting and nesting restrictions.
- 3.14 adds **t-strings** (PEP 750). These are template literals that produce structured objects, not strings, enabling safe SQL and HTML interpolation.

**Security footguns.**

- `pickle.loads` on untrusted data is remote code execution.
- `yaml.load` without SafeLoader is dangerous.
- `eval`/`exec` on input is dangerous.
- `assert` is stripped under `-O`, so never use it for validation or security checks.

## 12. The contested "it depends" ground

These are areas where knowledgeable people genuinely disagree. Having a reasoned position, rather than a dogma, is the senior signal.

**Async vs threads.** Async gives high-connection-count efficiency and explicit suspension points. You pay with colouring, ecosystem duplication, and subtle blocking bugs. Many teams find sync code plus threads or worker processes simpler and fast enough. Free-threading may shift this balance.

**How much typing.** Strict typing everywhere costs friction, especially with dynamic libraries. A common sweet spot:

- strict on core domain and public APIs,
- relaxed in scripts and tests,
- never `# type: ignore` without a reason.

**Classes vs functions.** Python is multi-paradigm. Many seniors favour modules of functions plus dataclasses over "Java-style" service classes, and reserve classes for real state plus behaviour.

**Dataclass vs Pydantic vs attrs.** Validation cost and coupling to a library, versus convenience. Opinions split on letting Pydantic models leak into domain logic.

**EAFP purity.** EAFP is idiomatic, but catching broad exceptions to implement control flow hides bugs. Sometimes a clear `if` check reads better.

**ORM vs raw SQL.** On one side, SQLAlchemy 2.0's typed style, Django ORM and SQLModel. On the other, query builders or raw SQL. The tradeoff is productivity versus control and performance transparency. N+1 queries are the classic ORM failure.

**pandas vs Polars.** pandas has a huge ecosystem and legacy footprint. **Polars** is Rust-based, lazy, multi-threaded, with a stricter API, and is increasingly chosen for new pipelines. **DuckDB** is a strong option for SQL-on-files.

**Monorepo and tooling churn.** The Astral tools (uv, ruff) are winning on speed. Some organisations hesitate to depend on a single VC-backed vendor, though the tools are open source.

**Dependency injection frameworks.** They are common in the Java world and mostly viewed as unnecessary in Python. Passing arguments and FastAPI's `Depends` usually suffice.

## 13. Current vs legacy at a glance

| Legacy | Current |
|---|---|
| Python 2 (dead since 2020) | Python 3 |
| Python 3.8 and 3.9 | Past end-of-life. Current releases are 3.13 and 3.14; production fleets commonly run 3.11 to 3.13 |
| `%` formatting and `.format()` | f-strings (`%` survives in logging calls) |
| `os.path` | `pathlib` |
| `typing.List` and `Optional` | builtin generics and `\|` |
| `TypeVar` boilerplate | PEP 695 syntax |
| `setup.py` and `requirements.txt` as source of truth | `pyproject.toml` with lock files |
| pip+virtualenv+pyenv | uv (or Poetry) |
| flake8+isort+Black | Ruff |
| `unittest` | pytest |
| `asyncio.get_event_loop()` dance and `@asyncio.coroutine` (removed 3.11) | `asyncio.run` and TaskGroup |
| `gather` for structured work | TaskGroup |
| metaclasses for registration | `__init_subclass__` |
| `from __future__ import annotations` | lazy annotations (3.14) |
| `utcnow()` | aware datetimes |
| `requests` in async code | httpx |
| Flask by default for APIs | FastAPI (and Litestar) for typed async APIs. Django remains dominant for full-stack, Flask for small sync services |

## 14. How to carry it

When you talk about Python at this level, reason from mechanisms:

- Names bind to objects.
- Syntax dispatches to dunders on the type.
- Attribute access runs the descriptor and MRO algorithm.
- Iteration is the iterator protocol.
- Cleanup is the context manager protocol.
- Memory is refcounting plus a cycle collector.
- Threads are serialized by the GIL, except where it's released, and soon optionally not at all.

Pair each language feature with its cost and its failure mode. Pair each tool with what it replaced and why. When asked "which is better," answer with the axis that decides it: I/O vs CPU bound, trust boundary vs internal code, application vs library, team size and ecosystem constraints. That habit, more than any single fact, is what makes people who know Python well recognize you as one of them.
