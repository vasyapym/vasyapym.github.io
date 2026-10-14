<!--
lesson-meta: {"practicePrompt":"Take a read path in a project you know and name its pattern (cache-aside, read-through, write-through, write-behind), then write down per key what staleness is acceptable and which consistency model your invalidation actually delivers. Finish by reproducing on paper the cache-aside race that installs a stale value and naming which mechanism — leases, single-flight, or a TTL — would stop it.","checkPrompt":"Without notes, reproduce the model spectrum — linearizability, sequential, causal, session guarantees, eventual — with one anomaly each rules out; re-derive the cache-aside race interleaving; and explain why PACELC, not CAP, is the right frame for a cache."}
-->
<!-- lesson-theory: {"problem":"Without this vocabulary, teams argue about cache correctness in vague words like 'fresh' and 'eventually right', then get burned by races and stampedes they had no name for. The pain surfaces as user-visible weirdness — your own write not appearing, a value moving backward — that nobody can trace to a cause.","model":"A cache is a deliberate, controlled inconsistency: a copy allowed to disagree with the source of truth in exchange for speed. Consistency models form a contract spectrum — linearizability, sequential, causal, session guarantees, eventual — that specifies which read results are allowed given the write history. Because a cache exists to cut latency, it lives on the weak end of PACELC; the real work is choosing which specific anomalies to rule out, not demanding 'strong consistency' everywhere.","mechanics":"Partitioning spreads the keyspace with consistent hashing and virtual nodes so only about 1/N of keys move when a node joins or leaves, while Redis Cluster instead reassigns 16,384 fixed hash slots; replication adds copies of the data for availability and read throughput; cache-source patterns — cache-aside with invalidate-on-write, read-through, write-through, write-behind, refresh-ahead — trade latency, durability, and freshness differently, and on writes you invalidate rather than update because deletes are idempotent and order-insensitive; stampede defenses are request coalescing (Facebook's leases), probabilistic early expiration (XFetch), TTL jitter, and stale-while-revalidate; session guarantees (read-your-writes, monotonic reads and writes, writes-follow-reads) come cheap via sticky sessions or client version tokens; the operating rule is explicit invalidation with a TTL as a safety net, because invalidation messages eventually get lost.","pitfalls":["Reading CAP as 'pick two of three' — partitions are not optional; the choice is what happens during one","Expecting a normal cache to be linearizable; coordinating every read defeats the purpose of caching","Treating a TTL as the freshness strategy instead of a safety net behind explicit invalidation","Updating the cache on writes instead of deleting; order-dependent updates can permanently install a stale value","Missing the cache-aside race where a slow reader re-installs an old value after the writer's invalidation","Assuming eventual consistency says anything about what you can read in the meantime; it is only a liveness promise","Believing consistent hashing balances load; it balances keys, and a hot key still overloads one shard","Conflating sequential consistency with linearizability; sequential allows reads behind wall-clock time","Using write-behind and then treating the cache as if it had database-grade durability","Setting one consistency policy for all data instead of per-key decisions based on the cost of staleness"],"whenNot":"This lesson is about data caches in front of a source of truth; it does not cover CPU hardware caches, CDN edge configuration, or database replication protocols in depth. It also does not claim any single pattern is best — the choice belongs to the data and the business, key by key."} -->

# Distributed Caching and Consistency Models

*A lesson in how fast systems lie to you, and how to choose which lies are acceptable*

---

## Part I: The Problem Caching Solves

Every computer system is shaped by a basic fact: fast storage is small and expensive, and large storage is slow and cheap. A CPU register answers in under a nanosecond. Main memory takes about a hundred nanoseconds. A round trip across a datacenter network takes around half a millisecond. A query against a busy relational database that has to touch disk can take tens of milliseconds or more. Across that range, the slowest and fastest differ by roughly seven orders of magnitude, which is about the difference between one second and four months.

