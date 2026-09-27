<!-- lesson-meta: {"id":"python-concurrency","title":"Concurrency in Python: Concepts and Vocabulary, from First Principles to the Frontier","summary":"A layered English guide to Python concurrency from first principles to the frontier: concurrency vs parallelism vs asynchrony, I/O-bound vs CPU-bound work, processes vs threads and preemptive vs cooperative scheduling; the hazards — race conditions, atomicity, critical sections, data race vs race condition, heisenbugs, and deadlock via the Coffman conditions (plus livelock, starvation, priority inversion); the GIL honestly explained — refcounting rationale, what it does and does not guarantee, GIL-releasing C extensions, the 5 ms switch interval, and the folklore of atomic built-in operations; the threading toolkit (Lock/RLock/Semaphore/Event/Condition with the wait-loop rule, Barrier, daemon threads, no thread.kill, excepthook), queue-based producer–consumer with backpressure and sentinels, executors and futures; multiprocessing by isolation — pickling costs, embarrassingly parallel workloads, start methods (fork's copy-on-write refcount trap and locked-lock deadlock, spawn, forkserver as the 3.14 Linux default); asyncio from the event loop and reactor/proactor patterns through coroutines (never awaited, weak task references), the cooperative contract (races impossible between awaits, never block the loop, function coloring), cancellation and structured concurrency with TaskGroup and ExceptionGroup, contextvars; theory — CSP vs the actor model, memory models and happens-before, lock-free/wait-free and the ABA trap, Amdahl/Gustafson/Little and the essential terms; the frontier — free-threaded Python (PEP 703: biased and deferred refcounting, immortal objects, mimalloc, per-object critical sections) and subinterpreters (PEP 684/734); and practice — choosing the tool per workload and seven principles of sound concurrent design.","concepts":[],"tier":1,"complexity":4,"practicePrompt":"Write a small Python module (3.12+) and exercise the vocabulary: (1) run 10 threads incrementing a shared counter and observe the lost update, then fix it with a Lock and with a queue-based pipeline; (2) demonstrate a deadlock from inconsistent lock ordering and break it with lock ordering or acquire timeouts; (3) time requests.get over 50 URLs sequentially vs ThreadPoolExecutor vs asyncio.gather with an async client, capping concurrency with asyncio.Semaphore; (4) run the same counter loop under a free-threaded 3.14 build if available. No Python was executed in this environment — run and verify it yourself.","checkPrompt":"Without a terminal: distinguish concurrency/parallelism/asynchrony and I/O-bound vs CPU-bound work; name the four Coffman conditions and which practical prevention breaks which; explain what the GIL does (refcounts, released around blocking calls, switch interval) and — the core test — why it does not make your code thread-safe, and which built-in operations happen to be atomic under it; the wait-inside-a-loop rule for Condition and why spurious wakeups force it; what backpressure means and why bounded queues matter; fork vs spawn vs forkserver — the refcount copy-on-write trap, the locked-lock-in-child deadlock, and why spawn needs the __main__ guard; what happens between two awaits in asyncio and what still needs asyncio.Lock; the never-block-the-loop rule and the bridges to threads/processes; how cancellation really works and what structured concurrency guarantees (TaskGroup, ExceptionGroup, except*); contextvars vs threading.local; CSP vs the actor model; happens-before and why free-threaded Python makes it your problem; CAS and the ABA problem; Amdahl's ceiling at 95% parallel code and Little's law; and how biased/deferred refcounting and immortal objects make free threading viable.","references":["Python docs: threading, concurrent.futures, multiprocessing, asyncio, contextvars — https://docs.python.org/3/","What's new in Python 3.11/3.13/3.14 — TaskGroup, free-threading, forkserver default — https://docs.python.org/3/whatsnew/","PEP 703 (free-threaded CPython), PEP 683 (immortal objects), PEP 684 (per-interpreter GIL), PEP 734 (multiple interpreters), PEP 492 (async/await), PEP 567 (contextvars)","Nathaniel J. Smith, Notes on structured concurrency, or: go statement considered harmful — https://vorpus.org/blog/notes-on-structured-concurrency-or-go-statement-considered-harmful/","Rob Pike, Concurrency is not parallelism (2012)","Mike Jones, What really happened on Mars? (Mars Pathfinder priority inversion)","Amdahl (1967), Gustafson (1988), Little (1961)","uvloop — https://github.com/MagicStack/uvloop","Bob Nystrom, What Color is Your Function? — https://journal.stuffwithstuff.com/2015/02/01/what-color-is-your-function/"]} -->

