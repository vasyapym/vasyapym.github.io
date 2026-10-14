<!-- lesson-meta: {"practicePrompt":"Take one service in an organization you know and write its catalog entity by hand: a catalog-info.yaml with owner, system, dependsOn and two annotations. Then make the graph answer three questions the old way cannot — who owns everything that depends on this service's database, which consuming systems would break if its API were deprecated, and what a given team owns and how much of it lacks documentation.","checkPrompt":"Without notes: distinguish an internal developer platform from an internal developer portal and explain why a portal without a platform fails; describe the catalog as a typed sociotechnical graph that is an index, not the source of truth; name the ingestion, processing and stitching loop; and explain why a template that runs catalog:register keeps the catalog fresh as a side effect."} -->
<!-- lesson-theory: {"problem":"In a microservices organization the complexity moved out of the code into the space between services — who owns this, where are its docs, what does it call, who is on call — and the answers live in a stale wiki and in one senior engineer's head. Every lookup burns finite attention on navigation instead of engineering, and the bill spikes exactly when someone joins, leaves, or goes on vacation.","model":"A portal is an instrument for reducing extraneous cognitive load: a socially maintained, machine-reconciled model of the organization's software and the people responsible for it, plus an interface for acting on that model. Its heart is the catalog — a typed sociotechnical graph whose edges make Conway's Law explicit and queryable. Templates turn golden paths into executable scaffolding that keeps the catalog fresh as a side effect, and scorecards turn standards into measurable proxies, with Goodhart's Law as the standing hazard.","mechanics":"Catalog as a typed graph: Components, APIs, Resources, Systems, Domains, Groups and Users are the nodes; the relations (ownedBy, dependsOn, providesApi, consumesApi, partOf) carry the value — ownership questions become queries instead of conversations. Metadata as code: catalog-info.yaml lives in the repository, passes through the same review as code, borrows Kubernetes's declarative model, and annotations act as the open key-value glue linking one entity to GitHub, PagerDuty, Grafana and the rest. Index, not truth: the ingestion-processing-stitching loop continuously reconciles the catalog against its sources, so UI edits to upstream-owned facts get overwritten; trust, not size, is the currency, and a 70 percent accurate catalog is worse than none. Ownership first: an owner field pointing at a team rather than an individual delivers the most value per unit of effort of any metadata. Templates close the loop: fetch a skeleton, publish the repository, register the entity — new software enters compliant and present, while the day-two problem (later template improvements do not propagate) is what scorecards and migration tooling exist for. Governance and proof of value: scorecards roll up into maturity levels but must be hard-to-game diagnostics rather than performance-review sticks; golden paths win by convenience rather than mandate; and DevEx dimensions (feedback loops, cognitive load, flow state) plus onboarding time-to-first-commit tell you whether any of it is working.","pitfalls":["Treating Backstage as a turnkey portal: it is a framework, and assembling it is your job.","Deploying the framework without populating the catalog — the ghost town nobody returns to.","Hand-maintaining metadata a machine could ingest — the road to the stale map.","Editing upstream-owned facts in the portal UI and losing them to the next reconciliation loop.","Pointing owner at individuals instead of teams: individuals leave, teams persist.","Putting a polished interface over unstandardized infrastructure: the portal without a platform.","Forcing adoption by policy instead of earning it with value — the mandate trap and compliance theater.","Spending months in the ontology rabbit hole debating Component versus System before shipping anything.","Using scorecards as a stick: they breed empty runbooks and cynicism.","Judging the catalog by size instead of accuracy: trust collapses after the first few wrong answers."],"whenNot":"The essay is a conceptual tour, not an installation guide: it skips Backstage's upgrade procedures and plugin API details, and it does not claim self-hosted Backstage suits organizations unable to commit sustained platform-team capacity."} -->

# Internal Developer Portals: Backstage and the Problem They Solve

## Part I: The Problem Before the Tool

Imagine you've just joined a mid-sized tech company as a software engineer. On day one you're told your team owns "the payments reconciliation service." You open the code repository, and it calls three other services you've never heard of. One of them is failing in staging. You need to know who owns it, where its documentation lives, how it's deployed, which dashboard shows its health, whether it's deprecated, and who is on call right now.

