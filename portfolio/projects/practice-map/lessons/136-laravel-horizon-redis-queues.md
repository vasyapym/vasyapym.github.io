<!--
lesson-meta: {"practicePrompt":"Run Horizon locally against real Redis and dispatch a deliberately slow job: set a job timeout longer than retry_after, reproduce the duplicate-execution race, and watch the same payload get reserved twice. Then make one payment-shaped job honest — idempotent via a unique DB constraint, afterCommit dispatch, explicit tries and backoff — and prove it twice over: with Queue::fake() asserting intent, and with a sync-driver integration test that actually serializes the payload.","checkPrompt":"Without notes, walk a dispatch from PHP serialize() and SerializesModels through the JSON envelope, the LPUSH onto queues:default, the atomic Lua reservation into the reserved sorted set, and the release and fail paths — and name the five numbers (delay, retry_after, timeout, tries, backoff) with the rule that retry_after must exceed the longest timeout. Also explain why a worker never sees new code until restart, what horizon:terminate does and does not interrupt, and why Redis being flushed means the jobs are gone while a dead Horizon means they just wait."}
-->
<!-- lesson-theory: {"problem":"Without the layer-under-queues model, incidents look supernatural: jobs double-charge after a timeout nobody sized, payloads vanish when cache and queue share one Redis, deploys strand old serialized payloads, and nobody can say whether Horizon is the queue. You scale by vibes instead of reading wait, throughput and runtime off the dashboard.","model":"Redis is the mailbox and ledger, workers are long-lived single-threaded PHP clerks pulling one envelope at a time, and Horizon is the floor manager that hires and fires clerks, watches wait times and keeps the scoreboard — three layers people constantly conflate with the Laravel Queue abstraction above and the OS supervisor below. The durability asymmetry tells you where risk lives: if Horizon dies, jobs sit untouched; if Redis dies or is flushed, the jobs are gone.","mechanics":"Dispatch anatomy: the job is PHP-serialized (SerializesModels stores only class and id, re-fetching at run time), wrapped in a JSON envelope and LPUSHed onto the queues:{name} list — FIFO, push left, pop right. Reservation: an atomic Lua script pops and ZADDs into queues:{name}:reserved scored by now plus retry_after; delayed jobs and releases wait in the delayed sorted set; exhausted attempts land in the failed_jobs table as the de facto dead-letter store; reserve, release, fail and delete are the four lifecycle verbs. Worker reality: boots Laravel once, one job per process, concurrency equals process count, static state and memory persist across jobs, priority is polling order never preemption, and timeout kills via PCNTL. Horizon control plane: master supervisor over supervisors over workers, balance simple versus auto with autoScalingStrategy on wait or size, balanceMaxShift and balanceCooldown against flapping, horizon:snapshot feeding the metrics, waits thresholds firing LongWaitDetected, tags for tenant search, and the viewHorizon gate guarding payloads. Job design: thin handle() delegating to services, ids not the world, idempotency under at-least-once via state checks and unique constraints, ShouldBeUnique versus UntilProcessing versus WithoutOverlapping versus RateLimited as three different tools, chains for ordered pipelines and batches for fan-out (needing the job_batches table even on Redis), afterCommit against the transaction race. Operations: separate cache Redis from queue Redis with noeviction and persistence, retry_after above the longest timeout, drain-or-compatible deploys with serialized classes, the bottleneck arithmetic (DB, APIs, CPU) before maxProcesses, and never MONITOR on a busy production Redis.","pitfalls":["Setting retry_after below the job timeout and manufacturing duplicate concurrent execution.","Assuming exactly-once delivery and skipping idempotency guards.","Sharing one Redis between cache and queues with an eviction policy that eats payloads.","Deploying breaking changes to job classes while old serialized payloads sit in the queue.","Trusting Queue::fake() alone, which skips serialization entirely.","Running raw queue:work daemons and Horizon on the same queues as double consumers.","Forgetting horizon:snapshot so balancing and graphs silently degrade.","Reading queue priority as preemption; a running low job is never interrupted.","Smuggling a Request, a huge collection or a closure into the job constructor.","Raising maxProcesses while the database or a third-party API is the real wall."],"whenNot":"The lesson is scoped to Redis-backed Laravel queues under Horizon; SQS, the database driver and Beanstalkd appear only as contrasts, and general distributed-systems theory is assumed. It does not claim Horizon is required for jobs to run — it is not, and it is not a queue driver — and it presents the Kubernetes-versus-Horizon tension as a live design choice, not a settled answer."} -->