# Concurrency in Python: Concepts and Vocabulary, from First Principles to the Frontier

## Part I: The Foundations

### 1. What concurrency actually is

Concurrency is about structure. Parallelism is about execution. Rob Pike's formulation is the cleanest: concurrency is *dealing with* many things at once, while parallelism is *doing* many things at once.

A concurrent program is composed of independently progressing activities whose lifetimes overlap. A parallel program has multiple computations physically executing at the same instant, on separate CPU cores.

A single-core machine can run a highly concurrent program with zero parallelism. It does this by interleaving: running a slice of task A, then a slice of task B, then back to A. Conversely, a GPU multiplying matrices is massively parallel but not very concurrent in the interesting sense. It is one task split into identical pieces, with no independent lifetimes to coordinate.

The distinction matters in Python more than in almost any other mainstream language. For decades, CPython offered excellent concurrency and very constrained parallelism.

A closely related word is **asynchrony**, which describes the relationship between starting an operation and getting its result. A synchronous call blocks the caller until the result is ready. An asynchronous call returns immediately, and the result arrives later through a callback, a future, or a resumed coroutine. Asynchrony is a mechanism for achieving concurrency, not a synonym for it.

### 2. Why bother: the two kinds of work

Nearly every concurrency decision in Python begins with one question: what is your program waiting on?

- **I/O-bound work** spends most of its time waiting on something external: a network socket, a disk, a database, a user, a subprocess. The CPU sits idle during these waits. Concurrency lets you fill that idle time with other useful work. A web scraper fetching a thousand URLs sequentially spends 99% of its life waiting. Done concurrently, it can finish almost a thousand times faster, even on one core.
- **CPU-bound work** is limited by computation itself: parsing, compression, numerical simulation, image processing. Here, interleaving on one core buys nothing, and actually costs a little overhead. Only true parallelism, meaning multiple cores working simultaneously, makes it faster.

Most real programs are a mixture. They also shift between regimes as they are optimized: once your I/O is concurrent, CPU time may become your new bottleneck.

### 3. Processes and threads

The operating system gives you two fundamental units of execution.

A **process** is an isolated instance of a running program. It has its own virtual address space, its own file descriptor table, its own memory. One process cannot directly read another's variables. Isolation is the defining feature: a crash in one process does not corrupt another. The cost is that creating processes is relatively expensive, and sharing data between them requires explicit **inter-process communication (IPC)**, such as pipes, sockets, shared memory segments, or files.

A **thread** is a unit of execution *within* a process. All threads in a process share the same memory: the same heap, the same global variables, the same open files. Each thread has its own stack and its own instruction pointer. Threads are cheaper to create than processes, and they communicate trivially, because they can simply read and write the same objects. That same property is the root of almost every concurrency bug ever written.

### 4. Scheduling

The OS **scheduler** decides which thread runs on which core at any moment. Most modern operating systems use **preemptive multitasking**: the scheduler can interrupt (preempt) a running thread at essentially any instruction boundary, save its state, and switch to another. This save-and-restore is a **context switch**. It costs from roughly a microsecond to several microseconds, plus the hidden expense of cold CPU caches afterward.

The alternative is **cooperative multitasking**, where a task runs until it voluntarily yields control. Cooperative systems are simpler to reason about, because switches happen only at known points. They are also fragile: one task that never yields starves everything else.

Python's `asyncio` is a cooperative system layered on top of a preemptive OS. Holding that picture in your head explains most of its behavior.

## Part II: The Hazards

### 5. Race conditions and atomicity

A **race condition** exists when a program's correctness depends on the relative timing or interleaving of operations it does not control. The canonical example is the humble increment:

```python
counter += 1
```

This looks like one operation. At the bytecode level, it is several: load the current value, add one, store the result back. Suppose two threads both load the value 41. Each computes 42, and each stores 42. One increment has vanished. This is a **lost update**.