At most organizations the answers are scattered. There's a stale wiki page, a Slack channel nobody reads, a spreadsheet someone maintained until 2021, and a senior engineer named Priya who simply *knows*. When Priya goes on vacation, the organization quietly loses part of its memory.

This is the core problem internal developer portals address. It isn't really a tooling problem. It's a problem of **organizational knowledge under conditions of scale and fragmentation**.

The shift to microservices, cloud infrastructure, and autonomous teams brought real benefits: independent deployability, team autonomy, and technological flexibility. It also produced an explosion of *things*. A company that once ran one monolith might now run eight hundred services, four thousand repositories, dozens of databases, hundreds of Kafka topics, and a forest of CI pipelines, each with its own conventions. The system's complexity didn't disappear when the monolith was decomposed. It moved from inside the code to the spaces *between* the code, into the relationships, ownership boundaries, and operational context that no single repository captures.

### Cognitive Load as the Central Concept

The most useful theoretical lens here comes from educational psychology, specifically John Sweller's **cognitive load theory**, later imported into software organization design by Matthew Skelton and Manuel Pais in *Team Topologies*. Sweller distinguished three kinds of mental load:

- **Intrinsic load** is the inherent difficulty of the task itself, such as understanding a reconciliation algorithm.
- **Extraneous load** is difficulty imposed by how information is presented or found, such as hunting through five tools to discover who owns a dependency.
- **Germane load** is the productive effort of building durable mental models.

The argument behind developer portals is that modern software organizations have let extraneous load balloon. Engineers spend their finite attention navigating infrastructure rather than solving the problems they were hired to solve. A portal is, at its heart, an instrument for reducing extraneous cognitive load so that attention can flow back to intrinsic and germane work.

Keep this framing in mind. It explains almost every design decision you'll encounter.

## Part II: Platform vs. Portal

The vocabulary in this field is genuinely confusing, partly because both terms abbreviate to "IDP."

An **Internal Developer Platform** is the full set of capabilities a company offers its engineers: provisioning infrastructure, deploying services, managing secrets, observing systems, running pipelines. It's the machinery. It might include Kubernetes clusters, Terraform modules, CI/CD systems, and service meshes, all assembled and maintained by a **platform team**.

An **Internal Developer Portal** is the *interface* to that platform and to the organization's software estate. It's where developers go to discover, understand, and act. If the platform is the engine and drivetrain, the portal is the dashboard and steering wheel.

The distinction matters because a common failure is to buy or build a portal while assuming it *is* the platform. A beautiful portal on top of chaotic, unstandardized infrastructure is a well-lit window into a mess. Conversely, a powerful platform with no coherent interface forces every developer to learn its internals, which defeats the purpose of having one.

The discipline that encompasses both is called **platform engineering**. Its guiding philosophy is to treat the platform *as a product*, with developers as its customers. That means user research, roadmaps, adoption metrics, and the humility to accept that if developers route around your platform, the platform is wrong, not the developers.

### Golden Paths and Paved Roads

Two metaphors recur constantly. Spotify speaks of **golden paths** and Netflix of **paved roads**. The idea is identical: the organization provides a well-supported, opinionated, *easiest* way to do common things, such as creating a new service, but doesn't forbid alternatives. You can go off-road, but you take on the maintenance burden yourself.

This is a subtle piece of incentive design. Rather than enforcing standards through mandates (which breed resentment and workarounds), you make the standard path so convenient that rational engineers choose it voluntarily. Standardization emerges from convenience rather than coercion. Portals are frequently the place where golden paths become tangible: a "Create New Service" button that spins up a repository with CI, monitoring, security scanning, and documentation already wired in.

## Part III: Backstage — Origins and Philosophy

**Backstage** was built internally at Spotify, open-sourced in March 2020, and donated to the Cloud Native Computing Foundation, where it reached incubating status in 2022. It's now the dominant open-source project in this space, and many commercial portals either build on it or define themselves in contrast to it.

