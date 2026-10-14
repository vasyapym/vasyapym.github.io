<!--
lesson-meta: {"practicePrompt":"Implement the essay's ProcessStripeWebhook: ShouldBeUniqueUntilProcessing keyed by the provider event id, the event id stored under a unique index before processing, an explicit backoff array, and afterCommit dispatch — then run the handler twice in a test and prove the second pass is a no-op. Next, sketch the queue keys in redis-cli (LLEN, ZCARD, ZRANGE WITHSCORES) and read one dashboard incident aloud, deciding whether it is a backlog, a saturated downstream, a retry storm, or a poison job.","checkPrompt":"Without notes, recite the five timing numbers (delay, retry_after, timeout, tries, backoff or retryUntil) and the burned-in rule that retry_after must exceed the longest timeout on the connection. Explain the difference between unique (a dispatch-time cache lock), WithoutOverlapping (execution-time serialization) and RateLimited (downstream protection), and say what happens at deploy: horizon:terminate, running jobs finishing on old code, and payloads stranded by renamed job classes."}
-->
<!-- lesson-theory: {"problem":"Treating queues as run-it-later produces incidents you cannot even name: duplicate concurrent executions from a mis-sized retry_after, webhooks redelivered into double charges, poison jobs cycling workers one by one, deploys stranding old serialized payloads. Without the production model you cannot tell which of the five meanings of it-errored actually happened.","model":"One sentence: Redis is the broker and timer system, queue workers are competing single-threaded PHP executors, a job is a serialized message with at-least-once delivery semantics, and Horizon is the supervisor and telemetry layer that manages those workers. Every design decision and production incident gets clearer once those four roles stay separate; the precise vocabulary — connection versus queue, reserved versus released versus failed, Horizon supervisor versus the OS supervisor — is the debugging instrument.","mechanics":"Redis structures per queue: a ready list (LPUSH, RPOP, FIFO within the queue), delayed and reserved sorted sets scored by availability and reservation expiry, an attempts hash, a notify list for blocking pops — with expired items migrated lazily by the next worker poll and Lua making pop-plus-reserve atomic under competition; this is not Redis Streams. The timing contract: delay, retry_after as the visibility timeout, timeout enforced by PCNTL as a PHP-level alarm rather than an OS kill, tries against retryUntil against maxExceptions — and the burned-in rule that retry_after must exceed the longest timeout, with genuinely long work segregated onto its own queue and connection. At-least-once handling: check state before acting, lean on database unique constraints as the final authority, wrap local multi-writes in transactions, pass idempotency keys to external systems like Stripe, store webhook event ids under unique indexes first, and escalate to a transactional outbox when a database write and an external effect must co-survive. Dispatch hygiene: afterCommit against the pre-commit race, constructors that survive PHP serialize — ids, enums, DTO-like values — and never a Request, session, user or closure, since workers have no HTTP context. Composition: ShouldBeUnique locks the dispatch and needs uniqueFor with a Redis-backed cache store, WithoutOverlapping serializes execution per explicit key, RateLimited and ThrottlesExceptions live in middleware(); chains are ordered pipelines, not transactions; batches track fan-out in the job_batches table with cooperative cancellation; chunk size is the real negotiation. Production: Horizon environments and balance arithmetic (Little's law for worker counts), queues separated by runtime and criticality profile, a dedicated queue Redis with noeviction and persistence, horizon:terminate deploys treating job class changes like schema migrations, tenant fairness built from topology, a failure playbook distinguishing backlog, saturated downstream, retry storm and poison job — plus Queue::fake() honesty and the QUEUE_CONNECTION=sync trap.","pitfalls":["Setting retry_after under the longest timeout, duplicating still-running work.","Conflating unique, WithoutOverlapping and RateLimited — three different tools at three different points.","Leaving a uniqueness lock in the array cache driver in production.","Writing handlers that are not safe to run twice under at-least-once delivery.","Dispatching inside a transaction without afterCommit and racing the commit.","Expecting FIFO completion order once more than one worker exists.","Trusting the queue timeout alone instead of also timing HTTP clients and DB statements.","Deploying without horizon:terminate or renaming job classes while payloads sit in flight.","Scaling worker counts while the database or a rate-limited API is the constraint.","Developing only with QUEUE_CONNECTION=sync, an environment that hides nearly every queue bug."],"whenNot":"This is a production mental model for Redis queues in Laravel, not a Horizon UI tutorial and not a general message-broker theory course; SQS visibility semantics and the database driver appear only as contrasts. It never claims exactly-once anywhere — it states the opposite — and it deliberately leaves the Redis-versus-SQS-versus-database choice open as a question of throughput, durability and ordering requirements."} -->

