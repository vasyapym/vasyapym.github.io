import type { LessonSection } from "../curriculum";

export const sections: readonly LessonSection[] = [
  {
    heading: "1. Core Language Model",
    blocks: [
      {"kind":"p","text":"**Is Python interpreted or compiled?** Both. CPython compiles source code into bytecode, then executes that bytecode on a stack-based virtual machine. So Python is not translated directly to machine code like C, but it is also not executed line-by-line as raw text."},
      {"kind":"p","text":"**What kind of typing does Python have?** Python is strongly, dynamically, and duck-typed. Dynamic means types belong to objects, not variables: `x = 1; x = \"a\"` is legal. Strong means `\"1\" + 1` fails instead of silently coercing. Duck typing means compatibility is determined by behavior — if an object has `.read()`, it can be used as a file-like object."},
      {"kind":"p","text":"**Is Python pass-by-value or pass-by-reference?** Neither classic model. It is *pass-by-assignment*: the parameter is bound to the same object. Mutating a mutable object inside a function is visible outside; rebinding the parameter is not. This explains why lists change but reassigned integers do not."},
      {"kind":"p","text":"**Mutable vs immutable?** Mutable objects can change in place: `list, dict, set`. Immutable objects cannot: `int, str, tuple, frozenset`. The classic trap is that a tuple is immutable as a container, but can contain mutable objects: `t = ([1],); t[0].append(2)` works."},
      {"kind":"p","text":"**`is` vs `==`?** `is` tests identity — same object in memory, i.e. `id(a) == id(b)`. `==` tests value equality via `__eq__`. Always use `x is None`, never rely on `is` for numbers or strings; CPython caching of small ints `-5..256` and string interning is an implementation detail."},
      {"kind":"p","text":"**What makes an object hashable?** An object whose hash never changes during its lifetime and which can be compared for equality. Hashable objects can be dict keys and set members. Defining `__eq__` without `__hash__` makes a custom class unhashable, which is usually the correct choice for mutable value objects."},
      {"kind":"p","text":"**How do dicts work?** Dicts are hash tables preserving insertion order since Python 3.7. Lookup, insert, and delete are O(1) average, O(n) worst-case under heavy collisions. That is why `in dict` is fast and `in list` is O(n)."},
      {"kind":"p","text":"**What is LEGB?** The scope lookup order: **L**ocal, **E**nclosing, **G**lobal, **B**uilt-in. A closure captures variables from the enclosing scope by reference, not by value — hence the famous loop trap where all lambdas created in a loop see the final loop value."},
    ],
  },
  {
    heading: "2. Data Model: Where Python Becomes \"Pythonic\"",
    blocks: [
      {"kind":"p","text":"**Iterable vs Iterator vs Generator?** An *iterable* can produce an iterator via `__iter__`. An *iterator* produces values via `__next__` and raises `StopIteration` when exhausted. A *generator* is an iterator created by a function containing `yield`; it suspends its local state between values, giving O(1) memory lazy evaluation instead of materializing a whole list."},
      {"kind":"p","text":"**What are dunder methods?** Dunder methods like `__len__`, `__eq__`, `__getitem__` implement Python's *data model*: syntax and built-ins delegate to them. `len(x)` calls `x.__len__()`. `__repr__` is the unambiguous developer representation and is the fallback; `__str__` is the readable user-facing one. You don't call dunders directly; you implement them so your objects behave like built-ins."},
      {"kind":"p","text":"**What is a decorator?** A higher-order function that takes a callable and returns a callable. `@dec` over `def f` is exactly `f = dec(f)`. Real uses: logging, caching, retries, authorization. Always use `@functools.wraps` inside so the wrapped function keeps its name and docstring; a decorator-with-arguments is just a factory returning a decorator, i.e. three nesting levels."},
      {"kind":"p","text":"**What is a context manager?** An object implementing `__enter__` and `__exit__`, used with `with` to guarantee cleanup even when an exception occurs — files, locks, DB transactions. `__exit__` receives exception information and can suppress it by returning `True`. `async with` uses `__aenter__`/`__aexit__`."},
      {"kind":"p","text":"**What is a descriptor?** An object defining `__get__`, `__set__`, or `__delete__` that is stored as a class attribute and therefore controls attribute access on instances. This is the hidden machinery behind `property`, `classmethod`, `staticmethod`, and even functions becoming bound methods. Data descriptors (with `__set__`) override instance `__dict__`; non-data descriptors do not."},
      {"kind":"p","text":"**What is the MRO and `super()`?** The Method Resolution Order is the class linearization computed by the C3 algorithm; attribute lookup follows it. `super()` does not mean \"my parent\" — it means \"the next class after me in the MRO of the actual instance,\" which enables cooperative multiple inheritance. Prefer `__init_subclass__` or class decorators over metaclasses; a metaclass is the class of a class (default `type`) and controls class creation itself, rarely needed in application code."},
      {"kind":"p","text":"**`__new__` vs `__init__`?** `__new__` creates and returns the instance; `__init__` initializes an already-created instance and returns `None`. You need `__new__` mainly when subclassing immutable types or implementing singletons."},
    ],
  },
  {
    heading: "3. Functions and OOP Design",
    blocks: [
      {"kind":"p","text":"**`*args`, `**kwargs`, `/`, `*`?** `*args` packs extra positionals into a tuple; `**kwargs` packs extra keywords into a dict; in calls they unpack. In a signature, `/` marks preceding parameters positional-only and a bare `*` marks following parameters keyword-only, making APIs explicit and refactor-safe."},
      {"kind":"p","text":"**`classmethod` vs `staticmethod`?** An instance method receives `self`. A `classmethod` receives the class `cls` and is used for alternative constructors like `User.from_json(...)`. A `staticmethod` receives nothing automatically; it is simply a function namespaced inside a class."},
      {"kind":"p","text":"**Mutable default argument trap?** Default values are evaluated once, at function definition time. `def f(x=[])` shares one list across all calls. The correct pattern is `def f(x=None)` and create the list inside."},
      {"kind":"p","text":"**Shallow vs deep copy?** Assignment creates an alias, not a copy. A shallow copy creates a new outer container but shares nested objects. `copy.deepcopy` recursively copies the object graph, handling cycles via a memo dict."},
      {"kind":"p","text":"**ABC vs Protocol vs dataclass?** An `ABC` with `@abstractmethod` enforces an interface nominally: subclasses must inherit and implement. A `Protocol` (from `typing`) gives structural typing: any class with matching methods qualifies, no inheritance — statically checked duck typing. A `@dataclass` auto-generates `__init__`, `__repr__`, and `__eq__`; `frozen=True` makes it immutable-style and hashable. `NamedTuple` is for lightweight immutable records; regular classes are for behavior plus invariants."},
      {"kind":"p","text":"**Do type hints enforce types?** No. Annotations are metadata checked statically by mypy/pyright and used by frameworks like Pydantic and FastAPI at runtime — but CPython itself ignores them during execution. `Any` opts out of checking; `object` means \"any object, but you may only use what `object` guarantees.\""},
    ],
  },
  {
    heading: "4. Memory and Performance",
    blocks: [
      {"kind":"p","text":"**How does garbage collection work?** Primarily reference counting: each object has a count of references, and is freed when it reaches zero. Because reference cycles never reach zero, a generational cyclic GC periodically finds and collects unreachable cycles. `__slots__` complements this: it replaces per-instance `__dict__` with fixed storage, reducing memory and preventing accidental attribute creation."},
      {"kind":"p","text":"**What is the GIL?** The Global Interpreter Lock is a mutex in CPython protecting interpreter internals, allowing only one thread to execute Python bytecode at a time. It is released during I/O and by many C extensions like NumPy. Consequence: threads help I/O-bound work, not CPU-bound work. Python 3.13 adds an experimental free-threaded build (PEP 703) without it."},
      {"kind":"p","text":"**Which data structure when?** `list`: ordered sequence, O(1) append, O(n) insert/delete in the middle and membership. `deque`: O(1) pops from both ends. `set`/`dict`: O(1) membership. `heapq` for priority queues, `bisect` for sorted lists. Middle+ signal: choose by operation complexity, not by habit."},
    ],
  },
  {
    heading: "5. Concurrency: The Decisive Section",
    blocks: [
      {"kind":"p","text":"**Threading vs Multiprocessing vs Asyncio?** Threads share memory, are preemptively scheduled by the OS, but are limited by the GIL — good for I/O-bound tasks. Processes have separate memory and separate GILs, giving true CPU parallelism at the cost of pickling data between them — good for CPU-bound tasks. Asyncio is single-threaded cooperative concurrency: coroutines voluntarily yield at `await`, letting one thread juggle thousands of I/O connections with minimal overhead."},
      {"kind":"p","text":"**Coroutine vs Task vs event loop?** Calling an `async def` function only creates a coroutine object; nothing runs. `await` runs it in the current task. `asyncio.create_task()` schedules it concurrently on the event loop, which is the scheduler switching between tasks at await points. `asyncio.gather()` awaits several awaitables and collects results. Biggest trap: blocking calls like `time.sleep()` or `requests.get()` inside async code freeze the entire loop — use `await asyncio.sleep()` and async clients."},
      {"kind":"p","text":"**How do you prevent race conditions?** Avoid shared mutable state; otherwise protect it with `threading.Lock` (or `RLock` for re-entry), communicate via thread-safe `queue.Queue`, or offload work to `concurrent.futures.ThreadPoolExecutor` / `ProcessPoolExecutor`, which is the modern high-level answer interviewers want."},
    ],
  },
  {
    heading: "6. Engineering: What Separates Middle from Junior",
    blocks: [
      {"kind":"p","text":"**How do imports work?** Python searches `sys.path`, finds the module, executes it once, and caches it in `sys.modules`; later imports reuse the cache. A module is a file; a package is a directory (traditionally with `__init__.py`, namespace packages excepted). A virtual environment isolates an interpreter plus its own site-packages so projects don't fight over dependency versions."},
      {"kind":"p","text":"**EAFP vs LBYL?** Python prefers *Easier to Ask Forgiveness than Permission*: try the operation and catch `KeyError`/`IndexError` instead of pre-checking. It is cleaner and avoids race conditions. Catch specific exceptions, never bare `except:`, and define custom exceptions to express domain errors."},
      {"kind":"p","text":"**How do you test?** Unit tests isolate one unit; integration tests verify components together; end-to-end tests verify whole flows. In pytest, *fixtures* inject setup/teardown dependencies. Mock at system boundaries (HTTP, DB) using `unittest.mock.patch` — and patch where the object is *looked up*, not where it is defined."},
      {"kind":"p","text":"**WSGI vs ASGI?** WSGI is the synchronous server interface behind classic Django/Flask deployments (Gunicorn). ASGI is its async successor supporting awaitables, WebSockets, and long-lived connections — used by FastAPI/Starlette with Uvicorn."},
      {"kind":"p","text":"**What is the N+1 problem?** An ORM lazily loads each related object with a separate query: 1 query for a list plus N queries for relations. Fix with eager loading — Django's `select_related` (JOIN, for foreign keys) and `prefetch_related` (separate query + in-memory join, for many-to-many)."},
      {"kind":"p","text":"**How do you optimize Python?** Measure first: `cProfile` for call hotspots, `timeit` for micro-benchmarks, `tracemalloc` for memory. Then optimize algorithms and data structures, cache with `functools.lru_cache`, push heavy work into NumPy/C extensions, I/O into asyncio, and CPU work into processes. Never micro-optimize before profiling."},
    ],
  },
  {
    heading: "Final Cheat-Line",
    blocks: [
      {"kind":"p","text":"Threads = I/O + shared memory, blocked by GIL for CPU. Processes = CPU parallelism, expensive communication. Asyncio = massive I/O concurrency, one thread, never block the loop."},
    ],
  },
];;
