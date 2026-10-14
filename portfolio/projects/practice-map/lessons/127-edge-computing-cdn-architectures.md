<!--
lesson-meta: {"practicePrompt":"Pick one slow endpoint of a real site and sketch its path through a CDN: where TLS terminates, what the cache key includes, and which Cache-Control directives apply. Then trace a cache miss through the hierarchy — edge to origin shield to origin — and count the round trips saved versus going direct. Finish by explaining when you would purge by surrogate key instead of by URL.","checkPrompt":"Without notes, reproduce the request path — DNS or anycast routing to a PoP, hit versus miss with ETag revalidation returning 304, and request coalescing on a hot expired object. Also state the isolation versus startup versus density tradeoff from VMs to isolates, and where mutable state can live at the edge (KV, Durable Objects, replicas, CRDTs) with the consistency cost of each."}
-->
<!-- lesson-theory: {"problem":"Without this model, latency looks like a server-speed problem, so teams buy bigger machines while users in another hemisphere still wait hundreds of milliseconds. Cache headers, state placement, and origin protection are then chosen blindly, and the bill arrives as a melted origin during the first stampede.","model":"The central model is the cloud-to-thing continuum, driven by one immovable fact: light is only so fast, so latency is dominated by distance and round trips, not by server speed. The whole discipline moves content, computation, and — hardest of all — state closer to users along that continuum. Caching solves read proximity, edge functions extend the move to compute proximity, and the unsolved hard core is write and state proximity.","mechanics":"Caching: Cache-Control directives (max-age, s-maxage, stale-while-revalidate, stale-if-error), TTL with ETag/Last-Modified revalidation returning 304, hit ratio as the central metric, cache keys with Vary, surrogate keys for targeted purges. Hierarchies: edge misses go to an origin shield that aggregates misses, request coalescing collapses a hot expired object into one origin fetch, consistent hashing spreads objects within a PoP, eviction plus admission policies protect cache space. Routing: DNS-based (with EDNS Client Subnet) versus anycast over BGP, then GSLB steering by health, capacity, and latency. Protocols: TLS terminated at the edge, warmed keep-alive connections across the middle mile, HTTP/3 over QUIC removing TCP head-of-line blocking with 0-RTT resumption and connection migration. Programmable edge: V8 isolates, Wasm plus WASI, and microVMs trade isolation against startup time and density; edge functions do routing, JWT validation, personalization, and bot mitigation in the request path. State: eventually consistent edge KV, single-authority Durable Objects (actor model), read replicas with bounded staleness, CRDTs for coordination-free merges — with PACELC pricing every choice.","pitfalls":["Believing faster servers fix latency when round trips over distance dominate","Confusing bandwidth with latency on a high-bandwidth, high-RTT link","Treating edge computing as one lineage instead of CDN, telecom MEC, and device edge","Writing Cache-Control without s-maxage and ignoring how shared caches see it","Designing cache keys that fragment content or leak one user's personalized page to another","Expecting an expired hot object to mean thousands of origin hits and missing request coalescing","Expecting edge KV writes to be instantly visible everywhere; they are eventually consistent","Placing mutable, coordination-heavy state at hundreds of PoPs and hitting CAP and PACELC costs","Assuming anycast picks the lowest-latency PoP when it picks the nearest in BGP terms","Ignoring data gravity and pushing heavy state to the edge without a hybrid plan"],"whenNot":"The lesson does not claim the edge is always the answer: data gravity pulls computation back toward large datasets, and hybrid designs (edge for interaction, core for heavy state) are often correct. It maps telecom and IoT edge vocabulary into the continuum but does not cover 5G radio internals or device firmware in depth. A single-region app with local users needs only the caching basics, not the full distributed machinery."} -->

# Edge Computing & CDN Architectures: From First Principles to the Frontier

## The Fundamental Problem: Physics and Distance

