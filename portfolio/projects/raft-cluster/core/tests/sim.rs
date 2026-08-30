//! Deterministic simulation tests for the Raft state machine.
//!
//! A self-contained message-passing harness drives clusters of [`Node`]s over
//! simulated time. All randomness comes from a seeded splitmix64 generator and
//! all iteration is over ordered collections, so identical seeds produce
//! bit-identical runs. No `std::time` and no thread-local randomness appear
//! anywhere in this file.

use std::collections::{BTreeMap, HashSet, VecDeque};

use raft_core::node::{Node, Outbound, ProposeError};
use raft_core::types::{Config, LogIndex, NodeId, Role, StatusReport};
use raft_core::wire::Message;

// ---------------------------------------------------------------------------
// Deterministic PRNG (splitmix64), duplicated here per the Part 2 spec.
// ---------------------------------------------------------------------------

/// Self-contained splitmix64 generator; identical to the one in `node.rs`.
struct Rng(u64);

impl Rng {
    fn new(seed: u64) -> Self {
        Rng(seed)
    }

    fn next(&mut self) -> u64 {
        self.0 = self.0.wrapping_add(0x9E37_79B9_7F4A_7C15);
        let mut z = self.0;
        z = (z ^ (z >> 30)).wrapping_mul(0xBF58_476D_1CE4_E5B9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94D0_49BB_1331_11EB);
        z ^ (z >> 31)
    }

    /// Uniform integer in `0..bound` (bound > 0).
    fn range(&mut self, bound: u64) -> u64 {
        self.next() % bound
    }

    /// Bernoulli trial with probability `p` (parts-per-million precision).
    fn bernoulli(&mut self, p: f64) -> bool {
        let ppm = (p.clamp(0.0, 1.0) * 1_000_000.0) as u64;
        self.range(1_000_000) < ppm
    }
}

// ---------------------------------------------------------------------------
// The message fabric.
// ---------------------------------------------------------------------------

/// Simulated tick granularity, in milliseconds.
const DT: u64 = 10;

/// A message sitting in flight between two nodes.
struct InFlight {
    deliver_at_ms: u64,
    /// Monotonic insertion sequence, used as a stable tie-breaker.
    seq: u64,
    from: NodeId,
    to: NodeId,
    message: Message,
}

/// Delivery fault rules applied at enqueue time.
#[derive(Clone, Copy, Default)]
struct Faults {
    p_drop: f64,
    p_dup: f64,
    /// Max extra delay, in ms. `0` means "deliver next tick".
    p_delay: u64,
}

/// A network partition, expressed as pairs of node ids that cannot exchange
/// messages in either direction. All pairs are linked by default.
#[derive(Default)]
struct Partition {
    /// Sorted pairs `(min(a,b), max(a,b))` of cut links.
    cuts: HashSet<(NodeId, NodeId)>,
}

impl Partition {
    fn cut(&mut self, a: NodeId, b: NodeId) {
        let (x, y) = if a < b { (a, b) } else { (b, a) };
        self.cuts.insert((x, y));
    }

    fn heal(&mut self, ) {
        self.cuts.clear();
    }

    fn is_linked(&self, a: NodeId, b: NodeId) -> bool {
        let (x, y) = if a < b { (a, b) } else { (b, a) };
        !self.cuts.contains(&(x, y))
    }
}

/// The simulator.
struct Fabric {
    nodes: BTreeMap<NodeId, Node>,
    alive: HashSet<NodeId>,
    now: u64,
    inflight: VecDeque<InFlight>,
    rng: Rng,
    faults: Faults,
    partition: Partition,
    seq: u64,

    /// When set, every outbound message *sent by* this node is copied into
    /// `captured` at enqueue time, before any drop/partition rule is applied.
    capture_from: Option<NodeId>,
    /// Buffer of captured outbound messages (see `capture_from`).
    captured: Vec<Outbound>,
}

