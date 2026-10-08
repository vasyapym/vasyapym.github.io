import type { LessonSection } from "../curriculum";

export const sections: readonly LessonSection[] = [
  {
    heading: null,
    blocks: [
      {"kind":"p","text":"*A rigorous, beginner-accessible lesson in concurrency, latency, memory, and production engineering.*"},
      {"kind":"p","text":"Go is attractive for cloud services because it combines native compilation, lightweight concurrency, garbage collection, and a capable networking library. But these features do not automatically produce fast systems."},
      {"kind":"p","text":"The central distinction is this:"},
      {"kind":"callout","variant":"key","text":"**Go makes concurrency inexpensive to express. Good systems design makes concurrency safe to sustain.**"},
      {"kind":"p","text":"A high-performance service must deliver correct responses predictably—not merely run quickly when the database is warm, traffic is light, and nothing fails."},
    ],
  },
  {
    heading: "1. Define performance before optimizing it",
    blocks: [
      {"kind":"p","text":"“Fast” can mean several different things:"},
      {"kind":"list","items":["**Latency:** how long one request takes.","**Throughput:** how many requests complete per second.","**Goodput:** how many useful, successful requests complete within the required deadline.","**Efficiency:** CPU, memory, network traffic, and money consumed per useful request.","**Resilience:** how well those properties survive bursts and partial failures."]},
      {"kind":"p","text":"These objectives interact. Increasing concurrency may improve throughput initially, then increase contention and queueing until latency becomes unacceptable."},
      {"kind":"p","text":"For example, an illustrative service objective might be:"},
      {"kind":"callout","variant":"key","text":"Sustain 10,000 requests per second, with 99% completing within 100 milliseconds, while staying within defined error and resource budgets."},
      {"kind":"p","text":"That is more meaningful than “maximize requests per second.”"},
    ],
  },
  {
    heading: "Why averages are insufficient",
    blocks: [
      {"kind":"p","text":"A mean latency of 20 milliseconds can coexist with a p99 latency of two seconds. The average describes the center of the distribution; the p99 describes a threshold exceeded by roughly one request in a hundred."},
      {"kind":"p","text":"Users experience individual requests, not averages. Distributed workflows often amplify the slowest requests."},
      {"kind":"p","text":"Also, measure failures and rejections alongside latency. A service that quickly rejects half its traffic may report excellent latency for its remaining successful requests."},
      {"kind":"p","text":"**Performance is a constrained optimization problem, not a single benchmark score.**"},
    ],
  },
  {
    heading: "2. Understand what Go’s concurrency actually provides",
    blocks: [
      {"kind":"p","text":"A **goroutine** is a lightweight concurrent task:"},
      {"kind":"p","text":"Concurrency means multiple tasks can make progress over overlapping periods. **Parallelism** means tasks are actually executing simultaneously."},
      {"kind":"p","text":"A service may have thousands of concurrent requests while only a few execute Go instructions at any instant."},
    ],
    examples: [
      {"title":"Блок 1","code":"go performWork()","explanation":"Пояснение не заполнено."},
    ],
  },
  {
    heading: "The scheduler: G, M, and P",
    blocks: [
      {"kind":"p","text":"Go’s runtime is commonly described using three entities:"},
      {"kind":"list","items":["**G:** a goroutine.","**M:** an operating-system thread.","**P:** a runtime resource needed to execute Go code."]},
      {"kind":"p","text":"`GOMAXPROCS` controls the number of threads that can execute Go code simultaneously. It does **not** limit the number of goroutines, connections, or database operations."},
      {"kind":"p","text":"Many network waits use the runtime’s network poller. A goroutine waiting for socket readiness can be parked without occupying an OS thread for the entire wait. Blocking system calls and cgo calls can behave differently."},
      {"kind":"p","text":"This makes Go particularly effective for services with many requests that alternate between short computations and network waits."},
      {"kind":"p","text":"But lightweight does not mean free. A waiting goroutine can retain:"},
      {"kind":"list","items":["Its stack.","Request and response buffers.","References to application objects.","Timers and context state.","Connections or other scarce resources."]},
      {"kind":"p","text":"The expensive part is often not the goroutine itself, but everything it keeps alive."},
    ],
  },
  {
    heading: "CPU-bound versus I/O-bound work",
    blocks: [
      {"kind":"p","text":"For CPU-bound work, useful parallelism is constrained by available CPU capacity. Creating a thousand runnable goroutines does not manufacture additional cores."},
      {"kind":"p","text":"For I/O-bound work, higher concurrency can hide waiting time—but only until some other resource saturates."},
      {"kind":"p","text":"In containers, verify the effective `GOMAXPROCS` and actual CPU quota behavior of your deployed Go version. A runtime configuration that looks reasonable on a developer workstation may behave differently under CPU throttling."},
    ],
  },
  {
    heading: "3. Queueing theory explains why “more concurrency” eventually fails",
    blocks: [
      {"kind":"p","text":"Suppose a service receives requests faster than it can complete them. The unfinished work must go somewhere:"},
      {"kind":"list","items":["A load-balancer queue.","A socket backlog.","Waiting goroutines.","A buffered channel.","A database connection-pool queue."]},
      {"kind":"p","text":"A queue does not create capacity. It postpones the consequences of insufficient capacity."},
    ],
  },
  {
    heading: "Little’s law",
    blocks: [
      {"kind":"p","text":"For a stable system, with measurements taken across the same boundary:"},
      {"kind":"p","text":"\\[ L = \\lambda W \\]"},
      {"kind":"p","text":"where:"},
      {"kind":"list","items":["\\(L\\) is the average number of requests in the system.","\\(\\lambda\\) is the average throughput.","\\(W\\) is the average time each request spends in the system."]},
      {"kind":"p","text":"At 10,000 requests per second and a mean residence time of 40 milliseconds:"},
      {"kind":"p","text":"\\[ L = 10{,}000 \\times 0.040 = 400 \\]"},
      {"kind":"p","text":"Now suppose a dependency slows down and mean residence time rises to 400 milliseconds:"},
      {"kind":"p","text":"\\[ L = 10{,}000 \\times 0.400 = 4{,}000 \\]"},
      {"kind":"p","text":"Maintaining the same throughput now requires ten times as much in-flight work."},
      {"kind":"p","text":"If each request retains 64 KiB, that represents approximately 25 MiB versus 250 MiB of retained request state—before counting the rest of the process."},
    ],
  },
  {
    heading: "Why variance matters",
    blocks: [
      {"kind":"p","text":"A deeper result comes from the idealized M/G/1 queue: Poisson arrivals, one first-come-first-served server, independent service times, and utilization below one."},
      {"kind":"p","text":"Its expected queueing delay is:"},
      {"kind":"p","text":"\\[ \\mathbb{E}[W_q] = \\frac{\\lambda \\mathbb{E}[S^2]} {2(1-\\rho)} \\]"},
      {"kind":"p","text":"where \\(S\\) is service time and:"},
      {"kind":"p","text":"\\[ \\rho = \\lambda \\mathbb{E}[S] \\]"},
      {"kind":"p","text":"The important engineering consequences are:"},
      {"kind":"list","ordered":true,"items":["**Waiting grows sharply as utilization approaches saturation.**","**Service-time variability matters**, because:"]},
      {"kind":"p","text":"\\[ \\mathbb{E}[S^2] = \\operatorname{Var}(S)+\\mathbb{E}[S]^2 \\]"},
      {"kind":"p","text":"A system with occasional very slow operations can queue much more severely than one with the same mean service time but less variability."},
      {"kind":"p","text":"This model does not directly predict a multicore Go server’s p99. It explains why operating every resource near 100% utilization is usually incompatible with predictable latency."},
      {"kind":"p","text":"**Concurrency limits should be selected through load testing around the saturation point—not by maximizing the goroutine count.**"},
    ],
  },
  {
    heading: "4. Make overload explicit with admission control",
    blocks: [
      {"kind":"p","text":"A service should decide how much work it can safely admit."},
      {"kind":"p","text":"Here is a small standard-library middleware that limits concurrent handler executions and attaches a request budget:"},
      {"kind":"p","text":"The buffered channel acts as a semaphore. Each admitted request occupies one slot until its handler returns."},
      {"kind":"p","text":"The `default` branch is important: when capacity is exhausted, the middleware rejects work rather than creating another waiting queue."},
    ],
    examples: [
      {"title":"Блок 2","code":"package service\n\nimport (\n\t\"context\"\n\t\"net/http\"\n\t\"time\"\n)\n\nfunc Admit(\n\tmaxInFlight int,\n\tbudget time.Duration,\n\tnext http.Handler,\n) http.Handler {\n\tif maxInFlight <= 0 || budget <= 0 {\n\t\tpanic(\"invalid admission configuration\")\n\t}\n\n\tslots := make(chan struct{}, maxInFlight)\n\n\treturn http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {\n\t\tselect {\n\t\tcase slots <- struct{}{}:\n\t\t\tdefer func() { <-slots }()\n\t\tdefault:\n\t\t\thttp.Error(\n\t\t\t\tw,\n\t\t\t\t\"temporarily overloaded\",\n\t\t\t\thttp.StatusServiceUnavailable,\n\t\t\t)\n\t\t\treturn\n\t\t}\n\n\t\tctx, cancel := context.WithTimeout(r.Context(), budget)\n\t\tdefer cancel()\n\n\t\tnext.ServeHTTP(w, r.WithContext(ctx))\n\t})\n}","explanation":"Пояснение не заполнено."},
    ],
  },
  {
    heading: "What this code does—and does not—guarantee",
    blocks: [
      {"kind":"p","text":"It bounds concurrent calls to `next`. It does not bound:"},
      {"kind":"list","items":["Open connections.","Work performed before this middleware.","Request-body sizes.","Fan-out created inside a handler.","Background jobs."]},
      {"kind":"p","text":"The context deadline is also **cooperative**. It does not forcibly terminate the handler or automatically write a timeout response. Downstream operations must observe cancellation."},
      {"kind":"p","text":"Notice that the slot remains occupied until the handler actually returns, even if its deadline expires. That is intentional: expired work that continues running still consumes capacity."},
      {"kind":"p","text":"Use `503` for general service overload. Tenant-specific quotas or rate policies often call for `429`. Either way, rejection must be included in availability accounting; load shedding protects the system but does not make failed requests disappear."},
    ],
  },
  {
    heading: "5. Give concurrency ownership, synchronization, and a lifetime",
    blocks: [
      {"kind":"p","text":"Go does not automatically impose structured concurrency. A bare `go` statement can launch work that outlives its caller."},
      {"kind":"p","text":"Every goroutine should therefore have answers to three questions:"},
      {"kind":"list","ordered":true,"items":["**Who owns it?**","**What causes it to stop?**","**Who waits for its completion?**"]},
      {"kind":"p","text":"For request-scoped work, derive cancellation from `r.Context()`, propagate it downstream, and join child tasks before returning when their results or cleanup belong to that request."},
      {"kind":"p","text":"`golang.org/x/sync/errgroup` is useful for coordinating related tasks, errors, and cancellation. But cancellation remains cooperative, and a per-request concurrency limit is not a service-wide limit."},
      {"kind":"p","text":"If work must survive the request, give it an explicit background lifecycle or transfer it to a durable job system. An abandoned goroutine is not a reliable queue."},
    ],
  },
  {
    heading: "Channels do not magically transfer ownership",
    blocks: [
      {"kind":"p","text":"Sending a slice through a channel copies the slice descriptor, not its underlying storage."},
      {"kind":"p","text":"If one goroutine sends a `[]byte` and then modifies the backing array while another reads it, synchronization of the send does not make those later mutations safe."},
      {"kind":"p","text":"Choose a clear ownership rule:"},
      {"kind":"list","items":["Transfer ownership and stop modifying the object.","Copy the data.","Protect shared access with synchronization.","Publish an immutable value."]},
      {"kind":"p","text":"Go’s memory model gives data-race-free programs sequentially consistent behavior. But that guarantee depends on using synchronization correctly."},
      {"kind":"p","text":"A practical default is:"},
      {"kind":"list","items":["Use a mutex to protect shared state and invariants.","Use channels to communicate events or transfer ownership.","Use atomics for simple, well-understood synchronization—not as a universal replacement for locks."]},
    ],
  },
  {
    heading: "Fan-out amplifies tail latency",
    blocks: [
      {"kind":"p","text":"Suppose a request launches \\(n\\) independent downstream calls simultaneously and must wait for all of them. If each call’s latency has cumulative distribution \\(F(t)\\), then the fan-out completion time satisfies:"},
      {"kind":"p","text":"\\[ P(T_{\\max} \\le t) = F(t)^n \\]"},
      {"kind":"p","text":"At the individual calls’ p99 threshold, \\(F(t)=0.99\\). With 100 calls:"},
      {"kind":"p","text":"\\[ 0.99^{100} \\approx 0.366 \\]"},
      {"kind":"p","text":"Only about 36.6% of those fan-outs finish within the individual-call p99 threshold."},
      {"kind":"p","text":"Real dependencies are not necessarily independent or identically distributed, so this is an illustrative model—not a production prediction. The lesson remains:"},
      {"kind":"callout","variant":"key","text":"Parallel fan-out can shorten the typical critical path while making the overall request highly sensitive to stragglers."},
      {"kind":"p","text":"Bound fan-out, distinguish required results from optional enrichment, and budget for the slowest required branch."},
    ],
  },
  {
    heading: "6. Treat downstream resources as shared capacity",
    blocks: [
      {"kind":"p","text":"A service is rarely faster than its most constrained dependency."},
    ],
  },
  {
    heading: "Reuse HTTP clients and transports",
    blocks: [
      {"kind":"p","text":"`http.Client` and `http.Transport` are designed for concurrent reuse. Creating fresh transports per request defeats connection pooling and can increase DNS, TCP, and TLS work."},
      {"kind":"p","text":"For outbound HTTP:"},
      {"kind":"list","items":["Attach the request context.","Configure appropriate connection and timeout policies.","Bound response sizes when practical.","Always close response bodies.","For HTTP/1.x connection reuse, normally consume the body to EOF when appropriate and bounded."]},
      {"kind":"p","text":"Do not read an arbitrarily large or endless body merely to preserve one reusable connection."},
      {"kind":"p","text":"Also distinguish timeout scopes. Dialing, TLS negotiation, waiting for response headers, and reading a response body are different phases."},
    ],
  },
  {
    heading: "Treat `sql.DB` as a pool",
    blocks: [
      {"kind":"p","text":"A `*sql.DB` is a concurrent connection pool, not one database connection. Create it as a long-lived service resource."},
      {"kind":"p","text":"Its limits matter:"},
      {"kind":"list","items":["`SetMaxOpenConns` bounds open connections.","`SetMaxIdleConns` controls retained idle connections.","Connection lifetime settings affect recycling."]},
      {"kind":"p","text":"A pool limit also creates a waiting point. Observe pool wait counts and durations, and pass contexts to database operations."},
      {"kind":"p","text":"Plan at fleet scale: 100 replicas with a maximum of 50 connections each can demand 5,000 connections. Adding pods can overload a shared database rather than increase useful throughput."},
    ],
  },
  {
    heading: "Deadlines are budgets, not decorations",
    blocks: [
      {"kind":"p","text":"An end-to-end deadline must cover local work, queueing, downstream calls, and response transmission."},
      {"kind":"p","text":"Giving each sequential dependency the entire original budget does not make those budgets fit together. Child operations should inherit the parent deadline and, where useful, receive a tighter local limit."},
      {"kind":"p","text":"A timeout means the caller stopped waiting. It does **not** prove that a remote operation never happened."},
      {"kind":"p","text":"For side-effecting operations, safe retries may require an idempotency key enforced atomically at the point of the side effect."},
    ],
  },
  {
    heading: "Retries can multiply overload",
    blocks: [
      {"kind":"p","text":"If three layers each permit three total attempts, one request can generate up to:"},
      {"kind":"p","text":"\\[ 3^3 = 27 \\]"},
      {"kind":"p","text":"attempts at the deepest dependency."},
      {"kind":"p","text":"Use retries only when the operation and failure mode justify them. Bound attempts and total retry time, add backoff and jitter, and consider a retry budget across the service."},
      {"kind":"p","text":"Retries consume capacity. During overload, they can become the mechanism that prevents recovery."},
    ],
  },
  {
    heading: "7. Understand memory as both retained state and allocation flow",
    blocks: [
      {"kind":"p","text":"Go’s garbage collector removes much manual memory-management complexity. It does not remove memory economics."},
      {"kind":"p","text":"Two quantities matter:"},
      {"kind":"list","ordered":true,"items":["**Live memory:** objects still reachable and therefore not collectible.","**Allocation rate:** how quickly new objects are created."]},
      {"kind":"p","text":"For a workload allocating \\(b\\) bytes per request at throughput \\(\\lambda\\):"},
      {"kind":"p","text":"\\[ A = \\lambda b \\]"},
      {"kind":"p","text":"where \\(A\\) is allocation rate in bytes per second."},
      {"kind":"p","text":"A modest per-request allocation cost can become substantial at high throughput."},
    ],
  },
  {
    heading: "Garbage collection costs more than pauses",
    blocks: [
      {"kind":"p","text":"Go performs much GC work concurrently with application execution. Nevertheless, collection consumes CPU, scans reachable structures, and can require application goroutines to assist with collection work."},
      {"kind":"p","text":"Relevant controls include:"},
      {"kind":"list","items":["**`GOGC`:** trades allowed heap growth against collection frequency.","**`GOMEMLIMIT`:** provides a soft limit for runtime-managed memory."]},
      {"kind":"p","text":"`GOMEMLIMIT` is not a hard cap on process RSS. Leave room for memory outside the Go runtime’s accounting and for operational variability."},
      {"kind":"p","text":"If the live set itself approaches the memory budget, more aggressive collection cannot free reachable objects. The remedy is reducing retained state or adding capacity—not merely changing a GC setting."},
    ],
  },
  {
    heading: "Common retention and allocation problems",
    blocks: [
      {"kind":"p","text":"**Small slices retaining large arrays.** A tiny subslice can keep an entire large backing array alive."},
      {"kind":"p","text":"**Unbounded caches.** A cache without an eviction policy and memory budget is potentially an application-level memory leak."},
      {"kind":"p","text":"**Unfinished work retaining request data.** Goroutine leaks often become heap-retention problems."},
      {"kind":"p","text":"**Repeated serialization and formatting.** JSON transformations, temporary strings, and logging can dominate allocation at scale."},
      {"kind":"p","text":"**Pointer-rich data structures.** They may increase both GC scanning and cache misses. More contiguous representations can help, depending on the workload."},
      {"kind":"p","text":"Do not assume that every pointer causes a heap allocation. Placement depends on compiler escape analysis and optimization."},
      {"kind":"p","text":"Similarly, do not apply `sync.Pool` reflexively. It is a best-effort reuse mechanism whose contents may disappear at any time—not a durable cache or a strict memory bound."},
      {"kind":"p","text":"Profile before pooling."},
    ],
  },
  {
    heading: "8. Optimize with evidence, not language folklore",
    blocks: [
      {"kind":"p","text":"A disciplined optimization loop is:"},
      {"kind":"list","ordered":true,"items":["Define the workload and objective.","Establish a reproducible baseline.","Identify the dominant constraint.","Change one relevant mechanism.","Measure the result and check correctness.","Repeat."]},
      {"kind":"p","text":"Useful starting commands include:"},
      {"kind":"p","text":"The race detector finds races exercised during testing; a clean run is not proof that all executions are race-free."},
      {"kind":"p","text":"Microbenchmarks answer narrow questions. They do not reproduce distributed contention, connection pools, CPU quotas, or failure behavior."},
    ],
    examples: [
      {"title":"Блок 3","code":"go test -race ./...\n\ngo test -run='^$' -bench=. -benchmem -count=5 ./...","explanation":"Пояснение не заполнено."},
    ],
  },
  {
    heading: "Choose the right diagnostic tool",
    blocks: [
      {"kind":"list","items":["**CPU profiles:** where execution time is spent.","**Heap and allocation profiles:** retained memory versus allocation churn.","**Goroutine profiles:** where work accumulates.","**Mutex and block profiles:** synchronization contention and waiting.","**Execution traces:** scheduling, blocking, GC activity, and concurrency interactions.","**Distributed traces:** request paths and downstream timing."]},
      {"kind":"p","text":"CPU profiles do not explain time spent waiting for a database. A function can dominate wall-clock latency while barely appearing in a CPU profile."},
      {"kind":"p","text":"Protect profiling endpoints; they expose operational information and should not be casually published on an internet-facing listener."},
    ],
  },
  {
    heading: "Load-generation models matter",
    blocks: [
      {"kind":"p","text":"A fixed-concurrency test automatically sends fewer requests when responses slow down. That may accurately model a closed population of users, but it can hide overload under an independent arrival stream."},
      {"kind":"p","text":"Use a workload model that matches reality. For arrival-driven traffic, open-loop rate tests are valuable. Ensure the generator is not saturated, and watch for coordinated omission: latency measurements that omit delays because the test stopped issuing work while the system was slow."},
      {"kind":"p","text":"Track:"},
      {"kind":"list","items":["Offered, admitted, completed, and rejected request rates.","Latency distributions.","Timeouts and other errors.","In-flight work and queue wait.","CPU throttling and memory.","Dependency and connection-pool saturation."]},
      {"kind":"p","text":"Do not average p99 values across replicas. Aggregate compatible histograms or underlying samples, then calculate the percentile."},
    ],
  },
  {
    heading: "Optimize the largest term first",
    blocks: [
      {"kind":"p","text":"Common high-value changes include reducing database round trips, improving query shape, eliminating redundant serialization, controlling hot-lock contention, and caching safely reusable results."},
      {"kind":"p","text":"A faster string conversion cannot compensate for an unnecessary network round trip."},
      {"kind":"p","text":"After structural problems are resolved, compiler-level techniques such as profile-guided optimization may provide additional gains."},
    ],
  },
  {
    heading: "9. Design for the cloud’s actual resource boundaries",
    blocks: [
      {"kind":"p","text":"Containers do not erase physical constraints; they introduce additional scheduling and accounting boundaries."},
    ],
  },
  {
    heading: "CPU limits affect tails",
    blocks: [
      {"kind":"p","text":"A service can experience CPU throttling even when the host has spare capacity. Examine quota-related throttling alongside process CPU usage."},
    ],
  },
  {
    heading: "Autoscaling is slower than overload",
    blocks: [
      {"kind":"p","text":"Autoscaling often reacts on a much longer timescale than a traffic burst. Admission control protects the service while capacity catches up."},
      {"kind":"p","text":"CPU-only scaling can also miss an I/O bottleneck. A service waiting on an exhausted database pool may have low CPU usage and poor latency."},
    ],
  },
  {
    heading: "Bound more than handler concurrency",
    blocks: [
      {"kind":"p","text":"A production service also needs policies for:"},
      {"kind":"list","items":["Header and body sizes.","Header-read and idle timeouts.","Request and dependency deadlines.","Background queues.","Connection pools.","Cache size.","Per-tenant fairness.","Long-lived streams."]},
      {"kind":"p","text":"Streaming endpoints often need different budgets from ordinary request–response APIs."},
    ],
  },
  {
    heading: "Shutdown is part of correctness",
    blocks: [
      {"kind":"p","text":"A disciplined shutdown typically involves:"},
      {"kind":"list","ordered":true,"items":["Withdrawing readiness.","Allowing routing changes to propagate where required.","Stopping admission of new work.","Draining in-flight work within a grace budget.","Stopping and joining background tasks.","Closing shared resources."]},
      {"kind":"p","text":"`http.Server.Shutdown` supports HTTP draining, but it does not automatically manage every background goroutine or upgraded connection. Its deadline expiring does not forcibly terminate arbitrary handler work."},
      {"kind":"p","text":"Shutdown requires the same ownership discipline as normal request execution."},
    ],
  },
  {
    heading: "10. A practical experiment that connects the concepts",
    blocks: [
      {"kind":"p","text":"Build a small HTTP service with a cancellation-aware simulated dependency."},
      {"kind":"p","text":"Then test four conditions:"},
      {"kind":"list","ordered":true,"items":["Normal dependency latency.","Ten times the normal dependency latency.","A brief arrival burst above sustainable throughput.","Intermittent dependency failures."]},
      {"kind":"p","text":"Compare an unbounded implementation with one using admission control, propagated deadlines, and bounded dependency concurrency."},
      {"kind":"p","text":"Observe:"},
      {"kind":"list","items":["Goodput.","p50, p95, and p99 latency.","Rejections and timeouts.","In-flight requests and goroutines.","Live heap and allocation rate.","CPU and GC activity."]},
      {"kind":"p","text":"The objective is not necessarily to eliminate rejection. It is to prevent this feedback loop:"},
      {"kind":"p","text":"\\[ \\text{slower dependency} \\rightarrow \\text{more in-flight work} \\rightarrow \\text{more retained memory and contention} \\rightarrow \\text{slower service} \\]"},
      {"kind":"p","text":"That experiment reveals more about cloud-service performance than many isolated syntax benchmarks."},
    ],
  },
  {
    heading: "The essential mental model",
    blocks: [
      {"kind":"p","text":"A robust Go service combines:"},
      {"kind":"list","items":["**Goroutines** to express concurrent work.","**Ownership and synchronization** to preserve correctness.","**Contexts** to communicate bounded lifetimes.","**Admission limits and bulkheads** to protect finite capacity.","**Pools and caches** to reuse expensive resources under explicit budgets.","**Profiles, traces, and realistic load tests** to identify what actually matters."]},
      {"kind":"p","text":"**Use concurrency to overlap waiting—not to conceal insufficient capacity.**"},
      {"kind":"p","text":"For deeper study: [The Go Memory Model](https://go.dev/ref/mem), [A Guide to the Go Garbage Collector](https://go.dev/doc/gc-guide), and [Go Diagnostics](https://go.dev/doc/diagnostics)."},
    ],
  },
];;