An operation is **atomic** if it appears to happen all at once, indivisibly, with no observable intermediate state. The incrementing statement above is not atomic.

A **critical section** is a stretch of code that accesses shared state and must not be executed by more than one thread at a time. **Mutual exclusion** is the guarantee that at most one thread is inside a given critical section.

Some literature separates two terms:

- A **data race** is unsynchronized concurrent access to the same memory location, where at least one access is a write. It is a low-level, memory-model concept.
- A **race condition** is the broader, semantic notion of timing-dependent incorrectness.

You can have a race condition with no data race. For example, check-then-act logic that uses individually atomic operations can still interleave badly:

```python
if key not in d:
    d[key] = compute()
```

Each line is safe on its own. The *pair* is not.

Race conditions produce **heisenbugs**: bugs that vanish when you add print statements or attach a debugger, because observation changes the timing. They are nondeterministic, rare under test, and common under production load. This is why concurrency correctness must be designed in, not tested in.

### 6. Deadlock, livelock, starvation

**Deadlock** occurs when a set of threads each wait for a resource held by another thread in the set, forming a cycle that can never resolve. Thread 1 holds lock A and wants lock B. Thread 2 holds lock B and wants lock A. Both wait forever.

The classic **Coffman conditions** say deadlock requires all four of the following at once:

1. **Mutual exclusion**: resources cannot be shared.
2. **Hold and wait**: a thread holds one resource while requesting another.
3. **No preemption**: resources cannot be forcibly taken away.
4. **Circular wait**: a cycle exists in the wait-for graph.

Break any one and deadlock becomes impossible. The most practical prevention is a global **lock ordering**: if every thread always acquires locks in the same order, circular wait cannot occur. Timeouts on acquisition, such as `lock.acquire(timeout=...)`, turn silent hangs into detectable failures.

**Livelock** is deadlock's hyperactive cousin. The threads are not blocked. They keep responding to each other, forever changing state without making progress, like two people repeatedly stepping aside in a hallway in the same direction.

**Starvation** is when a thread is perpetually denied a resource it needs, even though the system as a whole progresses. Unfair locks and greedy scheduling cause it. **Fairness** is the property that every waiting thread eventually gets its turn.

**Priority inversion** occurs when a high-priority task waits on a lock held by a low-priority task, which is itself preempted by medium-priority work. It famously nearly doomed the Mars Pathfinder mission. It is rarely a direct Python concern, but it belongs in any serious vocabulary.

## Part III: Threads in Python

### 7. The Global Interpreter Lock

The GIL is the single most discussed feature of CPython concurrency, and the most misunderstood.

The GIL is a mutex inside the CPython interpreter. It ensures that only one thread executes Python bytecode at a time within a given interpreter. It exists primarily because CPython manages memory through **reference counting**. Every object carries a count of how many references point to it, and the object is freed when that count reaches zero. These counts change constantly, on nearly every operation. Making each increment and decrement thread-safe with fine-grained locks or atomic instructions would slow single-threaded code considerably.

The GIL was the pragmatic 1990s solution. It is one big lock, so refcounts, and interpreter internals generally, need no further protection. It also made writing C extensions dramatically simpler, which is a large part of why Python's scientific ecosystem exists at all.

The consequences:

- **Threads cannot run pure-Python CPU-bound code in parallel.** Two threads computing prime numbers in Python take turns holding the GIL. Total throughput stays at one core's worth, and contention overhead often makes it slightly worse.
- **Threads work very well for I/O-bound code.** CPython releases the GIL around blocking system calls such as `socket.recv`, `file.read`, and `time.sleep`. While one thread waits on the network, others run Python freely.
- **C extensions can release the GIL** during long computations that do not touch Python objects. NumPy, hashlib on large inputs, zlib, many image libraries, and much of the scientific stack do this. Threads running NumPy-heavy code *can* achieve real parallelism.
- **The interpreter forces periodic handoffs.** A thread holding the GIL is asked to release it after a **switch interval**, 5 milliseconds by default (`sys.getswitchinterval()`), so other threads are not starved. This is why threads in Python still behave preemptively from the programmer's perspective.

Here is the misconception that causes real bugs: **the GIL does not make your code thread-safe.** It protects the interpreter's internal consistency, not your program's invariants. A switch can happen between the load and store of `counter += 1`. The GIL guarantees that a dictionary's internal hash table never becomes corrupted. It guarantees nothing about your check-then-act logic.