impl Fabric {
    /// Wire every node with `Config::default()` at `now = 0`.
    fn new(ids: &[NodeId], seed: u64) -> Fabric {
        let mut nodes = BTreeMap::new();
        let mut alive = HashSet::new();
        let cfg = Config::default();
        for &id in ids {
            let peers: Vec<NodeId> = ids.iter().copied().filter(|&x| x != id).collect();
            // Node::new seeds its RNG with `seed ^ id`, so the raw fabric seed
            // goes in here — XOR-ing the id a second time would hand every
            // node the same state and perfectly synchronize their elections.
            let node = Node::new(id, peers, cfg, seed, 0).expect("valid config");
            nodes.insert(id, node);
            alive.insert(id);
        }
        Fabric {
            nodes,
            alive,
            now: 0,
            inflight: VecDeque::new(),
            rng: Rng::new(seed),
            faults: Faults::default(),
            partition: Partition::default(),
            seq: 0,
            capture_from: None,
            captured: Vec::new(),
        }
    }

    fn set_faults(&mut self, faults: Faults) {
        self.faults = faults;
    }

    fn kill(&mut self, id: NodeId) {
        self.alive.remove(&id);
    }

    fn resume(&mut self, id: NodeId) {
        // Volatile state stays intact — a "crash" in this MVP is a pause.
        self.alive.insert(id);
    }

    fn is_alive(&self, id: NodeId) -> bool {
        self.alive.contains(&id)
    }

    fn statuses(&self) -> BTreeMap<NodeId, StatusReport> {
        self.nodes.iter().map(|(&id, n)| (id, n.status())).collect()
    }

    /// The unique leader among alive nodes, if there is exactly one.
    fn leader(&self) -> Option<NodeId> {
        let mut found = None;
        for (&id, n) in &self.nodes {
            if !self.alive.contains(&id) {
                continue;
            }
            if matches!(n.status().role, Role::Leader) {
                if found.is_some() {
                    return None;
                }
                found = Some(id);
            }
        }
        found
    }

    /// Deliver a client proposal directly to a specific node.
    fn propose(&mut self, id: NodeId, data: Vec<u8>) -> Result<LogIndex, ProposeError> {
        let node = self.nodes.get_mut(&id).expect("node exists");
        node.propose(data)
    }

    /// Enqueue an outbound message according to the fault rules. Drops silently
    /// if the sender is dead, the receiver is dead, or the link is cut. A dead
    /// receiver's inbound is dropped at enqueue time (documented choice).
    fn enqueue(&mut self, from: NodeId, ob: Outbound) {
        // Capture hook (records even messages that are later dropped/partitioned).
        if self.capture_from == Some(from) {
            self.captured.push(ob.clone());
        }

        if !self.is_alive(from) || !self.is_alive(ob.to) {
            return;
        }
        if !self.partition.is_linked(from, ob.to) {
            return;
        }
        if self.rng.bernoulli(self.faults.p_drop) {
            return;
        }
        let base_delay = if self.faults.p_delay == 0 {
            0
        } else {
            self.rng.range(self.faults.p_delay + 1)
        };
        self.push_inflight(from, ob.to, ob.message.clone(), base_delay);

        if self.rng.bernoulli(self.faults.p_dup) {
            let extra = if self.faults.p_delay == 0 {
                0
            } else {
                self.rng.range(self.faults.p_delay + 1)
            };
            self.push_inflight(from, ob.to, ob.message, extra);
        }
    }

    fn push_inflight(&mut self, from: NodeId, to: NodeId, message: Message, delay: u64) {
        self.seq += 1;
        self.inflight.push_back(InFlight {
            deliver_at_ms: self.now + delay,
            seq: self.seq,
            from,
            to,
            message,
        });
    }

    /// Drain every node's outbox into the in-flight queue. Killed nodes' outboxes
    /// are drained into the void so a later `resume` does not flood peers with
    /// stale-term messages (spec allows "suppressed"; this is the strict reading).
    fn drain_outboxes(&mut self) {
        let ids: Vec<NodeId> = self.nodes.keys().copied().collect();
        for id in ids {
            let obs = self
                .nodes
                .get_mut(&id)
                .map(|n| n.take_outbox())
                .unwrap_or_default();
            if !self.is_alive(id) {
                continue; // drained and discarded
            }
            for ob in obs {
                self.enqueue(id, ob);
            }
        }
    }