The most important thing to understand about Backstage is captured in its own self-description: it is **a framework for building developer portals**, not a portal you install and use. This distinction trips up many organizations. Backstage gives you a React and TypeScript frontend, a Node.js backend, a plugin architecture, a data model, and several core features. Assembling these into something your engineers actually want to use is *your* job, and it typically requires dedicated engineering investment. Organizations that treat Backstage as a turnkey product often end up with what practitioners grimly call a "ghost town": a deployed portal with a half-empty catalog that nobody visits.

Backstage's core rests on a few major pillars. We'll go through each, since together they form the conceptual vocabulary of the whole field.

## Part IV: The Software Catalog — The Heart of Everything

If you understand only one concept deeply, make it the **software catalog**. Everything else in a portal is either a view onto the catalog or an action that modifies the world the catalog describes.

### The Catalog as a Graph

Conceptually, the catalog is a **typed graph**. Nodes are entities, the "things" in your software estate. Edges are relations between them. Backstage defines a set of core entity kinds:

- A **Component** is a piece of software: a service, a website, a library, a data pipeline.
- An **API** is an interface that components provide or consume, described by an OpenAPI, AsyncAPI, gRPC, or GraphQL specification.
- A **Resource** is infrastructure a component needs at runtime: a database, an S3 bucket, a message queue.
- A **System** is a collection of components, APIs, and resources that together deliver a capability, such as "Payments."
- A **Domain** is a higher-level grouping of systems around a business area.
- A **Group** and a **User** represent the people and teams in the organization.
- Supporting kinds such as **Template** and **Location** handle scaffolding and ingestion mechanics.

The relations are where the real value lives: `ownedBy`, `dependsOn`, `providesApi`, `consumesApi`, `partOf`, `memberOf`. With these edges in place you can answer questions that were previously impossible without asking Priya. Who owns everything that depends on this database? Which systems consume this deprecated API? What does Team Falcon own, and how much of it lacks documentation?

Notice that this model is **sociotechnical**. It deliberately puts people (Groups, Users) and software (Components, APIs) in the same graph. That's a direct reflection of **Conway's Law**, the observation that systems mirror the communication structures of the organizations that build them. The catalog makes that mirroring explicit and queryable.

### Metadata as Code

How does information get into the catalog? Backstage's primary answer is **metadata as code**: each repository contains a descriptor file, conventionally `catalog-info.yaml`, that declares what the repository contains.

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: payments-reconciler
  description: Reconciles ledger entries against processor settlements
  annotations:
    github.com/project-slug: acme/payments-reconciler
    backstage.io/techdocs-ref: dir:.
    pagerduty.com/service-id: P123ABC
  tags: [java, kafka]
spec:
  type: service
  lifecycle: production
  owner: group:team-falcon
  system: payments
  dependsOn:
    - resource:ledger-db
  providesApis:
    - reconciliation-api