Certain single operations on built-in types, such as `list.append`, `dict[key] = value`, and `deque.popleft`, happen to be atomic under the GIL, because they complete within one C-level call. Relying on this is folklore rather than contract, and it is exactly the folklore that free-threaded Python is now forcing the community to formalize.

### 8. The `threading` toolkit

The `threading` module provides the standard synchronization vocabulary:

- **`Lock`** (a mutex): the basic mutual exclusion primitive. `acquire()` blocks until the lock is free, and `release()` frees it. Always use it as a context manager (`with lock:`), so exceptions cannot leave it held.
- **`RLock`** (a reentrant lock): may be acquired multiple times by the thread that already holds it, and must be released the same number of times. Useful when a locked method calls another locked method on the same object. It is also sometimes a design smell that indicates tangled responsibilities.
- **`Semaphore`**: a counter that permits up to N simultaneous holders. Used to limit concurrency, for example "at most 10 simultaneous database connections." A `BoundedSemaphore` raises an error if released more times than acquired, which catches bugs.
- **`Event`**: a simple boolean flag that threads can wait on. One thread calls `set()`, and all waiters wake. Good for "start now" or "shut down" signals.
- **`Condition`**: a **condition variable**, a lock paired with the ability to wait until notified. It is the general-purpose primitive from which the others can be built. The golden rule is to always wait inside a loop that rechecks the predicate, or to use `wait_for(predicate)`. Two things make this necessary: **spurious wakeups** can occur, and another thread may have consumed the condition between the notification and your wakeup.
- **`Barrier`**: makes N threads wait until all of them have arrived, then releases them together. Useful for phased algorithms.
- **Thread-local data** (`threading.local()`): gives each thread its own independent copy of a variable, such as a per-thread database connection.

A **daemon thread** is killed abruptly when the main program exits. A non-daemon thread keeps the process alive until it finishes. Daemon threads are convenient for background housekeeping, but dangerous for anything that must flush or clean up, because they get no chance to run `finally` blocks at shutdown. `join()` waits for a thread to finish.

A few more facts round out the picture:

- Python threads cannot be killed from outside. There is no safe `thread.kill()`, by design, since a thread killed while holding a lock would leave the program permanently wedged. Cooperative cancellation, typically through an `Event` the thread checks periodically, is the idiom.
- Signal handlers run only in the main thread.
- If one thread raises an unhandled exception, only that thread dies. `threading.excepthook` lets you observe it, but by default it is printed and otherwise lost. This is a common source of silent failures.

### 9. Communicate, don't share: queues

The deepest practical wisdom in concurrent programming is to minimize shared mutable state. The Go community puts it as: "Do not communicate by sharing memory; instead, share memory by communicating."

`queue.Queue` is a thread-safe FIFO with internal locking. It enables the **producer–consumer pattern**: producers `put()` work items, consumers `get()` them, and neither needs any explicit locks. `LifoQueue` and `PriorityQueue` vary the ordering. `task_done()` and `join()` let a producer wait until every item has been processed.

A **bounded queue** (`maxsize=N`) provides **backpressure**. When consumers fall behind, producers block instead of filling memory without limit. Unbounded queues between stages of different speeds are latent memory leaks, and backpressure is how well-designed systems degrade gracefully instead of falling over. A common shutdown technique is the **sentinel** or **poison pill**: a special value, often `None`, that tells a consumer to exit. Python 3.13 added `Queue.shutdown()` for a cleaner version of this.

### 10. Executors and futures

`concurrent.futures` offers a higher-level abstraction. A **thread pool** (`ThreadPoolExecutor`) maintains a fixed set of **worker threads** and distributes submitted tasks among them. This amortizes thread-creation cost and caps resource usage.

`submit()` returns a **future** (also called a promise in other languages): an object representing a result that does not exist yet. You can call `.result()` to block until it is available, which re-raises any exception the task threw. You can also attach callbacks, or use `as_completed()` to process results in completion order rather than submission order. `executor.map()` is the simple parallel-map.

The executor interface is identical for thread pools and process pools, so switching between them is often a one-line change. That is a quiet but significant design virtue.

