//! The Raft state machine (leader election + log replication, MVP scope).
//!
//! The core is caller-driven: it never reads a clock. Every entry point takes
//! `now_ms` and time is clamped to be monotonic. All I/O is expressed as
//! [`Outbound`] messages drained via [`Node::take_outbox`]; the core never
//! performs actual sends.

use std::collections::{HashMap, HashSet};
use std::fmt;

use crate::log::RaftLog;
use crate::types::{
    Config, ConfigError, Entry, LogIndex, NodeId, Role, StatusReport, Term, NO_NODE,
};
use crate::wire::Message;

/// Maximum number of entries carried in a single `AppendEntries` (bounds frame
/// size). Frozen.
const MAX_BATCH: usize = 64;

/// A message the caller must deliver to peer `to`.
#[derive(Clone)]
pub struct Outbound {
    /// Destination node.
    pub to: NodeId,
    /// The message to deliver.
    pub message: Message,
}

/// Error returned by [`Node::propose`] when the node is not the leader.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ProposeError {
    /// This node is not the leader. `leader_hint` is the last known leader, or
    /// [`NO_NODE`] when unknown.
    NotLeader {
        /// Best-effort hint at the current leader (`NO_NODE` when unknown).
        leader_hint: NodeId,
    },
}

impl fmt::Display for ProposeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ProposeError::NotLeader { leader_hint } => {
                if *leader_hint == NO_NODE {
                    write!(f, "not leader; leader unknown")
                } else {
                    write!(f, "not leader; try node {}", leader_hint)
                }
            }
        }
    }
}

impl std::error::Error for ProposeError {}

impl Message {
    /// The term carried by this message (for `StatusReport`, the reported term).
    /// Used by host layers for logging and stale-message filtering.
    pub fn term(&self) -> Term {
        match self {
            Message::RequestVote { term, .. } => *term,
            Message::RequestVoteReply { term, .. } => *term,
            Message::AppendEntries { term, .. } => *term,
            Message::AppendEntriesReply { term, .. } => *term,
            Message::StatusReport(s) => s.term,
        }
    }
}

/// Self-contained splitmix64 PRNG (see the frozen spec in Part 2).
struct SplitMix64 {
    state: u64,
}

impl SplitMix64 {
    fn new(seed: u64) -> Self {
        Self { state: seed }
    }

    fn next(&mut self) -> u64 {
        self.state = self.state.wrapping_add(0x9E37_79B9_7F4A_7C15);
        let mut z = self.state;
        z = (z ^ (z >> 30)).wrapping_mul(0xBF58_476D_1CE4_E5B9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94D0_49BB_1331_11EB);
        z ^ (z >> 31)
    }
}

/// A single Raft node.
pub struct Node {
    id: NodeId,
    /// Peers, sorted, deduped, excluding self.
    peers: Vec<NodeId>,
    config: Config,

    role: Role,
    current_term: Term,
    voted_for: NodeId,
    leader_id: NodeId,

    log: RaftLog,
    commit_index: LogIndex,
    last_applied: LogIndex,

    election_deadline_ms: u64,
    last_heartbeat_sent_ms: u64,

    next_index: HashMap<NodeId, LogIndex>,
    match_index: HashMap<NodeId, LogIndex>,
    votes: HashSet<NodeId>,

    rng: SplitMix64,
    outbox: Vec<Outbound>,
    last_now_ms: u64,
}

