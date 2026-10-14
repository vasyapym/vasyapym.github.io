<!-- lesson-meta: {"practicePrompt":"Pick one slow, read-heavy endpoint in a project you know and design its cache on paper: choose the pattern (cache-aside or read-through), the granularity, the TTL policy and the invalidation story. Then name which of the failure modes — stampede, penetration, avalanche, hot key — your design is still exposed to and what defends each, and check yourself against the essay's strategy questions.","checkPrompt":"From memory: separate eviction (space), expiration (time) and invalidation (truth); write the effective access time formula and reason in miss ratio, not hit ratio; explain why delete beats update on writes and which race TTLs bound; and list the stampede defenses (request coalescing, distributed locks, stale-while-revalidate, probabilistic early expiration) plus the HTTP directives people most often misread (no-cache, s-maxage, Vary)."} -->
<!-- lesson-theory: {"problem":"Caching is easy to add and easy to get subtly wrong: teams treat it as an optional optimization, then discover it is load-bearing infrastructure — when the hit ratio drops from 99.9 to 99 percent, the database receives ten times the load it was provisioned for, and what looked like a rounding error becomes the outage.","model":"A cache is a bet on locality — temporal, spatial and Zipf-skewed popularity — paid for with staleness. Every layer from a CPU cache line to a CDN repeats the same handful of decisions: what is worth keeping (eviction and admission), how copies are created (read and write patterns), how long a lie may survive (invalidation), and what happens when the bet fails (stampede and degradation defenses). Master that vocabulary once and the same ideas recur at every scale.","mechanics":"Read and write patterns: cache-aside keeps the application in control and degrades gracefully; read-through centralizes loading; write-through buys freshness with latency; write-behind buys write speed with durability risk; write-around keeps write-once data out of the cache. Eviction versus admission: LRU fails on scan pollution, LFU never forgets, and modern policies (SLRU, ARC, W-TinyLFU with its Count-Min Sketch admission filter) mix recency with frequency — deciding whether a new item gets in at all is often the stronger lever against one-hit wonders. The invalidation ladder: TTL-only with jitter, explicit deletes, event-driven invalidation off change data capture, versioned and generational keys, tag-based surrogate keys; delete beats update because it is idempotent under concurrency, and the delayed-reader race is why TTLs stay as a safety net. Failure modes and defenses: request coalescing, distributed locks, stale-while-revalidate and XFetch-style probabilistic early expiration against stampedes; negative caching and Bloom filters against penetration; TTL jitter, high availability and gutter pools against avalanche; in-process front caches and key replication against hot keys; splitting big values before they stall a single-threaded engine like Redis. HTTP semantics as the CDN skill: max-age versus s-maxage, no-cache meaning revalidate rather than do-not-cache, ETag and If-None-Match 304s, Vary fragmentation with header normalization, surrogate keys with soft purge, fingerprinted immutable assets, microcaching, and stale-if-error as resilience. Consistency and safety: cache-aside buys bounded staleness at best, read-your-writes is the property users actually notice, and cache keys are an interface — omit a dimension such as locale, tenant or permissions and one user sees another user's data.","pitfalls":["Reasoning in hit ratio instead of miss ratio: 99 to 99.9 percent is a tenfold change in backend load.","Treating the cache as a nice-to-have once the system depends on it: losing it is an outage.","Updating the cache on writes: update is not idempotent under concurrency; delete is.","Pairing explicit invalidation with no TTL: the late-reader race can poison a key indefinitely.","Reading no-cache as do-not-cache: it means revalidate before every use.","Letting a shared cache store a response containing one user's private data under a key another user can hit.","Running a big sequential scan against an LRU cache and flushing every genuinely hot item.","Ignoring serialization cost and cached-format versioning across deploys and rollbacks.","Leaving an unkeyed input that influences the response: the door to cache poisoning and web cache deception.","Purging hard instead of soft: a soft purge avoids sending a miss storm at the origin."],"whenNot":"This is a strategy guide, not an operations manual: it does not cover cluster sizing, backup and recovery procedures or vendor pricing, and it does not claim cache-aside designs can deliver consistency stronger than bounded staleness."} -->

# Caching Strategies: Redis, CDNs, and Application-Level Caching, from Basics to Advanced

Each section starts with the core idea in plain language and then goes deeper. Beginners can read the opening paragraphs of each section and skip ahead. Professionals will find the depth further in.

---

## Part 1: Why Caching Exists

### The one-sentence version

A cache is a smaller, faster store that keeps copies of data from a larger, slower store, betting that you will ask for the same data again soon.

### The physics behind it

Computing has a storage hierarchy, and each level trades capacity for speed. Rough orders of magnitude:

- A CPU's L1 cache answers in about a nanosecond.
- Main memory answers in about a hundred nanoseconds.
- An SSD random read takes tens of microseconds.
- A network round trip inside a data center takes around half a millisecond.
- A database query that touches disk and does real work takes several milliseconds to hundreds.
- A request crossing an ocean pays 70 to 150 milliseconds just for light in fiber and router hops.

These gaps span six to eight orders of magnitude. Caching is the discipline of exploiting them. Every serious system is a stack of caches: CPU caches, the operating system's page cache, the database's buffer pool, an application's in-memory maps, a shared cache like Redis, a CDN at the network edge, and the browser's cache on the user's device.