## Part IV: Processes in Python

### 11. `multiprocessing`: parallelism by isolation

The classic way around the GIL is to use multiple processes. Each has its own interpreter and its own GIL, so they genuinely execute Python in parallel on separate cores.

The price is isolation. Processes do not share Python objects, so data moving between them must be **serialized**, which in Python means **pickled**, sent across a pipe, and unpickled on the other side. Several consequences follow:

- The function and its arguments must be picklable. This is why lambdas and locally defined functions fail in process pools.
- Large arguments incur real copying cost. Sending a 2 GB array to a worker for a 10 ms computation is a losing trade.
- The ideal workload is **embarrassingly parallel**: large independent chunks of computation with small inputs and outputs.

`multiprocessing` mirrors the threading API: `Process`, `Lock`, `Queue`, `Event`, and so on. It adds process-specific tools: `Pool`, `Pipe`, `Manager` (a server process that hosts shared objects accessed by proxy, which is convenient but slow), `Value` and `Array` (ctypes-backed shared memory), and `multiprocessing.shared_memory`, which gives raw shared buffers that NumPy arrays can view directly with zero copying.

### 12. Start methods: fork, spawn, forkserver

How a child process begins is a surprisingly deep topic.

**fork** is the traditional Unix mechanism. It clones the parent process wholesale, and the child starts with a copy of the parent's entire memory. It is fast, and memory is shared **copy-on-write**: pages are physically copied only when one side modifies them. The copy-on-write benefit is partially defeated in CPython, however, because merely *reading* an object updates its reference count, which writes to its memory page.

The deeper problem is that fork copies only the calling thread. If another thread held a lock at the moment of the fork, that lock is copied in its locked state into a child where no thread will ever release it. This is a classic deadlock, and it occurs in logging, in memory allocators, and in libraries that use background threads. Mixing threads and fork is fundamentally hazardous. Python 3.12 began warning about forking a multithreaded process.

**spawn** starts a fresh interpreter and imports your main module in it. It is slower and uses more memory, but it is clean and safe. This is why scripts using multiprocessing need the `if __name__ == "__main__":` guard: without it, each child re-executes the process-creating code on import. Spawn is the default on Windows and on macOS.

**forkserver** launches a single clean, single-threaded server process early, then forks children from that server rather than from the possibly multithreaded main program. It combines most of the speed of fork with the safety of spawn. As of Python 3.14, it replaced fork as the default on Linux.

## Part V: Asynchronous I/O

### 13. The event loop

Threads handle I/O concurrency by letting the OS juggle blocked threads. The alternative is to use a single thread that never blocks, and instead asks the OS to report which of many I/O operations are ready. The OS mechanisms for this are `select`, `poll`, `epoll` (Linux), `kqueue` (BSD/macOS), and IOCP (Windows).

A program built this way runs an **event loop**. It repeatedly asks the OS "which sockets are ready?", runs the code waiting on those sockets until that code needs to wait again, and repeats. This is the **reactor pattern**: you are notified when I/O is *ready*, then perform it yourself. The **proactor pattern**, used by Windows IOCP, instead asks the OS to *perform* the I/O and notify you when it is *complete*.

The event-loop approach is why nginx and Node.js scale to tens of thousands of connections. Threads cost memory for their stacks and CPU for context switches, and ten thousand OS threads is uncomfortable. Ten thousand pending tasks in an event loop is routine. This is the old **C10K problem**.

### 14. Coroutines, `async` and `await`

Early event-loop programming used **callbacks**, and nested callbacks became unreadable ("callback hell"). Python's solution evolved out of generators:

1. `yield` made functions that suspend and resume.
2. PEP 342 let values be sent *into* generators.
3. PEP 380's `yield from` let generators delegate to sub-generators.
4. PEP 492 (Python 3.5) introduced dedicated `async def` and `await` syntax.

A **coroutine** is a function that can suspend its execution and later resume, preserving its local state. Calling an `async def` function does *not* run it. It returns a coroutine object, which runs only when awaited or scheduled on the loop. Forgetting to await a coroutine is a classic bug, and Python warns "coroutine was never awaited."

`await` is the suspension point. It says: "I'm waiting on this; loop, go run something else, and resume me when it's done." An **awaitable** is anything usable with `await`: coroutines, Tasks, and Futures.