# Laravel Horizon + Redis Queues: The Production Mental Model

The one-sentence model experienced Laravel developers carry is this: **Redis is the broker and timer system, queue workers are competing single-threaded PHP executors, a job is a serialized message with at-least-once delivery semantics, and Horizon is the supervisor and telemetry layer that manages those workers.** Almost every design decision and production incident in this stack becomes clearer once you keep those four roles separate.

A typical flow looks like this:

```text
HTTP request / console command / scheduler
        |
        | dispatch()
        v
Redis: pending list + delayed set + reserved set
        |
        | atomic pop + reserve
        v
Worker process -> unserialize job -> middleware -> handle()
        |
        +-> success: delete reservation ("ack")
        +-> exception: release with backoff, or fail permanently
        +-> crash/timeout: reservation expires, job becomes visible again

Horizon master -> supervisors -> worker processes
               -> metrics, tags, dashboard, autoscaling
```

Horizon is not the queue. Redis plus Laravel's queue worker can run without Horizon; Horizon replaces the manual work of starting, restarting, balancing, and watching many `queue:work` processes. Conversely, Horizon only supports the Redis queue driver. If your jobs run on SQS or the database driver, Horizon will not see them.

## Vocabulary that actually matters

People who work with this daily use a few terms precisely.

A **connection** is a configured broker, such as `redis`, `sqs`, or `database`. A **queue** is a named channel on that connection, such as `high`, `default`, `emails`, or `reports`. Saying "put it on Redis" is incomplete; the operational statement is "dispatch it to the `notifications` queue on the `redis` connection."

There are two levels of "connection" in a Redis setup, which confuses people. In `config/queue.php`, the queue connection named `redis` may point at a Redis connection named `default` or `queue` from `config/database.php`. The first is Laravel's queue abstraction; the second is the actual Redis client configuration.

A **job class** is your PHP class implementing `ShouldQueue`. A **job instance** or **payload** is one serialized occurrence of it sitting in Redis. **Attempts** are deliveries of that payload. A job can be attempted three times and still be the same logical job.

A **worker** is one long-lived PHP process running, under the hood, something like `php artisan queue:work redis --queue=default`. It handles one job at a time. A Horizon **supervisor** is a manager for a pool of those worker processes on one machine. A Horizon **master supervisor** manages the supervisors. This collides awkwardly with the operating system's own process supervisor — systemd, Supervisor, Docker, Forge's daemon manager — which typically starts exactly one Horizon master per host or container. When someone says "restart the supervisor," your first clarifying thought should be: Horizon supervisor, or the OS process manager?

Three verbs are worth keeping distinct. A job is **reserved** when a worker has popped it and owns it temporarily. It is **released** when the worker deliberately gives it back for a later attempt. It is **failed** only when Laravel gives up and records it in the failed-job store. "It errored" might mean any of: exception and released, exception and failed, timeout, worker killed, or model-not-found during unserialization. Senior debugging starts by identifying which.

## The life of a job, one layer down

When you call `GenerateReport::dispatch($reportId)`, Laravel builds a JSON payload. It contains a UUID, a display name, the handler name — usually `Illuminate\Queue\CallQueuedHandler@call` for a normal job class — bookkeeping fields such as `maxTries`, `timeout`, `backoff`, and `retryUntil`, and under `data.command`, a PHP-serialized copy of your job object.

That last fact shapes everything. Your constructor arguments must survive PHP serialization. Scalars, arrays, DTO-like values, enums, and models handled through `SerializesModels` are fine. Closures, open files, uploaded file objects, HTTP requests, database connections, and arbitrary service objects are not things to smuggle into a job. Store the file, then pass its path or ID.