### Why caching works at all: locality

Caches only help because real access patterns are not random. Two properties matter:

- **Temporal locality**: something accessed recently is likely to be accessed again soon.
- **Spatial locality**: things near a recently accessed item are likely to be accessed too.

On top of that, real-world popularity is usually heavily skewed, often modeled with a **Zipf distribution**: a small number of items get most of the requests. The top one percent of products, articles, or users can account for a large share of traffic. That skew lets a cache holding a tiny fraction of the data serve a large fraction of requests.

### The fundamental trade

A cache holds a copy, and copies can become wrong. Every caching decision balances three things:

- **Freshness**: how up to date the data is.
- **Performance**: latency and throughput.
- **Complexity**: how much machinery you need to keep things correct.

Phil Karlton's famous line, "There are only two hard things in computer science: cache invalidation and naming things," is funny because it is true. Caching is easy. Knowing when a cached thing is no longer true is hard.

---

## Part 2: Core Vocabulary

### Basic terms

- **Hit**: the requested data is in the cache.
- **Miss**: it is not, so you fetch from the slower **backing store**, also called the **origin** or **source of truth**.
- **Hit ratio**: hits divided by total requests.
- **Miss ratio**: one minus the hit ratio.
- **Miss penalty**: the extra cost paid on a miss.
- **Cold cache**: empty, as after a restart.
- **Warm cache**: populated and serving hits.
- **Cache warming** (or **priming**): deliberately pre-filling a cache before it takes traffic.
- **Key**: the identifier you look data up by.
- **Value**: the cached data itself.
- **TTL (time to live)**: how long an entry may live before it is considered expired.
- **Eviction**: removing entries to make room when the cache is full.
- **Expiration**: removing or invalidating entries because their time is up.
- **Invalidation**: marking or removing entries because the underlying data changed.

Eviction is about space, expiration is about time, and invalidation is about truth. Mixing these three up is a common source of confusion.

### Freshness terms

- **Stale**: an entry that no longer matches the source of truth.
- **Fresh**: an entry within its allowed lifetime. Note that fresh in the HTTP sense means "within its declared lifetime," not "guaranteed correct."
- **Working set**: the set of data actively in use over some window. If the working set fits in the cache, hit ratios are high. If it doesn't, the cache **thrashes**, constantly evicting things it will need again.

### Going deeper: think in miss ratio

The simplest performance model is the **effective access time**:

> Average latency ≈ hit ratio × hit latency + miss ratio × (miss latency + any overhead)

The important insight is to reason about miss ratio, not hit ratio, because misses are what reach your backend. Going from a 99 percent to a 99.9 percent hit ratio sounds like a rounding error. In fact it cuts backend traffic by a factor of ten. Conversely, a cache dropping from 99.9 to 99 percent sends ten times the load to a database that may have been provisioned assuming the cache works.

This leads to one of the most important operational truths in caching. Once a system depends on a cache to survive its load, the cache is no longer an optimization. It is load-bearing infrastructure, and losing it is an outage.

Another subtle measure is **byte hit ratio** versus **request hit ratio**. A CDN might serve 95 percent of requests from cache but only 70 percent of bytes, if large video files miss more often. Which one matters depends on whether you care about origin request load or bandwidth cost.

---

## Part 3: How Data Gets Into and Out of the Cache

These are the canonical read and write patterns. Every caching layer, from a Python dictionary to a global CDN, uses some combination of them.

### Cache-aside (lazy loading)

This is the most common pattern in application code. The application checks the cache first. On a hit, it uses the value. On a miss, it reads from the database, writes the result into the cache, and returns it. The cache knows nothing about the database; the application orchestrates everything.

- **Strengths**: simplicity, resilience (if the cache dies, the app still works, just slower), and only caching what is actually requested.
- **Weaknesses**: the first request for any item always misses, and keeping cache and database consistent on writes is entirely your problem.

### Read-through

Like cache-aside, except the cache itself is responsible for loading missing data. The application only talks to the cache, which calls a loader function or talks to the backing store on a miss. Libraries like Caffeine in Java, and many CDN configurations, work this way. It centralizes loading logic and makes it easier to add features like request coalescing.

### Write-through

On every write, the application writes to the cache and the cache synchronously writes to the database, and the write succeeds only when both have it. The cache is always populated with recent writes and reads are rarely stale. The cost is higher write latency, and you may cache data that is never read.

### Write-behind (write-back)

Writes go to the cache, which acknowledges immediately and flushes to the database asynchronously, often batching or coalescing multiple writes to the same key. Write performance is excellent and database load drops. The danger is durability: if the cache fails before flushing, acknowledged writes are lost. This is the same pattern CPU caches and operating system page caches use, which is why `fsync` exists.

### Write-around

Writes go straight to the database, bypassing the cache, and the corresponding cache entry is typically invalidated. This avoids polluting the cache with data written once and rarely read, such as logs or bulk imports.

### Refresh-ahead

The cache proactively refreshes entries that are popular and about to expire, so users rarely see a miss. It works well when access patterns are predictable and wastes work when they aren't.

### Going deeper: update the cache, or delete from it?

When data changes, should you write the new value into the cache, or delete the cache entry and let the next read repopulate it?

The industry consensus for cache-aside is usually to **delete**. Delete is idempotent and simpler to reason about under concurrency. Updating the cache from two concurrent writers can leave the cache holding the older value if the operations interleave unluckily.