A **Task** wraps a coroutine and schedules it to run concurrently on the loop. `asyncio.create_task()` is how you get "run this in the background" behavior. There is a subtle trap: the event loop holds only *weak* references to tasks. A task you create and do not store may be garbage-collected mid-execution. Keep a reference, or better, use a TaskGroup.

An asyncio **Future** is the low-level awaitable result placeholder that Tasks are built on. It is similar in spirit to, but distinct from, `concurrent.futures.Future`.

### 15. The cooperative contract

Because asyncio is cooperative, **control changes hands only at `await`**. This is a significant gift. Between two awaits, your code runs atomically with respect to other tasks. Many races that plague threaded code simply cannot occur. You still need `asyncio.Lock` when a critical section *spans* an await, for example read, then await a network call, then write.

The flip side is absolute: **never block the event loop.** Any of the following freezes *every* task in the program until it returns:

- `time.sleep(5)`
- a synchronous `requests.get()`
- a large CPU computation
- a slow synchronous database driver

Use `await asyncio.sleep()`, async-native libraries (such as `aiohttp`, `httpx`, and `asyncpg`), and for unavoidable blocking or CPU work, offload with `await asyncio.to_thread(func)` or `loop.run_in_executor()`. That is the standard bridge from async code into thread or process pools. The reverse bridge, submitting work into a running loop from another thread, is `asyncio.run_coroutine_threadsafe()` or `loop.call_soon_threadsafe()`. asyncio's own primitives are *not* thread-safe.

