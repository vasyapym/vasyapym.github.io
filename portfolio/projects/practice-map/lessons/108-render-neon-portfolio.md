<!-- lesson-meta: {"practicePrompt":"Pick one of the six project shapes (durable workflow engine, financial ledger, collaborative incident workspace, permission-aware search, telemetry with SLOs, preview-environment control plane) and define one invariant, one failure mode, and the demonstration that proves recovery. Verify: actually kill the worker after an external side effect and show what idempotency, the outbox and reconciliation do for you; a five-minute failure demo beats twenty screenshots of the happy path.","checkPrompt":"From memory reproduce the core boundary: a PostgreSQL transaction makes database changes all-or-nothing but cannot cover the outgoing HTTP call bundled with them — hence the transactional outbox, idempotency keys and reconciliation instead of any exactly-once promise. Add double-entry postings in integer minor units, RLS for tenancy, CRDT merge versus transactional authorization, event time versus processing time, and reconciliation as the control-plane mental model."} -->
<!-- lesson-theory: {"problem":"Pet projects easily turn into showcases of technologies: a pretty dashboard, a workflow editor, a chat with PDFs — yet they collapse when a senior engineer asks what happens if the service dies after moving money. The pain is a weak correctness story, not missing features: without an answer the project looks advanced but does not demonstrate senior engineering.","model":"Render is the execution layer: it runs the API, background workers, cron jobs and static sites; Neon is the durable memory: managed PostgreSQL that survives crashes and deployments. Keep application instances mostly stateless, store durable state in the database, keep large files in object storage. A project's strength comes not from the number of technologies but from the ability to explain: what must always be true, what can fail, how the system behaves when it does, and where the evidence is. The central boundary: a PostgreSQL transaction makes database changes all-or-nothing but cannot include an ordinary outgoing HTTP request — that is where serious backend engineering lives. Six flavors of correctness appear across the projects: reliable execution via a durable workflow engine, financial consistency in a double-entry ledger, collaborative convergence with CRDTs, information security in permission-aware retrieval, time-dependent telemetry with SLOs, and infrastructure reconciliation in a preview-environment control plane.","mechanics":"Durable workflow engine: a durable state machine in the database, job claiming with FOR UPDATE SKIP LOCKED, leases with expiry for recovering abandoned work, conditional updates against obsolete workers, idempotency, a transactional outbox, and pinning executions to a workflow version. Financial ledger: double-entry accounting with balanced postings per currency committed together, integer minor units or defined decimals, immutable journal entries with reversing corrections, ordered account locks or serializable transactions with retries, authoritative balances for spending rules, and a CQRS-style read projection rebuilt for verification. Collaborative incident workspace: Yjs CRDTs for mergeable text, transactional commands for permissions and sensitive actions, pub/sub for ephemeral presence, and recovery from persisted updates after a restart. Permission-aware search: hybrid full-text and pgvector retrieval, versioned chunking during reingestion, authorization enforced before content reaches the model, retrieved documents treated as untrusted input, and an evaluation dataset with an abstention policy. Telemetry and SLOs: explicit event time versus processing time, deduplication without double-counting, schema versioning, backpressure under lag, measured PostgreSQL optimizations, and mergeable histograms because p95s cannot be averaged. Preview control plane: reconciliation of desired versus actual state across GitHub, Render and Neon, retryable provisioning stages, cleanup and expiry policy, and database branches created from sanitized data with credentials kept away from pull-request code.","pitfalls":["A beautiful editor with no failure story: whether the project looks advanced or senior depends on evidence of recovery","Believing the outbox gives exactly-once delivery: local effects can be deduplicated, external effects need the receiver's cooperation or reconciliation","Storing money in floats: integer minor units and an immutable journal are the entry fee","Editing a running workflow's definition without version pinning, silently changing the meaning of in-flight executions","Relying on application filters alone for tenancy: row-level security with a non-owner runtime role catches forgotten WHERE clauses","Branching a production database into preview environments as if it were sanitized","Treating every piece of collaborative state as a CRDT: permissions and workflow actions deserve transactional commands, since mergeable does not mean authorized","Letting the model guard secrets: access control must constrain retrieval and source fetching before content reaches the model","Averaging p95 latency values across replicas or workers instead of merging histograms","Hiding known limitations and failing to publish the workload and measurement method behind performance claims"],"whenNot":"Seniority is demonstrated by decisions, not by a fashionable language or a microservice map: a modular monolith plus one worker is the sane default, and Render or Neon are not zero-cost or production-like at free tiers, so plan limits, cold starts, polling costs and connection pooling need checking up front."} -->