Even delete has a famous race. Consider this sequence:

1. Reader A misses the cache and reads the old value from the database.
2. Writer B updates the database and deletes the cache key.
3. Reader A, delayed by a garbage collection pause or a slow network, writes the old value into the cache.

The cache now holds stale data indefinitely, or until its TTL expires. This is why TTLs are a safety net even when you have explicit invalidation: they bound how long any bug or race can poison your data.

Mitigations, in increasing order of rigor:

- **Delayed double delete**: delete the key, then delete it again a short time later to catch late writers.
- **Versioning**: only write to the cache if your version is newer than what's there, using compare-and-set operations.
- **Leases**: the approach from Facebook's "Scaling Memcache at Facebook" paper (NSDI 2013). On a miss, the cache hands the client a lease token. A delete invalidates outstanding leases. When the client later tries to fill the cache, the fill is rejected if its lease was invalidated in the meantime. Leases also throttle how often a given key can be refilled, which helps with stampedes.

---

## Part 4: Eviction Policies

### The basic idea

When a cache is full and something new must go in, something old must come out. The eviction policy decides what.

### The common policies

- **FIFO**: evict the oldest inserted item regardless of use.
- **Random**: surprisingly decent in some workloads, and cheap.
- **LRU (Least Recently Used)**: evict the item not accessed for the longest time. This is the default mental model for most engineers.
- **LFU (Least Frequently Used)**: evict the item accessed the fewest times.
- **TTL-based**: evict whatever expires soonest.

### Going deeper: the theoretical optimum

The provably optimal policy is **Belady's MIN algorithm**: evict the item whose next use is furthest in the future. It is unimplementable because it requires knowing the future. It still matters as the benchmark against which real policies are measured, usually through offline simulation on recorded traces.

### Going deeper: why LRU and LFU each fail

LRU's weakness is **scan pollution**. A single sequential scan over a large dataset, such as a batch job or a crawler, can flush every genuinely hot item out of the cache, because each scanned item was "recently used."

LFU's weakness is that it never forgets. Something popular last week can squat in the cache forever. LFU also has trouble giving new items a chance to build up frequency.

### Going deeper: modern policies

Modern policies combine recency and frequency:

- **SLRU (Segmented LRU)**: splits the cache into a probationary segment for items seen once and a protected segment for items seen more than once.
- **2Q**: similar in spirit to SLRU.
- **ARC (Adaptive Replacement Cache)**, by Megiddo and Modha at IBM: keeps recency and frequency lists plus "ghost" lists that remember recently evicted keys (not values). It uses ghost hits to dynamically tune the balance between recency and frequency.
- **CLOCK** and its variants: approximate LRU cheaply using a circular buffer and reference bits. Operating systems use this family for page replacement.
- **W-TinyLFU**, by Einziger, Friedman, and Manes: used in Java's Caffeine library, it is one of the strongest general-purpose policies known. A small "window" LRU admits new items. A main region uses SLRU. An **admission filter** decides whether a candidate deserves to displace an existing item, based on a frequency estimate held in a **Count-Min Sketch**, a compact probabilistic counter. The counters are periodically halved so the policy ages out old popularity.

W-TinyLFU illustrates a key conceptual distinction: **admission policy** versus **eviction policy**. Deciding what to evict is only half the problem. Deciding whether a new item should get in at all is often the more powerful lever, especially against one-hit wonders. In many CDN workloads, a large fraction of objects are requested exactly once, and admitting them only pushes out useful content.

### Going deeper: modeling hit ratios analytically

The **Che approximation** (Che, Tung, and Wang, 2002) models an LRU cache as having a single characteristic time. An item stays in the cache if it is requested again within that time. This gives remarkably accurate hit ratio predictions under independent request models.

**Miss ratio curves**, which plot miss ratio against cache size, are the tool for capacity planning. They show where adding memory stops helping, and they reveal "cliffs" where a slightly larger cache suddenly captures an entire working set.

---

## Part 5: Invalidation Strategies

### The basic idea

When the source data changes, cached copies need to be updated or removed. The options range from "let time handle it" to "propagate every change precisely."

### TTL-only

Accept that data may be stale for up to the TTL. This is simple, robust, and often good enough. A product description cached for five minutes rarely hurts anyone.

The art is choosing TTLs per data type based on how costly staleness is versus how costly misses are. A practical refinement is **TTL jitter**: add randomness to TTLs so items cached at the same moment don't all expire at the same moment.

### Explicit invalidation

When code writes to the database, it also deletes or updates the relevant cache keys. This works until the mapping from data to cache keys becomes complicated. One user record might appear in a profile cache, a friends-list cache, a search result cache, and a rendered page fragment. Missing any one of them produces a stale-data bug.

### Event-driven invalidation

Instead of relying on application code to remember every key, you subscribe to the database's change stream and invalidate based on that. Common sources:

- Binary log, write-ahead log, or change data capture (CDC) tools like Debezium.
- Database triggers.
- Message queues.

Facebook's "mcsqueal" daemons tailed the MySQL commit log and issued invalidations to memcache. This decouples invalidation from application logic and catches writes from every source, including manual fixes and batch jobs.

### Versioned and generational keys

