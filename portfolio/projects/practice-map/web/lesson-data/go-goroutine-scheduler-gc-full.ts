import type { LessonSection } from "../curriculum";

export const sections: readonly LessonSection[] = [
  {
    heading: "Why Go Exists at All",
    blocks: [
      {"kind":"p","text":"To understand Go's role in cloud infrastructure, start with the problem it was designed to solve. In the mid-2000s, Google's engineers were writing massive networked services in C++ and Java — languages where concurrency was bolted on through operating-system threads, each costing megabytes of stack memory and expensive kernel-mediated context switches. A server handling 100,000 simultaneous connections couldn't afford 100,000 OS threads. The alternatives — callback-based event loops, as in Node.js or classic C epoll code — preserved performance but shattered program logic into fragments, a style researchers call \"stack ripping.\""},
      {"kind":"p","text":"Go's foundational bet was this: **concurrency should be cheap enough that you never have to contort your code around its cost.** Everything else about the language flows from that decision."},
    ],
  },
  {
    heading: "Goroutines: Concurrency as a Nearly Free Resource",
    blocks: [
      {"kind":"p","text":"A goroutine is a function executing concurrently, launched with the keyword `go`. What makes it remarkable is its economics. A goroutine starts with a stack of roughly 2–8 KB — not the 1–8 MB of an OS thread — and that stack grows and shrinks dynamically as needed. The runtime multiplexes many thousands of goroutines onto a small number of OS threads using an **M:N scheduler**."},
      {"kind":"p","text":"The scheduler's design, usually described as the **G-M-P model**, is worth understanding even at a beginner level because it explains Go's performance characteristics:"},
      {"kind":"list","items":["**G** — a goroutine (the unit of work)","**M** — a machine, i.e., an OS thread","**P** — a processor, a logical execution context, typically one per CPU core (`GOMAXPROCS`)"]},
      {"kind":"p","text":"Each P maintains a local run queue of goroutines. When a P exhausts its queue, it **steals work** from other Ps — a decentralized load-balancing strategy that avoids a single contended global lock. When a goroutine blocks on a system call, the runtime detaches the M from its P, hands the P to another thread, and keeps the CPU busy. Blocking I/O in your code does not block the machine."},
      {"kind":"p","text":"The practical consequence: in Go, you write straight-line, blocking-style code — *read request, query database, write response* — and the runtime transparently converts it into efficient event-driven execution underneath, via an integrated netpoller built on `epoll`/`kqueue`/IOCP. You get Node.js-class I/O scalability with none of the callback contortion. This is arguably Go's single greatest contribution to cloud engineering: it made the *easy* way to write a server also the *fast* way."},
    ],
  },
  {
    heading: "Channels and the Memory Model",
    blocks: [
      {"kind":"p","text":"Go's second famous slogan: *\"Don't communicate by sharing memory; share memory by communicating.\"* Channels are typed conduits between goroutines, and they serve double duty as both data transport and synchronization primitive. A send on an unbuffered channel doesn't complete until a receiver is ready — a rendezvous that establishes a **happens-before** edge in Go's formally specified memory model."},
      {"kind":"p","text":"Honesty demands nuance here, especially for professionals: channels are not always the right tool, and idiomatic high-performance Go uses them selectively. A channel operation involves a mutex and potentially a scheduler interaction; for a hot counter or a shared cache, `sync.Mutex`, `sync.RWMutex`, or `sync/atomic` are faster and often clearer. The mature guidance is:"},
      {"kind":"list","items":["**Channels** for ownership transfer, pipelines, fan-out/fan-in, and signaling (especially `select` over multiple event sources, timeouts, cancellation).","**Mutexes** for protecting shared state.","**Atomics** for lock-free counters and flags, when you can prove correctness."]},
      {"kind":"p","text":"The `context.Context` package deserves special mention — it's Go's idiom for request-scoped cancellation and deadlines, threaded explicitly through call chains. In a microservice handling a request that fans out to five downstream services, cancelling the context when the client disconnects propagates cancellation through the entire call tree. This explicitness is uncomfortable at first and invaluable in production."},
    ],
  },
  {
    heading: "The Garbage Collector: Engineering for Latency, Not Throughput",
    blocks: [
      {"kind":"p","text":"Here is where Go made a genuinely contrarian design choice. Most GC research historically optimized throughput — total work done per unit time. Go's team optimized for **pause time**, because a cloud service's tail latency (p99, p999) is what users and SLOs actually feel."},
      {"kind":"p","text":"Go's collector is a **concurrent, tri-color, mark-and-sweep** GC with write barriers. Since Go 1.8, stop-the-world pauses are typically **under a millisecond**, often tens of microseconds, independent of heap size. The trade-offs are real: Go sacrifices compaction (so it relies on a size-segregated allocator, derived from tcmalloc, to fight fragmentation) and it spends more total CPU on GC than a generational throughput-oriented collector would. The GC is tuned via `GOGC` (heap growth target) and, since Go 1.19, `GOMEMLIMIT` — a soft memory ceiling that is enormously useful in containerized deployments where exceeding a cgroup limit means an OOM kill rather than graceful degradation."},
      {"kind":"p","text":"For the performance-minded: the real discipline in high-performance Go is **allocation avoidance**. Escape analysis (`go build -gcflags='-m'`) tells you which values escape to the heap. Techniques like `sync.Pool` for object reuse, preallocated slices, and avoiding incidental allocations in hot paths (interface boxing, string/byte conversions, closures capturing variables) routinely yield order-of-magnitude improvements. Go gives you unusual *mechanical sympathy* for a garbage-collected language: structs are true value types with controllable layout, arrays are contiguous, and you can reason about cache behavior in ways that are nearly impossible in Java or Python."},
    ],
  },
  {
    heading: "The Deployment Story: Static Binaries and the Container Era",
    blocks: [
      {"kind":"p","text":"Go's rise is inseparable from the rise of containers — not coincidentally, **Docker and Kubernetes are themselves written in Go**. A Go program compiles to a single, statically linked native binary. No JVM to install, no `node_modules`, no Python virtualenv. A production container image can be `FROM scratch` plus one binary — a few megabytes, with a vanishingly small attack surface and sub-second cold starts."},
      {"kind":"p","text":"Cross-compilation is trivially built in (`GOOS=linux GOARCH=arm64 go build`), which matters enormously now that cloud fleets mix x86 and ARM (Graviton). Compile times are fast enough that the edit-build-test loop feels interpreted. These are not glamorous features, but at organizational scale they compound: CI pipelines are fast, deploys are simple artifacts, and operational surface area shrinks."},
    ],
  },
  {
    heading: "The Observability Toolchain",
    blocks: [
      {"kind":"p","text":"Production performance work in Go is unusually pleasant because introspection is built into the standard distribution:"},
      {"kind":"list","items":["**pprof** — CPU, heap, goroutine, mutex-contention, and blocking profiles, exposable over HTTP in a live service via `net/http/pprof`, visualized as flame graphs. Continuous profiling in production is standard practice.","**execution tracer** (`go tool trace`) — microsecond-resolution visibility into scheduler behavior, GC phases, and goroutine lifecycles.","**race detector** (`go test -race`) — a dynamic analysis based on the ThreadSanitizer algorithm that catches data races with vanishingly few false positives. Running your test suite under it should be non-negotiable.","**benchmarking** — `testing.B` with `benchstat` for statistically sound comparisons."]},
    ],
  },
  {
    heading: "An Honest Accounting of Trade-offs",
    blocks: [
      {"kind":"p","text":"A PhD-level treatment owes you the costs, not just the virtues:"},
      {"kind":"list","ordered":true,"items":["**The GC ceiling.** For workloads demanding absolute lowest latency with enormous heaps — HFT, some databases — teams have hit GC limits. (Though Go-written systems like CockroachDB, etcd, and Prometheus demonstrate the ceiling is quite high.)","**Expressiveness by design.** Go deliberately omits features — until 1.18 it lacked generics, and the current implementation (via GC Shape stenciling, a hybrid of monomorphization and dictionary passing) is more conservative than Rust's or C++'s. Error handling via explicit `if err != nil` returns is verbose; this is a considered trade for legibility, but it is a real tax.","**No ownership model.** Unlike Rust, Go cannot statically prove the absence of data races; it relies on convention, code review, and the race detector.","**Goroutine leaks** are the characteristic Go production bug: a goroutine blocked forever on a channel nobody will ever close, accumulating by the thousands. Structured-concurrency patterns (`errgroup`, context discipline) mitigate this."]},
    ],
  },
  {
    heading: "The Synthesis",
    blocks: [
      {"kind":"p","text":"Go's position in the cloud ecosystem is best understood not as \"the fastest language\" — Rust and C++ beat it on raw compute — but as the language occupying a deliberate optimum: **~90% of the performance of systems languages with ~20% of the cognitive and operational overhead**, plus a concurrency model purpose-built for the I/O-bound, massively-parallel, container-deployed workloads that define cloud services. That is why the control plane of the modern cloud — Kubernetes, Docker, etcd, Terraform, Prometheus, Vault, Istio, CoreDNS, Caddy, Traefik — is written in it."},
      {"kind":"p","text":"The lesson to internalize: Go's performance story is less about any single mechanism and more about **alignment** — a scheduler, a GC, a compiler, a deployment model, and a profiling toolchain all tuned for the same target. When your workload *is* that target, few tools serve you better."},
    ],
    examples: [
      {"title":"Блок 1","code":"lesson.status() // => Completed. Suggested next: pprof a real service,\n                //    read \"The Go Memory Model\", break something with -race.","explanation":"Пояснение не заполнено."},
    ],
  },
];;