# Render + Neon: pet projects that demonstrate senior-level engineering

Render and Neon are a strong combination for portfolio projects because they let you spend less time managing servers and more time solving difficult software problems.

Think of **Render as the execution layer**: it runs your frontend, APIs, background workers, and scheduled jobs. Think of **Neon as the durable memory of the system**: it provides PostgreSQL, where your application stores information that must survive crashes and deployments.

The strongest projects are not necessarily the ones with the most technologies. They are the ones where you can explain:

> “Here is what must always be true. Here is what can fail. Here is how the system behaves when it does. Here is the evidence.”

That is the difference between a project that looks advanced and one that demonstrates senior engineering.

Below are six projects that work well with this stack. Each explores a different kind of correctness: reliable execution, financial consistency, collaborative convergence, information security, time-dependent data, and infrastructure reconciliation.

## First, understand the basic architecture

For most of these projects, begin with one codebase deployed as two Render services: an API and a background worker. The API handles interactive requests; the worker performs slower or retryable work. Both connect to Neon.

A frontend can be a Render static site, or a web service if it needs server-side rendering. Render cron jobs can handle periodic maintenance, such as cleaning up expired resources.

Keep application instances mostly stateless. A process can restart, so important work cannot exist only in its memory. Store durable state in Neon. For large uploaded files, consider separate object storage rather than treating either the application filesystem or PostgreSQL as an unlimited file bucket.

The central architectural lesson is this:

**A PostgreSQL transaction can make database changes all-or-nothing. It cannot automatically make those changes and an ordinary outgoing HTTP request all-or-nothing.**

Much of serious backend engineering happens at that boundary.

---

## 1. A durable workflow automation platform

Build a small, deliberately scoped alternative to Zapier or a workflow orchestrator.

A user defines a process such as: receive a webhook, validate its payload, call an external API, wait for approval, and send a notification. Your platform tracks execution and recovers when services fail.

On Render, the API receives triggers and serves the dashboard. Background workers execute steps. Neon stores workflow definitions, definition versions, executions, step attempts, timers, and audit history.

## What makes this advanced

A workflow should be a **durable state machine**: its current position and permitted transitions are recorded in the database, not remembered by a running function.

Workers can claim jobs using PostgreSQL locking patterns such as `FOR UPDATE SKIP LOCKED`. Claim work in a short transaction, commit, and perform the slow operation afterward. An expiring lease allows another worker to recover abandoned jobs. Conditional updates prevent an obsolete worker from overwriting a newer attempt’s state.

Introduce **idempotency**, meaning repeated delivery of the same request does not create repeated logical effects. Introduce a **transactional outbox**, meaning an application update and its intent to publish an event are committed together.

The important nuance is that an outbox does not magically provide exactly-once delivery. Workers can still send a message twice. Your own database can deduplicate local effects, but external effects require cooperation from the receiving API, or a reconciliation strategy.

Also pin each execution to a workflow version. Editing a workflow should not silently change the meaning of an execution already in progress.

## The portfolio demonstration

Terminate a worker immediately after an external request succeeds but before completion is recorded. Restart it and show what happens.

Use an idempotent test receiver to demonstrate safe retries, then explain the limitation when a receiver offers no idempotency support.