`SerializesModels` does not freeze an Eloquent model in time. It replaces model properties with identifiers; on unserialization it fetches the model fresh from the database. That is usually what you want — the worker sees current state — but it also means a deleted model raises `ModelNotFoundException` before `handle()` even runs. If deletion should quietly cancel the work, set `public $deleteWhenMissingModels = true;`. Many experienced developers sidestep a whole category of surprises by passing integer IDs and loading models explicitly in `handle()`, where missing-record behavior is visible in their own code. Model serialization is convenient; an ID is honest.

On the Redis side, Laravel's queue driver uses a small set of structures per queue. Logically, ignoring the client key prefix, you will find:

- `queues:{name}` — a **list** of ready jobs. Pushes use `LPUSH`, pops use `RPOP`, giving FIFO order within that one queue.
- `queues:{name}:delayed` — a **sorted set** scored by the Unix timestamp when the job becomes available. This holds both future-scheduled jobs and released jobs waiting out their backoff.
- `queues:{name}:reserved` — a **sorted set** scored by reservation expiry. Popping a job moves it here: this is Redis emulating a visibility timeout.
- `queues:{name}:attempts` — a **hash** counting deliveries per job ID.
- `queues:{name}:notify` — a lightweight signal list used when blocking pops are enabled.

This is not Redis Streams and there are no consumer groups. The reservation pattern is built from lists, sorted sets, hashes, and Lua scripts. Lua matters because "take the oldest ready job, mark it reserved, increment its attempt count" must be atomic when twenty workers compete. Before popping, the worker also migrates expired items: delayed jobs whose time has come, and reserved jobs whose workers apparently died, are moved back onto the ready list. Note the consequence: migration is lazy. Nothing wakes up at exactly the scheduled second and moves the job; it becomes available when a worker next polls that queue. Queue delay is "not before," never a precision timer.

The worker loop is equally instructive. A daemon worker bootstraps Laravel once and then loops: pop a job, fire `JobProcessing`, run it through the job's middleware pipeline into `handle()`, and on success delete the reservation and fire `JobProcessed`. On exception it either releases the job with a delay or fails it: deletes the reservation, invokes the job's `failed()` callback, writes the payload and exception to the failed-job provider — by default the `failed_jobs` database table — and fires `JobFailed`.

Because the worker is long-lived, it is not a fresh PHP request. Code is already loaded, singletons and static state can persist, database connections are reused, and memory grows across jobs. Laravel checks memory and restart conditions between jobs, and Horizon restarts workers that die, but a slow leak still looks like gradually rising worker memory followed by periodic restarts. This is also why deployed code does not magically appear in running workers, a deployment point we will return to.

One more layer-down nuance: job `timeout` enforcement uses PCNTL signals where available. It is best understood as a PHP-level alarm that interrupts the job, not an OS-level kill of arbitrary blocking work. A job stuck in a long native call, a hung socket without its own timeout, or an external process can overrun. Set timeouts on your HTTP clients and database statements too; the queue timeout is the last line, not the only one.

## The timing and retry contract

Most queue bugs in Laravel are really disagreements among five numbers.

**`delay`** is when a job first becomes available. **`retry_after`**, configured per queue connection in `config/queue.php` (default 90 seconds), is the visibility timeout: how long a reserved job is hidden before Redis assumes the worker died and offers it to someone else. **`timeout`** is how long one attempt may run, settable on the job or via the worker. **`tries`** is the maximum number of attempts. **`backoff`** is the delay between attempts — an integer, an array such as `[10, 60, 300]`, or a `backoff()` method. `retryUntil()` offers an alternative philosophy: keep retrying until a wall-clock deadline rather than for a fixed count. `maxExceptions` adds a second ceiling: fail after this many exceptions even if attempts remain.