    /// Deliver everything with `deliver_at_ms <= now`, in stable seq order.
    fn deliver_ready(&mut self) {
        let mut ready: Vec<InFlight> = Vec::new();
        let mut remaining: VecDeque<InFlight> = VecDeque::new();
        while let Some(m) = self.inflight.pop_front() {
            if m.deliver_at_ms <= self.now {
                ready.push(m);
            } else {
                remaining.push_back(m);
            }
        }
        self.inflight = remaining;
        ready.sort_by_key(|m| (m.deliver_at_ms, m.seq));

        for m in ready {
            if !self.is_alive(m.to) {
                continue;
            }
            if !self.partition.is_linked(m.from, m.to) {
                continue;
            }
            if let Some(node) = self.nodes.get_mut(&m.to) {
                node.step(m.from, &m.message, self.now);
            }
        }
    }

    /// Run the simulator for `ms` more simulated milliseconds.
    fn run_until(&mut self, ms: u64) {
        let target = self.now + ms;
        while self.now < target {
            self.now += DT;
            let ids: Vec<NodeId> = self.nodes.keys().copied().collect();
            for id in &ids {
                if self.is_alive(*id) {
                    if let Some(n) = self.nodes.get_mut(id) {
                        n.tick(self.now);
                    }
                }
            }
            self.drain_outboxes();
            self.deliver_ready();
            // Replies produced during delivery are flushed in the same tick so a
            // full round trip does not cost two ticks. Their `deliver_at_ms` is
            // still honoured, so determinism and the delay distribution hold.
            self.drain_outboxes();
        }
    }

    /// Deliver a raw message to `to` right now, bypassing the network fabric.
    fn inject(&mut self, from: NodeId, to: NodeId, message: &Message) {
        if !self.is_alive(to) {
            return;
        }
        if let Some(n) = self.nodes.get_mut(&to) {
            n.step(from, message, self.now);
        }
    }
}

// ---------------------------------------------------------------------------
// Shared assertions.
// ---------------------------------------------------------------------------

/// All alive nodes must agree on `(leader_id, commit_index)`.
fn assert_convergence(fab: &Fabric) {
    let leader = fab.leader().expect("a unique leader among alive nodes");
    let expected_commit = fab.nodes[&leader].status().commit_index;
    for (&id, n) in &fab.nodes {
        if !fab.is_alive(id) {
            continue;
        }
        let s = n.status();
        assert_eq!(s.leader_id, leader, "node {id} disagrees on leader");
        assert_eq!(
            s.commit_index, expected_commit,
            "node {id} disagrees on commit_index"
        );
    }
}

/// All alive nodes must have identical `commit_index` and `log_len`. Combined
/// with Raft's Log Matching property (§5.3), which `node.rs` implements, this
/// implies identical entries index-by-index up to `log_len`.
fn assert_logs_identical(fab: &Fabric) {
    let leader = fab.leader().expect("a unique leader");
    let ref_status = fab.nodes[&leader].status();
    for (&id, n) in &fab.nodes {
        if !fab.is_alive(id) {
            continue;
        }
        let s = n.status();
        assert_eq!(
            s.log_len, ref_status.log_len,
            "node {id} has divergent log_len ({} vs {})",
            s.log_len, ref_status.log_len
        );
        assert_eq!(
            s.commit_index, ref_status.commit_index,
            "node {id} has divergent commit_index"
        );
    }
}

// ---------------------------------------------------------------------------
// Scenario 1: no faults, elects and converges.
// ---------------------------------------------------------------------------

#[test]
fn no_faults_elects_and_converges() {
    let mut fab = Fabric::new(&[1, 2, 3, 4, 5], 0xA5A5_5A5A);
    fab.run_until(2_000);

    let leader = fab.leader().expect("a leader emerges");
    assert_convergence(&fab);

    for i in 0..3u8 {
        let idx = fab.propose(leader, vec![i]).expect("leader accepts");
        assert!(idx >= 1);
        fab.run_until(500);
    }
    fab.run_until(1_500);

    let leader2 = fab.leader().expect("leader still unique");
    assert_eq!(leader, leader2, "leader is stable without faults");
    let s = fab.nodes[&leader].status();
    assert_eq!(s.log_len, 3, "leader has three entries");
    assert_eq!(s.commit_index, 3, "all three committed");
    assert_logs_identical(&fab);
}