impl Node {
    /// Create a node. Peers are stored sorted, deduped, and with self removed.
    /// Returns the underlying [`ConfigError`] unchanged if the config is invalid.
    pub fn new(
        id: NodeId,
        peers: Vec<NodeId>,
        config: Config,
        seed: u64,
        now_ms: u64,
    ) -> Result<Node, ConfigError> {
        config.validate()?;
        let mut peers: Vec<NodeId> = peers.into_iter().filter(|&p| p != id).collect();
        peers.sort_unstable();
        peers.dedup();

        let mut node = Node {
            id,
            peers,
            config,
            role: Role::Follower,
            current_term: 0,
            voted_for: NO_NODE,
            leader_id: NO_NODE,
            log: RaftLog::new(),
            commit_index: 0,
            last_applied: 0,
            election_deadline_ms: 0,
            last_heartbeat_sent_ms: now_ms,
            next_index: HashMap::new(),
            match_index: HashMap::new(),
            votes: HashSet::new(),
            rng: SplitMix64::new(seed ^ id),
            outbox: Vec::new(),
            last_now_ms: now_ms,
        };
        node.reset_election_deadline(now_ms);
        Ok(node)
    }

    /// This node's id.
    pub fn id(&self) -> NodeId {
        self.id
    }

    /// A flat snapshot of this node's volatile state.
    pub fn status(&self) -> StatusReport {
        StatusReport {
            role: self.role,
            term: self.current_term,
            leader_id: self.leader_id,
            commit_index: self.commit_index,
            last_applied: self.last_applied,
            log_len: self.log.last_index(),
            voted_for: self.voted_for,
        }
    }

    /// Copy up to `max_entries` log entries starting at 1-based `start_index`.
    ///
    /// Clamps exactly like [`RaftLog::slice`] — an out-of-range or `0` start
    /// yields an empty vector — and never panics. Hosts use this to draw
    /// per-node log bars and to serve committed data.
    pub fn log_slice(&self, start_index: LogIndex, max_entries: usize) -> Vec<Entry> {
        self.log.slice(start_index, max_entries).to_vec()
    }

    /// Advance logical time. Followers/candidates start an election on timeout;
    /// leaders emit heartbeats when the heartbeat interval elapses.
    pub fn tick(&mut self, now_ms: u64) {
        let now = self.observe_now(now_ms);
        match self.role {
            Role::Follower | Role::Candidate => {
                if now >= self.election_deadline_ms {
                    self.start_election(now);
                }
            }
            Role::Leader => {
                if now - self.last_heartbeat_sent_ms >= self.config.heartbeat_interval_ms {
                    for i in 0..self.peers.len() {
                        let peer = self.peers[i];
                        self.send_append_to(peer);
                    }
                    self.last_heartbeat_sent_ms = now;
                }
            }
        }
    }

    /// Process an incoming message from peer `from`.
    pub fn step(&mut self, from: NodeId, msg: &Message, now_ms: u64) {
        let now = self.observe_now(now_ms);
        if from == self.id || !self.is_peer(from) {
            return;
        }

        // Step down on strictly greater term before dispatch.
        if msg.term() > self.current_term {
            self.role = Role::Follower;
            self.current_term = msg.term();
            self.voted_for = NO_NODE;
            self.leader_id = NO_NODE;
            self.reset_election_deadline(now);
        }

        match msg {
            Message::RequestVote {
                term,
                candidate,
                last_log_index,
                last_log_term,
            } => {
                self.handle_request_vote(from, *term, *candidate, *last_log_index, *last_log_term, now);
            }
            Message::RequestVoteReply { term, vote_granted } => {
                self.handle_request_vote_reply(from, *term, *vote_granted, now);
            }
            Message::AppendEntries {
                term,
                leader,
                prev_log_index,
                prev_log_term,
                leader_commit,
                entries,
            } => {
                self.handle_append_entries(
                    from,
                    *term,
                    *leader,
                    *prev_log_index,
                    *prev_log_term,
                    *leader_commit,
                    entries,
                    now,
                );
            }
            Message::AppendEntriesReply {
                term,
                success,
                match_index,
                conflict_index,
            } => {
                self.handle_append_entries_reply(from, *term, *success, *match_index, *conflict_index);
            }
            // Host-to-host metadata, never a node input.
            Message::StatusReport(_) => {}
        }
    }