Instead of deleting entries, change the key. If a user's data is at version 42, the key might include "v42"; when it changes to 43, readers naturally look up a new key and the old entry simply ages out.

**Namespace generation counters** extend this to groups. Store a generation number for, say, "all of tenant X's data," include it in every key, and increment it to invalidate everything for that tenant in a single atomic operation. The old entries become unreachable garbage that eviction eventually reclaims.

### Tag-based invalidation

Attach tags to entries, such as "product:123" or "category:shoes," and purge by tag. CDNs call these **surrogate keys** or **cache tags**. Some application frameworks support them too.

### Going deeper: consistency models for caches

A cache is a form of replication, so the vocabulary of distributed consistency applies:

- **Strong consistency (linearizability)**: every read sees the latest write. This is essentially unattainable with a cache-aside design without coordination that destroys the performance benefit.
- **Eventual consistency**: replicas converge if writes stop.
- **Bounded staleness**: data is at most some amount of time or number of versions behind. TTLs give you bounded staleness, as long as nothing re-caches old data.
- **Read-your-writes consistency**: a user always sees their own updates. This is often the property users actually notice. A common trick is to bypass or refresh the cache for a user's own data for a short time after they write. Another is pinning that user's reads to the primary database briefly.
- **Monotonic reads**: a user never sees data go backward in time, which can happen when different requests hit different cache nodes or replicas.

The CPU world solved its version of this with hardware coherence protocols like **MESI**, in which caches snoop or use directories to invalidate each other. Distributed application caches rarely get anything that rigorous. That is why designers must decide explicitly which consistency guarantees they need, rather than assuming the cache behaves like the database.

---

## Part 6: Failure Modes Every Engineer Should Know

### Cache stampede (thundering herd, dogpile)

**The problem**: a popular key expires, and hundreds or thousands of concurrent requests all miss at once. They all hit the database simultaneously to recompute the same value. If that computation is expensive, the database can collapse, causing more timeouts, more misses, and a feedback loop.

**Solutions**:

- **Request coalescing**: also called request collapsing, or "singleflight" after the Go library. Only one request per key computes the value; others wait for its result.
- **Distributed locks**: the first request to miss takes a lock in Redis and recomputes. Others either wait, retry, or serve stale data.
- **Stale-while-revalidate**: keep serving the expired value while one background task refreshes it.
- **Probabilistic early expiration**: formalized in the XFetch algorithm by Vattani, Chierichetti, and Lowenstein (2015). Each request, as expiry approaches, independently decides with increasing probability to recompute early. The probability is scaled by how long recomputation takes. In the usual formulation, a request recomputes if the current time, minus recompute duration × a tuning constant beta × the natural log of a uniform random number, reaches the expiry time. Because the log of a number between zero and one is negative, this effectively pushes "now" forward by a random amount. The result is that, statistically, one request refreshes the value shortly before expiry, with no coordination required.

### Cache penetration

**The problem**: requests for keys that don't exist in the database at all. Since there's nothing to cache, every request misses and hits the database. This can be accidental or a deliberate attack using random IDs.

**Solutions**:

- **Negative caching**: cache the "not found" result with a short TTL.
- **Bloom filter**: a probabilistic structure that can definitively say an item is not in a set, while having a small false-positive rate for items it says are present. Placed in front of the cache, it rejects requests for keys that certainly don't exist.

### Cache avalanche

**The problem**: a large portion of the cache becomes unavailable at once, either because many keys expire simultaneously or because a cache cluster goes down.

**Solutions**:

- TTL jitter.
- High availability for the cache tier.
- Circuit breakers and rate limiting in front of the database.
- Graceful degradation.
- For restarts, persistence or warm-up procedures.

### Hot keys

**The problem**: a single key receives so much traffic that the one cache node owning it becomes a bottleneck, even though the cluster as a whole is idle. A celebrity's profile or a flash-sale item can do this.

**Solutions**:

- A small in-process cache in front of the shared cache for very hot keys.
- Replicating the key under multiple suffixed names and reading from a random copy.
- Read replicas.

### Big keys

**The problem**: a single huge value, such as a multi-megabyte JSON blob or a hash with millions of fields. It consumes network bandwidth, causes latency spikes when read or deleted, and in single-threaded systems like Redis can block everything else while being processed.

**Solutions**: split large values, paginate collections, and use asynchronous deletion.

### Going deeper: metastable failures

Caching is a classic cause of **metastable failure**: a system that is stable under normal load but, once pushed into a bad state, stays there even after the trigger disappears.

Here is a typical sequence. A cache cluster restarts and comes back cold. The database can't handle the full miss load, so requests time out. Timeouts trigger retries, which add load. The cache never warms because database queries never complete. The system stays down until operators shed load manually.

The defenses:

- Serve stale data on error.
- Limit concurrency to the backing store.
- Use backoff and retry budgets.
- Warm caches deliberately before routing traffic.
- Use **gutter pools**: a fallback cache tier that absorbs traffic when a primary cache node fails, so its keys don't fall straight through to the database. Facebook described this pattern.

---

## Part 7: Application-Level Caching

### The basic idea

This is caching done inside or alongside your application code: memoizing function results, keeping hot objects in memory, caching database query results, or caching rendered fragments of pages.

### In-process caches

The fastest cache is memory in the same process, with no network hop and no serialization. Examples:

- Python's `functools.lru_cache`.
- Java's Caffeine and Guava caches.
- A simple concurrent hash map with expiry.

Access costs are in nanoseconds to microseconds.

The tradeoffs:

- **Limited size**: you're bounded by the process's memory.
- **Garbage collection pressure**: large heaps of cached objects can cause long GC pauses in managed runtimes. Some libraries store data off-heap to avoid this.
- **Duplication**: every instance of your service has its own copy, so memory efficiency is poor.
- **Coherence**: when data changes, each instance's local copy must be invalidated somehow. Usual approaches are short TTLs, or broadcasting invalidation messages over pub/sub.

### Memoization

Caching the result of a function based on its arguments. It is only correct for **pure functions**, whose output depends solely on their inputs and which have no side effects. Memoizing something that secretly depends on the current time, the current user, or mutable global state is a classic bug.

### Distributed caches

A shared cache service like Redis or Memcached, accessed over the network. All application instances see the same data, the cache survives application deploys, and capacity scales independently. The cost is a network round trip, usually sub-millisecond in the same data center, plus serialization.

### Multi-tier caching

Combine both into an **L1/L2 design**:

- **L1**: a small in-process cache.
- **L2**: a shared distributed cache.
- **Backing store**: the database.

Reads check L1, then L2, then the database. The L1 absorbs hot keys and cuts network traffic dramatically. The challenge is keeping L1 coherent.

Redis 6 introduced **client-side caching with server-assisted invalidation**, which addresses this directly. With the `CLIENT TRACKING` command, the Redis server remembers which keys each client has read and pushes invalidation messages when those keys change. This uses push messages on the RESP3 protocol, or a redirected pub/sub connection on the older RESP2. A **broadcasting mode** lets clients subscribe to invalidations by key prefix instead, which costs the server less memory. Some vendors call this pattern a **near cache**.

### Granularity: what exactly do you cache?

- **Raw database rows or objects**: cache by primary key. Easy to invalidate, but assembling a page may require many cache lookups.
- **Query results**: cache the result of a specific query. High value, but hard to invalidate, because any change to any underlying row may affect the result.
- **Computed or aggregated results**: dashboards, recommendations, counts. Often the biggest wins, since they are expensive to compute and tolerant of staleness.
- **Rendered fragments**: HTML or serialized responses for parts of a page.
- **Full responses**: the entire HTTP response, at which point you are effectively doing what a CDN or reverse proxy does.

Rails popularized **Russian doll caching**: nested fragment caches whose keys include the updated-at timestamps of their contents. When an inner item changes, its key changes. Touching the parent's timestamp then changes the outer key, while unchanged sibling fragments remain cached and are reused.

### Going deeper: serialization is a hidden cost

Converting objects to bytes for a distributed cache often costs more CPU than the network round trip. Large JSON documents are slow to parse. Binary formats like Protocol Buffers or MessagePack, along with compression algorithms like LZ4 or Zstandard for large values, can matter more than the choice of cache engine.

Version your cached formats too. Deploying new code that can't read the old cached format, or old code during a rollback that can't read the new format, is a recurring production incident. Including a schema version in the key or value is a cheap defense.

### Going deeper: cache keys are an interface

A good key design is:

- **Deterministic**: the same logical request always produces the same key.
- **Collision-free**: different requests never share a key.
- **Namespaced**: by service, entity type, and tenant.

Including too little in the key, such as forgetting the user's locale or permissions, causes one user to see another user's data. That is both a correctness bug and potentially a serious security incident. Including too much, such as a timestamp or a random request ID, makes the hit ratio collapse to zero.

---

## Part 8: Redis in Depth

### The basic idea

Redis is an in-memory data store. It keeps everything in RAM, which makes it extremely fast, and it is most often used as a cache, though it is also used for queues, session storage, rate limiting, leaderboards, and more.

Unlike a simple key-value cache, Redis understands data structures, so you can manipulate a value on the server rather than fetching it, modifying it, and writing it back.

### Data types

- **Strings**: arbitrary bytes, up to 512 megabytes, with atomic increment operations.
- **Hashes**: field-value maps, good for objects.
- **Lists**: ordered sequences, usable as queues or stacks.
- **Sets**: unordered unique members, with intersections and unions.
- **Sorted sets**: members ordered by a score. Ideal for leaderboards, priority queues, time-indexed data, and sliding-window rate limiters.
- **Streams**: append-only logs with consumer groups.
- **Bitmaps and bitfields**: compact flags and counters.
- **HyperLogLog**: approximate cardinality counting, roughly 12 kilobytes per counter at about 0.81 percent standard error, regardless of how many items you count.
- **Geospatial indexes**: built on sorted sets.

Modules and newer versions add JSON documents, search, probabilistic structures, and vector similarity.

### The execution model

Redis executes commands on essentially a single main thread with an event loop. Each command is therefore atomic with no locking, and individual operations are fast and predictable.

Since Redis 6, network I/O can be offloaded to additional threads, but command execution remains serialized. The consequence is crucial: one slow command blocks everyone. Dangerous commands include:

- `KEYS` on a large database. Use `SCAN` instead, which iterates incrementally.
- Huge `SMEMBERS` or `HGETALL` calls.
- `DEL` on a giant collection. Use `UNLINK`, which reclaims memory in a background thread.
- Expensive Lua scripts.