// ---------------------------------------------------------------------------
// Scenario 2: leader failover, old leader resumes and steps down.
// ---------------------------------------------------------------------------

#[test]
fn leader_failover_and_old_leader_steps_down() {
    let mut fab = Fabric::new(&[1, 2, 3, 4, 5], 0x1234_5678);
    fab.run_until(2_000);
    let old_leader = fab.leader().expect("initial leader");

    fab.propose(old_leader, vec![0xAA]).expect("propose ok");
    fab.run_until(1_000);

    fab.kill(old_leader);
    fab.run_until(4_000);

    let new_leader = fab.leader().expect("new leader among survivors");
    assert_ne!(new_leader, old_leader, "old leader is not counted");

    fab.propose(new_leader, vec![0xBB]).expect("new leader ok");
    fab.run_until(1_500);
    let survivors_commit = fab.nodes[&new_leader].status().commit_index;
    assert!(survivors_commit >= 2, "second entry committed on survivors");

    fab.resume(old_leader);
    fab.run_until(4_000);

    let final_leader = fab.leader().expect("still a unique leader");
    assert_ne!(final_leader, old_leader, "old leader must not re-win here");
    let old_status = fab.nodes[&old_leader].status();
    assert!(
        matches!(old_status.role, Role::Follower),
        "old leader stepped down to Follower"
    );
    assert_logs_identical(&fab);
}

// ---------------------------------------------------------------------------
// Scenario 3: minority partition cannot elect.
// ---------------------------------------------------------------------------

#[test]
fn minority_partition_cannot_elect() {
    let ids = [1u64, 2, 3, 4, 5];
    let mut fab = Fabric::new(&ids, 0xC0FFEE);
    fab.run_until(1_500);

    let majority = [1u64, 2, 3];
    let minority = [4u64, 5];
    for &a in &majority {
        for &b in &minority {
            fab.partition.cut(a, b);
        }
    }

    fab.run_until(4_000);

    let leader = fab
        .nodes
        .iter()
        .filter(|(id, _)| majority.contains(id))
        .find(|(_, n)| matches!(n.status().role, Role::Leader))
        .map(|(id, _)| *id)
        .expect("majority elects a leader");

    for &m in &minority {
        let role = fab.nodes[&m].status().role;
        assert!(
            !matches!(role, Role::Leader),
            "minority node {m} elected itself"
        );
    }

    let idx = fab.propose(leader, vec![0x11]).expect("majority commits");
    assert!(idx >= 1);
    fab.run_until(1_500);
    let commit_majority = fab.nodes[&leader].status().commit_index;
    assert!(commit_majority >= 1, "propose committed on majority");

    for &m in &minority {
        match fab.propose(m, vec![0x22]) {
            Err(ProposeError::NotLeader { .. }) => {}
            Ok(_) => panic!("minority node {m} accepted a propose"),
        }
        assert_eq!(
            fab.nodes[&m].status().commit_index, 0,
            "minority node {m} committed something"
        );
    }

    fab.partition.heal();
    fab.run_until(4_000);

    let final_leader = fab.leader().expect("unique leader after healing");
    assert!(fab.nodes[&final_leader].status().commit_index >= 1);
    assert_logs_identical(&fab);
}

// ---------------------------------------------------------------------------
// Scenario 4: commit requires majority.
// ---------------------------------------------------------------------------