Everything in this field begins with a constraint that no amount of engineering can eliminate: the speed of light. Data traveling through fiber optic cable moves at roughly two-thirds the speed of light in a vacuum—about 200,000 km/s. A round trip from New York to Sydney and back covers some 32,000 kilometers, imposing a floor of roughly 160 milliseconds of latency before a single byte of useful work happens. Add routing hops, queuing delays, TCP handshakes, and TLS negotiation, and you quickly understand why a user in Jakarta experiences a website hosted in Virginia as sluggish no matter how powerful the origin server is.

This is the core insight: **latency is dominated by distance and round trips, not by server speed**. The entire discipline of edge computing and content delivery exists to attack this problem by moving computation and data *closer to users*—geographically, topologically, or both.

## The Vocabulary of Proximity

Before going further, some foundational terms. The **origin** (or origin server) is the authoritative source of content—your application servers, your database, the canonical truth. The **edge** is any infrastructure positioned closer to end users than the origin. A **Point of Presence (PoP)** is a physical location—a data center or rack within a carrier facility—where edge infrastructure lives. Large CDNs operate hundreds of PoPs; some operate thousands of smaller deployments embedded directly inside ISP networks.

**Latency** is the time for data to travel between two points, typically measured as **RTT (round-trip time)**. **Throughput** is the volume of data per unit time. **Bandwidth** is theoretical capacity. These are distinct: you can have a high-bandwidth, high-latency link (satellite internet, historically) or a low-bandwidth, low-latency one. Many application protocols are *latency-bound*, not bandwidth-bound, because they require sequential round trips—which is why cutting RTT often matters more than adding bandwidth. The term **bandwidth-delay product** captures how much data can be "in flight" on a link, and it governs TCP window tuning.

**Last mile** refers to the final connection to the user (their ISP, cellular link, or home network); **middle mile** is the transit between edge locations and origins. CDNs optimize both, but through different mechanisms.

## Caching: The Original Edge Technology

The CDN (Content Delivery Network) emerged in the late 1990s—Akamai being the pioneer—around a simple idea: store copies of content at the edge so most requests never travel to the origin. This is **caching**, and its vocabulary is essential.

A **cache hit** means the edge served the content from local storage; a **cache miss** means it had to fetch from origin (or from another cache tier). The **cache hit ratio (CHR)** is the central performance metric—a CDN running at 95%+ hit ratio has reduced origin load twentyfold. **TTL (time to live)** governs how long an object remains fresh. Objects past their TTL are **stale**, and the cache must **revalidate** them with the origin, typically via conditional requests using **ETags** or **Last-Modified** headers—if the origin responds `304 Not Modified`, the cache can keep serving its copy without re-downloading.

HTTP's `Cache-Control` header is the lingua franca here: directives like `max-age`, `s-maxage` (specifically for shared caches like CDNs), `no-store`, `private`, `public`, and the subtle but powerful `stale-while-revalidate` (serve stale content immediately while refreshing in the background) and `stale-if-error` (serve stale content if the origin is down—turning the cache into a resilience layer).

**Cache invalidation**—famously one of the two hard problems in computer science—is the act of forcibly removing or refreshing cached content before its TTL expires, usually via **purge** APIs. Sophisticated systems use **surrogate keys** or **cache tags**: metadata attached to cached objects allowing you to purge, say, "everything related to product 4711" across millions of URLs in milliseconds.

The **cache key** determines what counts as "the same object." By default it's the URL, but it can incorporate headers, cookies, query parameters, or device type—governed partly by the HTTP `Vary` header. Poorly designed cache keys cause **cache fragmentation** (the same content stored under many keys, destroying hit ratios) or, worse, serving one user's personalized content to another.

Two advanced caching pathologies deserve mention. **Cache stampede** (or thundering herd) occurs when a popular object expires and thousands of simultaneous requests all miss and hammer the origin; the defense is **request coalescing** (also called request collapsing)—the edge sends *one* request to origin and fans the response out to all waiters. **Cache poisoning** is a security failure where an attacker tricks the cache into storing malicious content under a legitimate key, often by exploiting discrepancies in how the cache and origin parse requests—related to **HTTP request smuggling**.

