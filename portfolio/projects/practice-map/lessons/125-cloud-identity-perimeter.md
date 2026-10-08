<!-- lesson-meta: {"practicePrompt":"Take one identity in your account (real or imagined) and derive its effective permissions by walking every applicable layer: identity policy, resource policy, permissions boundary, SCP. Then check whether any iam-level permission in the set lets the identity rewrite its own policy; if yes, it is effectively an administrator.","checkPrompt":"From memory: state the three evaluation rules (default deny, explicit deny wins, explicit allow must pass every layer); separate granting from limiting policy types; and explain why a role's trust policy is a different control from its permissions policy."} -->
<!-- lesson-theory: {"problem":"Cloud estates rarely get breached in the cinematic sense; they leak credentials and drift into misconfiguration, and without a model of IAM, secrets, and posture you cannot even answer who can do what to which resource.","model":"In the cloud the API is the perimeter and identity is the key to the API: control-plane credentials, reachable from anywhere, can create, read, or destroy anything you own. Three disciplines are three views of that one problem. IAM composes policies into a decision where explicit deny always wins and limiting layers only intersect; secrets management replaces long-lived keys with short-lived, federated credentials the platform vouches for; CSPM continuously audits the declared configuration against the intent you meant to express.","mechanics":"Policy evaluation: default deny, explicit deny always wins, and an explicit allow must pass every applicable layer, so boundaries, SCPs, RCPs, and session policies intersect but never grant; roles split authority into a permissions policy (what it may do) and a trust policy (who may become it), and both halves must be reasoned about together; STS issues temporary credentials with bounded exposure, and workload identity federation exchanges OIDC tokens pinned to repository and branch for CI; the confused deputy is defused by external IDs and condition keys such as aws:SourceArn that pin a request to one customer; permissions compose transitively, so iam:PassRole plus ec2:RunInstances, or iam:CreatePolicyVersion, quietly equals administrator; RBAC grows into role explosion, ABAC shifts correctness onto tag integrity, and ReBAC (Zanzibar) decides from relationship graphs.","pitfalls":["wildcard actions or resources written under deadline pressure harden into permanent privilege creep","granted permissions routinely exceed used permissions (often under five percent), and every unused grant is latent attacker capital","a trust policy accepting any token from an OIDC issuer lets any repository on earth assume the role; pin repository and branch","auditing by policy text misses transitive escalation paths because effective power is everything reachable, not what the document says","static access keys pasted into CI secret stores remain the classic leak vector that federation removes","cross-account access requires a two-sided handshake; forgetting the second side either breaks access or over-opens it","treating the control plane as plumbing misses that an attacker can snapshot your database without one packet touching your firewall","shared responsibility never moves identity, access, and configuration onto the provider, no matter the service model"],"whenNot":"This is cloud IAM, secrets, and posture management; it does not teach application-level product authorization beyond ReBAC vocabulary, network packet forensics, or on-premises hardening."} -->

# Cloud Security: A Field Guide to IAM, Secrets Management, and CSPM

*From first principles to the research frontier*

---

## Prologue: Why Cloud Security Is a Different Animal

In a traditional data center, security was largely about place. Servers lived in a building, the building had a network, and the network had a perimeter guarded by firewalls. If you were inside the perimeter, you were mostly trusted. If you were outside, you were mostly not. The mental model was a castle with a moat.

The cloud breaks this model. When you use Amazon Web Services, Microsoft Azure, or Google Cloud, your infrastructure is not something you physically own. It is something you **declare** through an API. You create a virtual machine, a database, or a storage bucket by sending a request to the provider's control plane, an HTTPS endpoint reachable from anywhere on Earth. The castle has no walls. Every resource you own can be created, modified, read, or destroyed by anyone holding the right credentials, from any network.

This yields the central insight of cloud security, worth stating plainly:

> **In the cloud, the API is the perimeter, and identity is the key to the API.**

Everything else follows. Identity and Access Management (IAM) decides who can call which APIs on which resources. Secrets management protects the credentials that prove identity. Cloud Security Posture Management (CSPM) continuously checks whether the configuration you declared through those APIs is safe. These three disciplines are not separate topics. They are three views of one problem.

## The Shared Responsibility Model