# Laravel Horizon + Redis Queues: The Deep Lesson

## The one mental model to keep

> **Redis is the mailbox and ledger. Workers are long-lived PHP clerks pulling one envelope at a time. Horizon is the floor manager: it hires/fires clerks, watches wait times, and keeps the scoreboard.**

Everything else is detail on top of that.

Three things people constantly conflate — keep them separate:

| Layer | What it is | What it does NOT do |
|---|---|---|
| **Laravel Queue** (`Illuminate\Queue`) | Framework abstraction | Doesn't run anything by itself. Just serializes a job and pushes it somewhere. |
| **Redis** | The broker / storage | Doesn't execute code. Stores payloads in lists & sorted sets. |
| **Worker** (`queue:work`) | A daemon PHP process | Doesn't monitor or scale itself. Boots Laravel once, loops forever pulling jobs. |
| **Horizon** | Process manager + observability UI *on top of Redis queues* | Not a queue driver. Not required for jobs to run. Only works with Redis. |
| **Supervisor / systemd / Forge / Docker** | OS-level process keeper | Keeps `php artisan horizon` alive across crashes and reboots. Horizon keeps workers alive. |

If Horizon dies, jobs already in Redis sit there untouched. If Redis dies (or is flushed), the jobs are *gone*. That asymmetry tells you where the durability lives.

---

## 1. Anatomy of a dispatch, a layer below the abstraction

When you write:

```php
ProcessPodcast::dispatch($podcast);
```

this is what actually happens:

**1. Serialization.** The job object is PHP-`serialize()`'d into a string. If you use the `SerializesModels` trait, Eloquent models are *not* serialized whole — they're replaced with a tiny identifier (`{class, id, connection}`) and re-fetched from the DB when the job runs. This is why a model deleted between dispatch and execution throws `ModelNotFoundException` (control it with `public $deleteWhenMissingModels = true;`).

**2. The payload.** Laravel wraps that string in a JSON envelope and `LPUSH`es it onto a Redis **list** named `queues:default`:

```json
{
  "uuid": "9d2f...",
  "displayName": "App\\Jobs\\ProcessPodcast",
  "job": "Illuminate\\Queue\\CallQueuedHandler@call",
  "maxTries": 3,
  "attempts": 0,
  "data": { "command": "O:24:\"App\\Jobs\\ProcessPodcast\":..." }
}
```