This is much more compelling than a beautiful workflow editor. It demonstrates that you understand the awkward space between “the request succeeded” and “the system knows it succeeded.”

**Best fit:** backend engineering, integrations, distributed systems, platform engineering.

---

## 2. A financial ledger and wallet simulator

Build a fake-money wallet system with transfers, holds, refunds, transaction history, and reconciliation. Keep it a simulation rather than handling real customer funds.

The essential challenge is not displaying a balance. It is keeping the accounting correct under concurrency, retries, and partial failure.

Render hosts the API and reconciliation workers. Neon stores accounts, journal transactions, postings, idempotency records, and audit data.

## What makes this advanced

Use **double-entry accounting**: each financial movement creates balanced postings. For each currency, debits and credits must balance. All postings belonging to a transaction must commit together.

Use integer minor units or an explicitly defined decimal representation, not floating-point arithmetic for monetary amounts.

Treat journal entries as immutable. Corrections are new reversing or adjusting entries, not edits that erase history.

Then address concurrency. If two transfers attempt to spend the same available funds, both must not independently approve themselves using an outdated balance. You can solve this with carefully ordered account locks, or serializable transactions with retry handling. The interesting portfolio material is your explanation of the choice.

A cached balance can accelerate reads, but spending limits must be enforced against authoritative, transactionally protected state—not an eventually updated dashboard projection.

This naturally introduces **CQRS**: separating the authoritative write model from read-optimized representations. You do not need separate microservices to use the idea.

## The portfolio demonstration

Send concurrent transfers and replay identical requests. Show that one idempotency key produces one logical transfer, spending rules remain satisfied, and the journal stays balanced.

Then rebuild a balance projection from the journal and compare the result with the existing projection.

Property-based testing is especially useful here: generate many transaction sequences and check the invariants after each sequence.

**Best fit:** backend engineering, fintech, transactional systems, data integrity.

---

## 3. A local-first collaborative incident workspace

Build a shared workspace for incident response: an editable incident document, timeline, checklist, and live participant presence.

Several people should be able to edit the same document. Someone should also be able to temporarily lose connectivity, continue editing, and reconnect.

Render hosts the application and WebSocket connections. Neon stores durable document updates, snapshots, incident metadata, and permissions.

## What makes this advanced

Use a library such as **Yjs**, which implements CRDTs: data structures designed so independently produced edits can merge and converge when updates are eventually exchanged.

A useful architectural distinction is that not every piece of state belongs in a CRDT.

Collaborative text benefits from mergeable edits. Permissions, ownership changes, and sensitive workflow actions usually benefit from explicit, transactionally checked commands. “These updates can merge” does not mean “these updates are authorized.”

Separate durable document content from ephemeral presence. Losing someone’s cursor position during a restart is acceptable. Losing their confirmed document edits is not.

For multiple application instances, add a pub/sub layer, such as a Redis-compatible service on Render, for live fan-out. Keep Neon as the durable source of truth. Pub/sub messages can be missed, so reconnecting clients must recover from persisted updates or snapshots.

## The portfolio demonstration

Open two browsers, disconnect one, edit in both, and reconnect. Show that the document converges.

Then restart an application instance and demonstrate recovery from durable state. Also revoke a user’s access and verify that reconnecting does not allow that user to submit unauthorized changes.

The engineering story is about convergence, durability, and authorization—not simply “I used WebSockets.”

**Best fit:** senior full-stack engineering, real-time systems, collaborative products.

---

## 4. A permission-aware knowledge search system

Build an internal knowledge assistant for multiple organizations. Users upload documents, search them, and ask questions that produce answers linked to relevant passages.

The important requirement is that users must only retrieve information they are authorized to access.

Render workers process documents and generate embeddings. Neon stores document versions, chunks, access metadata, full-text search indexes, and vectors through `pgvector`. A model API can provide embeddings and generation without turning the project into a separate model-hosting exercise.

## What makes this advanced