    /// Append a client command. Only the leader accepts proposals; it replicates
    /// eagerly and returns the assigned log index.
    pub fn propose(&mut self, data: Vec<u8>) -> Result<LogIndex, ProposeError> {
        if !matches!(self.role, Role::Leader) {
            return Err(ProposeError::NotLeader {
                leader_hint: self.leader_id,
            });
        }
        self.log.append(vec![Entry {
            term: self.current_term,
            data,
        }]);
        self.advance_commit();
        for i in 0..self.peers.len() {
            let peer = self.peers[i];
            self.send_append_to(peer);
        }
        Ok(self.log.last_index())
    }

    /// Drain all pending outbound messages. Returns an empty `Vec` when idle.
    pub fn take_outbox(&mut self) -> Vec<Outbound> {
        std::mem::take(&mut self.outbox)
    }

    // ------------------------------------------------------------------ helpers

    /// Clamp `now_ms` to be monotonic and record it.
    fn observe_now(&mut self, now_ms: u64) -> u64 {
        let now = now_ms.max(self.last_now_ms);
        self.last_now_ms = now;
        now
    }

    fn is_peer(&self, id: NodeId) -> bool {
        self.peers.binary_search(&id).is_ok()
    }

    /// `deadline = now + min + rng % (max - min + 1)`.
    fn reset_election_deadline(&mut self, now: u64) {
        let span = self.config.election_timeout_max_ms - self.config.election_timeout_min_ms + 1;
        let jitter = self.rng.next() % span;
        self.election_deadline_ms = now + self.config.election_timeout_min_ms + jitter;
    }

    fn reply(&mut self, to: NodeId, message: Message) {
        self.outbox.push(Outbound { to, message });
    }

    /// Build and enqueue an `AppendEntries` for `peer` from its `next_index`.
    fn send_append_to(&mut self, peer: NodeId) {
        let next = *self
            .next_index
            .get(&peer)
            .unwrap_or(&(self.log.last_index() + 1));
        let prev = next - 1;
        let prev_term = self.log.term_at(prev).unwrap_or(0);
        let entries = self.log.slice(next, MAX_BATCH).to_vec();
        let msg = Message::AppendEntries {
            term: self.current_term,
            leader: self.id,
            prev_log_index: prev,
            prev_log_term: prev_term,
            leader_commit: self.commit_index,
            entries,
        };
        self.outbox.push(Outbound { to: peer, message: msg });
    }

    fn start_election(&mut self, now: u64) {
        self.role = Role::Candidate;
        self.current_term += 1;
        self.voted_for = self.id;
        self.leader_id = NO_NODE;
        self.votes.clear();
        self.votes.insert(self.id);
        self.reset_election_deadline(now);

        if self.peers.is_empty() {
            // Single-node cluster: win immediately via the uniform path.
            self.become_leader(now);
            return;
        }

        for i in 0..self.peers.len() {
            let peer = self.peers[i];
            let msg = Message::RequestVote {
                term: self.current_term,
                candidate: self.id,
                last_log_index: self.log.last_index(),
                last_log_term: self.log.last_term(),
            };
            self.outbox.push(Outbound { to: peer, message: msg });
        }
    }

    fn become_leader(&mut self, now: u64) {
        self.role = Role::Leader;
        self.leader_id = self.id;
        let next = self.log.last_index() + 1;
        self.next_index.clear();
        self.match_index.clear();
        for i in 0..self.peers.len() {
            let peer = self.peers[i];
            self.next_index.insert(peer, next);
            self.match_index.insert(peer, 0);
        }
        self.last_heartbeat_sent_ms = now;
        for i in 0..self.peers.len() {
            let peer = self.peers[i];
            self.send_append_to(peer);
        }
        // Single-node clusters can commit their tail right away.
        self.advance_commit();
    }