Before going further, we need the foundational contract of cloud computing: the **shared responsibility model**. The provider is responsible for security *of* the cloud: physical data centers, hypervisors, the hardware, and the global network. You are responsible for security *in* the cloud: your data, your identities, your configurations, your code.

The line moves depending on the service type:

- **Infrastructure-as-a-Service** (a raw virtual machine): you own almost everything above the hypervisor, including the operating system and its patches.
- **Platform-as-a-Service** (a managed database): the provider handles the OS and engine, and you handle access and configuration.
- **Software-as-a-Service:** you mostly own identity and data.

What never moves, in any model, is this: **identity, access, and configuration are always your job.** Gartner famously predicted that through 2025, the overwhelming majority of cloud security failures would be the customer's fault, and breach postmortems have largely borne this out. Clouds rarely get "hacked" in the cinematic sense. They get misconfigured, and their credentials get leaked.

## Control Plane and Data Plane

One more distinction is essential. The **control plane** is the management layer: the APIs that create, configure, and delete resources. The **data plane** is where your workloads actually run and your data actually flows: packets moving between servers, queries hitting a database, objects being read from storage.

Traditional security focused overwhelmingly on the data plane (network firewalls, intrusion detection). Cloud security must treat the control plane as a first-class attack surface. An attacker with control-plane access doesn't need to exploit your application. They can simply snapshot your database, share the snapshot to their own account, and walk away. No packet ever touches your firewall.

---

## Part I: Identity and Access Management

## The Basics: Who, What, and Whether

IAM answers one question, over and over, billions of times per day across every cloud: **"Should this request be allowed?"** To answer it, the system needs three things:

1. **Who is asking?** This is **authentication** (often abbreviated *AuthN*), the process of proving identity. Passwords, cryptographic keys, certificates, and tokens are all ways of authenticating.
2. **What are they asking to do, and to what?** This is the **action** and the **resource**. "Read the object `payroll.csv` in the bucket `finance-data`" is an action (read) on a resource (that object).
3. **Are they permitted to?** This is **authorization** (*AuthZ*), the process of evaluating rules to decide yes or no.

Beginners frequently conflate authentication and authorization. Keep them separate in your mind. Authentication is showing your passport at the border. Authorization is whether your visa permits you to work in the country. A perfectly authenticated identity can still be unauthorized.

## Principals: The Cast of Characters

A **principal** is any entity that can make a request. Clouds have several kinds:

- **Human users** are people, typically engineers, administrators, or analysts.
- **Groups** are collections of users, used to assign permissions in bulk.
- **Roles** are identities that can be *assumed* temporarily rather than permanently owned. This is one of the most important concepts in cloud IAM, and we'll return to it.
- **Service accounts** or **workload identities** are non-human identities used by software: a virtual machine, a container, a serverless function, a CI/CD pipeline.

A crucial modern fact: **non-human identities vastly outnumber human ones**, often by ratios of 10:1 to 50:1 or more in mature environments. Every microservice, every automation script, every Lambda function, every Kubernetes pod with cloud access is an identity. Securing humans is the easy, well-understood part. The machine identities are where most organizations lose track.

## Policies: The Rules of the Game

Permissions are expressed in **policies**, structured documents that state what is allowed or denied. In AWS, a policy is a JSON document that looks like this:

```json
{
  "Effect": "Allow",
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::finance-data/*",
  "Condition": { "Bool": { "aws:MultiFactorAuthPresent": "true" } }
}
```

Read it as a sentence: *Allow* the action *GetObject* on any object in *finance-data*, under the condition that the caller used multi-factor authentication. Nearly every cloud policy language has these same atoms: **effect, action, resource, condition**, plus implicitly or explicitly a **principal**.

Each cloud structures policies differently:

- **Google Cloud** uses *bindings*. A policy attached to a resource says "this member has this role." Roles are bundles of permissions.
- **Azure** uses *role assignments*. A security principal is assigned a role definition at a *scope*: a management group, subscription, resource group, or individual resource.

The vocabulary differs. The logic is the same.

## The Principle of Least Privilege

The single most cited principle in all of security is **least privilege**: every identity should have exactly the permissions it needs to do its job, and nothing more.

Simple to state, devilishly hard to achieve. AWS alone has well over 15,000 distinct IAM actions. Developers, under deadline pressure, write policies like `"Action": "*"` or `"Resource": "*"` because it makes the error messages go away. Permissions accumulate over time ("privilege creep") and are rarely removed, because removing a permission might break something and nobody knows for sure what uses what.

