import type { LessonSection } from "../curriculum";

export const sections: readonly LessonSection[] = [
  {
    heading: "The one idea that explains everything",
    blocks: [
      {"kind":"p","text":"Before any vocabulary, you need the central idea, because every term in Kubernetes is a consequence of it. Kubernetes is a system for declaring desired state and continuously reconciling reality toward it."},
      {"kind":"p","text":"You do not tell Kubernetes \"start three copies of my web server.\" You tell it \"there should be three copies of my web server,\" and it takes on the job of making that true and keeping it true. If a machine dies and takes one copy with it, nobody has to notice. The system sees that reality (two copies) differs from the declaration (three copies) and acts to close the gap."},
      {"kind":"p","text":"This is the difference between imperative and declarative management. It is the same philosophical shift as moving from a thermostat you adjust by hand to one you set to 21 degrees and walk away from. Engineers call the mechanism a control loop or reconciliation loop: observe, compare, act, repeat, forever."},
      {"kind":"p","text":"There is one more subtle property worth knowing early, because it is what makes Kubernetes robust. Its control loops are level-triggered rather than edge-triggered. An edge-triggered system reacts to events: \"a pod was deleted.\" If it misses the event, it is wrong forever. A level-triggered system reacts to state: \"there are currently two pods and there should be three.\" Missed events do not matter, because the next time the loop looks, the discrepancy is still visible. This single design choice is why Kubernetes survives network partitions, crashed components, and restarts so gracefully. Almost every piece of vocabulary below is either a way of expressing desired state or a component that reconciles toward it."},
    ],
  },
  {
    heading: "Cluster, nodes, and the control plane",
    blocks: [
      {"kind":"p","text":"A cluster is the whole system: a set of machines pooled together and managed as one computer. Those machines are called nodes. A node can be a physical server, a virtual machine, or even a Raspberry Pi. Kubernetes deliberately abstracts away which."},
      {"kind":"p","text":"Nodes play two broad roles. Worker nodes run your actual applications. The control plane is the brain that makes decisions about the cluster. In small setups the control plane may share machines with workloads. In production it usually runs on dedicated, replicated nodes, or is hidden from you entirely by a managed service such as GKE, EKS, or AKS."},
      {"kind":"p","text":"The control plane consists of a handful of components, and understanding their division of labor is the key to understanding Kubernetes as a distributed system."},
      {"kind":"p","text":"The API server (kube-apiserver) is the front door and the hub. Every interaction goes through it: your commands, the scheduler's decisions, a node reporting its health. Crucially, components do not talk to each other directly. They all talk to the API server, and they coordinate by reading and writing shared state through it. This is a hub-and-spoke architecture, sometimes described as a blackboard pattern: everyone writes on and reads from a common board rather than messaging one another. The API server also handles authentication (who are you?), authorization (are you allowed to do this?), and admission (should this request be accepted or modified?)."},
      {"kind":"p","text":"etcd is the database behind the API server: a distributed, strongly consistent key-value store. It holds the entire state of the cluster, meaning every object, every declaration, and every status report. etcd uses the Raft consensus algorithm, which is why it is typically run as three or five replicas: Raft needs a majority (a quorum) to agree on writes, so an odd number tolerates failures most efficiently. Only the API server talks to etcd directly. If etcd is lost without a backup, the cluster has effectively lost its memory. Your containers may keep running for a while, but the system no longer knows what it was supposed to be doing."},
      {"kind":"p","text":"The scheduler (kube-scheduler) decides which node each new workload should run on. It does not start anything itself. It watches for pods that have no node assigned and picks a node in two phases. First comes filtering: which nodes are even eligible, given resources, constraints, and taints? Then comes scoring: among eligible nodes, which is best? Finally it writes its decision back to the API server, a step called binding. The node then notices it has been assigned work and does it. This illustrates the blackboard pattern perfectly: the scheduler's entire output is one field written to shared state."},
      {"kind":"p","text":"The controller manager (kube-controller-manager) is a single process bundling dozens of independent control loops called controllers. There is a controller for Deployments, one for ReplicaSets, one for nodes, one for Jobs, one for service accounts, and so on. Each watches a particular kind of object and reconciles reality toward its declaration. When people say \"Kubernetes is just a bunch of control loops,\" this is largely what they mean."},
      {"kind":"p","text":"The cloud controller manager is the part that talks to your cloud provider. It creates load balancers, attaches disks, and notices when a VM has been deleted. Separating it out keeps the core of Kubernetes cloud-agnostic."},
    ],
  },
  {
    heading: "On every worker node",
    blocks: [
      {"kind":"p","text":"Each node runs a small set of agents."},
      {"kind":"p","text":"The kubelet is the node's representative to the control plane. It watches the API server for pods assigned to its node, instructs the container runtime to start them, monitors their health, and reports status back. The kubelet is the reason a node is part of the cluster at all."},
      {"kind":"p","text":"The container runtime actually runs containers. Common ones are containerd and CRI-O. Kubernetes talks to runtimes through a standard interface called the CRI (Container Runtime Interface). This is why Kubernetes famously stopped depending on Docker specifically: images built with Docker still work everywhere, because they follow the OCI (Open Container Initiative) image standard, but Docker itself is no longer required on nodes."},
      {"kind":"p","text":"kube-proxy implements the networking rules that make Services work, typically by programming iptables, IPVS, or nftables rules in the node's kernel. Some modern networking plugins, notably eBPF-based ones like Cilium, replace kube-proxy entirely."},
      {"kind":"p","text":"This pattern of standard interfaces recurs throughout Kubernetes and is worth naming. The CRI handles runtimes, the CNI (Container Network Interface) handles networking, and the CSI (Container Storage Interface) handles storage. Kubernetes defines the contract and vendors provide implementations. This is how a single orchestrator runs on every cloud and on bare metal."},
    ],
  },
  {
    heading: "Objects: the grammar of desired state",
    blocks: [
      {"kind":"p","text":"Everything you declare in Kubernetes is an object, also called a resource. You usually write objects as YAML files called manifests, and you submit them with kubectl, the command-line client (pronounced \"cube-control,\" \"cube-cuddle,\" or \"cube-C-T-L\" depending on which tribe you belong to)."},
      {"kind":"p","text":"Nearly every object has the same anatomy, and learning it pays off enormously."},
      {"kind":"list","items":["**apiVersion and kind** say what type of object this is, for example \"apps/v1, Deployment.\" The API is versioned and grouped, which lets Kubernetes evolve without breaking users.","**metadata** holds the object's identity: its name, its namespace, its labels, its annotations, and bookkeeping fields such as a unique ID and a resourceVersion.","**spec** is the desired state, what you want.","**status** is the observed state, what is actually true, as reported by the system."]},
      {"kind":"p","text":"The spec/status split is the declarative philosophy made concrete. You write spec. Controllers read spec, act on the world, and write status. Reconciliation is precisely the work of making status converge toward spec."},
      {"kind":"p","text":"The resourceVersion field deserves a note for the curious. It enables optimistic concurrency control: when you update an object, you implicitly say \"I am modifying the version I last saw.\" If someone else changed it in the meantime, your write is rejected and you must re-read and retry. No locks are needed. The same versioning powers the watch mechanism, which lets components subscribe to a stream of changes starting from a known version rather than repeatedly polling. The client-side machinery built on this, called informers, keeps a local cached copy of cluster state that is updated by watches. This is how thousands of controllers can observe a cluster without crushing the API server."},
    ],
  },
  {
    heading: "Namespaces, labels, selectors, and annotations",
    blocks: [
      {"kind":"p","text":"A namespace is a named partition within a cluster, such as \"production,\" \"staging,\" or \"team-payments.\" Names only need to be unique within a namespace, and access policies and resource quotas can be scoped to one. It is important to understand that namespaces provide organizational and administrative isolation, not strong security isolation. Workloads in different namespaces can still talk over the network by default, and they share the same nodes and kernel. Some objects, such as nodes and persistent volumes, are cluster-scoped and live outside any namespace."},
      {"kind":"p","text":"Labels are key-value pairs attached to objects, like \"app=checkout\" or \"tier=frontend.\" They look trivial, but they are arguably the most important design idea in the whole system, because they are how objects find each other."},
      {"kind":"p","text":"A selector is a query over labels, such as \"all pods where app=checkout.\" Kubernetes connects objects by selecting on labels rather than by hard references. A Service does not contain a list of its pods. It contains a selector, and whatever pods currently match are its pods. This loose coupling is what makes the system dynamic: pods come and go, and relationships re-form automatically. It is essentially set-based, relational thinking applied to infrastructure."},
      {"kind":"p","text":"Annotations are also key-value metadata, but they are not used for selection. They carry arbitrary information for tools and humans: build IDs, documentation links, configuration hints for an ingress controller. The rule of thumb is that labels are for identifying and grouping, and annotations are for describing."},
    ],
  },
  {
    heading: "The Pod: the atom of Kubernetes",
    blocks: [
      {"kind":"p","text":"A pod is the smallest deployable unit in Kubernetes. Beginners often assume that unit is the container, but it is not. A pod wraps one or more containers that share a fate and an environment."},
      {"kind":"p","text":"Containers in the same pod share a network namespace, meaning one IP address and one port space, so they reach each other via localhost. They can share storage volumes. They are always scheduled together onto the same node. Under the hood, a tiny \"pause\" container typically holds the shared namespaces open while the real containers come and go."},
      {"kind":"p","text":"Why this extra layer? Because some processes are intimately coupled without being one program. The classic case is the sidecar pattern: a main application container plus a helper that ships its logs, proxies its traffic (as in service meshes like Istio or Linkerd), or refreshes its credentials. Init containers are another variant. They run to completion, in order, before the main containers start, which makes them useful for setup tasks like waiting for a database or running migrations. Kubernetes now has native sidecar support, implemented as init containers that keep running alongside the main app."},
      {"kind":"p","text":"The most important conceptual fact about pods is that they are ephemeral and disposable. A pod is not repaired when it dies. It is replaced by a new pod with a new name and usually a new IP address. You should think of pods as cattle, not pets. This is why you almost never create pods directly: you create higher-level objects that manage pods for you. It is also why the networking and storage abstractions below exist, since they give stable identity to things built out of unstable parts."},
      {"kind":"p","text":"Every pod gets its own cluster-wide IP address, and the Kubernetes networking model requires that every pod can reach every other pod directly without NAT. This flat network is implemented by the CNI plugin, such as Calico, Cilium, or Flannel, and it dramatically simplifies application design compared with older port-mapping schemes."},
    ],
  },
  {
    heading: "Workload controllers: how pods are managed",
    blocks: [
      {"kind":"p","text":"A ReplicaSet ensures that a specified number of identical pods, called replicas, are running at all times. It finds its pods by label selector and creates or deletes pods to match the count. You rarely create ReplicaSets directly."},
      {"kind":"p","text":"A Deployment is what you normally use for stateless applications. It manages ReplicaSets, and that indirection is the trick behind rolling updates. When you change a Deployment's pod template, say to a new image version, the Deployment creates a new ReplicaSet and gradually scales it up while scaling the old one down. Two parameters control the pace: maxSurge (how many extra pods may exist during the update) and maxUnavailable (how many may be missing). Because old ReplicaSets are kept around, a rollback is simply scaling an old one back up. A Deployment is a controller managing controllers, which is a good example of how Kubernetes composes simple loops into sophisticated behavior."},
      {"kind":"p","text":"A StatefulSet is for workloads where identity matters, such as databases, message queues, and anything clustered. Its pods get stable, ordinal names (db-0, db-1, db-2), stable network identities, and their own persistent storage that follows them if they are rescheduled. They are created, updated, and terminated in a defined order. A StatefulSet treats its pods as pets with name tags, which is exactly what distributed databases with leader election and replication need."},
      {"kind":"p","text":"A DaemonSet runs one copy of a pod on every node, or on every node matching some criteria. It is used for node-level infrastructure: log collectors, monitoring agents, network plugins. When a node joins the cluster, the DaemonSet automatically places its pod there."},
      {"kind":"p","text":"A Job runs pods until a task completes successfully, rather than keeping them running forever. It suits batch processing, data migrations, and one-off computations, and it can run pods in parallel and retry failures. A CronJob creates Jobs on a schedule using classic cron syntax."},
      {"kind":"p","text":"Notice that each of these simply encodes a different answer to the question \"what does it mean for this workload to be healthy?\" For a Deployment, the answer is N interchangeable pods running. For a StatefulSet, it is N specific, named pods, each with its own state. For a DaemonSet, it is one per node. For a Job, it is the task completed. Each is a control loop with a different definition of correct."},
    ],
  },
  {
    heading: "Services and networking: stable names for moving targets",
    blocks: [
      {"kind":"p","text":"Since pods are ephemeral and their IPs change constantly, something must provide a stable address. That is the Service."},
      {"kind":"p","text":"A Service gives a set of pods, chosen by label selector, a single stable virtual IP and DNS name. Clients talk to the Service, and traffic is load-balanced across whichever pods currently match. Behind the scenes, the control plane maintains EndpointSlices, the live list of healthy pod addresses backing each Service, and kube-proxy or its replacement programs each node to route traffic accordingly. The virtual IP is not bound to any real network interface. It is an illusion maintained by kernel rules on every node."},
      {"kind":"p","text":"Services come in several types."},
      {"kind":"list","items":["**ClusterIP** is the default. It is reachable only inside the cluster.","**NodePort** additionally opens a fixed port on every node, forwarding to the Service.","**LoadBalancer** additionally asks the cloud provider to create an external load balancer pointing at the Service.","**Headless**, created by setting clusterIP to None, allocates no virtual IP at all. Instead, DNS returns the individual pod IPs directly. StatefulSets use this so clients can address specific members, like db-0."]},
      {"kind":"p","text":"Cluster DNS, usually CoreDNS, lets you reach a Service by name, following a pattern like my-service.my-namespace.svc.cluster.local. Service discovery in Kubernetes is therefore mostly just DNS, which every programming language already understands."},
      {"kind":"p","text":"An Ingress defines HTTP and HTTPS routing from outside the cluster to Services inside it, using rules like \"requests for shop.example.com/api go to the api service.\" An Ingress is only a declaration. It needs an ingress controller, such as NGINX, Traefik, or a cloud provider's, to actually implement it. This separation of API from implementation is typical of Kubernetes."},
      {"kind":"p","text":"The Gateway API is the newer, more expressive successor to Ingress. It splits responsibilities across roles. Infrastructure providers define GatewayClasses, cluster operators define Gateways, and application teams define routes such as HTTPRoute or GRPCRoute. This mirrors how real organizations divide ownership of networking."},
      {"kind":"p","text":"A NetworkPolicy is a firewall rule for pods, expressed with label selectors. For example, you might state that only pods labeled app=frontend may connect to pods labeled app=database on port 5432. By default all pods can talk to all pods. NetworkPolicies are how you move toward a zero-trust posture, and they only take effect if your CNI plugin enforces them."},
    ],
  },
  {
    heading: "Configuration and secrets",
    blocks: [
      {"kind":"p","text":"A ConfigMap holds non-sensitive configuration as key-value pairs or whole files, and injects it into pods as environment variables or mounted files. This decouples configuration from container images, so the same image can run in development and in production."},
      {"kind":"p","text":"A Secret is structurally similar but intended for sensitive data like passwords, tokens, and TLS certificates. There is a well-known caveat that professionals must internalize: Secret values are base64-encoded, and base64 is an encoding, not encryption. By default, Secrets are stored unencrypted in etcd unless encryption at rest is configured. Their real protections come from access control, from not being baked into images, and from optional encryption or external secret managers such as Vault or cloud KMS services."},
    ],
  },
  {
    heading: "Storage: persistence in a world of disposable pods",
    blocks: [
      {"kind":"p","text":"Container filesystems vanish when containers die, so Kubernetes provides layered storage abstractions."},
      {"kind":"p","text":"A volume is storage attached to a pod that outlives individual container restarts. Some volumes, like emptyDir, live and die with the pod. Others connect to durable storage."},
      {"kind":"p","text":"A PersistentVolume (PV) is a piece of actual storage in the cluster, such as a cloud disk or an NFS share, represented as a cluster-scoped object. A PersistentVolumeClaim (PVC) is a request for storage by a workload, along the lines of \"I need 20 GiB, readable and writable by one node.\""},
      {"kind":"p","text":"The PV/PVC split is a clean separation of concerns. It resembles the relationship between a physical resource and a demand for one. Developers state what they need (the claim), and the system satisfies it with what exists (the volume) by binding the two together."},
      {"kind":"p","text":"A StorageClass enables dynamic provisioning. Rather than administrators pre-creating volumes, a claim that references a StorageClass, such as \"fast-ssd,\" causes the matching disk to be created on demand through a CSI driver. Access modes like ReadWriteOnce and ReadWriteMany describe how a volume may be mounted, and reclaim policies (Retain or Delete) determine what happens to data when the claim is released."},
    ],
  },
  {
    heading: "Resources, scheduling, and placement",
    blocks: [
      {"kind":"p","text":"Each container can declare requests and limits for CPU and memory, and these two numbers mean very different things."},
      {"kind":"list","items":["**Requests** are what the scheduler uses for placement. They are a guaranteed reservation. A node is considered full when the sum of requests reaches its capacity, regardless of actual usage.","**Limits** are ceilings enforced at runtime by the Linux kernel's cgroups."]},
      {"kind":"p","text":"The consequences differ by resource type, and this is a frequent source of production mysteries. CPU is compressible: a container exceeding its CPU limit is throttled, meaning slowed down but kept alive. Memory is incompressible: a container exceeding its memory limit is OOM-killed (terminated for being out of memory). CPU is measured in cores or millicores, where 500m means half a core. Memory is measured in bytes, as in 256Mi."},
      {"kind":"p","text":"From requests and limits, Kubernetes derives a pod's Quality of Service (QoS) class. A pod is Guaranteed when requests equal limits for every resource, Burstable when some requests are set, and BestEffort when none are. When a node runs short of memory, the kubelet evicts pods starting with BestEffort and protecting Guaranteed ones last. Your resource declarations are therefore also statements about priority under pressure."},
      {"kind":"p","text":"Placement has its own vocabulary."},
      {"kind":"list","items":["**nodeSelector** is the simplest option: run only on nodes with a given label.","**Node affinity and anti-affinity** are richer rules, which may be \"required\" or \"preferred.\" For example: prefer nodes with GPUs, or never schedule on spot instances.","**Pod affinity and anti-affinity** place pods relative to other pods. A common rule is \"do not put two replicas of this database in the same availability zone.\"","**Topology spread constraints** distribute pods evenly across failure domains like zones or nodes.","**Taints and tolerations** work in the opposite direction. A taint on a node repels pods, as in \"this node is reserved for GPU workloads.\" Only pods with a matching toleration may schedule there. Affinity attracts pods to nodes, while taints let nodes reject pods."]},
    ],
  },
  {
    heading: "Health and lifecycle",
    blocks: [
      {"kind":"p","text":"Kubernetes uses probes to judge container health, and the three kinds answer different questions."},
      {"kind":"list","items":["**A liveness probe** asks whether the container is alive or stuck. If it fails, the container is restarted.","**A readiness probe** asks whether the container is ready to receive traffic. If it fails, the pod is removed from Service endpoints but not restarted. This matters during startup, warm-up, or temporary overload.","**A startup probe** gives slow-starting applications time to boot before liveness checks begin, preventing restart loops."]},
      {"kind":"p","text":"Confusing liveness with readiness is a classic mistake. Making a liveness probe depend on a database, for instance, can turn a brief database outage into a cluster-wide restart storm."},
      {"kind":"p","text":"The phrase CrashLoopBackOff, which every Kubernetes user eventually meets, describes a container that keeps crashing. The kubelet restarts it with exponentially increasing delays so a broken application does not thrash the node."},
      {"kind":"p","text":"A PodDisruptionBudget (PDB) limits how many pods of an application can be down at once due to voluntary disruptions, such as node drains during upgrades. An example is \"at least two of my three replicas must always be available.\" It is how you tell cluster maintenance tooling not to break your availability. Draining a node means safely evicting its pods, respecting PDBs, so the node can be serviced. Cordoning a node marks it unschedulable without evicting anything."},
    ],
  },
  {
    heading: "Scaling",
    blocks: [
      {"kind":"list","items":["**The Horizontal Pod Autoscaler (HPA)** adjusts the number of replicas based on metrics like CPU usage or custom signals such as queue depth.","**The Vertical Pod Autoscaler (VPA)** adjusts requests and limits, making pods bigger or smaller rather than more or fewer.","**The Cluster Autoscaler**, or newer alternatives like Karpenter, adds or removes nodes. When pods cannot be scheduled for lack of capacity, it provisions machines, and when nodes sit underused, it consolidates them away."]},
      {"kind":"p","text":"These three form layers of elasticity: pods scale within nodes, and nodes scale within the cloud. Each is itself a control loop."},
    ],
  },
  {
    heading: "Ownership, deletion, and garbage collection",
    blocks: [
      {"kind":"p","text":"When a Deployment creates a ReplicaSet, which creates pods, each child records an owner reference pointing to its parent. This forms a graph, and the garbage collector uses it: delete the Deployment, and its ReplicaSets and pods are cleaned up automatically, a behavior called cascading deletion."},
      {"kind":"p","text":"A finalizer is a marker on an object that blocks its final deletion until some cleanup has happened. For example, it can ensure a cloud load balancer is destroyed before the Service object disappears. When you delete an object with finalizers, it enters a \"terminating\" state and waits for the responsible controllers to finish their work and remove their finalizers. Objects stuck in Terminating forever are almost always waiting on a finalizer whose controller is gone."},
    ],
  },
  {
    heading: "Security and identity",
    blocks: [
      {"kind":"p","text":"Authentication establishes identity. Kubernetes has no user database of its own. Humans are typically authenticated via certificates or external identity providers using OIDC."},
      {"kind":"p","text":"A ServiceAccount is an identity for processes running in pods. It lets workloads call the Kubernetes API or cloud services with short-lived, automatically rotated tokens."},
      {"kind":"p","text":"RBAC (Role-Based Access Control) governs authorization. A Role (namespaced) or ClusterRole (cluster-wide) lists permitted verbs on resources, such as \"get, list, and watch pods.\" A RoleBinding or ClusterRoleBinding grants that role to a user, group, or ServiceAccount. RBAC permissions are purely additive: there are no deny rules, only grants."},
      {"kind":"p","text":"Admission control is the final gate before an object is persisted. Mutating admission can alter requests, for example by injecting a sidecar or setting defaults. Validating admission can reject them, for example by forbidding privileged containers or images from untrusted registries. These can be extended through admission webhooks, or declared directly with ValidatingAdmissionPolicy using the CEL expression language. Tools like OPA Gatekeeper and Kyverno build policy-as-code on top of this. Pod Security Standards (privileged, baseline, restricted) provide built-in profiles for how locked-down pods must be."},
    ],
  },
  {
    heading: "Extending Kubernetes: the platform for building platforms",
    blocks: [
      {"kind":"p","text":"Here is where Kubernetes reveals its real nature. It is less an orchestrator than a framework for writing control loops, which happens to ship with some built in."},
      {"kind":"p","text":"A CustomResourceDefinition (CRD) teaches the API server a new kind of object. Once you define, say, a \"PostgresCluster\" type, users can create PostgresCluster objects with kubectl exactly as they create Deployments, with the same storage, versioning, RBAC, and watch semantics."},
      {"kind":"p","text":"A new object type does nothing by itself, though. Pair it with a custom controller that watches those objects and reconciles reality toward them, and you have an Operator. An operator encodes human operational knowledge in software: how to provision a database cluster, perform failover, take backups, and run upgrades. It applies the same observe-compare-act loop Kubernetes uses internally to any domain you like."},
      {"kind":"p","text":"This is why so much of the cloud-native ecosystem, from certificate management (cert-manager) to GitOps (Argo CD, Flux) to entire cloud-resource provisioning systems (Crossplane), is built as CRDs plus controllers. The Kubernetes API has become a general-purpose, declarative control plane for anything."},
    ],
  },
  {
    heading: "Tooling vocabulary you will hear constantly",
    blocks: [
      {"kind":"list","items":["**Helm** is the package manager for Kubernetes. A chart is a templated bundle of manifests with configurable values, and a release is an installed instance of a chart.","**Kustomize** is a template-free alternative that layers patches over base manifests. It is built into kubectl.","**GitOps** is the practice of storing desired state in Git and having an in-cluster agent continuously reconcile the cluster to match the repository. It is the control-loop philosophy extended outward to your version control.","**A context** in your kubeconfig file selects which cluster, user, and namespace kubectl talks to. Running commands against the wrong context is the rite of passage no one wants."]},
    ],
  },
  {
    heading: "Bringing it together",
    blocks: [
      {"kind":"p","text":"Follow a single command through the system, and the vocabulary snaps into a coherent picture."},
      {"kind":"p","text":"You apply a Deployment manifest with kubectl. The API server authenticates you, checks RBAC, runs admission, and stores the object in etcd. The Deployment controller, watching via an informer, notices the new Deployment and creates a ReplicaSet. The ReplicaSet controller notices that and creates pod objects. The scheduler notices unassigned pods, filters and scores nodes, and binds each pod to one. The kubelet on each chosen node notices its new pods, asks the container runtime to pull images and start containers, runs the probes, and reports status. Once the readiness probes pass, the EndpointSlice controller adds the pods to your Service's endpoints, kube-proxy updates routing rules across all nodes, and traffic flows. If a node later dies, the node controller marks its pods as lost, the ReplicaSet sees too few replicas, and the whole chain quietly runs again."},
      {"kind":"p","text":"No component orchestrated this from above. Each one watched shared state, did one small job, and wrote its result back. That is the deep lesson of Kubernetes: a robust system built from many simple, independent, level-triggered control loops cooperating through a single consistent source of truth. Once you see that, the rest of the vocabulary is just the names of the loops and the shapes of the state they reconcile."},
    ],
  },
];;