A **cache** is the engineering answer to this gap. It keeps a copy of some data in a faster place, betting that the data will be asked for again soon. The bet usually pays off because real workloads are skewed. A small fraction of the data (the popular user profiles, the trending product, the current session) receives most of the requests. This is often described with Zipfian distributions, and it is the empirical fact that makes caching worthwhile. If access were uniformly random across a huge dataset, caches would hardly help.

The most important idea in this lesson is this: **a cache is a copy, and a copy can disagree with the original.** Once you have two places holding "the same" data, you have to answer an awkward question: *when they disagree, what is the truth, and what is a reader allowed to see?*

That question is what **consistency models** exist to answer. Phil Karlton's well-known line, "There are only two hard things in computer science: cache invalidation and naming things," is a joke about exactly this.

---

## Part II: From One Cache to Many

Consider a single application server with an in-memory hash map holding recent database results. This is a **local cache**. It is very fast, with no network hop, but it has two weaknesses. Its capacity is limited to one machine's memory, and when you run twenty application servers you have twenty independent caches. Each warms up separately, each holds its own copy, and each can disagree with the others.

A **distributed cache** such as Memcached, Redis Cluster, Hazelcast, or Apache Ignite moves the cached data into a dedicated tier of machines that every application server shares. This gives you pooled memory across many nodes and a single logical cache that all clients see. In exchange, you now have a distributed system, and distributed systems bring their own problems.

Two mechanisms make a cache tier "distributed," and they serve different purposes.

### Partitioning (sharding): spreading the data

If you have a terabyte of cached data and machines with 64 GB of RAM each, you need to split the keyspace across nodes. The naive method is `node = hash(key) mod N`. It works until you add or remove a node. When N changes, nearly every key maps to a different node. Your hit rate collapses, and every request falls through to the database at once.

**Consistent hashing**, introduced by Karger et al. in 1997, fixes this. Picture the hash space as a ring. Each node is hashed to one or more points on the ring, and each key belongs to the first node found clockwise from the key's own hash. When a node joins or leaves, only the keys in its arc of the ring move, which on average is about 1/N of the data. Real implementations place each physical node at many points on the ring, called **virtual nodes**, so that load evens out and a departing node's keys are scattered across many survivors instead of landing on one neighbor.

(Redis Cluster takes a related approach: it uses 16,384 fixed **hash slots** assigned to nodes. Moving data means reassigning slots, which is simpler to reason about operationally.)

### Replication: copying the data

Partitioning gives you capacity. **Replication** gives you availability and read throughput by storing each piece of data on more than one node. If the primary for a key dies, a replica can take over.

Replication also means you now have copies of copies. The database is the source of truth, the cache primary holds a copy, and the cache replicas hold copies of that. Each of these links can lag.

---

## Part III: How Data Moves Between Cache and Source

Before discussing consistency in the abstract, it helps to see the concrete patterns that connect a cache to its database. Each pattern has its own consistency profile.

**Cache-aside (lazy loading).** This is the most common pattern. The application handles everything. To read, check the cache; on a miss, read the database, store the result in the cache, and return it. To write, update the database and then *invalidate* (delete) the cache entry. The cache stays ignorant of the database, which is simple and robust: if the cache tier disappears, the system gets slower but stays correct. The drawback is that some subtle race conditions remain, covered below.

**Read-through.** This is like cache-aside, except the cache does the loading. On a miss, the cache fetches from the database through a configured loader. Application code is cleaner, and the consistency properties are about the same.

**Write-through.** Writes go to the cache, and the cache synchronously writes them to the database before acknowledging. The cache stays fresh, but every write pays two latencies, and you cache data that may never be read.

**Write-behind (write-back).** Writes go to the cache and are acknowledged right away. The cache flushes them to the database asynchronously, often in batches. Write performance is excellent. The risk is that if a cache node dies before flushing, acknowledged writes are lost. You have effectively made the cache a database, without the durability guarantees a database provides.

**Refresh-ahead.** The cache proactively reloads popular entries shortly before they expire, so readers seldom see a miss.