## CDN Architecture: Tiers, Shields, and Hierarchies

A naive CDN is a flat layer of caches, each independently fetching from origin. Real architectures are **hierarchical**. Edge PoPs that miss can fetch from a **mid-tier** or **shield** cache (an **origin shield**)—a designated PoP that aggregates misses from many edges, so the origin sees traffic from one or a few locations rather than hundreds. This dramatically improves effective hit ratios and protects the origin. The term **tiered distribution** describes this cascade.

Within a PoP, **consistent hashing** distributes objects across cache servers so that each object lives on a predictable machine, maximizing in-PoP hit ratios and minimizing redistribution when servers are added or removed. This algorithm—ring-based hashing that maps both objects and servers onto the same keyspace—is foundational across distributed systems, and its refinements (rendezvous hashing, jump hashing, bounded-load consistent hashing) are what keep petabyte-scale caches efficient.

Cache storage itself is tiered: hot objects in RAM, warm objects on NVMe/SSD, with **eviction policies** (LRU—least recently used—and its many smarter descendants like S3-FIFO, LHD, or TinyLFU with admission control) deciding what to keep. **Cache admission** is the underappreciated twin of eviction: deciding whether an object should *enter* the cache at all, since one-hit-wonder objects pollute cache space.

## Request Routing: How Users Find the Edge

How does a user's request land at the nearest PoP? There are two dominant mechanisms.