    /// §5.4.2: advance `commit_index` to the highest `N` from a majority that is
    /// stored in the current term.
    fn advance_commit(&mut self) {
        if !matches!(self.role, Role::Leader) {
            return;
        }
        let cluster = self.peers.len() + 1;
        let mut n = self.log.last_index();
        while n > self.commit_index {
            if self.log.term_at(n) == Some(self.current_term) {
                let mut count = 1; // leader matches its own tail implicitly.
                for i in 0..self.peers.len() {
                    let peer = self.peers[i];
                    if *self.match_index.get(&peer).unwrap_or(&0) >= n {
                        count += 1;
                    }
                }
                if count * 2 > cluster {
                    self.commit_index = n;
                    self.last_applied = self.commit_index;
                    break;
                }
            }
            n -= 1;
        }
    }

    fn handle_request_vote(
        &mut self,
        from: NodeId,
        term: Term,
        candidate: NodeId,
        last_log_index: LogIndex,
        last_log_term: Term,
        now: u64,
    ) {
        if term < self.current_term {
            self.reply(
                from,
                Message::RequestVoteReply {
                    term: self.current_term,
                    vote_granted: false,
                },
            );
            return;
        }

        // §5.4.1 up-to-date check.
        let our_term = self.log.last_term();
        let up_to_date = last_log_term > our_term
            || (last_log_term == our_term && last_log_index >= self.log.last_index());
        let can_vote = self.voted_for == NO_NODE || self.voted_for == candidate;
        let grant = can_vote && up_to_date;

        if grant {
            self.voted_for = candidate;
            self.reset_election_deadline(now);
        }
        self.reply(
            from,
            Message::RequestVoteReply {
                term: self.current_term,
                vote_granted: grant,
            },
        );
    }

    fn handle_request_vote_reply(&mut self, from: NodeId, term: Term, vote_granted: bool, now: u64) {
        if !matches!(self.role, Role::Candidate) || term != self.current_term {
            return;
        }
        if vote_granted {
            self.votes.insert(from);
            if self.votes.len() > (self.peers.len() + 1) / 2 {
                self.become_leader(now);
            }
        }
    }

    #[allow(clippy::too_many_arguments)]
    fn handle_append_entries(
        &mut self,
        from: NodeId,
        term: Term,
        leader: NodeId,
        prev_log_index: LogIndex,
        prev_log_term: Term,
        leader_commit: LogIndex,
        entries: &[Entry],
        now: u64,
    ) {
        if term < self.current_term {
            self.reply(
                from,
                Message::AppendEntriesReply {
                    term: self.current_term,
                    success: false,
                    match_index: 0,
                    conflict_index: 0,
                },
            );
            return;
        }

        // Same-term (or just-stepped-down) message from a valid leader: adopt it
        // and refresh the election timer regardless of the consistency outcome.
        self.role = Role::Follower;
        self.leader_id = leader;
        self.reset_election_deadline(now);

        // §5.3 consistency check.
        if prev_log_index > self.log.last_index() {
            self.reply(
                from,
                Message::AppendEntriesReply {
                    term: self.current_term,
                    success: false,
                    match_index: 0,
                    conflict_index: self.log.last_index() + 1,
                },
            );
            return;
        }
        if prev_log_index > 0 {
            let matches_prev = self.log.term_at(prev_log_index) == Some(prev_log_term);
            if !matches_prev {
                let conflict_term = self.log.term_at(prev_log_index).unwrap_or(0);
                let mut idx = prev_log_index;
                while idx > 1 && self.log.term_at(idx - 1) == Some(conflict_term) {
                    idx -= 1;
                }
                self.reply(
                    from,
                    Message::AppendEntriesReply {
                        term: self.current_term,
                        success: false,
                        match_index: 0,
                        conflict_index: idx,
                    },
                );
                return;
            }
        }

        // §5.3 Log Matching: idempotent apply, truncate only on real conflict.
        for (offset, entry) in entries.iter().enumerate() {
            let i = prev_log_index + 1 + offset as u64;
            if self.log.term_at(i) == Some(entry.term) {
                continue;
            }
            self.log.truncate_from(i);
            let remaining: Vec<Entry> = entries[offset..].to_vec();
            self.log.append(remaining);
            break;
        }

        let new_commit = leader_commit.min(self.log.last_index());
        if new_commit > self.commit_index {
            self.commit_index = new_commit;
            self.last_applied = self.commit_index;
        }

        self.reply(
            from,
            Message::AppendEntriesReply {
                term: self.current_term,
                success: true,
                match_index: prev_log_index + entries.len() as u64,
                conflict_index: 0,
            },
        );
    }