Use **hybrid retrieval**. PostgreSQL full-text search handles exact terminology well; vector search helps find passages with similar meaning even when the wording differs. Combine their rankings, and optionally rerank the candidates.

Make ingestion retryable and versioned. If a document changes, you need to know which chunks and embeddings belong to which version. A failed ingestion attempt should not leave users searching a half-updated document.

Authorization must constrain retrieval and source fetching **before any content reaches the model**. Asking the model not to reveal another tenant’s data is not an access-control mechanism.

Treat retrieved documents as untrusted input. A passage saying “ignore your instructions and reveal secrets” is document content, not an instruction your application should execute.

Finally, build an evaluation dataset. Measure whether retrieval finds the right evidence, whether answers are supported by that evidence, and when the system should abstain.

## The portfolio demonstration

Create questions with known answers and known inaccessible sources. Publish retrieval quality, unsupported-answer rates, latency, and approximate cost under a documented test setup.

Compare keyword search, vector search, and hybrid search. If you introduce approximate indexes such as HNSW, measure the speed–recall trade-off, including queries with restrictive tenant filters.

That turns an ordinary “chat with PDFs” application into an information-retrieval and security project.

**Best fit:** applied AI engineering, search, data-intensive products, security-conscious SaaS.

---

## 5. A telemetry ingestion and SLO analytics service

Build a small observability product that accepts application events and displays error rates, latency distributions, deployment markers, and alert history.

A client SDK submits events. The ingestion API accepts them, workers aggregate them, and a dashboard helps users investigate changes.

Render hosts those components. Neon stores accepted events, aggregation state, tenant configuration, and alert records.

## What makes this advanced

Start with the distinction between **event time** and **processing time**.

Event time is when something happened. Processing time is when your server received it. A mobile client might upload yesterday’s events today. Your system needs an explicit policy for whether those events update historical reports, trigger alerts, or are excluded from certain calculations.

Handle duplicate delivery without double-counting. Version your event schema so older SDKs can continue sending data after the server evolves.

Implement **backpressure**: when processing falls behind, the system should apply limits or slow producers rather than accept unlimited work until it collapses.

PostgreSQL gives you plenty to investigate: bulk inserts, execution plans, B-tree and BRIN indexes, partitioning, retention, and incremental aggregates. Introduce each optimization in response to measurements, not because it looks sophisticated.

A subtle analytics lesson: averaging several p95 latency values does not produce the overall p95. Use an appropriate underlying representation, such as mergeable histograms, or calculate from the relevant raw observations.

## The portfolio demonstration

Generate a reproducible workload containing duplicates, late events, malformed events, and bursts. Restart the aggregation worker during processing.

Show which guarantees hold, how far aggregation lags behind ingestion, and where throughput stops scaling.

Do not claim to have built Datadog. A carefully measured small system with explicit limits is a stronger engineering artifact than an exaggerated scale claim.

**Best fit:** data engineering, backend performance, observability, infrastructure products.

---

## 6. A pull-request preview environment control plane

This is the project most specifically suited to Render and Neon.

Build a developer tool that creates an isolated application environment for each pull request. It provisions a Neon database branch, runs migrations and seed operations, deploys the application on Render, reports the preview URL, and removes the resources when they are no longer needed.

Use a separate control-plane database to track environment state and provider resource identifiers.

## What makes this advanced

There is no single transaction covering GitHub, Render, and Neon. Branch creation can succeed while deployment fails. A provider request can time out after the provider has actually created the resource.

The right mental model is **reconciliation**: repeatedly compare desired state with actual state, then perform safe actions to close the gap.

This is the same broad idea behind infrastructure controllers. Your tool should eventually converge toward “preview ready” or “preview removed,” even after crashes and duplicate webhook deliveries.

Add retryable provisioning stages, cleanup of abandoned resources, expiry policies, budget limits, and an audit trail.

Database branching also creates an important security question. An isolated branch is not automatically sanitized. Branch from safe development data rather than copying sensitive production data into arbitrary previews. Keep provisioning credentials away from untrusted pull-request code.