These patterns are not simply better or worse than one another. They sit at different points on a tradeoff among latency, durability, and freshness, and that tradeoff is what the rest of the lesson formalizes.

---

## Part IV: Consistency Models

A **consistency model** is a contract between a data system and its users. It specifies which values a read may return, given the history of writes. Stronger models allow fewer surprising results and are easier to program against. They also cost more in latency, availability, or both.

It helps to think of the models as a spectrum, roughly ordered from strongest to weakest.

### Linearizability: the illusion of one copy

**Linearizability** was formalized by Herlihy and Wing in 1990. It is the strongest commonly discussed model for single objects. It promises that the system behaves as if there were exactly one copy of the data and every operation took effect atomically at some instant between its start and its finish.

In practice, once any read has returned a new value, every later read, from any client anywhere, must also return that value or something newer. There is no going back in time and no client seeing a value that another client has already seen overwritten.

This model is the most intuitive, because it matches how we imagine a single variable behaves. It is also expensive. Making replicas agree on a single order of operations requires coordination, usually a consensus protocol such as Raft or Paxos, or routing all operations through a single leader. Coordination costs network round trips, and during a network partition some nodes must refuse to answer.

### Sequential consistency: one order, not necessarily real time

**Sequential consistency** (Lamport, 1979) relaxes the real-time requirement. All clients must agree on *some* single total order of operations, and each client's own operations must appear in the order that client issued them. That agreed order does not have to match wall-clock time. If you write at 12:00:00 and I read at 12:00:01, I may still see the old value, as long as everyone sees the same overall sequence.

### Causal consistency: respecting cause and effect

**Causal consistency** relaxes further. Operations that are *causally related* must be seen in the same order by everyone. Operations that are *concurrent*, meaning neither could have influenced the other, may be seen in different orders by different observers.

The usual example: Alice posts "I lost my job." Then, having seen her post, Bob replies "So sorry to hear that!" Bob's reply was caused by Alice's post. Under causal consistency, nobody can see Bob's reply without Alice's post. If Carol, on the other side of the world, posted an unrelated photo at the same moment, different users may see the photo and Alice's post in different orders, which is harmless.

Causal consistency is interesting theoretically because it is close to the strongest model that can remain available during network partitions. It is much cheaper than linearizability and still prevents most anomalies that confuse humans.

### Session guarantees: consistency as one user experiences it

Many real systems don't promise anything global. Instead they promise things from *a single client's point of view*. These **session guarantees** were formalized by Terry et al. in 1994 for the Bayou system:

- **Read-your-writes.** After you write something, your later reads will reflect it. This is the guarantee people notice most when it's missing: you update your profile picture, refresh, and see the old one.
- **Monotonic reads.** Once you've seen a value, you won't later see an older one. Without this, refreshing a page can make a comment appear, vanish, and reappear as your requests hit replicas at different lag.
- **Monotonic writes.** Your writes are applied in the order you issued them.
- **Writes-follow-reads.** If you read a value and then write, your write is ordered after the value you read.

These are cheap to provide, often by keeping a user "sticky" to one replica or by tracking a version token on the client, and they remove a large share of user-visible weirdness.

### Eventual consistency: it will converge, at some point

At the weak end is **eventual consistency**, popularized in Werner Vogels' 2008 writing about Amazon's systems. Its only promise is that if writes stop, all replicas will *eventually* converge to the same value.

The guarantee is very weak. It does not say how long convergence takes, and it says nothing about what you might read in the meantime: stale values, values that move backward, or different values from different replicas. It is a *liveness* property (something good eventually happens) with no *safety* property (nothing bad happens along the way).

Even so, eventual consistency is extremely useful. It allows maximum availability and minimum latency, and for a large class of data, such as like counts, recommendation lists, and product view counters, brief staleness doesn't matter.

A stronger variant, **strong eventual consistency**, guarantees that any two replicas that have received the same set of updates are in the same state, with no conflict-resolution step needed. This is what **CRDTs** (Conflict-free Replicated Data Types) provide. They are data structures such as counters, sets, and registers whose merge operation is commutative, associative, and idempotent, so the order in which updates arrive doesn't affect the result.