The rule that must be burned in is **`retry_after` must exceed the longest possible `timeout` for jobs on that connection**. If a job may run 300 seconds but `retry_after` is 90, then at second 91 another worker can pick up the same payload while the first is still legitimately working. You have manufactured duplicate concurrent execution with configuration. Because `retry_after` is per connection, not per job, teams often segregate genuinely long work onto its own queue and connection whose `retry_after` is sized for it, accepting slower crash recovery there in exchange for correctness.

Retries follow from the delivery guarantee: **at-least-once**. Laravel cannot promise exactly-once, because the interesting failure is indistinguishable from success. Suppose your job charges a card, the charge succeeds, and the worker is killed before deleting the reservation. After `retry_after` expires, the job returns and runs again. Suppose it throws after writing to the database but before calling an external API, or after the API call but before recording the result. Every ordering has a crash window. Therefore the senior-level rule is not "avoid retries" — retries are the point — but **write handlers that are safe to run more than once**.

In practice that means checking current state before acting ("only send the invoice email if `invoice_emailed_at` is null, and set it in the same operation"), leaning on database unique constraints as the final authority, wrapping multi-write local work in a transaction, taking a row lock with `lockForUpdate()` where concurrent attempts would interleave badly, and passing idempotency keys to external systems that support them, Stripe being the canonical example. For webhooks, store the provider's event ID under a unique index first; the job then becomes "process this recorded event," and redelivery collapses into a lookup. Where a database write and an external effect must be atomic from the business's point of view, Laravel queues alone do not solve it; the grown-up pattern is a transactional outbox: write the intent in the same database transaction as the state change, and let a relay job publish from that table.

A related transaction footgun happens at dispatch time. If you create an order inside `DB::transaction()` and dispatch a job that immediately loads that order, a fast worker may run before commit and find nothing — or the transaction may roll back while the job still runs. Use `->afterCommit()` on the dispatch, the job's `$afterCommit` property, or implement `ShouldQueueAfterCommit`. After-commit dispatch is the default instinct of experienced Laravel developers for anything dispatched alongside database writes.

Retries also need judgment, not just configuration. Retry transient failures: network resets, 429s and 5xx from a dependency, deadlocks. Do not endlessly retry deterministic failures: a validation error, a missing configuration value, a bug that throws on this payload every time. Those become poison jobs consuming attempts and log volume. A sane production job often looks like this:

```php
final class ProcessStripeWebhook implements ShouldQueue, ShouldBeUniqueUntilProcessing
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;
    public int $timeout = 60;
    public int $uniqueFor = 600;

    public function __construct(public string $stripeEventId) {}

    public function uniqueId(): string
    {
        return $this->stripeEventId;
    }

    public function backoff(): array
    {
        return [5, 30, 120, 600];
    }

    public function handle(StripeEventProcessor $processor): void
    {
        $processor->process($this->stripeEventId); // idempotent inside
    }
}
```

Notice what is not in the constructor: no `Request`, no authenticated user object as an implicit ambient dependency, no session. Workers have no HTTP context. If the job needs an actor, tenant, locale, or correlation ID, pass it explicitly and establish that context at the start of `handle()`.

## Uniqueness, overlap, and throttling are three different tools

Beginners conflate these; seniors choose deliberately.

**Unique jobs** (`ShouldBeUnique`, or `ShouldBeUniqueUntilProcessing`) prevent duplicate *dispatch*. Laravel takes a cache-backed atomic lock keyed by the class plus your `uniqueId()`; a second dispatch while the lock is held is silently dropped. Plain `ShouldBeUnique` holds the lock until the job completes or fails; `UntilProcessing` releases it as soon as a worker starts, allowing the next copy to queue behind. Always set `uniqueFor`: if a worker is killed hard, the lock may otherwise outlive the job, and a bounded expiry is your recovery path. And remember the lock lives in the cache store — in production that must be Redis or Memcached, not the array driver.

**`WithoutOverlapping` middleware** prevents duplicate *execution*. Queued copies may accumulate, but only one runs at a time; others are released back or discarded with `dontRelease()`. Give it a specific key — `new WithoutOverlapping("invoice:{$this->invoiceId}")` — because the default key can serialize unrelated jobs. Its lock expiry is a safety valve, not a guarantee: if real work can exceed `expireAfter`, another copy can start, so the database constraint still has to be right. Locks reduce wasted work; constraints preserve truth.