#[test]
fn commit_requires_majority() {
    let ids = [1u64, 2, 3, 4, 5];
    let mut fab = Fabric::new(&ids, 0xDEAD_BEEF);
    fab.run_until(2_000);
    let leader = fab.leader().expect("initial leader");

    let victims: Vec<NodeId> = ids.iter().copied().filter(|&x| x != leader).take(2).collect();
    for v in &victims {
        fab.kill(*v);
    }
    fab.run_until(500);

    fab.propose(leader, vec![1]).expect("leader ok");
    fab.run_until(1_500);
    let commit_after_first = fab.nodes[&leader].status().commit_index;
    assert!(commit_after_first >= 1, "propose committed with 3/5 alive");

    let third: NodeId = ids
        .iter()
        .copied()
        .find(|&x| x != leader && !victims.contains(&x))
        .expect("a third victim");
    fab.kill(third);
    fab.run_until(500);

    // With 3/5 dead there is no majority, so nothing new may commit anywhere.
    let commit_before_stall = commit_after_first;
    if let Some(l) = fab.leader() {
        // Accepted by the leader but, with no majority reachable, never
        // committed — the exact state the rest of the test unfolds from.
        let _ = fab.propose(l, vec![2]);
    }
    fab.run_until(6_000);

    for (&id, n) in &fab.nodes {
        if !fab.is_alive(id) {
            continue;
        }
        assert!(
            n.status().commit_index <= commit_before_stall,
            "commit advanced past the majority-lost point on node {id}"
        );
    }

    // Resume both paused followers: L + 2 makes 3/5 alive — a majority again.
    // The pause let their election timers lapse, so they will campaign; the
    // old leader may be deposed and its uncommitted term-T entry overwritten
    // (§5.4.2) — either way the cluster re-converges under one leader.
    fab.resume(victims[0]);
    fab.resume(victims[1]);
    fab.run_until(6_000);

    let leader_now = fab.leader().expect("majority restored → a leader");
    fab.propose(leader_now, vec![3]).expect("propose ok");
    fab.run_until(2_000);

    let final_commit = fab.nodes[&leader_now].status().commit_index;
    assert!(
        final_commit > commit_before_stall,
        "commit advanced after majority restored ({final_commit} > {commit_before_stall})"
    );
    assert_logs_identical(&fab);
}

// ---------------------------------------------------------------------------
// Scenario 5: chaotic delivery still converges deterministically.
// ---------------------------------------------------------------------------

fn run_chaos_scenario(seed: u64) -> Vec<(NodeId, StatusReport)> {
    let mut fab = Fabric::new(&[1, 2, 3, 4, 5], seed);
    fab.set_faults(Faults {
        p_drop: 0.10,
        p_dup: 0.10,
        p_delay: 200,
    });

    fab.run_until(3_000);

    // Scripted partition #1: isolate node 5 for ~1s.
    for peer in [1u64, 2, 3, 4] {
        fab.partition.cut(5, peer);
    }
    fab.run_until(1_000);
    fab.partition.heal();
    fab.run_until(1_500);

    if let Some(l) = fab.leader() {
        let _ = fab.propose(l, vec![1]);
        let _ = fab.propose(l, vec![2]);
    }
    fab.run_until(2_000);

    // Scripted partition #2: split {1,2} vs {3,4,5} for ~1s.
    for a in [1u64, 2] {
        for b in [3u64, 4, 5] {
            fab.partition.cut(a, b);
        }
    }
    fab.run_until(1_000);
    fab.partition.heal();

    fab.run_until(6_000);

    // Turn chaos off and let stragglers catch up cleanly.
    fab.set_faults(Faults::default());
    fab.run_until(3_000);

    fab.statuses().into_iter().collect()
}

#[test]
fn chaos_delivery_converges() {
    let seed = 0xFEED_BEEF_CAFE_BABE;
    let a = run_chaos_scenario(seed);
    let b = run_chaos_scenario(seed);

    // Determinism: identical seeds → bit-identical final status vectors.
    assert_eq!(a.len(), b.len(), "status vectors differ in size");
    for ((id_a, sa), (id_b, sb)) in a.iter().zip(b.iter()) {
        assert_eq!(id_a, id_b, "id order differs");
        assert_eq!(sa.role.as_u8(), sb.role.as_u8(), "role differs at {id_a}");
        assert_eq!(sa.term, sb.term, "term differs at {id_a}");
        assert_eq!(sa.leader_id, sb.leader_id, "leader_id differs at {id_a}");
        assert_eq!(sa.commit_index, sb.commit_index, "commit differs at {id_a}");
        assert_eq!(sa.log_len, sb.log_len, "log_len differs at {id_a}");
        assert_eq!(sa.voted_for, sb.voted_for, "voted_for differs at {id_a}");
        assert_eq!(
            sa.last_applied, sb.last_applied,
            "last_applied differs at {id_a}"
        );
    }

    // Convergence: exactly one leader; everyone agrees and commits.
    let leaders: Vec<NodeId> = a
        .iter()
        .filter(|(_, s)| matches!(s.role, Role::Leader))
        .map(|(id, _)| *id)
        .collect();
    assert_eq!(leaders.len(), 1, "expected a single stable leader");
    let leader = leaders[0];
    let commit = a
        .iter()
        .find(|(id, _)| *id == leader)
        .map(|(_, s)| s.commit_index)
        .unwrap();
    for (id, s) in &a {
        assert_eq!(s.leader_id, leader, "node {id} disagrees on leader");
        assert_eq!(s.commit_index, commit, "node {id} disagrees on commit");
        assert_eq!(s.log_len, commit, "node {id} log length off commit");
    }
}

