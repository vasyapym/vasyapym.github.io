import type { LessonSection } from "../curriculum";

export const sections: readonly LessonSection[] = [
  {
    heading: "The one mental model to keep",
    blocks: [
      {"kind":"callout","variant":"key","text":"**Redis is the mailbox and ledger. Workers are long-lived PHP clerks pulling one envelope at a time. Horizon is the floor manager: it hires/fires clerks, watches wait times, and keeps the scoreboard.**"},
      {"kind":"p","text":"Everything else is detail on top of that."},
      {"kind":"p","text":"Three things people constantly conflate — keep them separate:"},
      {"kind":"list","items":["**Laravel Queue** (`Illuminate\\Queue`) — Framework abstraction; What it does NOT do: Doesn't run anything by itself. Just serializes a job and pushes it somewhere.","**Redis** — The broker / storage; What it does NOT do: Doesn't execute code. Stores payloads in lists & sorted sets.","**Worker** (`queue:work`) — A daemon PHP process; What it does NOT do: Doesn't monitor or scale itself. Boots Laravel once, loops forever pulling jobs.","**Horizon** — Process manager + observability UI *on top of Redis queues*; What it does NOT do: Not a queue driver. Not required for jobs to run. Only works with Redis.","**Supervisor / systemd / Forge / Docker** — OS-level process keeper; What it does NOT do: Keeps `php artisan horizon` alive across crashes and reboots. Horizon keeps workers alive."]},
      {"kind":"p","text":"If Horizon dies, jobs already in Redis sit there untouched. If Redis dies (or is flushed), the jobs are *gone*. That asymmetry tells you where the durability lives."},
    ],
  },
  {
    heading: "1. Anatomy of a dispatch, a layer below the abstraction",
    blocks: [
      {"kind":"p","text":"When you write:"},
      {"kind":"p","text":"this is what actually happens:"},
      {"kind":"p","text":"**1. Serialization.** The job object is PHP-`serialize()`'d into a string. If you use the `SerializesModels` trait, Eloquent models are *not* serialized whole — they're replaced with a tiny identifier (`{class, id, connection}`) and re-fetched from the DB when the job runs. This is why a model deleted between dispatch and execution throws `ModelNotFoundException` (control it with `public $deleteWhenMissingModels = true;`)."},
      {"kind":"p","text":"**2. The payload.** Laravel wraps that string in a JSON envelope and `LPUSH`es it onto a Redis **list** named `queues:default`:"},
      {"kind":"p","text":"**3. Reservation.** A worker runs a Lua script (atomic, so two workers can't grab the same job) that `RPOP`s from the list and `ZADD`s the payload into a **sorted set** `queues:default:reserved`, scored by expiry timestamp = `now + retry_after`. The list is FIFO: push left, pop right."},
      {"kind":"p","text":"**4. Execution.** The worker unserializes, resolves `handle()` dependencies from the container, runs your code."},
      {"kind":"p","text":"**5. Resolution.**"},
      {"kind":"list","items":["**Success** → payload removed from the reserved set (`ZREM`). Done.","**Exception** → *released*: re-queued onto `queues:default:delayed` (another sorted set, scored by when it should become available again), `attempts` incremented. A later reserve cycle migrates expired delayed jobs back to the main list.","**Out of tries** → *failed*: written to the `failed_jobs` DB table (that's your dead-letter queue — Laravel has no separate DLQ concept), `failed()` hook called, `JobFailed` event fired."]},
      {"kind":"p","text":"Delayed jobs (`->delay(now()->addMinutes(5))`) skip the list entirely and go straight into the `:delayed` sorted set."},
      {"kind":"p","text":"**Vocabulary that matters here**"},
      {"kind":"list","items":["**Connection** vs **queue**: a *connection* is a driver config (`redis`, `database`, `sqs` in `config/queue.php`). A *queue* is a named lane *within* a connection (`high`, `default`, `low`). People who say \"the redis queue\" ambiguously lose credibility fast; say \"the `redis` connection, `emails` queue.\"","**Reserve / release / fail / delete** are the four precise verbs for a job's lifecycle. \"The job ran again\" is vague; \"it was released with backoff after attempt 2\" is senior.","**`retry_after`** (in `config/queue.php`, default 90s): how long a job can sit in the reserved set before another worker assumes its worker died and re-queues it. This is the single most dangerous number in the system — see footguns."]},
    ],
    examples: [
      {"title":"Блок 1","code":"ProcessPodcast::dispatch($podcast);","explanation":"Пояснение не заполнено."},
      {"title":"Блок 2","code":"{\n  \"uuid\": \"9d2f...\",\n  \"displayName\": \"App\\\\Jobs\\\\ProcessPodcast\",\n  \"job\": \"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\n  \"maxTries\": 3,\n  \"attempts\": 0,\n  \"data\": { \"command\": \"O:24:\\\"App\\\\Jobs\\\\ProcessPodcast\\\":...\" }\n}","explanation":"Пояснение не заполнено."},
    ],
  },
  {
    heading: "2. The worker process: where most misconceptions live",
    blocks: [
      {"kind":"p","text":"`php artisan queue:work redis --queue=high,default --timeout=60 --tries=3 --memory=128 --sleep=3`"},
      {"kind":"p","text":"Key facts:"},
      {"kind":"list","items":["**It's a daemon.** It boots the framework *once* and processes jobs serially — one job at a time per process. Concurrency = number of processes, never threads. Ten parallel jobs means ten PHP processes, each with its full memory footprint.","**Because it's long-lived, it is not FPM.** Static state, singletons, and leaked memory persist across jobs. Laravel resets some scoped bindings between jobs, but your `static` properties and careless singletons will haunt you. This is also why workers don't see new code until restarted (more below).","**Queue priority is polling order, not preemption.** `--queue=high,default,low` means: always check `high` first. A `low` job already running is never interrupted; a flood of `high` jobs can starve `low` indefinitely.","**With `sleep=3`, an idle worker polls Redis every 3 seconds.** It's not purely blocking (there's an optional `block_for` config using blocking pops). Polling is fine; don't be surprised by constant light Redis traffic.","Useful flags seniors actually use: `--once` (CI, debugging), `--stop-when-empty` (ephemeral/drain workers, serverless-ish setups), `--max-jobs=1000` / `--max-time=3600` (proactive recycling before memory leaks matter — the supervisor restarts it fresh)."]},
      {"kind":"p","text":"A worker exceeding `--memory` stops itself gracefully; exceeding `--timeout` gets killed via PCNTL alarm (this is why Horizon/workers need `ext-pcntl` and don't work properly on Windows)."},
    ],
  },
  {
    heading: "3. Horizon: the control plane",
    blocks: [
      {"kind":"p","text":"Horizon replaces manually-managed `queue:work` processes with a hierarchy:"},
      {"kind":"p","text":"Terminology trap: Horizon has a **master supervisor** and **supervisors** (process pools), plus the *OS* program also called **Supervisor**. In conversation, disambiguate: \"Horizon supervisor\" vs \"supervisord.\""},
      {"kind":"p","text":"What Horizon adds over raw `queue:work`:"},
      {"kind":"list","ordered":true,"items":["**Auto-balancing.** Config in `config/horizon.php`:"]},
      {"kind":"p","text":"- `simple`: split processes evenly across queues, fixed. - `auto`: shift processes toward whichever queue has the worst projected wait (queue depth × recent average runtime from metrics snapshots). This is why metrics matter — run `Schedule::command('horizon:snapshot')->everyFiveMinutes()` in your scheduler or balancing and the dashboard's runtime/throughput graphs have nothing to work with."},
      {"kind":"list","ordered":true,"items":["**Metrics, tags, dashboard.** Recent jobs, pending, failed, throughput, runtime percentiles, per-queue wait. Stored under `horizon:*` Redis keys, trimmed per `config/horizon.php` `trim` settings. **Tags** are how you find \"all jobs for tenant 42\": Horizon auto-tags Eloquent models in job properties, or define `tags()` on the job. Credible operators navigate Horizon by tag, not by scrolling."]},
      {"kind":"list","ordered":true,"items":["**Wait notifications.** `'waits' => ['redis:default' => 60]` fires `LongWaitDetected` when a queue's estimated wait exceeds the threshold — wire this to Slack/PagerDuty; don't rely on eyeballing the dashboard."]},
      {"kind":"list","ordered":true,"items":["**Fast termination & graceful deploys.** `horizon:terminate` tells the master to let workers *finish their current job*, then restart everything with fresh code. Compare:"]},
      {"kind":"p","text":"- `queue:restart` — for plain `queue:work` fleets; sets a cache timestamp workers check between jobs. - `horizon:terminate` — the Horizon equivalent (Forge runs this automatically on deploy). - **Neither interrupts a running job.** A worker mid-job keeps executing *old code* to completion — usually fine, occasionally a nasty surprise during breaking changes."},
      {"kind":"list","ordered":true,"items":["**Operational commands:** `horizon`, `horizon:status`, `horizon:list`, `horizon:pause` / `horizon:continue` (great for maintenance windows), `horizon:terminate`, `horizon:snapshot`, `horizon:clear`, `horizon:forget {id}`."]},
      {"kind":"p","text":"**Authorization:** the dashboard exposes payloads (potentially sensitive data). It's open in `local` env; in production the `viewHorizon` gate in `HorizonServiceProvider` must be locked down. An unguarded `/horizon` in production is a real-world breach vector."},
    ],
    examples: [
      {"title":"Блок 3","code":"OS Supervisor/systemd\n└── horizon (master process)\n    ├── supervisor-1  (config block)\n    │   ├── queue:work  × N processes\n    │   └── queue:work  × N\n    └── supervisor-2\n        └── queue:work  × M","explanation":"Пояснение не заполнено."},
      {"title":"Блок 4","code":"'production' => [\n    'supervisor-1' => [\n        'connection' => 'redis',\n        'queue' => ['high', 'default'],\n        'balance' => 'auto',              // 'simple', 'auto', or false\n        'autoScalingStrategy' => 'time',  // wait-time-based; 'size' = queue depth\n        'minProcesses' => 2,\n        'maxProcesses' => 20,\n        'balanceMaxShift' => 1,           // max processes moved per cycle\n        'balanceCooldown' => 3,           // seconds between rebalances (anti-flapping)\n        'memory' => 128,\n        'tries' => 3,\n        'timeout' => 60,\n    ],\n],","explanation":"Пояснение не заполнено."},
    ],
  },
  {
    heading: "4. Designing jobs like a senior",
    blocks: [
      {"kind":"p","text":"A job is not \"a controller method but async.\" Rules of thumb:"},
      {"kind":"p","text":"**Jobs should be thin; services do the work.** `handle()` should orchestrate and delegate. This keeps jobs testable, retryable, and reusable from controllers/commands."},
      {"kind":"p","text":"**Pass IDs and primitives, not the world.** Small payloads = less Redis memory, faster serialization, fewer surprises. Never serialize a `Request`, a huge Collection, or a closure (closures can't be queued at all)."},
      {"kind":"p","text":"**Design for at-least-once delivery.** This is the core distributed-systems fact: **Laravel queues do not guarantee exactly-once.** A worker can die after your side effect but before deleting the job from the reserved set — the job runs again. Therefore:"},
      {"kind":"list","items":["**Idempotency is your job, not the framework's.** Guard with status checks, unique DB constraints, or \"already processed\" markers.","**`ShouldBeUnique`** helps but is a cache lock, not a proof. `uniqueId()` scopes the lock; `uniqueFor` sets its TTL. Know the difference: `ShouldBeUnique` holds the lock until the job *finishes*; `ShouldBeUniqueUntilProcessing` releases it when the job *starts* (use when you want to allow the next dispatch while this one runs).","**`WithoutOverlapping` middleware** serializes jobs sharing a key; **`RateLimited`** middleware (backed by the rate limiter) releases rather than fails when throttled; **`ThrottledExceptions`** backs off on flaky downstream APIs."]},
      {"kind":"p","text":"**Retries are a policy, not a default.** Set them deliberately:"},
      {"kind":"p","text":"Retries only help for *transient* failures (network blip, deadlock, rate limit). Retrying a deterministic bug three times just triples your log noise and delays the inevitable failure. Often `tries = 1` plus alerting is the honest choice."},
      {"kind":"p","text":"**Transactions: the classic race.** If you dispatch inside a DB transaction, the worker may pick the job up *before commit* and not find the model. Fix with `Model::dispatch(...)->afterCommit()` or `public $afterCommit = true;`. In serious systems this escalates to the **transactional outbox pattern** — Laravel's `afterCommit` covers most people; know the term and when it's insufficient (when the dispatch side effect and DB write must survive together across services)."},
      {"kind":"p","text":"**Chains vs batches — know the difference cold:**"},
      {"kind":"list","items":["Semantics — Sequential pipeline; next runs only if previous succeeds; `Bus::batch([...])`: Parallel fan-out; runs concurrently across workers","Failure — Chain halts (unless configured otherwise); `Bus::batch([...])`: `then` / `catch` / `finally` callbacks; `allowFailures()` optional","Infra — Queue only; `Bus::batch([...])`: Needs the `job_batches` DB table *even on Redis*","Use for — Multi-step workflows (import → transform → publish); `Bus::batch([...])`: Fan-out work (generate 1,000 thumbnails, track progress %)"]},
      {"kind":"p","text":"A batch inside a chain (or vice versa) is the standard \"senior\" composition."},
      {"kind":"p","text":"**Events for hooks, not polling:** `JobProcessing`, `JobProcessed`, `JobExceptionOccurred`, `JobFailed` — use them for metrics/logging rather than instrumenting every job."},
    ],
    examples: [
      {"title":"Блок 5","code":"public int $tries = 3;\npublic int $timeout = 120;              // per-attempt wall clock\npublic array $backoff = [10, 60, 300];  // exponential-ish gaps\npublic int $maxExceptions = 2;          // fail fast on repeated exceptions\n// or: public function retryUntil(): DateTime","explanation":"Пояснение не заполнено."},
    ],
  },
  {
    heading: "5. Scaling and queue topology",
    blocks: [
      {"kind":"list","items":["**Sharding by lane beats one mega-queue.** Typical topology: `high` (payments, auth emails), `default`, `low` (reports, cleanup), plus isolation lanes for slow/heavy work (`video`, `imports`) so a 10-minute job class can't head-of-line block password resets. A slow job only blocks its own process — but if all your processes are in one pool, it blocks *effectively* everything.","**Ordering:** Redis lists are FIFO, but with 10 workers pulling concurrently, completion order is effectively random. If you truly need ordering per-entity, use `WithoutOverlapping` keyed by entity or a chain — and accept the throughput cost. Needing global order is usually a design smell.","**Fairness:** in multi-tenant apps, one tenant's bulk import can starve everyone. Counter with per-tenant queues + capped processes, rate-limited middleware, or a fairness-aware dispatch layer. This is a genuinely contested design area — there's no built-in fair scheduler.","**The bottleneck moves.** Doubling workers doubles throughput until you saturate the DB, a third-party API, or CPU. Watch Redis op latency, DB connections, and downstream rate limits before reflexively raising `maxProcesses`. Every worker is a DB connection consumer too."]},
    ],
  },
  {
    heading: "6. The footgun hall of fame",
    blocks: [
      {"kind":"list","ordered":true,"items":["**`retry_after` ≤ job `timeout`.** If a job can run 120s but `retry_after` is 90s, Redis assumes the worker died at 90s and hands the job to a *second* worker while the first is still running. Duplicate charges, duplicate emails. **Rule: `retry_after` must exceed your longest job timeout** (with margin). Also keep Horizon's supervisor timeout settings coherent with worker timeouts.","**Cache Redis = queue Redis.** Use separate Redis instances (or at minimum separate databases). Queue Redis: persistence on (AOF/RDB), `maxmemory-policy noeviction` — you never want jobs evicted, and `cache:clear` / a flush should never be able to nuke pending work. Cache Redis: eviction is fine, loss is acceptable.","**Assuming exactly-once.** Covered above; it's the #1 architectural misconception.","**Breaking serialization changes on deploy.** In-flight payloads contain `serialize()`'d objects of your *old* class shape. Renaming/removing typed properties can make old payloads un-unserializable. Mitigate: drain queues before breaking deploys, or keep job classes backward-compatible.","**`Queue::fake()` hides real bugs.** Fakes skip serialization entirely. Keep at least some tests on the `sync` driver or real serialization so payload bugs surface.","**Huge payloads & N+1 in jobs.** A job that lazy-loads relationships in a loop *without* an HTTP request still melts the DB — and now invisibly. Eager-load in the constructor or at handle time, deliberately.","**Running both `queue:work` daemons and Horizon on the same queues.** Double consumers, double confusion. Pick one control plane per queue.","**Forgetting `horizon:snapshot` in the scheduler.** Auto-balancing and metrics silently degrade.","**`queue:listen` in production** (legacy habit). It spawns a fresh PHP process per job — picks up code changes without restart, but brutally slow. It exists for local convenience folklore; use `queue:work`/Horizon and restart properly.","**No alerting on `failed_jobs` growth or queue wait.** Failed jobs accumulate silently. Monitor table growth, Horizon waits, and throughput drops."]},
    ],
  },
  {
    heading: "7. A day in the life: ops playbook",
    blocks: [
      {"kind":"p","text":"**Queue is backing up.** Diagnosis order: Horizon dashboard wait/throughput → `LLEN queues:default` in `redis-cli` (and `ZCOUNT queues:default:delayed -inf +inf`) → are workers alive (`horizon:status`)? → did runtime spike (bad deploy? downstream slow?) → failed rate spiking (poison job?) → only then scale processes. Never `redis-cli MONITOR` on production — it murders performance."},
      {"kind":"p","text":"**Bad deploy, code is broken.** `horizon:pause` to stop intake execution, fix, deploy, `horizon:terminate`, `horizon:continue`. Or let it drain and terminate."},
      {"kind":"p","text":"**Failed job handling.** Inspect in Horizon (payload, exception, tags), fix root cause, `queue:retry {id}` or `queue:retry all`; `queue:forget`, `queue:flush` when sure. Build `queue:prune-failed` into your scheduler so the table doesn't grow forever."},
      {"kind":"p","text":"**Deploying.** Standard Forge-style flow: deploy code → `horizon:terminate` → supervisors respawn workers on new code. Remember running jobs finish on old code."},
      {"kind":"p","text":"**Tooling map (current ecosystem):** Horizon = queue control plane; **Telescope** = deep per-job/per-request debugging (dev/staging; it *can* watch jobs richly but is heavy); **Pulse** = lightweight production health aggregation (newer, Laravel 11 era) that complements rather than replaces Horizon."},
    ],
  },
  {
    heading: "8. Contested calls (\"it depends\" — and what it depends on)",
    blocks: [
      {"kind":"list","items":["**Many small jobs vs one big job.** Small: better parallelism, retry granularity, progress visibility; cost: overhead, ordering pain, more failure modes. Chunk big work into batches by default.","**Horizon vs plain `queue:work` + supervisor.** Horizon wins when you want autoscaling/metrics/UI. In Kubernetes, Horizon's model (one master spawning processes per pod) fights the platform's model — many teams instead run `queue:work` pods and scale with KEDA on Redis list length, using Horizon only for the dashboard by running a single replica. Knowing this tension marks you as current.","**Redis vs SQS vs database driver.** Redis: fast, Horizon-eligible, but you're the durability owner. SQS: managed durability, visibility-timeout semantics (same `retry_after` trap, different name), no Horizon. Database driver: legitimately fine at low volume, zero new infra, but polls your primary DB and doesn't scale write-heavy. Beanstalkd is legacy — don't choose it for new work.","**Push-time work vs run-time work.** Resolve everything you can at *dispatch* time only if it can't go stale; otherwise pass IDs and fetch fresh at run time. SerializesModels is the framework nudging you toward fetch-fresh.","**Tries: high with backoff vs fail-fast.** Depends on failure class: idempotent + transient → retry generously; side-effectful + deterministic → fail fast and alert."]},
    ],
  },
  {
    heading: "9. Legacy vs current, in one breath",
    blocks: [
      {"kind":"p","text":"Legacy: `queue:listen`, treating `sync` as a \"good enough\" production driver, queue config buried in `.env` without `retry_after` thought, Telescope as your production queue monitor, Supervisor config copy-pasted per-worker instead of Horizon."},
      {"kind":"p","text":"Current (Laravel 10–12 era): Horizon 5 as the standard Redis control plane, `ShouldBeUnique` / middleware-based throttling instead of hand-rolled locks, batches as the default fan-out primitive, `afterCommit` as a reflex, Pulse alongside Horizon for app health, and queue topology designed per workload class rather than one `default` queue for everything."},
    ],
  },
  {
    heading: "10. Credibility checklist",
    blocks: [
      {"kind":"p","text":"In any design review or incident, ask these six questions and you'll sound like you've operated this before:"},
      {"kind":"list","ordered":true,"items":["\"Is it idempotent under at-least-once delivery?\"","\"What's `timeout`, and is `retry_after` safely above it?\"","\"Which queue, and what else shares that pool?\"","\"What's the retry policy — and are these failures transient or deterministic?\"","\"What happens on deploy to in-flight jobs — drained, or old code to completion?\"","\"How would we *know* it's stuck — which wait threshold alerts, and who gets paged?\""]},
      {"kind":"p","text":"If you can also glance at Horizon and read wait time vs throughput vs runtime to tell \"we need workers\" apart from \"the database is the wall,\" you're operating at the level this lesson aimed for."},
      {"kind":"p","text":"**Self-test:** (a) A payment job with `timeout=180` runs twice and double-charges. Name the likely config bug. (b) Your `low` queue hasn't processed in an hour under `balance: simple`. Why might that be fine — and when is it not? (c) A job is dispatched inside a transaction and intermittently fails with `ModelNotFoundException`. What's the one-word fix? — Answers: (a) `retry_after ≤ 180`; (b) `simple` dedicates fixed processes, so check whether its pool is just busy vs. dead; under `auto` with few total processes, starvation is the risk to check; (c) `afterCommit`."},
    ],
  },
];;