**`RateLimited` middleware** protects a downstream: if the named limiter is exhausted, the job is released for later rather than counted as a failure. **`ThrottlesExceptions`** takes the opposite trigger: after too many exceptions in a window, it backs the job off, which is exactly right for a flaky third-party API and exactly wrong as a first response to your own bug. There are Redis-specific variants of both that use Lua for accuracy under concurrency. The general design principle is to put these cross-cutting behaviors in the `middleware()` method rather than hand-rolling lock and limiter code inside every `handle()`.

Inside `handle()`, the `InteractsWithQueue` trait gives you `$this->release($delay)`, `$this->delete()`, `$this->fail($exception)`, and `$this->attempts()`. Reaching for them manually is sometimes right — releasing yourself when you discover a prerequisite is not ready yet, for example — but a job littered with manual control flow usually wants middleware or a state-machine redesign instead.

## Composing work: chains, batches, and fan-out

A **chain** runs jobs in sequence: each successor is dispatched only after its predecessor succeeds, and a failure stops the chain. Chains are a pipeline, not a transaction; step three failing does not undo steps one and two. Use them for genuine ordering — resize the upload, then OCR it, then index it — not as a poor man's saga.

A **batch**, built with `Bus::batch([...])` and the `Batchable` trait, is Laravel's fan-out/fan-in tool: many jobs run in parallel, progress is tracked in the `job_batches` database table, and `then`, `catch`, and `finally` callbacks fire as the batch resolves. Jobs can add more jobs to their own batch, and cancellation is cooperative — a long job must periodically check `$this->batch()?->cancelled()`. Batches are how you import 50,000 rows credibly: chunk the file, dispatch a job per thousand rows, let the batch report progress, and let the `then` callback mark the import complete. Compare that with one mega-job looping over everything: simpler, but no parallelism, coarse retries, and one failure restarts enormous amounts of work. The opposite extreme — one job per row for a million rows — drowns you in dispatch and bookkeeping overhead. Chunk size is where the trade-off lives, and a few hundred to a few thousand records per job is the usual negotiating range.

Also remember that dispatching from inside a job is just dispatching. Nothing stops a job from enqueueing its successor work, which enables elegant recursive decomposition and, occasionally, exponential fan-out accidents. Put explicit bounds and counters on self-perpetuating jobs.

## Horizon: the control plane

Run `php artisan horizon` and one master process reads `config/horizon.php`, resolves the block for your `APP_ENV` under `environments`, and starts each named supervisor. Each supervisor spawns worker processes with the right connection, queues, timeout, tries, memory limit, and sleep settings, then watches them: restarting the dead, enforcing process counts, and responding to pause, continue, scale, and terminate commands. Horizon's own state — supervisor heartbeats, recent and pending jobs, metrics, tags — lives in Redis under Horizon's keys, fed by listeners on Laravel's job lifecycle events. The dashboard is a window onto that data.

Three supervisor settings deserve real understanding. **`balance`** governs how processes map to queues. With `false`, each worker takes the whole queue list and polls in priority order. With `simple`, the process pool is split evenly across the supervisor's queues. With `auto`, Horizon continuously shifts processes between queues based on workload, moving at most `balanceMaxShift` processes every `balanceCooldown` seconds, between `minProcesses` and `maxProcesses`. The newer **`autoScalingStrategy`** chooses whether that workload is judged by estimated wait time or raw queue size; time is usually the more honest signal, because a thousand 50-millisecond jobs are less alarming than ten 10-minute jobs. Auto-scaling here is per Horizon master: on three worker hosts each configured for `maxProcesses: 20`, your real ceiling is 60, and each master reacts to global workload independently. That is normal, but you should be able to say the number out loud.

Queue "priority" in this system is softer than newcomers expect. Within one queue, order is FIFO. Across queues, priority is expressed by polling order and, more powerfully, by how many processes you allocate. It is never preemptive: a long low-priority job already running will not be interrupted for a high-priority arrival. This is why experienced teams separate queues by *runtime and criticality profile*, not just by label — `high` for short user-facing work, `default`, `low` for reports and cleanups, often a dedicated supervisor for a slow integration so one bad third party cannot consume the whole fleet. A fifteen-minute report and a two-hundred-millisecond webhook should rarely share a pool.