---

## Part V: Why You Can't Have Everything (CAP and PACELC)

Why not choose linearizability everywhere and be done? Because of a theorem.

The **CAP theorem**, conjectured by Eric Brewer in 2000 and proven by Gilbert and Lynch in 2002, says that when a network **P**artition occurs, a distributed system must choose between **C**onsistency (in the linearizable sense) and **A**vailability (every request to a non-failed node gets a response). If two halves of your cluster can't communicate and a client writes to one half, the other half can either refuse requests, giving up availability, or serve possibly stale data, giving up consistency.

CAP is often misread as "pick two of three." That framing is wrong, because partitions are not optional. Networks fail, and you don't get to opt out. The real choice is what you do *when* a partition happens.

Daniel Abadi's **PACELC** formulation (2012) adds the part CAP leaves out: *if* there is a **P**artition, choose **A** or **C**; **E**lse, in normal operation, choose between **L**atency and **C**onsistency. This is the tradeoff you face every day, not just during rare failures. Strong consistency requires coordination, coordination requires round trips, and round trips add latency even when the network is healthy.

This matters a great deal for caches. **A cache exists to reduce latency.** Its purpose is to sit firmly on the "L" side of PACELC. A cache that coordinates on every read to guarantee linearizability usually defeats its own purpose. This is why most production caches are eventually consistent with respect to their source of truth, and why the real engineering work is in limiting how stale they get and in which ways.

---

## Part VI: Where Caches Go Wrong

This section moves from theory to the failures that cause real outages.

### The cache-aside race

Cache-aside looks safe: write to the database, then delete the cache key. Consider this interleaving between a reader R and a writer W, with the cache initially empty for key `k`:

```
1. R: cache miss on k
2. R: reads k from DB → gets value v1
3. W: writes v2 to DB
4. W: deletes k from cache   (nothing there to delete)
5. R: writes v1 into cache   ← stale value installed
```

The cache now holds `v1` indefinitely, or until its TTL expires, even though the database holds `v2`. The reader's slow fetch let it install a stale value *after* the writer's invalidation had already happened.

Facebook described this exact problem in **"Scaling Memcache at Facebook"** (Nishtala et al., NSDI 2013), and their solution is worth knowing: **leases**. On a miss, the cache gives the client a lease token. The client may set the value only by presenting that token. If a delete for the key arrives in the meantime, the cache invalidates the token, and the stale write in step 5 is rejected. The same mechanism also handles the next problem.

### Delete, don't update

A related rule of thumb: on writes, *invalidate* the cache entry instead of *updating* it with the new value. If two writers update the database in order A then B, but their cache updates arrive in order B then A because of network timing, the cache ends up holding A permanently, which is wrong. Deletes are idempotent and don't depend on order. The worst outcome of a delete is a later cache miss.

### Thundering herds and cache stampedes

Suppose a popular key, say the homepage's featured content read 50,000 times per second, expires. In the next few milliseconds thousands of requests miss at once, all query the database for the same value, and the database falls over. This is a **cache stampede**, also called the **thundering herd** or **dog-piling**.

Several defenses are in use:

- **Request coalescing / single-flight.** Only one request per key is allowed to go to the database. The others wait for its result. Facebook's leases do this as well: only the lease holder may fill the key, and others briefly wait or accept a slightly stale value.
- **Probabilistic early expiration.** Each reader, as expiry approaches, has a small and increasing probability of refreshing the value early. Vattani, Chierichetti, and Lowenstein (2015) showed an optimal form of this, often called **XFetch**, where the chance of early recomputation rises exponentially toward expiry and is scaled by how long recomputation takes. Refreshes end up spread out over time instead of happening all at once.
- **TTL jitter.** Add randomness to expiration times so that keys populated together don't all expire together.
- **Stale-while-revalidate.** Serve the expired value right away while refreshing it in the background. This is an explicit trade of freshness for availability, and HTTP caching has a header for it.