The gap between **granted permissions** and **used permissions** is one of the most important metrics in cloud security. Studies by cloud security vendors routinely find that identities use only a small fraction, often under 5%, of the permissions they hold. Every unused permission is latent risk: it does nothing for the business but everything for an attacker who compromises that identity.

## Intermediate: How Policy Evaluation Actually Works

To reason about IAM rigorously, you must understand the **evaluation logic**, the algorithm that combines all applicable policies into a single allow-or-deny decision. AWS's logic is the most intricate and most instructive, so let's use it.

The foundational rules:

1. **Default deny.** If nothing explicitly allows a request, it is denied. This is called *implicit deny*.
2. **Explicit deny always wins.** If any applicable policy says `Deny`, the request is denied, regardless of how many policies say `Allow`.
3. **Otherwise, an explicit allow is required**, and it must pass through every layer of policy that applies.

The layers in AWS include:

- **Identity-based policies:** attached to a user, group, or role. "What can this principal do?"
- **Resource-based policies:** attached to a resource, such as an S3 bucket policy or a KMS key policy. "Who can access this resource?"
- **Permissions boundaries:** a ceiling on what an identity-based policy can grant. Even if a role's policy says `Allow *`, a boundary limiting it to S3 means it can only ever touch S3.
- **Service Control Policies (SCPs):** organization-level guardrails that cap what any principal in an account can do, including the account's root user.
- **Resource Control Policies (RCPs):** a newer organization-level ceiling on what can be done *to* resources, regardless of who is asking.
- **Session policies:** passed in when assuming a role, further narrowing that particular session.

The key insight: **some policy types grant, and others only limit.** Identity-based and resource-based policies can grant permissions. SCPs, RCPs, permissions boundaries, and session policies can only restrict. The effective permission is the **intersection** of all the limiting layers with the **union** of the granting layers, minus anything explicitly denied.

There is an additional subtlety around accounts. **Within a single account**, a resource-based policy naming a specific principal can grant access even without a matching identity-based policy. **Across accounts**, both sides must agree: the resource owner's policy must allow the external principal, *and* the external principal's own account must allow it to make the call. This two-sided handshake is what makes cross-account access safe by default.

## Roles, Temporary Credentials, and the Trust Relationship

Now we return to **roles**, because they represent a philosophical shift in how credentials work.

The old model was **long-lived credentials**: a user gets an access key, and that key works until someone revokes it, which might be never. If the key leaks into a public GitHub repository, it's valid for an attacker indefinitely.

The modern model is **temporary credentials** issued by a **Security Token Service (STS)**. A principal *assumes* a role, and STS returns a set of credentials that expire automatically, typically after one hour (configurable from 15 minutes up to 12 hours). If those credentials leak, the window of exposure is bounded.

Every role has two policies, and this duality is one of the most commonly misunderstood ideas in IAM:

- **The permissions policy** says what the role can *do* once assumed.
- **The trust policy** says who is allowed to *become* the role.

A role with modest permissions but a trust policy that lets anyone in your organization assume it is a weaker control than it looks. Conversely, a role with powerful permissions but a tightly scoped trust policy can be quite safe. **You must always reason about both halves.**

## The Confused Deputy Problem

Cross-account roles introduce a classic security puzzle called the **confused deputy problem**. Suppose you use a third-party SaaS vendor that monitors your AWS account. You create a role in your account that trusts the vendor's AWS account. The vendor assumes the role to read your configuration.

But the vendor serves thousands of customers. What stops a malicious customer from telling the vendor, "Please monitor this account," and supplying *your* role's identifier? The vendor (the "deputy") has legitimate authority to assume roles that trust it, and it can be tricked into using that authority on behalf of the wrong party.

The mitigation is an **external ID**: a unique secret value that you and the vendor agree on, which must be supplied when assuming the role. The trust policy requires the external ID to match. The vendor generates a distinct one per customer, so a malicious customer can't supply yours. The pattern recurs throughout cloud services, where it is mitigated with condition keys like `aws:SourceArn` and `aws:SourceAccount`.

## Federation and Single Sign-On