### Expiration

Redis expires keys two ways:

- **Lazily**: when a key is accessed, Redis checks whether it has expired and deletes it if so.
- **Actively**: a background cycle runs several times per second, governed by the `hz` setting. It samples keys that have TTLs, deletes the expired ones, and repeats while a substantial fraction of the sample (classically more than 25 percent) turns out to be expired.

Consequently, expired keys can occupy memory briefly, and mass expirations can cause CPU bursts.

### Eviction (maxmemory-policy)

When memory reaches the configured `maxmemory`, Redis follows the eviction policy:

- `noeviction`: reject writes with errors. This is the right choice when Redis is a primary datastore, not a cache.
- `allkeys-lru` / `volatile-lru`: approximate LRU across all keys, or only keys with a TTL.
- `allkeys-lfu` / `volatile-lfu`: approximate LFU.
- `allkeys-random` / `volatile-random`: random eviction.
- `volatile-ttl`: evict keys with the nearest expiry.

### Going deeper: Redis's approximate LRU and LFU

Redis does not maintain a true LRU linked list, which would cost memory for every key. Instead:

- **LRU**: each key stores a 24-bit clock of its last access. On eviction, Redis samples a handful of keys (the `maxmemory-samples` setting, default 5) and evicts the best candidate, keeping a small pool of good candidates across rounds. With a sample size around 10, it closely approximates true LRU.
- **LFU**: it reuses the same bits for a logarithmic, Morris-style probabilistic counter. An 8-bit value represents access counts up to around a million, tuned by `lfu-log-factor`. A decay mechanism (`lfu-decay-time`) reduces counts over time so old popularity fades.

### Persistence

Despite being in-memory, Redis can persist data in two ways:

- **RDB snapshots**: Redis forks a child process, which writes a point-in-time dump. Copy-on-write in the operating system makes the fork cheap at first. However, a write-heavy workload during the snapshot can nearly double memory usage as pages get copied, which is a classic cause of out-of-memory kills.
- **AOF (Append-Only File)**: logs every write command. The `fsync` policy is `always` (safest, slowest), `everysec` (the default, risking about one second of writes), or `no` (let the OS decide). The AOF is periodically rewritten to compact it.

Many deployments use both. For pure caching, persistence is often disabled entirely, or kept only to speed up warm restarts.

### Replication and high availability

Redis replication is **asynchronous**: the primary acknowledges writes before replicas have them. If the primary fails, acknowledged writes can be lost. The `WAIT` command lets a client block until a number of replicas acknowledge, which reduces the risk but does not give full strong consistency.

**Redis Sentinel** monitors primaries and automates failover in non-clustered setups.

### Redis Cluster

Redis Cluster shards data across nodes:

- The keyspace is divided into **16,384 hash slots**. A key's slot is the CRC16 of the key modulo 16,384.
- Each primary owns a range of slots. Clients are redirected with `MOVED` responses when slots have permanently moved, and `ASK` responses during migration.
- Multi-key operations, transactions, and scripts only work when all keys are in the same slot.
- **Hash tags** force related keys into the same slot. If a key contains a substring in curly braces, only that substring is hashed, so `user:{42}:profile` and `user:{42}:settings` land together. Overusing a single hash tag recreates the hot-shard problem.

### Atomicity tools

- **Pipelining**: sends many commands without waiting for each reply, eliminating per-command round trips. This is often a ten-fold throughput gain, but it is not atomic.
- **`MULTI`/`EXEC` transactions**: queue commands and execute them as a block with no interleaving. There is no rollback on errors within the block.
- **`WATCH`**: adds optimistic concurrency. If a watched key changes before `EXEC`, the transaction aborts and you retry.
- **Lua scripts and Redis Functions**: run atomically on the server, enabling compound operations like "check and set if version is newer," which helps with the invalidation races described earlier.

### Going deeper: distributed locks and the Redlock debate

The simple Redis lock is `SET key value NX PX 30000`: set only if absent, with a 30-second expiry. Release it with a script that deletes the key only if the value matches your unique token, so you never release someone else's lock.

**Redlock** extends this across multiple independent Redis nodes. Martin Kleppmann famously critiqued it, arguing that locks based on timing assumptions cannot guarantee safety under process pauses, clock jumps, and network delays. A client can pause after acquiring a lock, have the lock expire, and then wake up and write anyway. His recommended fix is **fencing tokens**: monotonically increasing numbers checked by the storage system, which rejects writes from stale lock holders. Salvatore Sanfilippo (antirez), Redis's creator, responded defending Redlock under its stated assumptions.

The practical takeaway:

- Redis locks are fine for **efficiency**, such as avoiding duplicate work during a stampede.
- For **correctness**, where two holders would corrupt data, you need fencing or a consensus system like ZooKeeper or etcd.

### Memory realities

Redis uses the jemalloc allocator, and long-running instances can suffer **fragmentation**, where the operating system reports far more memory than the data uses. Active defragmentation can help.

Small collections use compact encodings, called **listpacks** (formerly ziplists) and **intsets**, that save huge amounts of memory but switch to full structures beyond configurable size thresholds. Designing data to stay under those thresholds, for example by splitting objects across many small hashes, is a known optimization.

### The ecosystem in 2024–2025