Horizon also derives the metrics operators actually watch: throughput and average runtime per job and queue, current workload and estimated wait, and the **wait thresholds** in `config/horizon.php` (`'waits' => ['redis:default' => 60]`) that fire a `LongWaitDetected` event you can route to mail or Slack. Two operational details are easy to miss. First, the time-series graphs come from snapshots, so schedule `horizon:snapshot` every five minutes — in modern Laravel, in `routes/console.php`; in older apps, in the console kernel — alongside `schedule:run` itself. Second, the dashboard is only as safe as the `viewHorizon` gate in your `HorizonServiceProvider`. In production it must be restricted to real administrators; failed-job payloads and job metadata are not public information. Horizon auto-tags jobs from Eloquent models in their properties, and a custom `tags()` method can add tenant or customer identifiers, which is what makes "show me everything for tenant 4821" possible during an incident.

## Running it in production

A credible production layout separates concerns physically: web hosts dispatch, a managed or carefully operated Redis holds the queues, one or more worker hosts run Horizon, and exactly one scheduler instance dispatches recurring work (use `onOneServer` for scheduled tasks so three web servers do not enqueue the same job three times). Redis for queues deserves respect as infrastructure. Give it a dedicated instance or at minimum a dedicated logical database, set its eviction policy to `noeviction` — a cache-style `volatile-lru` policy can silently evict job payloads, which is data loss disguised as tidiness — and decide consciously about persistence. With AOF or snapshotting and replication, Redis is reasonably durable; without them, a crash takes your pending work with it. Senior framing: Redis is the broker, not the source of truth, so anything whose loss is unacceptable should be reconstructible from the database or protected by an outbox-style record. Never share a Redis you might `FLUSHDB` for cache reasons with your queues.

Deployment is the other place queue systems bite. Workers are long-lived processes running old code, so after deploying you run `php artisan horizon:terminate`. Horizon stops spawning, lets workers finish their current jobs, exits, and your process manager restarts it on the new code. The legacy `queue:restart` broadcast exists for bare `queue:work` setups; with Horizon, terminate is the correct ritual. Two corollaries matter. First, graceful termination waits for the longest running job, so deploys and pathological jobs are coupled; `fast_termination` exists but trades that wait for killed work. Second, queued payloads are PHP-serialized objects tied to class names and property layouts. Renaming a job class or changing its constructor while old payloads sit in Redis strands those payloads. During risky releases, drain or pause queues, keep job classes backward-compatible for a deploy, and treat job property changes like schema migrations: expand, migrate, contract.

Scaling decisions should be driven by arithmetic, not vibes. Little's law gives you the intuition: if jobs arrive at 100 per minute and each takes 6 seconds, you need roughly 10 workers just to keep up, and wait time is backlog divided by throughput. Adding workers reduces wait; it does not make an individual job faster. And workers are only as scalable as the bottleneck behind them — if every job hammers the same database table or a rate-limited API, more processes convert a queue backlog into database contention and 429s. Scale the constraint, or throttle deliberately with queues per integration or per large tenant so one noisy neighbor cannot starve everyone. Fairness across tenants is not built in; it is an architectural choice you make with queue topology.

Know your failure playbook before you need it. A **backlog** with all workers busy and healthy downstream means add capacity or shed load. Workers busy but throughput flat and errors rising means a downstream is saturated; scaling workers makes it worse. A queue whose processed count climbs while completions do not is usually a retry storm — find the exception, fix the cause, and remember that failed jobs in the dashboard can be retried, while `queue:retry`, `queue:forget`, and `queue:prune-failed` do the same from the CLI. A **poison job** — a payload that crashes or OOMs every worker that touches it — will cycle: kill worker, reservation expires, kill next worker. Horizon restarting workers faithfully is what keeps this alive; you find it via supervisor restart churn and the reserved set, and you remove or fix the payload deliberately. For hands-on inspection, `redis-cli` against the queue keys (`LLEN`, `ZCARD` on the delayed and reserved sets, `ZRANGE ... WITHSCORES` to see when things become visible) tells you the truth the dashboard summarizes; avoid `MONITOR` on a busy production Redis. Horizon's pause and continue commands are legitimate incident tools: pause the bleeding queue first, diagnose second.