```

Geeks will immediately notice the resemblance to Kubernetes manifests: `apiVersion`, `kind`, `metadata`, `spec`. This is intentional. Backstage borrows Kubernetes's **declarative model**, where you describe the desired state and the system reconciles toward it. The `annotations` field is particularly important. It's an open-ended key-value space that plugins use to link an entity to external systems: this is its GitHub repository, this is its PagerDuty service, this is its Grafana dashboard. Annotations are the glue that lets one catalog entry become a hub connecting a dozen tools.

Placing metadata in the repository has a deep rationale. Metadata stored in a separate system drifts from reality because nobody updates it. Metadata that lives beside the code goes through the same code review, versioning, and ownership processes as the code itself. It's the same insight that drove "infrastructure as code" and "docs as code": **co-locate the description with the thing described, and the description stays honest longer**.

### The Ingestion Pipeline

Under the hood, the Backstage catalog runs a continuous processing loop with three stages.

1. **Ingestion.** *Entity providers* pull raw entity data from sources: YAML files discovered in GitHub organizations, users and groups synchronized from an identity provider like Okta or LDAP, or custom providers you write to import from a CMDB or cloud account.
2. **Processing.** *Processors* validate each entity, enrich it, resolve references, and emit relations. If a component declares `owner: group:team-falcon`, processing generates both the `ownedBy` edge and its inverse `ownerOf` edge.
3. **Stitching.** Finally, the outputs of processing are assembled into the complete, final entity that the rest of the system reads.

The loop runs continuously, so the catalog is perpetually reconciling itself against its sources. This architecture surfaces a profound conceptual point.

### The Catalog Is an Index, Not the Truth

A well-designed catalog is usually **not the system of record** for most of what it displays. GitHub is the source of truth for repositories. Your identity provider is the source of truth for team membership. Kubernetes is the source of truth for what's actually running. The catalog is a **derived, federated index** that aggregates and cross-references these sources.

This matters for two reasons. First, it determines where edits should happen. If you change team membership in the portal UI but the identity provider still says otherwise, the next reconciliation loop will overwrite your change. Second, it frames the central quality problem of every catalog: **staleness**. The catalog's value is directly proportional to how much engineers trust it, and trust collapses the first few times it's wrong. A catalog that's 70% accurate is often worse than no catalog, because people stop consulting it while still occasionally being misled by it.

This is why mature organizations favor *automated discovery* wherever possible, with hand-written metadata reserved for things only humans know, such as ownership, purpose, and lifecycle stage. The guiding principle: **automate the facts, curate the meaning**.

### Ownership: The Single Most Valuable Field

If you take one practical lesson from this section, take this one. Of all the metadata in a catalog, **ownership** delivers by far the most value per unit of effort. Unowned software is an organizational hazard. Nobody patches it, nobody responds when it breaks, and nobody decides whether it should still exist. Simply getting a reliable `owner` field on every component, pointing at a *team* rather than an individual (individuals leave; teams persist), resolves a large fraction of the coordination pain that motivates portals in the first place.

## Part V: Software Templates — Golden Paths Made Executable

The second pillar is the **Scaffolder**, which runs **Software Templates**. If the catalog answers "what exists?", templates answer "how do I make a new thing the right way?"

A template is itself a catalog entity, defined declaratively. It specifies parameters to collect from the user (described in JSON Schema, which Backstage renders as a form) and a sequence of steps, each invoking an action.

```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: java-service
  title: Java Microservice (Golden Path)
spec:
  owner: group:platform-team
  type: service
  parameters:
    - title: Service details
      required: [name, owner]
      properties:
        name:
          type: string
        owner:
          type: string
          ui:field: OwnerPicker
  steps:
    - id: fetch
      action: fetch:template
      input:
        url: ./skeleton
        values:
          name: ${{ parameters.name }}
          owner: ${{ parameters.owner }}
    - id: publish
      action: publish:github
      input:
        repoUrl: github.com?owner=acme&repo=${{ parameters.name }}
    - id: register
      action: catalog:register
      input:
        repoContentsUrl: ${{ steps.publish.output.repoContentsUrl }}
        catalogInfoPath: /catalog-info.yaml