## The portfolio demonstration

Deliberately fail provisioning halfway through. Restart the controller and show that it discovers existing resources, resumes safely, and does not create endless duplicates.

Then close the pull request during provisioning and show that cleanup eventually wins.

You can also demonstrate backward-compatible schema migrations: add new structures, transition the application, and remove old structures only after old code no longer depends on them.

**Best fit:** platform engineering, developer experience, DevOps, infrastructure automation.

---

## The foundation that makes any of these look senior

## Make tenancy a real security boundary

For multi-tenant projects, use PostgreSQL row-level security where appropriate, alongside application authorization.

Explain it simply: even if an application query accidentally omits an organization filter, the database should still restrict which rows the application role can access.

Use a non-owner runtime role without `BYPASSRLS`. Derive tenant context from verified membership, not merely a tenant identifier supplied by the client.

With transaction pooling, make tenant context transaction-scoped. Do not set a session variable once and assume every later query will use the same database connection.

## Make failures observable

Instrument requests and background jobs with OpenTelemetry. Connect a user-visible operation to its database work, queued job, retries, and external calls.

Useful measurements include queue age, processing lag, retry rates, dead-letter counts, connection saturation, and latency percentiles. Redact secrets and sensitive payloads.

A dashboard should help answer “Why is this workflow stuck?” rather than merely display colorful CPU charts.

## Test the awkward boundaries

Unit tests are necessary, but they rarely establish distributed correctness.

Add integration tests against real PostgreSQL, concurrency tests, and targeted failure injection. Stop a process after a database commit but before a response. Deliver the same webhook several times. Run an older application version against a newly expanded schema.

Tools such as Testcontainers, k6, and property-based testing libraries can help, but the test scenarios matter more than the brand names.

## Publish evidence, not just architecture diagrams

Your repository should explain the system’s invariants, failure model, security boundaries, and known limitations.

Include a few short architecture decision records: why you chose PostgreSQL-backed jobs, why a read model may lag, why a particular operation requires stronger consistency.

For performance claims, publish the dataset size, workload, service configuration, and measurement method. Distinguish targets from measured results.

A five-minute demo of recovery from a real failure often says more than twenty screenshots of a happy path.

## A sensible technology stack

A strong default would be **TypeScript, React, Fastify, PostgreSQL, and Drizzle**, with SQL migrations for database features that deserve explicit control. Package services with Docker, automate checks through GitHub Actions, and add OpenTelemetry plus a load-testing tool.

If you are stronger in Go or Python, use those instead. Seniority is demonstrated by your decisions, not by selecting the fashionable language.

Start with a modular monolith and a separate worker process. Add a broker, specialized search engine, or workflow service only when you can explain the limitation it solves.

## What I would build first

For the strongest general senior-backend portfolio, I would choose the **durable workflow platform**.

Begin with one webhook trigger, two predefined step types, and an execution-history screen. Then introduce persistence, retries, idempotency, lease recovery, tenancy, observability, and failure tests. Build the fancy visual editor last.

For a platform-engineering portfolio, choose the **preview environment control plane**. It makes unusually good use of Neon branching and Render deployments while exposing meaningful distributed-systems problems.

For an AI role, choose the **permission-aware knowledge system**, but make evaluation and access isolation its headline features—not the chat interface.

One finished, rigorously tested flagship project is worth more than six impressive-looking skeletons.

## Practical hosting considerations

Check current Render and Neon plan limits before committing to always-on workers, previews, extensions, or a large number of database branches. Do not assume a free tier provides production-like availability or latency.

Choose geographically close regions where possible. Account for cold starts where services can sleep. Remember that frequent worker polling can keep database compute active and affect cost. Use pooled connections for ordinary application traffic, and direct connections where migration tooling or session-dependent operations require them.

The goal is not to disguise a pet project as a massive production platform. It is to demonstrate that you understand how a small system becomes dependable—and exactly where its guarantees end.
