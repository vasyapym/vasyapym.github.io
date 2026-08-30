//! Shared identifiers and value types used across the whole core.
//!
//! These are the small, dependency-free building blocks that [`crate::wire`],
//! [`crate::log`], and (in Part 2) the node state machine are written against.

/// Identifies a node in the cluster. `0` is reserved to mean "none"
/// (see [`NO_NODE`]).
pub type NodeId = u64;

/// A Raft term: a monotonically increasing logical clock for elections.
pub type Term = u64;

/// A 1-based position in the replicated log. `0` means "before the first entry".
pub type LogIndex = u64;

/// Sentinel [`NodeId`] meaning "no node" (e.g. no known leader, no vote cast).
pub const NO_NODE: NodeId = 0;

/// The role a node currently plays in the Raft protocol.
///
/// The `u8` mapping (`Follower = 0`, `Candidate = 1`, `Leader = 2`) is part of
/// the frozen wire format and must not be reordered.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Role {
    /// Passive: waits for leader contact, votes, and times out into an election.
    Follower,
    /// Actively soliciting votes for a new term.
    Candidate,
    /// Won an election; replicates entries and sends heartbeats.
    Leader,
}

impl Role {
    /// Returns the frozen wire encoding of this role (`0`/`1`/`2`).
    pub fn as_u8(self) -> u8 {
        match self {
            Role::Follower => 0,
            Role::Candidate => 1,
            Role::Leader => 2,
        }
    }

    /// Decodes a role from its wire byte, or `None` for an unknown value.
    pub fn from_u8(value: u8) -> Option<Role> {
        match value {
            0 => Some(Role::Follower),
            1 => Some(Role::Candidate),
            2 => Some(Role::Leader),
            _ => None,
        }
    }
}

/// A single replicated log entry: a client payload stamped with the term in
/// which it was created. The `data` bytes are opaque to the core.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Entry {
    /// The term of the leader that first created this entry.
    pub term: Term,
    /// Opaque client payload; the core never interprets these bytes.
    pub data: Vec<u8>,
}

/// Timing configuration for a node, all in milliseconds.
///
/// Time is caller-driven: these values only describe intervals; the core never
/// reads a clock itself.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Config {
    /// Lower bound of the randomized election timeout.
    pub election_timeout_min_ms: u64,
    /// Upper bound of the randomized election timeout.
    pub election_timeout_max_ms: u64,
    /// How often a leader sends heartbeats.
    pub heartbeat_interval_ms: u64,
}

impl Default for Config {
    fn default() -> Self {
        Config {
            election_timeout_min_ms: 900,
            election_timeout_max_ms: 1800,
            heartbeat_interval_ms: 250,
        }
    }
}

impl Config {
    /// Checks that the timing values are internally consistent.
    ///
    /// Requires a positive minimum timeout, `min <= max`, and a positive
    /// heartbeat interval.
    pub fn validate(&self) -> Result<(), ConfigError> {
        if self.election_timeout_min_ms < 1 {
            return Err(ConfigError::ElectionTimeoutTooSmall);
        }
        if self.election_timeout_min_ms > self.election_timeout_max_ms {
            return Err(ConfigError::ElectionTimeoutRangeInverted);
        }
        if self.heartbeat_interval_ms < 1 {
            return Err(ConfigError::HeartbeatTooSmall);
        }
        Ok(())
    }
}

/// Why a [`Config`] failed [`Config::validate`].
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ConfigError {
    /// `election_timeout_min_ms` was zero.
    ElectionTimeoutTooSmall,
    /// `election_timeout_min_ms` exceeded `election_timeout_max_ms`.
    ElectionTimeoutRangeInverted,
    /// `heartbeat_interval_ms` was zero.
    HeartbeatTooSmall,
}

impl core::fmt::Display for ConfigError {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        let msg = match self {
            ConfigError::ElectionTimeoutTooSmall => {
                "election_timeout_min_ms must be at least 1"
            }
            ConfigError::ElectionTimeoutRangeInverted => {
                "election_timeout_min_ms must not exceed election_timeout_max_ms"
            }
            ConfigError::HeartbeatTooSmall => "heartbeat_interval_ms must be at least 1",
        };
        f.write_str(msg)
    }
}