    fn handle_append_entries_reply(
        &mut self,
        from: NodeId,
        term: Term,
        success: bool,
        match_index: LogIndex,
        conflict_index: LogIndex,
    ) {
        if !matches!(self.role, Role::Leader) || term != self.current_term {
            return;
        }
        if success {
            let existing = *self.match_index.get(&from).unwrap_or(&0);
            let m = existing.max(match_index);
            self.match_index.insert(from, m);
            self.next_index.insert(from, m + 1);
            self.advance_commit();
        } else {
            let cur_next = *self
                .next_index
                .get(&from)
                .unwrap_or(&(self.log.last_index() + 1));
            let mut new_next = cur_next.saturating_sub(1);
            if conflict_index > 0 {
                new_next = new_next.min(conflict_index);
            }
            let new_next = new_next.max(1);
            self.next_index.insert(from, new_next);
            self.send_append_to(from);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn cfg() -> Config {
        Config::default()
    }

    #[test]
    fn follower_rejects_propose_with_hint() {
        let mut n = Node::new(1, vec![2, 3], cfg(), 0, 0).unwrap();
        let err = n.propose(vec![1]).unwrap_err();
        assert_eq!(err, ProposeError::NotLeader { leader_hint: NO_NODE });

        // After learning a leader, the hint reflects it.
        n.step(
            2,
            &Message::AppendEntries {
                term: 1,
                leader: 2,
                prev_log_index: 0,
                prev_log_term: 0,
                leader_commit: 0,
                entries: vec![],
            },
            100,
        );
        n.take_outbox();
        let err = n.propose(vec![1]).unwrap_err();
        assert_eq!(err, ProposeError::NotLeader { leader_hint: 2 });
    }

    #[test]
    fn single_node_leader_commits_on_propose() {
        let mut n = Node::new(1, vec![], cfg(), 0, 0).unwrap();
        n.tick(10_000);
        assert!(matches!(n.status().role, Role::Leader));

        let idx = n.propose(vec![9]).unwrap();
        assert_eq!(idx, 1);
        assert_eq!(n.status().commit_index, 1);
        assert_eq!(n.status().last_applied, 1);
    }

    #[test]
    fn vote_grant_deny_and_up_to_date() {
        let mut n = Node::new(1, vec![2, 3], cfg(), 0, 0).unwrap();

        // Grant to first eligible candidate.
        n.step(
            2,
            &Message::RequestVote {
                term: 1,
                candidate: 2,
                last_log_index: 0,
                last_log_term: 0,
            },
            100,
        );
        let out = n.take_outbox();
        assert_eq!(out.len(), 1);
        match &out[0].message {
            Message::RequestVoteReply { term, vote_granted } => {
                assert_eq!(*term, 1);
                assert!(*vote_granted);
            }
            _ => panic!("expected RequestVoteReply"),
        }

        // Same term, different candidate: already voted -> deny.
        n.step(
            3,
            &Message::RequestVote {
                term: 1,
                candidate: 3,
                last_log_index: 0,
                last_log_term: 0,
            },
            120,
        );
        let out = n.take_outbox();
        match &out[0].message {
            Message::RequestVoteReply { vote_granted, .. } => assert!(!*vote_granted),
            _ => panic!("expected RequestVoteReply"),
        }

        // Give this node a real log (term 2), then test §5.4.1.
        n.step(
            2,
            &Message::AppendEntries {
                term: 2,
                leader: 2,
                prev_log_index: 0,
                prev_log_term: 0,
                leader_commit: 0,
                entries: vec![Entry { term: 2, data: vec![7] }],
            },
            200,
        );
        n.take_outbox();

        // Stale-log candidate (higher term, but older last_log_term) -> deny.
        n.step(
            3,
            &Message::RequestVote {
                term: 3,
                candidate: 3,
                last_log_index: 5,
                last_log_term: 1,
            },
            300,
        );
        let out = n.take_outbox();
        match &out[0].message {
            Message::RequestVoteReply { term, vote_granted } => {
                assert_eq!(*term, 3);
                assert!(!*vote_granted);
            }
            _ => panic!("expected RequestVoteReply"),
        }

        // Up-to-date candidate at the current term -> grant.
        n.step(
            2,
            &Message::RequestVote {
                term: 3,
                candidate: 2,
                last_log_index: 1,
                last_log_term: 2,
            },
            310,
        );
        let out = n.take_outbox();
        match &out[0].message {
            Message::RequestVoteReply { vote_granted, .. } => assert!(*vote_granted),
            _ => panic!("expected RequestVoteReply"),
        }
    }

    #[test]
    fn higher_term_causes_step_down() {
        let mut n = Node::new(1, vec![2, 3], cfg(), 0, 0).unwrap();
        n.tick(10_000);
        assert!(matches!(n.status().role, Role::Candidate));
        assert_eq!(n.status().term, 1);

        n.step(
            2,
            &Message::AppendEntries {
                term: 5,
                leader: 2,
                prev_log_index: 0,
                prev_log_term: 0,
                leader_commit: 0,
                entries: vec![],
            },
            11_000,
        );
        let s = n.status();
        assert!(matches!(s.role, Role::Follower));
        assert_eq!(s.term, 5);
        assert_eq!(s.leader_id, 2);
        assert_eq!(s.voted_for, NO_NODE);
    }

    #[test]
    fn idempotent_retransmit_does_not_duplicate() {
        let mut n = Node::new(1, vec![2, 3], cfg(), 0, 0).unwrap();
        let ae = Message::AppendEntries {
            term: 1,
            leader: 2,
            prev_log_index: 0,
            prev_log_term: 0,
            leader_commit: 0,
            entries: vec![
                Entry { term: 1, data: vec![1] },
                Entry { term: 1, data: vec![2] },
            ],
        };
        n.step(2, &ae, 100);
        assert_eq!(n.status().log_len, 2);
        n.take_outbox();

        // Same batch again: no growth, no truncation.
        n.step(2, &ae, 200);
        assert_eq!(n.status().log_len, 2);
        assert_eq!(n.log.term_at(1), Some(1));
        assert_eq!(n.log.term_at(2), Some(1));
    }

    #[test]
    fn commit_never_counts_older_term_entries() {
        // §5.4.2: a leader must not commit an entry from a previous term merely
        // because it is stored on a majority.
        let mut n = Node::new(1, vec![2, 3], cfg(), 0, 0).unwrap();
        n.current_term = 2;
        n.role = Role::Leader;
        n.leader_id = 1;
        n.log.append(vec![Entry { term: 1, data: vec![1] }]); // index 1, old term
        n.next_index.insert(2, 2);
        n.next_index.insert(3, 2);
        n.match_index.insert(2, 1); // replicated to a majority (self + 2)
        n.match_index.insert(3, 0);

        n.advance_commit();
        assert_eq!(n.commit_index, 0, "must not commit an old-term entry");

        // Append a current-term entry; once it reaches a majority, both commit.
        n.log.append(vec![Entry { term: 2, data: vec![2] }]); // index 2
        n.match_index.insert(2, 2);
        n.advance_commit();
        assert_eq!(n.commit_index, 2);
        assert_eq!(n.last_applied, 2);
    }
}