## Testing, honestly

`Queue::fake()` is excellent for asserting intent — `Queue::assertPushed(ProcessInvoice::class)` or `assertPushedOn('high', ...)` — and `Bus::fake()` does the same for chains and batches. But a fake does not serialize your job, does not touch Redis, does not run middleware locks, and does not exercise retry semantics. The classic false confidence is a job that passes every faked test and fails its first real dispatch because the constructor held something unserializable. Compensate in layers: fake at the HTTP boundary to assert dispatch decisions, run selected jobs synchronously or against a real Redis in integration tests to prove they execute, and keep at least a smoke path that dispatches for real. Also beware the local-development version of this trap: `QUEUE_CONNECTION=sync` in `.env` makes everything run inline, inside your request transaction, with an authenticated user present — an environment that hides nearly every bug this lesson has described. Develop against real Redis with Horizon running locally at least some of the time; note Horizon needs PCNTL/POSIX, so on Windows that means WSL or Docker.

## The contested parts, and what's legacy

A few debates recur in every team. **Jobs versus queued listeners:** a `ShouldQueue` event listener becomes a queued job under the hood, so the choice is about vocabulary and coupling, not mechanism — domain actions usually read better as jobs, reactions to domain events as listeners. **Granularity:** one coarse job per use case is easier to reason about and retry as a unit; fine-grained jobs parallelize and isolate failure but multiply overhead and partial-completion states. **Redis versus SQS versus database:** the database driver is respectable for low-volume, transactional dispatch and poor under polling contention; SQS removes broker operations and gives you managed durability and FIFO options, at the cost of Horizon's dashboard and some latency and visibility semantics of its own; Redis plus Horizon wins on Laravel-native ergonomics, speed, and visibility, at the cost of owning Redis's durability story. There is no universal answer, but there is a universal mistake: choosing before you can state your throughput, durability, and ordering requirements.

Ordering deserves one blunt sentence: with more than one worker, even a single FIFO queue does not execute in order, because job two can start while job one is still running and finish first. If order is a correctness requirement, you need one worker on that queue, sequence checks in the handler, or an explicit state machine — not hope.

For current versus legacy practice: use the PhpRedis extension, not the old Predis package. `queue:work` has been a daemon for years; `queue:listen` and the `--daemon` flag are history. Hand-rolled Supervisor configurations spawning eight `queue:work` processes still function, but on Redis, Horizon config is the modern expression of the same intent. Job behavior that used to require CLI flags or boilerplate now lives on the job itself — `$tries`, `$timeout`, `backoff()`, `retryUntil()`, `middleware()`, uniqueness interfaces. Failed jobs use UUIDs in current Laravel, and scheduling lives in `routes/console.php` in the Laravel 11/12 skeleton rather than a console kernel. The fundamentals — payload, reservation, retry — have been stable for a decade, which is precisely why learning them beats learning flags.

## A pre-flight checklist, in prose

Before you ship a job, you should be able to answer, without hesitating: What queue and connection does it run on, and roughly how long does an attempt take at p99? Is `retry_after` safely above that? Is the handler idempotent, and which database constraint or idempotency key proves it? What happens if every referenced model is deleted first? Which failures are transient enough to deserve five attempts, and what backoff keeps a dependency outage from becoming a retry storm? Does it need uniqueness, non-overlap, or rate limiting — three different answers? Was it dispatched after commit? Does it secretly depend on the request, the session, or the authenticated user? Who gets paged when its queue's wait crosses the threshold, and what is the failed-job retry procedure?

If you can answer those, you are no longer treating queues as "run it later." You are operating a distributed system with at-least-once delivery, explicit visibility semantics, and a control plane — which is exactly what Laravel, Redis, and Horizon have been giving you all along.