/// A flat, copyable snapshot of a node's observable state.
///
/// Parts 3–4 surface this over the C ABI, so it is deliberately a plain
/// value type with no owned allocations.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct StatusReport {
    /// The node's current role.
    pub role: Role,
    /// The node's current term.
    pub term: Term,
    /// The leader the node currently believes in, or [`NO_NODE`] if unknown.
    pub leader_id: NodeId,
    /// Highest log index known to be committed.
    pub commit_index: LogIndex,
    /// Highest log index applied to the state machine.
    pub last_applied: LogIndex,
    /// Number of entries in the log.
    pub log_len: u64,
    /// Candidate voted for in the current term, or [`NO_NODE`] if none.
    pub voted_for: NodeId,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn role_u8_roundtrip() {
        for role in [Role::Follower, Role::Candidate, Role::Leader] {
            assert_eq!(Role::from_u8(role.as_u8()), Some(role));
        }
    }

    #[test]
    fn role_wire_values_are_frozen() {
        assert_eq!(Role::Follower.as_u8(), 0);
        assert_eq!(Role::Candidate.as_u8(), 1);
        assert_eq!(Role::Leader.as_u8(), 2);
    }

    #[test]
    fn role_from_unknown_byte_is_none() {
        assert_eq!(Role::from_u8(3), None);
        assert_eq!(Role::from_u8(255), None);
    }

    #[test]
    fn default_config_is_valid() {
        let cfg = Config::default();
        assert_eq!(cfg.election_timeout_min_ms, 900);
        assert_eq!(cfg.election_timeout_max_ms, 1800);
        assert_eq!(cfg.heartbeat_interval_ms, 250);
        assert_eq!(cfg.validate(), Ok(()));
    }

    #[test]
    fn config_rejects_zero_min_timeout() {
        let cfg = Config {
            election_timeout_min_ms: 0,
            ..Config::default()
        };
        assert_eq!(cfg.validate(), Err(ConfigError::ElectionTimeoutTooSmall));
    }

    #[test]
    fn config_rejects_inverted_range() {
        let cfg = Config {
            election_timeout_min_ms: 2000,
            election_timeout_max_ms: 1000,
            ..Config::default()
        };
        assert_eq!(
            cfg.validate(),
            Err(ConfigError::ElectionTimeoutRangeInverted)
        );
    }

    #[test]
    fn config_allows_min_equal_to_max() {
        let cfg = Config {
            election_timeout_min_ms: 1000,
            election_timeout_max_ms: 1000,
            ..Config::default()
        };
        assert_eq!(cfg.validate(), Ok(()));
    }

    #[test]
    fn config_rejects_zero_heartbeat() {
        let cfg = Config {
            heartbeat_interval_ms: 0,
            ..Config::default()
        };
        assert_eq!(cfg.validate(), Err(ConfigError::HeartbeatTooSmall));
    }

    #[test]
    fn config_error_display_is_nonempty() {
        for err in [
            ConfigError::ElectionTimeoutTooSmall,
            ConfigError::ElectionTimeoutRangeInverted,
            ConfigError::HeartbeatTooSmall,
        ] {
            assert!(!err.to_string().is_empty());
        }
    }

    #[test]
    fn entry_is_clonable_and_comparable() {
        let a = Entry {
            term: 7,
            data: vec![1, 2, 3],
        };
        let b = a.clone();
        assert_eq!(a, b);
    }

    #[test]
    fn status_report_is_copy() {
        let s = StatusReport {
            role: Role::Leader,
            term: 4,
            leader_id: 2,
            commit_index: 10,
            last_applied: 9,
            log_len: 12,
            voted_for: NO_NODE,
        };
        let t = s;
        assert_eq!(s, t);
        assert_eq!(t.voted_for, NO_NODE);
    }
}