```

Read the steps in order and you can see the elegance. The template fetches a skeleton project and fills in values, publishes it as a new GitHub repository, and then **registers the new service in the catalog automatically**. The skeleton already contains a `catalog-info.yaml`, CI configuration, Dockerfile, observability setup, and documentation stub.

This closes a loop that's easy to miss. Templates don't just save developers time. They ensure that *new* software enters the world already compliant with organizational standards and already present in the catalog. The catalog stays accurate not because someone audits it, but because the easiest way to create software inherently populates it. Here, the golden path and catalog freshness turn out to be the same mechanism.

A known limitation is worth naming. Basic scaffolding is a one-time copy. Once a service is created, later improvements to the template don't automatically propagate to services created earlier. This "day-two" problem, keeping existing services aligned with evolving standards, is one reason organizations add scorecards and automated migration tooling on top of scaffolding.

## Part VI: TechDocs and Search

**TechDocs** is Backstage's docs-as-code system. Engineers write Markdown in their repositories, and TechDocs (built on MkDocs) renders it into documentation attached directly to the corresponding catalog entity. The insight mirrors metadata-as-code: documentation co-located with code, reviewed in the same pull requests, and *discoverable through the entity it describes*, rots more slowly than documentation in a disconnected wiki. When you land on a service's page in the portal, its docs are one tab away, not one archaeological expedition away.

**Search** unifies discovery across the catalog, TechDocs, and anything else you plug in. Search is easy to undervalue, but it matters through the lens of **information foraging theory**, the idea from Pirolli and Card that people seek information much like animals forage for food, following the "scent" of cues and abandoning patches that yield too little. A portal with strong search and consistent entity pages provides strong information scent. A fragmented tooling landscape provides weak scent everywhere, and developers resort to the highest-yield patch available, which is usually interrupting a colleague.

## Part VII: The Plugin Architecture

Backstage's extensibility comes from **plugins**, and much of its practical value lives here. There are plugins for Kubernetes (showing a service's pods and deployments on its entity page), CI systems, cloud cost, PagerDuty, SonarQube, security scanners, feature flags, and hundreds more from the community.

Architecturally, frontend plugins contribute UI, often as tabs or cards on entity pages. Backend plugins contribute APIs, catalog processors, scaffolder actions, and integrations. Backstage introduced a newer backend system based on dependency injection and well-defined extension points, along with an evolving declarative frontend system, which together make plugins more composable and reduce the glue code adopters must write.

The architectural idea is that the **entity page becomes a single pane of glass**. Rather than the developer visiting ten tools and mentally joining the data, the portal performs the join, keyed on the entity and its annotations, and presents everything in context. That is extraneous cognitive load being removed in the most literal way possible.

Backstage also ships a **permission framework** for fine-grained authorization over what users can see and do, and pluggable authentication providers. These matter enormously once a portal moves from read-only discovery to *taking actions*, such as triggering deployments, provisioning resources, or rotating credentials.

## Part VIII: Scorecards and the Economics of Standards

A newer but now central concept is the **scorecard**: automated evaluation of entities against organizational standards. Does this service have an owner? Documentation? A runbook? Is it on a supported language version? Does it have alerting configured? Has it passed a security scan in the last thirty days?

Scorecards turn the catalog from a passive map into an active **governance instrument**. Commercial tools such as Cortex and OpsLevel were built substantially around this idea, Spotify offers Soundcheck as a commercial Backstage plugin, and open-source Backstage has Tech Insights for similar purposes. Scorecards typically roll up into maturity levels (bronze, silver, gold) and can drive time-boxed initiatives: "Every production service must reach silver by Q3."

Here a PhD-level caution is warranted, in the form of **Goodhart's Law**: when a measure becomes a target, it ceases to be a good measure. A scorecard that checks "has a runbook" will soon produce many empty runbooks. The deeper principle is that scorecards measure *proxies* for the qualities you care about (operability, security, maintainability), and the gap between proxy and reality widens under pressure. Well-designed scorecard programs favor checks that are automatically verifiable and hard to game, pair metrics with human review, and present scores as diagnostic aids rather than performance-review weapons. Used as a stick, scorecards breed cynicism. Used as a map of where help is needed, they become one of the most useful views in the portal.

## Part IX: The Landscape Beyond Backstage

Backstage dominates the open-source space, but the market is broad, and understanding the alternatives clarifies Backstage's own trade-offs.

- **Managed and distributed Backstage.** Roadie offers hosted Backstage. Red Hat Developer Hub is an enterprise distribution of Backstage. Spotify sells its own commercial Portal product and plugins. These exist because running and customizing Backstage yourself is substantial ongoing work.
- **SaaS portals with flexible data models.** Port is notable for letting you define your own entity types (it calls them "blueprints") rather than adopting a fixed ontology. This trades Backstage's opinionated, shared vocabulary for flexibility. Cortex and OpsLevel emphasize catalog plus scorecards and service maturity. Atlassian's Compass integrates with the Atlassian ecosystem.
- **Platform orchestrators.** Tools like Humanitec operate at the *platform* layer rather than the portal layer, handling how workloads are configured and deployed across environments. They're often paired with a portal, which reinforces the platform-versus-portal distinction from Part II.

The fundamental trade-off is **build versus buy**, and it rests on a question about where your organization's differentiation lies. Backstage offers maximal control, a huge ecosystem, no license fees, and a vendor-neutral data model, at the cost of requiring a dedicated team (often several engineers) to customize and maintain it. Commercial portals offer faster time to value and less maintenance, at the cost of subscription fees, less customizability, and some vendor dependence. Neither is universally correct. The honest heuristic: if you can't commit sustained engineering capacity to treating the portal as a product, self-hosted Backstage is likely to become a ghost town.

## Part X: Measuring Whether Any of This Works

How do you know a portal is succeeding? The field draws on several research frameworks.

**DORA metrics** (deployment frequency, lead time for changes, change failure rate, and time to restore service) measure software delivery performance, though a portal's influence on them is indirect.

The **SPACE framework** (Forsgren, Storey, and colleagues) argues that developer productivity is multidimensional, spanning Satisfaction, Performance, Activity, Communication, and Efficiency, and warns against any single metric.

Most directly relevant is the **DevEx framework** (Noda, Storey, Forsgren, and Greiler, 2023), which identifies three core dimensions of developer experience: **feedback loops**, **cognitive load**, and **flow state**. A portal acts most directly on cognitive load, which brings us full circle to Part I.

In practice, effective portal teams combine leading indicators (catalog coverage, ownership completeness, template usage, weekly active users) with outcome measures (time-to-first-commit for new hires, time to create a production-ready service, developer satisfaction surveys). Onboarding time is an especially telling metric, because new hires are the people for whom extraneous cognitive load is highest and tribal knowledge is least available.

## Part XI: Why Portals Fail, and Principles That Make Them Succeed

Synthesizing everything above, portal failures cluster into a few recognizable patterns.

The **ghost town** comes from deploying the framework without populating it, so there's nothing useful to find and nobody returns. The **stale map** comes from relying on manually maintained metadata without automation, so trust erodes after the first few wrong answers. The **portal without a platform** puts a polished interface over unstandardized infrastructure, so the golden-path buttons have nothing coherent to invoke. The **mandate trap** forces adoption through policy rather than earning it through value, which produces compliance theater rather than genuine use. And the **ontology rabbit hole** spends months debating whether something is a Component or a System before shipping anything.

The principles that counter these follow naturally:

1. **Start with ownership.** It's the highest-leverage metadata and the foundation for everything else.
2. **Automate facts, curate meaning.** Ingest what machines know, and ask humans only for what only humans know.
3. **Make the golden path the easiest path.** Templates that auto-register entities keep the catalog fresh as a side effect.
4. **Treat the portal as a product.** Interview developers, find their most painful workflows, and solve those first.
5. **Start thin.** Team Topologies' notion of the "thinnest viable platform" applies: deliver one valuable capability well before building ten mediocre ones.
6. **Earn trust through accuracy.** A smaller, correct catalog beats a larger, unreliable one.

## Closing Synthesis

Strip away the specific tools and an internal developer portal is a **socially maintained, machine-reconciled model of an organization's software and the people responsible for it**, paired with an interface for acting on that model. Its catalog is a typed sociotechnical graph that makes Conway's Law visible and queryable. Its templates turn organizational standards into executable golden paths. Its plugins perform the joins across tools that developers would otherwise perform in their heads. Its scorecards make standards measurable, with all the promise and peril of measurement.

Above all, it's an instrument for redirecting a scarce resource, human attention, away from navigating complexity and toward creating value. Backstage is the most influential embodiment of these ideas, but the ideas outlast any one tool. Understand them, and you can evaluate any portal, design a catalog model, or diagnose why an existing portal sits empty.

## Questions for Reflection

1. Think of an organization you know. Where does its "tribal knowledge" live, and what would happen if the people holding it left tomorrow?
2. Why might a catalog that's 70% accurate be *worse* than having no catalog at all?
3. Explain in your own words why a template that automatically runs `catalog:register` helps solve the staleness problem.
4. Design three scorecard checks for a production service, then explain how each could be gamed and how you'd mitigate that.
5. Your company has two platform engineers and no budget for SaaS. Would you choose self-hosted Backstage? Justify your answer using the build-versus-buy trade-off.