**DNS-based routing**: when the user resolves `www.example.com`, the CDN's authoritative DNS returns an IP address for a PoP chosen based on the resolver's location (increasingly refined via **EDNS Client Subnet**, which passes part of the user's actual IP to the authoritative server). It's flexible but limited by DNS caching and the fact that users sometimes use distant resolvers.

**Anycast routing**: the same IP address is announced via **BGP (Border Gateway Protocol)** from many PoPs simultaneously; internet routing naturally delivers each packet to the topologically nearest announcement point. Anycast gives fast failover and simplicity, but "nearest in BGP terms" is not always nearest in latency terms, and long-lived TCP connections can theoretically break if routes shift mid-connection (in practice this is rare, and QUIC's connection IDs mitigate it). Many providers (Cloudflare famously) are anycast-first; others (Akamai, traditionally) are DNS-first; hybrids are common.

Beyond initial routing, CDNs perform **global server load balancing (GSLB)**—steering traffic based on real-time PoP health, capacity, and measured latency—and within a PoP, **Layer 4** (connection-level, e.g., via ECMP and consistent hashing in software load balancers like Maglev or Katran) and **Layer 7** (HTTP-aware) load balancing.

## Protocol Optimization: The Middle Mile and the Handshake Wars

A huge, often invisible portion of CDN value comes from protocol mechanics. Terminating **TLS at the edge** means the expensive handshake happens over a short last-mile RTT rather than a transoceanic one. **Connection pooling and keep-alive** between edge and origin means user requests ride pre-warmed, congestion-window-grown connections across the middle mile. **TCP congestion control** variants (CUBIC, and Google's model-based **BBR**) are tuned per path.

The protocol evolution itself is edge-driven history: **HTTP/1.1** suffered head-of-line blocking at the connection level (one slow response blocks others). **HTTP/2** introduced multiplexing many streams over one TCP connection—but TCP itself still imposes head-of-line blocking at the packet level (one lost packet stalls all streams). **HTTP/3** solves this by replacing TCP with **QUIC**, a UDP-based transport with independent streams, built-in TLS 1.3, **0-RTT connection resumption** (returning visitors send data in the very first packet), and **connection migration** (connections survive network changes, like switching from Wi-Fi to cellular—crucial for mobile). CDNs were among the first large deployers of QUIC precisely because they control one end of billions of connections.

**Early hints (HTTP 103)**, **server push** (now largely deprecated), **preconnect/prefetch/preload** resource hints, and **priority signaling** round out the delivery-optimization vocabulary.

## From Delivering Content to Running Code: Edge Computing Proper

The pivotal shift of the last decade: CDNs stopped being passive caches and became **programmable platforms**. This is edge computing in the CDN lineage (distinct from, but converging with, the telecom and IoT lineages—more below).

**Edge functions** or **edge workers** (Cloudflare Workers, Fastly Compute, Akamai EdgeWorkers, AWS Lambda@Edge and CloudFront Functions) let developers run code at every PoP, executing in the request path. The architectural challenge is startup time and density: a PoP may need to run millions of tenants' code with microsecond-level **cold starts**. The solutions define the modern vocabulary:

- **V8 isolates** (Cloudflare's approach): instead of spinning up a container or VM per tenant, run many tenants inside one process using the JavaScript engine's sandboxing. Isolates start in microseconds and share runtime overhead. The tradeoff is a restricted execution model (no arbitrary binaries, limited CPU time).
- **WebAssembly (Wasm)** and **WASI**: a portable, sandboxed binary format allowing near-native-speed code in any language, instantiated in microseconds. Fastly's Compute platform pioneered this; Wasm is increasingly viewed as the universal edge runtime, with **component model** standardization enabling composable, language-agnostic modules.
- **MicroVMs** (Firecracker, used by AWS Lambda): stripped-down virtual machines booting in low milliseconds—stronger isolation than isolates, heavier than Wasm.

The spectrum here is an **isolation/density/startup tradeoff triangle**: VMs (strong isolation, slow, low density) → containers → microVMs → Wasm sandboxes → isolates (weakest hardware-level isolation, fastest, highest density).

Typical edge-function workloads: request rewriting and routing, authentication/authorization (validating **JWTs** at the edge so unauthorized requests never reach origin), A/B testing, personalization of otherwise-cached pages (**edge-side includes**, ESI, were the primitive ancestor of this), geolocation-based logic, bot mitigation, and API composition.

## The State Problem: The Hard Part of Edge Computing

Stateless code at the edge is a solved problem. **State** is where it gets intellectually deep. If your code runs in 300 locations, where does your data live? This runs headlong into the **CAP theorem** (under network partition, choose consistency or availability) and, more practically, into the latency-consistency tradeoff formalized in **PACELC** (even without partitions, lower latency trades against stronger consistency).

The emerging taxonomy of edge state:

- **Edge key-value stores** (Cloudflare Workers KV, Fastly's KV): globally replicated, **eventually consistent**—writes propagate over seconds. Great for configuration and read-heavy data; wrong for counters or coordination.
- **Durable Objects / actor-model state** (Cloudflare Durable Objects): instead of replicating data everywhere, give each piece of state a *single authoritative instance* somewhere in the network, and route all requests for it there. This is the **actor model** at planetary scale—strong consistency per object, with latency determined by distance to the object's home. Objects can migrate toward their traffic.
- **Edge databases and read replicas**: distributed SQL systems (CockroachDB, Spanner-lineage systems, Turso/libSQL, PlanetScale) placing replicas near users, with vocabulary like **follower reads**, **bounded staleness**, and **leaseholder placement**.
- **CRDTs (Conflict-free Replicated Data Types)**: data structures mathematically guaranteed to merge concurrent updates from multiple locations without coordination—counters, sets, sequences that converge deterministically. CRDTs trade expressiveness for coordination-free availability and are foundational to **local-first software** and collaborative editing at the edge.
- **Data gravity**: the observation that computation tends to migrate toward large datasets, not vice versa—a counterforce to edge distribution and the reason many architectures end up hybrid: edge for interaction, core for heavy state.

A related concept is **session affinity / sticky routing**: ensuring a user's successive requests land on the same edge instance holding their state.

## Security at the Edge

Because the edge terminates connections for a vast share of internet traffic, it is the natural enforcement point for security—and this has become inseparable from CDN architecture.

**DDoS mitigation**: anycast networks inherently *dilute* volumetric attacks across the whole network (an attack that would obliterate one data center is absorbed across hundreds of PoPs). Vocabulary: **volumetric attacks** (raw bandwidth floods, amplification via DNS/NTP/memcached reflection), **protocol attacks** (SYN floods, exhaustion of connection state—countered with **SYN cookies**), and **application-layer (L7) attacks** (expensive requests that look legitimate). **Scrubbing centers** are dedicated filtering facilities in older architectures; modern edge-native designs filter at every PoP, often in the kernel or NIC using **XDP/eBPF** for line-rate packet processing.

**WAF (Web Application Firewall)**: L7 inspection at the edge for SQL injection, XSS, and the OWASP catalog, increasingly augmented by ML-based anomaly detection. **Bot management** distinguishes humans, good bots, and bad bots via fingerprinting (TLS fingerprints like **JA3/JA4**, behavioral signals) and challenges. **Rate limiting** at the edge protects origins by counting globally or per-PoP.

**Zero Trust and SASE/SSE**: the edge network doubles as a corporate security perimeter—**ZTNA (Zero Trust Network Access)** replaces VPNs by authenticating every request at the nearest PoP, with **Secure Access Service Edge** being the Gartner-coined umbrella for converging networking and security in the edge cloud.

TLS at the edge raises key-custody questions: **Keyless SSL** lets the CDN terminate TLS without holding the customer's private key (the handshake's private-key operation is remoted to a key server). **mTLS** (mutual TLS) secures edge-to-origin links; **origin cloaking** hides origin IPs so attackers can't bypass the edge.

## The Other Edge Lineages: Telecom, IoT, and the Compute Continuum

"Edge computing" means different things in different industries, and the mature vocabulary distinguishes them.

**MEC (Multi-access Edge Computing)** is the telecom lineage: compute placed inside the mobile network—at base stations or aggregation points—standardized by ETSI, tightly coupled to **5G**. 5G's relevant concepts: **network slicing** (virtual networks with guaranteed characteristics carved from shared infrastructure), **URLLC** (ultra-reliable low-latency communication, targeting ~1ms air-interface latency), and the **UPF (User Plane Function)** whose placement determines where traffic can "break out" to local compute. MEC targets use cases where even CDN-edge latency is too high: vehicle-to-everything (**V2X**), AR/VR rendering offload, industrial robotics.

**Fog computing** (a Cisco-coined term, somewhat faded) describes a continuum of compute between cloud and devices, especially for IoT. The **far edge** or **device edge** means compute on or adjacent to the device itself—gateways in factories, smart cameras, vehicles. Here the drivers are not only latency but **bandwidth economics** (a factory generating terabytes of sensor data per day cannot ship it all to the cloud; filter and aggregate locally), **autonomy** (systems must function when disconnected—"offline-first"), **data sovereignty and residency** (regulations like GDPR constraining where data may travel—edge processing keeps raw data in-jurisdiction), and **privacy** (process video locally, transmit only events).

The unifying mental model is the **cloud-to-thing continuum**: hyperscale regions → cloud availability zones → regional/metro edge → CDN PoPs → telecom MEC → on-premise edge → gateways → devices. Each hop toward the device buys latency, autonomy, and privacy at the cost of capacity, consistency, and operational simplicity. **Workload placement**—deciding where along this continuum each function runs, statically or dynamically—is arguably *the* central architectural decision of the field.

## Operating Distributed Edges: Orchestration and Observability

Running software across hundreds or thousands of heterogeneous, capacity-constrained, sometimes-disconnected locations is an operations problem unlike cloud operations.

**Orchestration**: Kubernetes dominates, with edge-specific distributions (**K3s**, **KubeEdge**, **MicroK8s**) and patterns for fleets—**GitOps** (declarative desired state in version control, with agents pulling and reconciling—essential when you can't push to disconnected sites). **Over-the-air (OTA) updates**, staged rollouts, and **canary deployments** per-PoP. The edge inverts cloud assumptions: capacity is scarce (you can't autoscale a cell tower), hardware is heterogeneous, and the network between control plane and data plane is unreliable—hence designs where edge sites remain fully functional when disconnected from the mothership (**control plane/data plane separation** taken to its logical extreme: the data plane must never depend on the control plane's availability).

**Observability**: aggregating logs and metrics from thousands of sites is a bandwidth problem in itself; the pattern is local aggregation, sampling, and streaming summaries. **Real User Monitoring (RUM)** measures actual user experience (Core Web Vitals: LCP, INP, CLS) versus **synthetic monitoring** from test probes. CDN-specific metrics: cache hit ratio by tier, origin offload, time-to-first-byte (**TTFB**), error rates per PoP, and **p99 latency**—at the edge, tail latencies matter more than averages because every user hits some tail.

## Economics and Peering: The Business Physics

CDN economics rest on network topology. **Transit** is paid wholesale internet connectivity; **peering** is settlement-free (usually) direct interconnection between networks at **Internet Exchange Points (IXPs)**. A CDN with rich peering delivers traffic cheaply and with fewer hops. **On-net caching** (Netflix Open Connect, Google Global Cache, Akamai's embedded servers) goes further: cache appliances placed *inside ISP networks*, so popular content never crosses an inter-network boundary at all—the logical endpoint of the proximity principle. **95th percentile billing**, **egress costs** (the notorious cloud-egress fee structure that edge providers increasingly weaponize against hyperscalers), and **origin offload** (the fraction of traffic the CDN absorbs) are the commercial vocabulary.

**Multi-CDN** architectures route across several providers for resilience and price arbitrage, steered by RUM data—introducing the meta-problem of a routing layer above the CDNs.

## The Frontier: Where the Field Is Going

**Edge AI inference** is the current frontier: running ML models at PoPs (GPU-equipped edges, model quantization and distillation to fit constrained hardware) for low-latency inference—speech, vision, and increasingly LLM serving where **time-to-first-token** is the latency-sensitive metric. **Federated learning** inverts the data flow: train models across distributed edge data without centralizing it, sharing only gradients—intersecting with **differential privacy**.

**Confidential computing** (TEEs—trusted execution environments like Intel SGX/TDX, AMD SEV, Arm CCA) addresses the trust problem of running sensitive workloads on physically less-secure edge hardware: encrypt data even during computation, with **remote attestation** proving the code is what it claims.

Architectural patterns consolidating around the edge: **Jamstack** and its successors (pre-rendered content served from the edge, dynamic behavior via edge functions), **ISR (incremental static regeneration)**, **edge-side rendering** of frameworks, **local-first software** built on CRDTs with the edge as sync fabric, and **event-driven edge** architectures using distributed queues and pub/sub with regional fan-out.

And looming over everything: the observation that the distinction between "CDN," "edge platform," and "cloud" is dissolving. Cloudflare, Fastly, and Akamai add compute, storage, and databases; AWS, Google, and Azure push regions, Local Zones, Wavelength zones, and Outposts outward. The industry is converging on a single abstraction—**the distributed cloud**: write code once, declare its latency, residency, and consistency requirements, and let a global scheduler place it along the continuum. We are not there yet; workload placement, state distribution, and the economics of scarce edge capacity remain genuinely open problems. But the trajectory is clear, and it was set by that original, immovable fact: light is only so fast, and users are everywhere.

---

**If you retain one synthesis**: CDNs solved *read* proximity (caching static content near users); edge computing extends this to *compute* proximity (running logic near users); the unsolved hard core is *write and state* proximity (keeping mutable, consistent data near users)—and every major concept in this field, from consistent hashing to CRDTs to Durable Objects to PACELC, is a different weapon aimed at that same target.
