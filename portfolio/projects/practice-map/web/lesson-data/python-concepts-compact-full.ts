import type { LessonSection } from "../curriculum";

export const sections: readonly LessonSection[] = [
  {
    heading: null,
    blocks: [
      {"kind":"p","text":"The format below is deliberate: each entry is a one-breath definition you could say out loud, followed by the one detail."},
    ],
  },
  {
    heading: "1. Object Model & Memory",
    blocks: [
      {"kind":"p","text":"**Everything is an object.** In Python, every value — integers, functions, classes, modules, `None` — is a heap-allocated object with an identity (`id()`), a type, and a value. Variables are not boxes holding values; they are names bound to objects. The senior tell: you say \"name binding\" instead of \"assignment copies the value.\""},
      {"kind":"p","text":"**Mutability.** An object is mutable if its state can change in place after creation (`list`, `dict`, `set`, most user classes) and immutable if it cannot (`int`, `str`, `tuple`, `frozenset`). Immutability is a property of the object, not the name — a tuple can contain a list that mutates. The classic trap is the mutable default argument: `def f(x=[])` evaluates the list once at definition time, so every call shares it. Use `None` as a sentinel."},
      {"kind":"p","text":"**Reference counting + cycle GC.** CPython frees an object the instant its reference count hits zero — deterministic and cheap. Because reference cycles (A→B→A) never reach zero, a separate generational garbage collector periodically scans container objects for unreachable cycles. The `gc` module exposes it; `__del__` on cyclic objects is a historical foot-gun. Weak references (`weakref`) let you observe an object without keeping it alive."},
      {"kind":"p","text":"**Interning and `is` vs `==`.** `==` calls `__eq__` and compares values; `is` compares identity. CPython caches small integers (−5 to 256) and some strings, so `a is b` may accidentally be `True` for equal small values — never rely on it. Use `is` only for singletons: `None`, `True`, `False`, sentinels."},
      {"kind":"p","text":"**Shallow vs deep copy.** A shallow copy (`copy.copy`, slicing, `dict(d)`) creates a new container whose elements are the same objects; a deep copy (`copy.deepcopy`) recursively copies the contents. The interview follow-up: deep copy handles cycles via a memo dict, and you can customize both with `__copy__` / `__deepcopy__`."},
      {"kind":"p","text":"**`__slots__`.** Declaring `__slots__ = (\"x\", \"y\")` in a class replaces the per-instance `__dict__` with fixed descriptors, cutting memory roughly in half for many small objects and slightly speeding attribute access. The cost: no dynamic attributes, and inheritance requires care (a subclass without `__slots__` silently regains `__dict__`)."},
    ],
  },
  {
    heading: "2. Functions, Scope, Closures",
    blocks: [
      {"kind":"p","text":"**LEGB.** Name resolution proceeds Local → Enclosing → Global → Builtin. Assignment inside a function makes a name local for the *entire* function body (decided at compile time), which is why reading a global and then assigning it raises `UnboundLocalError`. `global` and `nonlocal` opt out of that rule."},
      {"kind":"p","text":"**Closure.** A function that captures variables from an enclosing scope and retains them after that scope exits. Captured variables live in cell objects, and the capture is *by reference, late-bound*: a loop that creates lambdas referencing `i` yields functions that all see the final `i`. Fix with a default argument (`lambda i=i:`) or `functools.partial`."},
      {"kind":"p","text":"**First-class functions & higher-order functions.** Functions can be passed, returned, and stored like any object; a higher-order function takes or returns functions. This is the foundation of decorators, callbacks, and `map`/`filter`/`sorted(key=...)`."},
      {"kind":"p","text":"**Decorator.** Syntactic sugar: `@deco def f` is `f = deco(f)`. A decorator is any callable that takes a callable and returns a callable (usually a wrapper). Use `functools.wraps` to preserve `__name__`, `__doc__`, and `__wrapped__`. Parameterized decorators are decorator factories — three nested levels. Class decorators and stacking order (bottom applies first) are the typical follow-ups."},
      {"kind":"p","text":"**`*args`, `**kwargs`, and parameter kinds.** Python has five parameter kinds, in order: positional-only (before `/`), positional-or-keyword, var-positional (`*args`), keyword-only (after `*`), var-keyword (`**kwargs`). Positional-only parameters (3.8+) protect you from callers depending on names you may rename."},
      {"kind":"p","text":"**Generators.** A function containing `yield` returns a generator object that executes lazily, suspending state between `next()` calls. They give O(1) memory for streams and compose into pipelines. `yield from` delegates to a sub-iterator and forwards `send()`/`throw()`. `send()` turns a generator into a coroutine-like consumer; `return value` in a generator becomes `StopIteration.value`."},
      {"kind":"p","text":"**Iterator protocol.** An *iterable* defines `__iter__` returning an iterator; an *iterator* defines `__next__` and returns itself from `__iter__`. Iterators are single-pass and exhaust; iterables like lists produce a fresh iterator each time. A `for` loop calls `iter()` once and `next()` repeatedly until `StopIteration`."},
      {"kind":"p","text":"**Lambda.** An anonymous single-expression function. The honest middle-level take: use it for tiny `key=` arguments, and reach for `operator.itemgetter`/`attrgetter` or a named `def` when it grows or needs a traceback-friendly name."},
      {"kind":"p","text":"**`functools` essentials.** `lru_cache`/`cache` memoize pure functions keyed on hashable arguments; `partial` freezes arguments; `reduce` folds; `singledispatch` gives function overloading by the type of the first argument; `cached_property` computes once per instance."},
    ],
  },
  {
    heading: "3. Classes & the Data Model",
    blocks: [
      {"kind":"p","text":"**Dunder methods / protocols.** Python's \"magic methods\" are how objects opt into language syntax: `__len__` for `len()`, `__getitem__` for indexing, `__contains__` for `in`, `__call__` for `()`, `__enter__`/`__exit__` for `with`, `__hash__` and `__eq__` for dict keys. Duck typing means the interpreter asks \"do you implement the protocol?\", never \"what is your class?\""},
      {"kind":"p","text":"**`__new__` vs `__init__`.** `__new__` is a static method that *creates* and returns the instance; `__init__` *initializes* an already-created instance and returns `None`. You override `__new__` for immutable subclasses (`int`, `str`, `tuple`), singletons, or to return a different class entirely."},
      {"kind":"p","text":"**`__repr__` vs `__str__`.** `__repr__` is the unambiguous developer-facing form, ideally valid Python to recreate the object; `__str__` is the human-facing form and falls back to `__repr__`. Always define `__repr__`."},
      {"kind":"p","text":"**`__eq__` and `__hash__` contract.** Objects that compare equal must hash equal. Defining `__eq__` without `__hash__` sets `__hash__` to `None`, making the class unhashable — intentional, because a mutable-but-equal object in a set would break invariants. Hash only on immutable fields."},
      {"kind":"p","text":"**Class vs instance vs static methods.** An instance method receives `self`; a `@classmethod` receives `cls` and is the idiomatic way to write alternate constructors (`from_json`) that respect subclassing; a `@staticmethod` receives nothing and is simply a namespaced function."},
      {"kind":"p","text":"**Properties & descriptors.** A descriptor is any object defining `__get__`, `__set__`, or `__delete__`, placed on a class. Data descriptors (with `__set__`) take precedence over instance `__dict__`; non-data descriptors (only `__get__`) do not — this is why functions become bound methods and why `property` overrides instance attributes. `property` is just a descriptor with a nice decorator API. `__set_name__` lets a descriptor learn its attribute name."},
      {"kind":"p","text":"**MRO & `super()`.** Method Resolution Order is computed by C3 linearization, guaranteeing each class appears once, children precede parents, and base order is preserved. `super()` does not mean \"my parent\"; it means \"the next class in the MRO of the *instance's* type,\" which is what makes cooperative multiple inheritance work — every class in the chain must call `super().__init__(**kwargs)` and forward unknown arguments."},
      {"kind":"p","text":"**Mixins.** Small classes contributing one behavior, intended for multiple inheritance and never instantiated alone. They work because of the MRO and should avoid `__init__` or cooperate via `super()`."},
      {"kind":"p","text":"**Abstract base classes.** `abc.ABC` with `@abstractmethod` prevents instantiation until all abstract members are overridden, and `register()` allows virtual subclassing without inheritance. `collections.abc` provides `Iterable`, `Mapping`, `Sequence` etc. for `isinstance` checks that respect duck typing."},
      {"kind":"p","text":"**Protocols (structural typing).** `typing.Protocol` defines a type by its method signatures rather than inheritance; any class with matching methods satisfies it at type-check time. It is duck typing made explicit for static analyzers, and `@runtime_checkable` extends it to `isinstance`."},
      {"kind":"p","text":"**Dataclasses.** `@dataclass` generates `__init__`, `__repr__`, `__eq__`, and optionally ordering and `__hash__` from annotated fields. `frozen=True` gives immutability and hashability; `field(default_factory=list)` avoids the mutable-default trap; `slots=True` (3.10+) adds `__slots__`; `__post_init__` handles derived fields. Compare: `NamedTuple` is a tuple with names, `attrs` is the ancestor, `pydantic` adds validation."},
      {"kind":"p","text":"**Metaclasses.** A metaclass is the type of a class; `type` is the default. Overriding `__new__` or `__init__` on a metaclass lets you intercept class creation — registering plugins, validating attributes, injecting methods. The pragmatic answer: `__init_subclass__` and class decorators cover 90% of use cases with less magic."},
      {"kind":"p","text":"**Context managers.** Objects implementing `__enter__`/`__exit__` for deterministic setup/teardown. `__exit__` receives exception info and suppresses the exception if it returns `True`. `contextlib.contextmanager` turns a generator into one; `ExitStack` manages a dynamic number of them."},
    ],
  },
  {
    heading: "4. Typing",
    blocks: [
      {"kind":"p","text":"**Gradual typing.** Annotations are optional metadata ignored at runtime by the interpreter and checked by external tools (`mypy`, `pyright`). You can type incrementally, module by module."},
      {"kind":"p","text":"**Key constructs.** `Optional[X]` is `X | None`; `Union` merges types; `Any` disables checking (distinct from `object`, which permits everything but allows nothing); `TypeVar` parameterizes generics; `Callable[[Args], Ret]` describes functions; `Literal`, `TypedDict`, `Final`, `ClassVar`, `overload`, and `ParamSpec` handle the edges. Prefer `Sequence`/`Mapping`/`Iterable` in parameters (accept broadly) and concrete types in returns (promise precisely)."},
      {"kind":"p","text":"**Variance.** `list[Dog]` is *not* a `list[Animal]` because lists are mutable (invariant); `Sequence[Dog]` *is* a `Sequence[Animal]` because it is read-only (covariant). `Callable` is contravariant in arguments. Knowing this word is a strong middle+ signal."},
    ],
  },
  {
    heading: "5. Concurrency",
    blocks: [
      {"kind":"p","text":"**GIL.** The Global Interpreter Lock is a CPython mutex allowing only one thread to execute Python bytecode at a time. It simplifies memory management and makes C extensions easier but means threads do not parallelize CPU-bound Python code. I/O operations and many C library calls (NumPy, hashing, compression) release it. Python 3.13 ships an experimental free-threaded build."},
      {"kind":"p","text":"**Threading vs multiprocessing vs asyncio.** Threads: shared memory, cheap, good for blocking I/O, limited by the GIL for CPU. Processes: true parallelism, isolated memory, serialization (pickling) overhead, best for CPU-bound work. Asyncio: single-threaded cooperative multitasking via an event loop, excellent for many concurrent network connections, but one blocking call stalls everything. `concurrent.futures` gives a uniform `Executor` API over threads and processes."},
      {"kind":"p","text":"**Coroutines, `async`/`await`.** `async def` defines a coroutine function; calling it returns a coroutine object that does nothing until awaited or scheduled as a Task. `await` yields control to the event loop at a suspension point. `asyncio.gather` runs awaitables concurrently; `create_task` schedules without awaiting; `TaskGroup` (3.11+) adds structured concurrency. Blocking code goes through `loop.run_in_executor` / `asyncio.to_thread`."},
      {"kind":"p","text":"**Race conditions & synchronization.** Even with the GIL, compound operations (`x += 1`, check-then-act) are not atomic across threads. `threading.Lock`, `RLock`, `Semaphore`, `Event`, `Condition`, and `queue.Queue` (thread-safe by design) are the primitives. Prefer passing messages over sharing state."},
    ],
  },
  {
    heading: "6. Data Structures & Complexity",
    blocks: [
      {"kind":"p","text":"**`list`.** Dynamic array: O(1) indexing and amortized append, O(n) insert/delete at the front. Use `collections.deque` for O(1) operations at both ends."},
      {"kind":"p","text":"**`dict`.** Hash table with insertion order preserved (guaranteed since 3.7), O(1) average lookup. Keys must be hashable. Compact split-table layout since 3.6 made it both smaller and ordered. `defaultdict`, `Counter`, `OrderedDict` (now mainly for `move_to_end`), and `ChainMap` are the specialized relatives."},
      {"kind":"p","text":"**`set`.** Hash table of keys without values; O(1) membership, with mathematical operations (`|`, `&`, `-`, `^`). `frozenset` is the hashable immutable variant."},
      {"kind":"p","text":"**Comprehensions & generator expressions.** List/dict/set comprehensions build eagerly; a generator expression `(x for x in ...)` builds lazily. Pass generator expressions directly to `sum`, `any`, `max`, `join` for memory efficiency. Comprehensions have their own scope since Python 3."},
      {"kind":"p","text":"**Sorting.** `sorted()` and `list.sort()` use Timsort, stable, O(n log n), with a `key` function called once per element. Stability means you can sort by secondary key first, then primary, or use a tuple key. `reverse=True` preserves stability."},
      {"kind":"p","text":"**String immutability and building.** Repeated `+=` on strings is quadratic in theory (CPython has an optimization, but don't rely on it); accumulate into a list and `\"\".join()` it. f-strings are the fastest and clearest formatting."},
      {"kind":"p","text":"**`array`, `bytes`, `memoryview`.** `bytes` is immutable, `bytearray` mutable; `memoryview` provides zero-copy slicing of buffer-protocol objects; `array.array` stores homogeneous primitives compactly. These matter when someone asks about binary protocols or performance."},
    ],
  },
  {
    heading: "7. Errors, Modules, Tooling",
    blocks: [
      {"kind":"p","text":"**Exceptions as control flow (EAFP).** \"Easier to Ask Forgiveness than Permission\": try the operation and catch the exception, rather than checking preconditions (LBYL). It is idiomatic, avoids TOCTOU races, and is cheap when exceptions are rare. Catch narrowly, never bare `except:`, use `else` for the no-exception path and `finally` for cleanup. `raise ... from e` preserves causality; exception groups and `except*` (3.11+) handle concurrent failures."},
      {"kind":"p","text":"**Custom exception hierarchies.** Define a base `MyLibError(Exception)` and subclasses so callers can catch at the granularity they need. Exceptions are classes; put useful attributes on them."},
      {"kind":"p","text":"**Modules, packages, imports.** A module is a `.py` file (or C extension); a package is a directory with `__init__.py` (namespace packages omit it). Imports execute the module once and cache it in `sys.modules`. Circular imports fail when module A needs a name from B while B is still mid-execution importing A — fix by importing inside functions, restructuring, or importing the module rather than names. `if __name__ == \"__main__\":` distinguishes script execution from import."},
      {"kind":"p","text":"**Virtual environments & packaging.** `venv` isolates interpreter + site-packages per project. `pyproject.toml` is the modern single source for build metadata (PEP 517/518/621); tools like `pip`, `poetry`, `uv`, `pip-tools` manage dependencies with lock files for reproducibility. Wheels are prebuilt binary distributions; sdists are source."},
      {"kind":"p","text":"**Testing.** `pytest` uses plain `assert` with introspection, fixtures for dependency injection with scoped lifetimes, `parametrize` for table-driven tests, and `monkeypatch`/`unittest.mock` for isolation. Mock at the boundary you own, assert on behavior not implementation. Property-based testing (`hypothesis`) generates inputs to find edge cases."},
      {"kind":"p","text":"**Profiling & performance.** Measure before optimizing: `timeit` for microbenchmarks, `cProfile`/`py-spy` for hotspots, `tracemalloc` for memory. Typical wins in order: better algorithm, built-ins and C-implemented libraries, caching, avoiding attribute lookups in hot loops, then Cython/Rust extensions or PyPy. Python 3.11+ got substantially faster via the adaptive specializing interpreter."},
      {"kind":"p","text":"**Pickle & serialization.** `pickle` serializes arbitrary object graphs but executes code on load — never unpickle untrusted data. JSON is safe and interoperable but limited to primitives; use custom encoders or dataclass `asdict`."},
      {"kind":"p","text":"**PEP 8 / Zen.** Style is enforced by tools (`ruff`, `black`, `isort`), so the interview point is judgment: readability counts, explicit is better than implicit, flat is better than nested, errors should never pass silently."},
    ],
  },
  {
    heading: "8. Design Vocabulary You Will Be Asked For",
    blocks: [
      {"kind":"p","text":"**Duck typing** — behavior over inheritance. **Composition over inheritance** — hold a collaborator rather than extend it. **Dependency injection** — pass collaborators in, don't construct them inside. **Singleton** — in Python, a module *is* a singleton; metaclass singletons are usually overkill. **Factory** — a `@classmethod` or plain function returning configured instances. **Strategy** — pass a callable. **Observer** — list of callbacks. **Idempotency** — repeated application yields the same result; essential for retries and APIs. **Pure function** — output depends only on inputs, no side effects; trivially cacheable and testable."},
    ],
  },
];;