**3. Reservation.** A worker runs a Lua script (atomic, so two workers can't grab the same job) that `RPOP`s from the list and `ZADD`s the payload into a **sorted set** `queues:default:reserved`, scored by expiry timestamp = `now + retry_after`. The list is FIFO: push left, pop right.

**4. Execution.** The worker unserializes, resolves `handle()` dependencies from the container, runs your code.

**5. Resolution.**
- **Success** → payload removed from the reserved set (`ZREM`). Done.
- **Exception** → *released*: re-queued onto `queues:default:delayed` (another sorted set, scored by when it should become available again), `attempts` incremented. A later reserve cycle migrates expired delayed jobs back to the main list.
- **Out of tries** → *failed*: written to the `failed_jobs` DB table (that's your dead-letter queue — Laravel has no separate DLQ concept), `failed()` hook called, `JobFailed` event fired.

Delayed jobs (`->delay(now()->addMinutes(5))`) skip the list entirely and go straight into the `:delayed` sorted set.

### Vocabulary that matters here

- **Connection** vs **queue**: a *connection* is a driver config (`redis`, `database`, `sqs` in `config/queue.php`). A *queue* is a named lane *within* a connection (`high`, `default`, `low`). People who say "the redis queue" ambiguously lose credibility fast; say "the `redis` connection, `emails` queue."
- **Reserve / release / fail / delete** are the four precise verbs for a job's lifecycle. "The job ran again" is vague; "it was released with backoff after attempt 2" is senior.
- **`retry_after`** (in `config/queue.php`, default 90s): how long a job can sit in the reserved set before another worker assumes its worker died and re-queues it. This is the single most dangerous number in the system — see footguns.

---

## 2. The worker process: where most misconceptions live

`php artisan queue:work redis --queue=high,default --timeout=60 --tries=3 --memory=128 --sleep=3`

Key facts:

- **It's a daemon.** It boots the framework *once* and processes jobs serially — one job at a time per process. Concurrency = number of processes, never threads. Ten parallel jobs means ten PHP processes, each with its full memory footprint.
- **Because it's long-lived, it is not FPM.** Static state, singletons, and leaked memory persist across jobs. Laravel resets some scoped bindings between jobs, but your `static` properties and careless singletons will haunt you. This is also why workers don't see new code until restarted (more below).
- **Queue priority is polling order, not preemption.** `--queue=high,default,low` means: always check `high` first. A `low` job already running is never interrupted; a flood of `high` jobs can starve `low` indefinitely.
- **With `sleep=3`, an idle worker polls Redis every 3 seconds.** It's not purely blocking (there's an optional `block_for` config using blocking pops). Polling is fine; don't be surprised by constant light Redis traffic.
- Useful flags seniors actually use: `--once` (CI, debugging), `--stop-when-empty` (ephemeral/drain workers, serverless-ish setups), `--max-jobs=1000` / `--max-time=3600` (proactive recycling before memory leaks matter — the supervisor restarts it fresh).

A worker exceeding `--memory` stops itself gracefully; exceeding `--timeout` gets killed via PCNTL alarm (this is why Horizon/workers need `ext-pcntl` and don't work properly on Windows).

---

## 3. Horizon: the control plane

Horizon replaces manually-managed `queue:work` processes with a hierarchy:

```
OS Supervisor/systemd
└── horizon (master process)
    ├── supervisor-1  (config block)
    │   ├── queue:work  × N processes
    │   └── queue:work  × N
    └── supervisor-2
        └── queue:work  × M
```

Terminology trap: Horizon has a **master supervisor** and **supervisors** (process pools), plus the *OS* program also called **Supervisor**. In conversation, disambiguate: "Horizon supervisor" vs "supervisord."

What Horizon adds over raw `queue:work`:

1. **Auto-balancing.** Config in `config/horizon.php`:

```php
'production' => [
    'supervisor-1' => [
        'connection' => 'redis',
        'queue' => ['high', 'default'],
        'balance' => 'auto',              // 'simple', 'auto', or false
        'autoScalingStrategy' => 'time',  // wait-time-based; 'size' = queue depth
        'minProcesses' => 2,
        'maxProcesses' => 20,
        'balanceMaxShift' => 1,           // max processes moved per cycle
        'balanceCooldown' => 3,           // seconds between rebalances (anti-flapping)
        'memory' => 128,
        'tries' => 3,
        'timeout' => 60,
    ],
],
```

   - `simple`: split processes evenly across queues, fixed.
   - `auto`: shift processes toward whichever queue has the worst projected wait (queue depth × recent average runtime from metrics snapshots). This is why metrics matter — run `Schedule::command('horizon:snapshot')->everyFiveMinutes()` in your scheduler or balancing and the dashboard's runtime/throughput graphs have nothing to work with.

2. **Metrics, tags, dashboard.** Recent jobs, pending, failed, throughput, runtime percentiles, per-queue wait. Stored under `horizon:*` Redis keys, trimmed per `config/horizon.php` `trim` settings. **Tags** are how you find "all jobs for tenant 42": Horizon auto-tags Eloquent models in job properties, or define `tags()` on the job. Credible operators navigate Horizon by tag, not by scrolling.

3. **Wait notifications.** `'waits' => ['redis:default' => 60]` fires `LongWaitDetected` when a queue's estimated wait exceeds the threshold — wire this to Slack/PagerDuty; don't rely on eyeballing the dashboard.

4. **Fast termination & graceful deploys.** `horizon:terminate` tells the master to let workers *finish their current job*, then restart everything with fresh code. Compare:
   - `queue:restart` — for plain `queue:work` fleets; sets a cache timestamp workers check between jobs.
   - `horizon:terminate` — the Horizon equivalent (Forge runs this automatically on deploy).
   - **Neither interrupts a running job.** A worker mid-job keeps executing *old code* to completion — usually fine, occasionally a nasty surprise during breaking changes.

5. **Operational commands:** `horizon`, `horizon:status`, `horizon:list`, `horizon:pause` / `horizon:continue` (great for maintenance windows), `horizon:terminate`, `horizon:snapshot`, `horizon:clear`, `horizon:forget {id}`.

**Authorization:** the dashboard exposes payloads (potentially sensitive data). It's open in `local` env; in production the `viewHorizon` gate in `HorizonServiceProvider` must be locked down. An unguarded `/horizon` in production is a real-world breach vector.

---

## 4. Designing jobs like a senior

A job is not "a controller method but async." Rules of thumb:

**Jobs should be thin; services do the work.** `handle()` should orchestrate and delegate. This keeps jobs testable, retryable, and reusable from controllers/commands.

**Pass IDs and primitives, not the world.** Small payloads = less Redis memory, faster serialization, fewer surprises. Never serialize a `Request`, a huge Collection, or a closure (closures can't be queued at all).

**Design for at-least-once delivery.** This is the core distributed-systems fact: **Laravel queues do not guarantee exactly-once.** A worker can die after your side effect but before deleting the job from the reserved set — the job runs again. Therefore:

- **Idempotency is your job, not the framework's.** Guard with status checks, unique DB constraints, or "already processed" markers.
- **`ShouldBeUnique`** helps but is a cache lock, not a proof. `uniqueId()` scopes the lock; `uniqueFor` sets its TTL. Know the difference: `ShouldBeUnique` holds the lock until the job *finishes*; `ShouldBeUniqueUntilProcessing` releases it when the job *starts* (use when you want to allow the next dispatch while this one runs).
- **`WithoutOverlapping` middleware** serializes jobs sharing a key; **`RateLimited`** middleware (backed by the rate limiter) releases rather than fails when throttled; **`ThrottledExceptions`** backs off on flaky downstream APIs.

**Retries are a policy, not a default.** Set them deliberately:

```php
public int $tries = 3;
public int $timeout = 120;              // per-attempt wall clock
public array $backoff = [10, 60, 300];  // exponential-ish gaps
public int $maxExceptions = 2;          // fail fast on repeated exceptions
// or: public function retryUntil(): DateTime
```

Retries only help for *transient* failures (network blip, deadlock, rate limit). Retrying a deterministic bug three times just triples your log noise and delays the inevitable failure. Often `tries = 1` plus alerting is the honest choice.

**Transactions: the classic race.** If you dispatch inside a DB transaction, the worker may pick the job up *before commit* and not find the model. Fix with `Model::dispatch(...)->afterCommit()` or `public $afterCommit = true;`. In serious systems this escalates to the **transactional outbox pattern** — Laravel's `afterCommit` covers most people; know the term and when it's insufficient (when the dispatch side effect and DB write must survive together across services).

**Chains vs batches — know the difference cold:**

| | `Bus::chain([...])` | `Bus::batch([...])` |
|---|---|---|
| Semantics | Sequential pipeline; next runs only if previous succeeds | Parallel fan-out; runs concurrently across workers |
| Failure | Chain halts (unless configured otherwise) | `then` / `catch` / `finally` callbacks; `allowFailures()` optional |
| Infra | Queue only | Needs the `job_batches` DB table *even on Redis* |
| Use for | Multi-step workflows (import → transform → publish) | Fan-out work (generate 1,000 thumbnails, track progress %) |

A batch inside a chain (or vice versa) is the standard "senior" composition.

**Events for hooks, not polling:** `JobProcessing`, `JobProcessed`, `JobExceptionOccurred`, `JobFailed` — use them for metrics/logging rather than instrumenting every job.

---

## 5. Scaling and queue topology

- **Sharding by lane beats one mega-queue.** Typical topology: `high` (payments, auth emails), `default`, `low` (reports, cleanup), plus isolation lanes for slow/heavy work (`video`, `imports`) so a 10-minute job class can't head-of-line block password resets. A slow job only blocks its own process — but if all your processes are in one pool, it blocks *effectively* everything.
- **Ordering:** Redis lists are FIFO, but with 10 workers pulling concurrently, completion order is effectively random. If you truly need ordering per-entity, use `WithoutOverlapping` keyed by entity or a chain — and accept the throughput cost. Needing global order is usually a design smell.
- **Fairness:** in multi-tenant apps, one tenant's bulk import can starve everyone. Counter with per-tenant queues + capped processes, rate-limited middleware, or a fairness-aware dispatch layer. This is a genuinely contested design area — there's no built-in fair scheduler.
- **The bottleneck moves.** Doubling workers doubles throughput until you saturate the DB, a third-party API, or CPU. Watch Redis op latency, DB connections, and downstream rate limits before reflexively raising `maxProcesses`. Every worker is a DB connection consumer too.

---

## 6. The footgun hall of fame

1. **`retry_after` ≤ job `timeout`.** If a job can run 120s but `retry_after` is 90s, Redis assumes the worker died at 90s and hands the job to a *second* worker while the first is still running. Duplicate charges, duplicate emails. **Rule: `retry_after` must exceed your longest job timeout** (with margin). Also keep Horizon's supervisor timeout settings coherent with worker timeouts.
2. **Cache Redis = queue Redis.** Use separate Redis instances (or at minimum separate databases). Queue Redis: persistence on (AOF/RDB), `maxmemory-policy noeviction` — you never want jobs evicted, and `cache:clear` / a flush should never be able to nuke pending work. Cache Redis: eviction is fine, loss is acceptable.
3. **Assuming exactly-once.** Covered above; it's the #1 architectural misconception.
4. **Breaking serialization changes on deploy.** In-flight payloads contain `serialize()`'d objects of your *old* class shape. Renaming/removing typed properties can make old payloads un-unserializable. Mitigate: drain queues before breaking deploys, or keep job classes backward-compatible.
5. **`Queue::fake()` hides real bugs.** Fakes skip serialization entirely. Keep at least some tests on the `sync` driver or real serialization so payload bugs surface.
6. **Huge payloads & N+1 in jobs.** A job that lazy-loads relationships in a loop *without* an HTTP request still melts the DB — and now invisibly. Eager-load in the constructor or at handle time, deliberately.
7. **Running both `queue:work` daemons and Horizon on the same queues.** Double consumers, double confusion. Pick one control plane per queue.
8. **Forgetting `horizon:snapshot` in the scheduler.** Auto-balancing and metrics silently degrade.
9. **`queue:listen` in production** (legacy habit). It spawns a fresh PHP process per job — picks up code changes without restart, but brutally slow. It exists for local convenience folklore; use `queue:work`/Horizon and restart properly.
10. **No alerting on `failed_jobs` growth or queue wait.** Failed jobs accumulate silently. Monitor table growth, Horizon waits, and throughput drops.

---

## 7. A day in the life: ops playbook

**Queue is backing up.** Diagnosis order: Horizon dashboard wait/throughput → `LLEN queues:default` in `redis-cli` (and `ZCOUNT queues:default:delayed -inf +inf`) → are workers alive (`horizon:status`)? → did runtime spike (bad deploy? downstream slow?) → failed rate spiking (poison job?) → only then scale processes. Never `redis-cli MONITOR` on production — it murders performance.

**Bad deploy, code is broken.** `horizon:pause` to stop intake execution, fix, deploy, `horizon:terminate`, `horizon:continue`. Or let it drain and terminate.

**Failed job handling.** Inspect in Horizon (payload, exception, tags), fix root cause, `queue:retry {id}` or `queue:retry all`; `queue:forget`, `queue:flush` when sure. Build `queue:prune-failed` into your scheduler so the table doesn't grow forever.

**Deploying.** Standard Forge-style flow: deploy code → `horizon:terminate` → supervisors respawn workers on new code. Remember running jobs finish on old code.

**Tooling map (current ecosystem):** Horizon = queue control plane; **Telescope** = deep per-job/per-request debugging (dev/staging; it *can* watch jobs richly but is heavy); **Pulse** = lightweight production health aggregation (newer, Laravel 11 era) that complements rather than replaces Horizon.

---

## 8. Contested calls ("it depends" — and what it depends on)

- **Many small jobs vs one big job.** Small: better parallelism, retry granularity, progress visibility; cost: overhead, ordering pain, more failure modes. Chunk big work into batches by default.
- **Horizon vs plain `queue:work` + supervisor.** Horizon wins when you want autoscaling/metrics/UI. In Kubernetes, Horizon's model (one master spawning processes per pod) fights the platform's model — many teams instead run `queue:work` pods and scale with KEDA on Redis list length, using Horizon only for the dashboard by running a single replica. Knowing this tension marks you as current.
- **Redis vs SQS vs database driver.** Redis: fast, Horizon-eligible, but you're the durability owner. SQS: managed durability, visibility-timeout semantics (same `retry_after` trap, different name), no Horizon. Database driver: legitimately fine at low volume, zero new infra, but polls your primary DB and doesn't scale write-heavy. Beanstalkd is legacy — don't choose it for new work.
- **Push-time work vs run-time work.** Resolve everything you can at *dispatch* time only if it can't go stale; otherwise pass IDs and fetch fresh at run time. SerializesModels is the framework nudging you toward fetch-fresh.
- **Tries: high with backoff vs fail-fast.** Depends on failure class: idempotent + transient → retry generously; side-effectful + deterministic → fail fast and alert.

---

## 9. Legacy vs current, in one breath

Legacy: `queue:listen`, treating `sync` as a "good enough" production driver, queue config buried in `.env` without `retry_after` thought, Telescope as your production queue monitor, Supervisor config copy-pasted per-worker instead of Horizon.

Current (Laravel 10–12 era): Horizon 5 as the standard Redis control plane, `ShouldBeUnique` / middleware-based throttling instead of hand-rolled locks, batches as the default fan-out primitive, `afterCommit` as a reflex, Pulse alongside Horizon for app health, and queue topology designed per workload class rather than one `default` queue for everything.

---

## 10. Credibility checklist

In any design review or incident, ask these six questions and you'll sound like you've operated this before:

1. "Is it idempotent under at-least-once delivery?"
2. "What's `timeout`, and is `retry_after` safely above it?"
3. "Which queue, and what else shares that pool?"
4. "What's the retry policy — and are these failures transient or deterministic?"
5. "What happens on deploy to in-flight jobs — drained, or old code to completion?"
6. "How would we *know* it's stuck — which wait threshold alerts, and who gets paged?"

If you can also glance at Horizon and read wait time vs throughput vs runtime to tell "we need workers" apart from "the database is the wall," you're operating at the level this lesson aimed for.

**Self-test:** (a) A payment job with `timeout=180` runs twice and double-charges. Name the likely config bug. (b) Your `low` queue hasn't processed in an hour under `balance: simple`. Why might that be fine — and when is it not? (c) A job is dispatched inside a transaction and intermittently fails with `ModelNotFoundException`. What's the one-word fix? — Answers: (a) `retry_after ≤ 180`; (b) `simple` dedicates fixed processes, so check whether its pool is just busy vs. dead; under `auto` with few total processes, starvation is the risk to check; (c) `afterCommit`.