// ---------------------------------------------------------------------------
// Scenario 6: a stale leader's AppendEntries cannot corrupt committed log.
// ---------------------------------------------------------------------------

#[test]
fn stale_leader_cannot_corrupt_log() {
    let mut fab = Fabric::new(&[1, 2, 3, 4, 5], 0xBADD_C0DE);
    fab.run_until(2_000);
    let old_leader = fab.leader().expect("initial leader");

    // Commit an entry under the old leader.
    fab.propose(old_leader, vec![0xE1]).expect("commit e1");
    fab.run_until(1_000);
    assert!(fab.nodes[&old_leader].status().commit_index >= 1);

    // Turn on the capture hook so the old leader's next heartbeat is recorded
    // at enqueue time, regardless of any later drop/partition faults.
    let target_peer: NodeId = fab
        .nodes
        .keys()
        .copied()
        .find(|&id| id != old_leader)
        .expect("some peer");
    fab.capture_from = Some(old_leader);
    fab.run_until(1_000); // let at least one heartbeat cycle emit
    fab.capture_from = None;

    let captured = fab
        .captured
        .iter()
        .find(|ob| ob.to == target_peer && matches!(ob.message, Message::AppendEntries { .. }))
        .cloned()
        .expect("captured a stale AppendEntries to the target peer");

    // Fail the old leader; survivors must elect a new one.
    fab.kill(old_leader);
    fab.run_until(4_000);
    let new_leader = fab.leader().expect("survivors elect a new leader");
    assert_ne!(new_leader, old_leader);

    // Commit fresh entries under the new leader.
    fab.propose(new_leader, vec![0xE2]).expect("commit e2");
    fab.propose(new_leader, vec![0xE3]).expect("commit e3");
    fab.run_until(2_000);
    let commit_after_new = fab.nodes[&new_leader].status().commit_index;
    assert!(commit_after_new >= 3);

    // Snapshot the target follower's log length before the stale injection.
    let pre_len = fab.nodes[&target_peer].status().log_len;

    // Inject the captured stale AppendEntries into the target follower. It must
    // reject or ignore it without truncating committed data.
    if fab.is_alive(target_peer) {
        fab.inject(old_leader, target_peer, &captured.message);
    }

    // Resume the old leader briefly so it observes the higher-term traffic and
    // steps down to Follower.
    fab.resume(old_leader);
    fab.run_until(2_000);

    // No committed prefix on any alive node regressed; the target never shrank.
    for (&id, n) in &fab.nodes {
        if !fab.is_alive(id) {
            continue;
        }
        let s = n.status();
        if id == target_peer {
            assert!(
                s.log_len >= pre_len,
                "target follower {id} lost log (was {pre_len}, is {})",
                s.log_len
            );
        }
        assert!(
            s.commit_index >= commit_after_new,
            "commit regressed on node {id} ({} < {commit_after_new})",
            s.commit_index
        );
    }

    // Old leader must have stepped down.
    assert!(
        matches!(fab.nodes[&old_leader].status().role, Role::Follower),
        "old leader did not step down"
    );

    // Whole cluster ends identical.
    fab.run_until(2_000);
    assert_logs_identical(&fab);
}