This two-world split is the **function coloring problem** (Bob Nystrom's term). Async functions can call sync functions, but sync functions cannot simply await async ones. "Async-ness" propagates virally up the call stack, and libraries fragment into sync and async variants. It is the primary ergonomic cost of async/await in any language.

Some key tools:

- `asyncio.run()`: the entry point that creates the loop, runs the top-level coroutine, and tears down cleanly.
- `asyncio.gather()`: runs awaitables concurrently and collects their results.
- `asyncio.wait()`: gives finer control, such as "first completed."
- `asyncio.Semaphore`: the standard way to cap concurrency, for example "at most 20 outstanding requests," which is essential for politeness and backpressure.
- `async with` and `async for`: asynchronous context managers and iterators, whose setup, teardown, or iteration steps themselves await.
- `uvloop`: a drop-in, libuv-based event loop that is often substantially faster.

### 16. Cancellation, timeouts, structured concurrency

Cancelling a task (`task.cancel()`) does not kill it instantly. It schedules a `CancelledError` to be raised inside the coroutine at its next await point. The coroutine may run cleanup in `finally` blocks, and it should almost never swallow the error. `asyncio.timeout()` (3.11+) wraps a block with a deadline implemented through cancellation.

Robust cancellation is one of the hardest problems in concurrent design. The industry answer is **structured concurrency**, pioneered in Python by Nathaniel J. Smith's Trio library (whose version is called "nurseries") and adopted into asyncio as `TaskGroup` in Python 3.11.

The principle is that concurrent tasks have lexically scoped lifetimes, the same way variables have lexical scopes:

- A TaskGroup block does not exit until every task it spawned has finished.
- If one child fails, the siblings are cancelled.
- The errors propagate upward together as an `ExceptionGroup`, handled with the `except*` syntax.

Tasks can no longer leak into the background, errors can no longer vanish silently, and the call stack once again tells the truth about what is running. Smith's essay "Notes on structured concurrency, or: Go statement considered harmful" argues that an unstructured `spawn` is to concurrency what `goto` was to control flow. It is worth reading.

### 17. Context variables

`threading.local` breaks under asyncio, because many tasks share a single thread. `contextvars` (PEP 567) provides values that are local to a logical execution context. Each asyncio Task runs in its own copy of the context, so request IDs, locale settings, or tracing spans follow the task correctly across awaits. Modern frameworks rely on this heavily.

## Part VI: Theory and Models

### 18. Models of concurrency

There are two grand paradigms:

- **Shared memory with locks**: threads mutate common state under synchronization. It is powerful and efficient, but correctness is a global property, and every access is a potential bug.
- **Message passing**: isolated entities communicate only by sending messages. Correctness becomes more local and compositional.

Two formal traditions stand out within message passing:

- **Communicating Sequential Processes (CSP)**, from Tony Hoare, 1978. Anonymous processes communicate over channels. It underlies Go's goroutines and channels.
- **The actor model**, from Carl Hewitt, 1973. Addressable actors each own private state and a mailbox, process one message at a time, and may create more actors. It underlies Erlang and Akka, and it is the reason Erlang systems reach legendary uptime through "let it crash" supervision trees.

Python supports both styles informally: queues between threads, pipes between processes, and libraries layered on top.

### 19. Memory models and visibility

At the hardware level, concurrency is stranger than interleaving. CPUs have per-core caches and store buffers, and both compilers and CPUs reorder memory operations for speed. Without synchronization, one thread's write may become visible to another thread late, or in a different order than written.

A **memory model** specifies which reorderings are permitted and which visibility guarantees hold. Its central concept is the **happens-before** relation: if operation A happens-before operation B, B is guaranteed to see A's effects. Synchronization primitives create happens-before edges. A lock release happens-before the next acquisition of the same lock. A **memory barrier** (or fence) is the low-level instruction that enforces this ordering.

Under the GIL, Python programmers were almost entirely insulated from this layer. The GIL's acquire and release acted as a full barrier at every switch. In free-threaded Python, the question of what one thread is guaranteed to observe about another's writes becomes real. The answer is to use proper synchronization, and the interpreter's correctness no longer quietly covers for you.

### 20. Lock-free and wait-free

**Lock-free** algorithms guarantee that the system as a whole always makes progress, even if individual threads are delayed indefinitely. They are built on atomic hardware instructions, chiefly **compare-and-swap (CAS)**: "set X to new *only if* it still equals old; tell me whether it worked." **Wait-free** is stronger: every thread completes in a bounded number of steps.

These algorithms are notoriously difficult. The **ABA problem**, where a value changes from A to B and back to A and fools a CAS, is a famous trap. Python exposes essentially no user-level atomic primitives, but the concept explains how the interpreter and libraries implement their guarantees.

### 21. Laws of speedup

**Amdahl's law**: if a fraction *p* of a program is parallelizable, the maximum speedup with *N* workers is

    1 / ((1 − p) + p/N)

With 95% parallel code, infinite cores give at most a 20× speedup. The serial part dominates. Amdahl's law is the sober reminder that parallelism has hard ceilings.

**Gustafson's law** offers the optimistic counterpoint: in practice, we use more cores to solve *bigger* problems, and the parallel fraction tends to grow with problem size.

Several related terms round out this vocabulary:

- **Throughput** is work completed per unit time.
- **Latency** is the time for one piece of work. Concurrency often improves throughput while leaving latency unchanged, or even slightly worse.
- **Little's law** (L = λW) relates items in the system, arrival rate, and time in system. It is invaluable for sizing pools and queues.
- **Contention** is the slowdown that occurs when many workers fight over the same lock or resource. Past a certain point, adding workers makes things *slower*.

Some other essential terms:

- **Thread-safe**: correct under concurrent use.
- **Reentrant**: safe to re-enter before a previous invocation finishes, as with signal handlers and recursion.
- **Idempotent**: running an operation twice has the same effect as running it once. This is critical for retries in distributed systems.
- **Immutability**: data that cannot change cannot race. Tuples, frozensets, and frozen dataclasses are concurrency's quiet heroes.

## Part VII: The Frontier

### 22. Free-threaded Python (PEP 703)

After decades of attempts, most famously Larry Hastings' "Gilectomy," Sam Gross's `nogil` work produced a viable GIL-free CPython. It shipped as an experimental separate build in Python 3.13 (often invoked as `python3.13t`). Python 3.14 promoted it to an officially supported, though still optional, build.

Removing the GIL without destroying single-threaded performance or correctness required several deep techniques:

- **Biased reference counting**: the thread that owns an object updates its refcount cheaply and non-atomically, while other threads use slower atomic operations. This exploits the empirical fact that most objects are touched by only one thread.
- **Immortal objects** (PEP 683): objects such as `None`, `True`, and small integers have refcounts that never change, eliminating contention on the hottest objects in the language.
- **Deferred reference counting** for certain objects, such as functions and modules, that are accessed frequently from many threads.
- The **mimalloc** allocator, which is thread-friendly and whose design supports safe lock-free reads of dicts and lists.
- **Per-object locks**, called "critical sections" internally, protecting built-in containers, so that operations like `list.append` remain safe.

Several practical implications follow:

- Pure-Python CPU-bound threads can now scale across cores.
- Single-threaded code pays a modest overhead, which was reduced considerably between 3.13 and 3.14.
- C extensions must declare themselves free-thread-compatible. Importing one that has not done so re-enables the GIL at runtime unless it is overridden.
- Races in *your* code that were rare under the GIL become more frequent. The GIL never guaranteed your correctness, but it made many bugs statistically improbable. Free threading removes that statistical cover.

### 23. Subinterpreters

A middle path between threads and processes is to run multiple isolated Python interpreters inside one process. PEP 684 (Python 3.12) gave each subinterpreter its own GIL. PEP 734 (Python 3.14) exposed this through the `concurrent.interpreters` module and an `InterpreterPoolExecutor`.

Each interpreter has separate modules and objects, much like a process, but they share an address space. That means cheaper startup and the possibility of efficient data exchange. It is essentially the actor model realized inside CPython: isolated workers with explicit channels between them. The extension ecosystem's support is still maturing.

## Part VIII: Practice

### 24. Choosing a tool

For **I/O-bound work with modest concurrency**, up to a few hundred operations: threads, typically through `ThreadPoolExecutor`. They are simple, they work with ordinary synchronous libraries, and they are GIL-irrelevant.

For **I/O-bound work at high concurrency**, thousands of connections, or when you need fine control over cancellation and timeouts: `asyncio` (or Trio, or AnyIO for backend portability). This requires async-native libraries throughout.

For **CPU-bound pure-Python work**: processes, through `ProcessPoolExecutor`, and increasingly free-threaded builds or subinterpreters. Before any of those, first ask whether NumPy, a vectorized approach, or a compiled extension would eliminate the problem entirely. A 100× algorithmic or vectorization win beats an 8× parallel win, and the two compose.

For **CPU-bound work in GIL-releasing libraries** such as NumPy or compression codecs: threads may already give real parallelism.

For **mixed workloads**: an asyncio core that offloads blocking or CPU work to executors is the common, robust architecture.

For **scaling beyond one machine**: this is distributed computing, a different discipline with its own tools (Celery, Dask, Ray) and its own hazards, such as partial failure, network partitions, and the absence of a shared clock.

### 25. Principles of sound concurrent design

1. **Minimize shared mutable state.** Prefer immutable data, message passing, and confinement, meaning each object is owned by exactly one thread or task.
2. **Make synchronization coarse and obvious** before making it clever and fine-grained. Correct and slightly slow beats fast and occasionally wrong.
3. **Always pair acquisition with release** using context managers.
4. **Bound everything**: queues, pools, concurrency limits, timeouts. Unbounded resources are latent outages.
5. **Design cancellation and shutdown from the start.** Structured concurrency makes this tractable.
6. **Never let exceptions disappear.** Check futures, use TaskGroups, and install excepthooks.
7. **Measure before and after.** Concurrency adds complexity, and it is only justified by a demonstrated bottleneck.

For debugging, several tools help:

- `faulthandler.dump_traceback_later()` reveals where hung threads are stuck.
- asyncio debug mode (`PYTHONASYNCIODEBUG=1`) flags slow callbacks that block the loop, as well as unawaited coroutines.
- `py-spy` samples running processes without modifying them.
- Stress testing with many iterations, and varying `sys.setswitchinterval`, can coax rare interleavings into appearing.

## Coda

Concurrency is the art of reasoning about orderings you do not control. Every mechanism in this document, whether locks, queues, event loops, futures, task groups, or process isolation, is ultimately a way of constraining the space of possible interleavings until every remaining one is correct.

Python's history here is unusually instructive. It began with a pragmatic global lock that traded parallelism for simplicity. It developed rich workarounds in processes and async I/O. It is now, carefully, taking on true free-threaded parallelism along with the responsibilities that come with it.

The vocabulary above is the shared language of that journey. It is also the language of concurrency everywhere else, from operating system kernels to distributed databases. Learn it here, and it transfers.