Large organizations don't want to create separate cloud users for every employee. They already have an **identity provider (IdP)** such as Okta, Microsoft Entra ID (formerly Azure Active Directory), or Google Workspace. **Federation** lets the cloud trust that external IdP.

Two protocols dominate:

- **SAML 2.0** is an older XML-based standard, widespread in enterprise.
- **OpenID Connect (OIDC)** is a modern identity layer built on OAuth 2.0, using JSON Web Tokens (JWTs).

In a federated flow, the employee logs into the corporate IdP (with MFA), the IdP issues a signed assertion or token saying "this is Alice, member of the Engineering group," and the cloud exchanges that for temporary role credentials. Alice never has a permanent cloud password or access key. When she leaves the company and her IdP account is disabled, her cloud access dies with it. This is **Single Sign-On (SSO)**, and it is the baseline expectation for human access today.

## Workload Identity Federation: Killing the Static Key

The same idea now extends to machines. Historically, if your GitHub Actions pipeline needed to deploy to AWS, you'd create an IAM user, generate an access key, and paste it into GitHub's secrets store. That key was long-lived and powerful, a juicy target.

**Workload identity federation** eliminates this. GitHub acts as an OIDC identity provider and issues each pipeline run a short-lived signed token with claims like "repository `acme/api`, branch `main`, workflow `deploy.yml`." AWS (or Azure, or GCP) is configured to trust GitHub's OIDC issuer and to exchange tokens matching specific claims for temporary role credentials. No static secret exists anywhere.

The security of this design rests entirely on how carefully you scope the trust policy's conditions. A trust policy that accepts *any* token from GitHub's issuer would let any GitHub repository on Earth assume your role. That precise misconfiguration has been found in the wild. The trust policy must pin the repository, and ideally the branch or environment.

The same pattern appears inside clouds:

- **AWS** attaches roles to EC2 instances via *instance profiles* and to pods via *IRSA* or *EKS Pod Identity*.
- **Azure** has *managed identities*.
- **GCP** attaches service accounts to compute and offers *Workload Identity* for GKE.

In all cases, the platform itself vouches for the workload's identity and dispenses short-lived credentials automatically.

## Access Control Models: RBAC, ABAC, and ReBAC

Underlying policy languages are formal access control models. Knowing them helps you reason about scale.

- **Role-Based Access Control (RBAC)** assigns permissions to roles and roles to principals. It is intuitive and auditable, but suffers from **role explosion**: as organizations grow, they create ever-more-specific roles ("DataScientist-ProjectX-ReadOnly-EU") until the role catalog is unmanageable.
- **Attribute-Based Access Control (ABAC)** makes decisions based on attributes of the principal, resource, action, and environment. A single ABAC rule might say: "Allow access if the principal's `team` tag equals the resource's `team` tag." One policy replaces hundreds of roles. The trade-off is that correctness now depends on the integrity of tags. If a user can modify their own tags, or tag a resource arbitrarily, ABAC collapses. Securing *who can set attributes* becomes the real control.
- **Relationship-Based Access Control (ReBAC)** decides based on relationships in a graph: "Alice can edit this document because she is a member of a team that owns the folder containing it." Google's **Zanzibar** paper (2019) formalized this at planetary scale and inspired systems like SpiceDB and OpenFGA. ReBAC is more common in application-level authorization than in cloud infrastructure IAM, but GCP's resource hierarchy, with permissions inherited from organization to folder to project to resource, is ReBAC in spirit.

## Advanced: Privilege Escalation and the Graph Nature of IAM

Here is where IAM becomes intellectually deep. **Permissions are not independent. They compose.** An identity's *effective* power is not what its policies literally say, but everything it can transitively reach.

Consider a role that cannot read your secrets database directly but holds `iam:CreatePolicyVersion`. It can rewrite its own policy to grant itself anything. That single permission is, functionally, administrator access. Security researchers (notably Rhino Security Labs) have catalogued dozens of such **privilege escalation paths** in AWS alone:

- **`iam:PassRole` combined with `ec2:RunInstances`:** launch a virtual machine with a more powerful role attached, then log into the machine and harvest that role's credentials. `PassRole` is the single most dangerous and most misunderstood permission in AWS IAM. It lets you hand a role to a service, and the service then acts with that role's power.
- **`lambda:UpdateFunctionCode`**