In 2024 Redis moved from the BSD license to a dual source-available license. The Linux Foundation then launched **Valkey**, a fork of Redis 7.2 backed by major cloud providers, which has since added significant multithreading improvements. In 2025 Redis added the AGPL as an additional licensing option. Functionally, the core concepts in this section apply to both projects.

### Memcached comparison

Memcached is the older, simpler alternative:

- Multithreaded, so it scales vertically across cores easily.
- Only string values.
- No persistence and no replication.
- A **slab allocator** that groups items into size classes. This can cause "slab calcification" when your value-size distribution shifts.

Memcached remains excellent for pure, simple, high-throughput caching. Redis wins when you need data structures, persistence, or replication.

---

## Part 9: CDNs and HTTP Caching

### The basic idea

A Content Delivery Network is a globally distributed set of servers that cache content close to users. Instead of every user fetching your image from a server in Virginia, users in Tokyo get it from a server in Tokyo. This cuts latency, reduces load and bandwidth costs on your servers, and absorbs traffic spikes and some kinds of attacks.

### CDN vocabulary

- **Origin**: your actual server.
- **Edge server**: a CDN server near users.
- **PoP (point of presence)**: a CDN location.
- **Cache key**: what the CDN uses to decide whether two requests are "the same." By default this is usually the URL, scheme, and host, and it can be customized.
- **Purge (invalidation)**: removing content from CDN caches.
- **Origin shield**, also called **tiered caching**: an intermediate cache layer between edges and origin. Without it, a cache miss at each of 300 edge locations becomes 300 requests to your origin. With a shield, edges fetch from the shield, which fetches from the origin once.

### Routing

Users reach the nearest PoP via one of two methods:

- **Anycast**: the same IP address is announced from many locations, and internet routing delivers packets to a topologically near one.
- **DNS-based steering**: the DNS server returns different IPs based on the resolver's location.

### HTTP caching semantics (RFC 9111)

CDNs, browsers, and reverse proxies all speak the same caching language, defined in the HTTP caching standard. Understanding these headers is the single most valuable skill for CDN work.

**Cache-Control** is the main header. Key directives:

- `max-age=N`: the response is fresh for N seconds.
- `s-maxage=N`: same, but only for shared caches like CDNs. It overrides max-age there, letting you cache longer at the CDN than in browsers.
- `public`: any cache may store this, even if it would otherwise be considered private, such as responses to authenticated requests.
- `private`: only the end user's browser may store this, not shared caches.
- `no-cache`: the most misunderstood directive. It does **not** mean "don't cache." It means "you may store this, but you must revalidate with the origin before every use."
- `no-store`: actually means don't store this anywhere.
- `must-revalidate`: once stale, you must not serve this without successful revalidation.
- `immutable`: this resource will never change during its freshness lifetime, so browsers shouldn't even revalidate on reload.
- `stale-while-revalidate=N`: after expiry, you may serve stale content for up to N seconds while refreshing in the background.
- `stale-if-error=N`: if the origin is failing, you may serve stale content for up to N seconds. This is a hugely valuable resilience tool.

**Other freshness headers**:

- `Expires`: the older, absolute-date version of max-age.
- `Age`: how long the response has sat in caches.

If no explicit freshness is given, caches may apply **heuristic freshness**, commonly 10 percent of the time since `Last-Modified`. This is a frequent source of "why is this cached?" mysteries.

**Validators and conditional requests**: when a cached response is stale, the cache can ask the origin whether it has changed instead of downloading it again.

- `ETag`: an opaque version identifier. Strong ETags mean byte-identical. Weak ETags, prefixed with `W/`, mean semantically equivalent.
- `Last-Modified`: a timestamp.

The cache sends `If-None-Match` with the ETag, or `If-Modified-Since` with the date. If nothing changed, the origin replies **304 Not Modified** with no body, saving bandwidth and often origin work.

**Vary** tells caches which request headers change the response. For example, `Vary: Accept-Encoding` means gzip and Brotli versions are cached separately. Varying on high-cardinality headers like `User-Agent` or `Cookie` fragments the cache into near uselessness. CDNs typically **normalize** such headers into a small set of buckets, such as mobile versus desktop, or a few supported languages.

**Targeted headers**: `Surrogate-Control`, and the standardized `CDN-Cache-Control` (RFC 9213), let you give the CDN instructions separate from those for browsers. A common pattern is caching at the edge for a long time while purging on change, while telling browsers to revalidate frequently.

### Cache busting and fingerprinting

The best invalidation is never needing to invalidate. For static assets like JavaScript, CSS, and images, put a content hash in the filename, such as `app.3f9a2c.js`, and serve with a long max-age plus `immutable`. When content changes, the filename changes, the HTML references the new name, and the old file simply stops being requested. Only the HTML itself then needs a short lifetime or revalidation.

This is the versioned-key pattern from application caching, applied to the web.

### Purging

- **By URL**: precise but tedious.
- **By prefix or wildcard**: where supported.
- **By surrogate key or cache tag**: tag responses at the origin, such as "product-123," and purge every response carrying that tag in one call.
- **Soft purge**: marks content stale rather than deleting it, so it can still be served under stale-while-revalidate or stale-if-error rules while the refresh happens. This avoids sending a miss storm to the origin.

Global purge propagation ranges from milliseconds to minutes, depending on the provider.

### Caching dynamic content

CDNs aren't just for static files:

- **Microcaching**: caching dynamic responses for one to a few seconds. On a page receiving a thousand requests per second, a one-second TTL turns a thousand origin hits into one, with staleness nobody notices.
- **Request collapsing at the edge**: the CDN equivalent of singleflight.
- **Edge Side Includes (ESI)**: lets a page be assembled at the edge from separately cached fragments with different lifetimes.
- **Edge compute platforms**: let you run code at the edge, so you can personalize a cached shell or compute cache keys intelligently.

### Going deeper: personalized and authenticated content

The cardinal rule: never let a shared cache store a response that contains one user's private data under a key another user can hit. Responses that depend on cookies or authorization should be `private` or `no-store`, unless the cache key explicitly includes the identity dimension.

Many CDNs refuse to cache responses with `Set-Cookie`, or requests with `Authorization`, by default, for exactly this reason. Overriding those defaults without understanding them is how data leaks happen.

### Going deeper: security attacks on caches

- **Cache poisoning**: an attacker finds an **unkeyed input**, such as a header like `X-Forwarded-Host`, that influences the response but isn't part of the cache key. They craft a request so that the poisoned response gets cached and served to everyone else. James Kettle's research at PortSwigger made this a well-known attack class. The defense: anything that influences the response must be in the cache key or stripped before reaching the origin.
- **Web cache deception**: the reverse. The attacker tricks a victim into requesting something like `/account/profile.css`. The origin ignores the fake extension and returns the private profile page, while the CDN sees ".css" and caches it publicly. The attacker then fetches it.

Both attacks come from a mismatch between how the cache and the origin interpret a request.

### Going deeper: large objects

Video and large downloads use **range requests**. CDNs often cache large files in fixed-size **slices**, so a user seeking to the middle of a video doesn't force the edge to fetch the whole file.

---

## Part 10: The Rest of the Stack

### Browser caching

Browsers have:

- An HTTP cache governed by the same headers described above.
- An in-memory cache for the current session.
- A **back/forward cache** that keeps entire pages alive for instant navigation.

**Service workers** give developers a programmable cache with explicit strategies such as cache-first, network-first, and stale-while-revalidate. This is the basis of offline-capable progressive web apps.

### DNS caching

DNS caching uses TTLs on records and is the oldest large-scale distributed cache on the internet. Long DNS TTLs reduce lookup latency but slow down failover. That is a perfect miniature of the freshness-versus-performance trade.

### Database-internal caches

- The database's **buffer pool** caches disk pages.
- The operating system's **page cache** caches files.
- Some databases have **query result caches**. MySQL removed its query cache in version 8.0 because its global invalidation lock hurt scalability on write-heavy workloads, which is a good cautionary tale.
- **Materialized views** are precomputed query results stored as tables. They are essentially a cache maintained by the database, with refresh strategies that mirror everything in this guide.

### Reverse proxy caches

Varnish, Nginx's proxy cache, and similar tools sit in front of your application inside your own infrastructure. They apply HTTP caching semantics, often with powerful configuration languages for custom cache keys and logic.

---

## Part 11: Designing a Caching Strategy

When deciding what and how to cache, a seasoned engineer works through roughly these questions:

1. **What is slow or expensive, and is it read far more than it's written?** Caching shines on read-heavy, write-light data. Caching write-heavy data mostly adds invalidation cost.
2. **How stale can this data be without harm?** Seconds, minutes, or never? This sets your TTLs and determines whether you need active invalidation.
3. **What's the access distribution?** Highly skewed popularity means a small cache captures most of the benefit. A flat distribution may need a cache nearly as large as the dataset.
4. **Where should the cache live?** Closest to the user is fastest but hardest to invalidate: browser, then CDN, then reverse proxy, then in-process, then shared cache, then the database's own buffers. Often you use several layers with progressively shorter lifetimes toward the source of truth.
5. **What happens on a miss storm or a cache outage?** If the answer is "the database dies," you need stampede protection, stale serving, and capacity planning that assumes cache failure.
6. **What's the invalidation story?** TTL-only, explicit deletes, change-data-capture events, versioned keys, or tags? Who is responsible, and what catches the cases they miss?
7. **What could leak?** Check keys for every dimension that affects the response: user, tenant, locale, permissions, feature flags, and API version.
8. **How will you observe it?** Monitor:
   - Hit ratio, sliced by key type.
   - Eviction rate. High evictions plus a low hit ratio means the cache is too small or the admission policy is poor.
   - Latency percentiles, especially p99. Tail latency matters enormously when one page fans out into dozens of cache lookups, because the page is as slow as its slowest lookup.
   - Memory and fragmentation.
   - Hot keys and big keys.
   - Origin load.

### The mental model in one paragraph

A cache is a bet on locality, paid for with staleness. Every strategy in this guide manages one side of that bet:

- **Eviction and admission policies** decide what's worth keeping.
- **Read and write patterns** decide how copies are created and updated.
- **Invalidation strategies** decide how long a lie can survive.
- **Stampede, penetration, and avalanche defenses** keep the cache from becoming the cause of the outage it was meant to prevent.
- **Layering** (browser, CDN, application, Redis, database) multiplies the benefit and multiplies the places where truth can go stale.

Master the vocabulary, and you'll find the same handful of ideas repeated at every scale, from a CPU's cache line to a CDN spanning six continents.