### Hot keys

Consistent hashing spreads *keys* evenly, but it does not spread *load* evenly. A single extremely popular key, such as a celebrity's profile during a news event, lives on one shard, and that shard becomes the bottleneck. Common fixes are replicating hot keys across several nodes (and reading from a random replica), adding a small local cache on application servers in front of the distributed cache, or splitting the key into `k#1 … k#n` copies.

The local cache layer brings back the multi-copy consistency problem from Part II. That is a recurring pattern in this field: each performance fix tends to create a new consistency question.

### Replication lag and cross-region invalidation

When caches are replicated across regions, invalidations have to cross oceans. Facebook's paper describes a "remote marker" technique: when a user in a non-primary region writes data, the system records that the key is in flux, so that the same user's subsequent reads go to the primary region instead of a lagging local replica. This is a concrete implementation of **read-your-writes**, built specifically because eventual consistency alone produced user-visible anomalies.

---

## Part VII: Thinking Like a Practitioner

How do you turn all this into decisions? Experienced engineers tend to ask a few questions about each piece of cached data.

**What is the cost of staleness?** A like count that is ten seconds behind costs nothing. An account balance that is ten seconds behind could allow a double-spend. A permission revocation that is ten seconds behind is a security incident. Consistency requirements belong to *the data and the business*, not to the infrastructure. Many systems sensibly use different strategies for different keys.

**Who notices?** Users mostly notice anomalies in their *own* actions, such as not seeing their own write or seeing a value move backward. Session guarantees like read-your-writes and monotonic reads often provide most of the perceived correctness for a small fraction of the cost of global strong consistency.

**What bounds the staleness?** A TTL is a safety net, not a strategy. Explicit invalidation gives freshness in the normal case, and the TTL limits the damage when invalidation fails, which it eventually will because messages get lost. Having both is the norm.

**What happens when the cache disappears?** If losing the cache tier would overwhelm your database, then the cache is no longer an optimization. It has become critical infrastructure and should be engineered and monitored that way. Facebook's "gutter pools," spare cache servers that absorb load from failed ones, exist for this reason.

**Is the cache a source of truth?** If you use write-behind, or if data exists only in the cache, then the cache is a database, and you need to think about durability, replication, and consistency with the rigor that a database requires.

---

## Summary

A cache is a deliberate, controlled inconsistency that you accept in exchange for speed. Consistency models give you precise vocabulary for describing that inconsistency:

- **Linearizable:** the system behaves like a single copy.
- **Sequential:** everyone sees the same order, though not necessarily real-time order.
- **Causal:** causes are always seen before their effects.
- **Session guarantees:** you see your own writes, and your view never moves backward.
- **Eventual:** replicas converge once writes stop.

CAP and PACELC explain why you can't simply choose the strongest model: consistency requires coordination, and coordination costs latency and availability. Since a cache's whole purpose is low latency, it will almost always operate in weaker territory. The skill lies in deciding *which* anomalies to rule out (stale overwrites, backward reads, missing your own writes) and choosing mechanisms (leases, invalidation, versioning, session affinity, stampede protection) that rule them out without giving up the speed the cache was added for.

---

### Further Reading

- Herlihy & Wing, *Linearizability: A Correctness Condition for Concurrent Objects* (1990)
- Terry et al., *Session Guarantees for Weakly Consistent Replicated Data* (1994)
- Karger et al., *Consistent Hashing and Random Trees* (1997)
- Gilbert & Lynch, *Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services* (2002)
- Vogels, *Eventually Consistent* (2008)
- Abadi, *Consistency Tradeoffs in Modern Distributed Database System Design* (2012)
- Nishtala et al., *Scaling Memcache at Facebook* (NSDI 2013), one of the most practically useful papers on caching
- Vattani et al., *Optimal Probabilistic Cache Stampede Prevention* (VLDB 2015)
- Kleppmann, *Designing Data-Intensive Applications*, chapters 5 and 9, the best book-length treatment of these ideas
