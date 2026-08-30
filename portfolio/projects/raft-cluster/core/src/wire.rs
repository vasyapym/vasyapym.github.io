//! The frozen binary wire format shared by every consumer.
//!
//! One codec serves the browser fabric, the Go RPC daemon, and the future
//! C ABI. All integers are **little-endian**. A frame is exactly one message;
//! transports own their length framing, so this codec never adds a prefix.
//!
//! Decoding is strict and panic-free: it is meant to run behind a C ABI on
//! untrusted input, so every read is bounds-checked and any empty, truncated,
//! over-long, or trailing-garbage frame is reported as a [`WireError`] rather
//! than indexing out of bounds.

use crate::types::{Entry, LogIndex, NodeId, Role, StatusReport, Term};

/// Message type bytes: the frozen first byte of every frame.
mod tag {
    pub const REQUEST_VOTE: u8 = 1;
    pub const REQUEST_VOTE_REPLY: u8 = 2;
    pub const APPEND_ENTRIES: u8 = 3;
    pub const APPEND_ENTRIES_REPLY: u8 = 4;
    pub const STATUS_REPORT: u8 = 5;
}

/// A single Raft RPC frame in the frozen wire format.
///
/// The variants and their fields mirror the byte layout in the module docs
/// one-for-one; the leading type byte selects the variant on decode.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Message {
    /// Candidate soliciting a vote (type byte `1`).
    RequestVote {
        /// Candidate's current term.
        term: Term,
        /// Id of the candidate requesting the vote.
        candidate: NodeId,
        /// Index of the candidate's last log entry.
        last_log_index: LogIndex,
        /// Term of the candidate's last log entry.
        last_log_term: Term,
    },
    /// Response to a [`Message::RequestVote`] (type byte `2`).
    RequestVoteReply {
        /// Responder's current term, for the candidate to update itself.
        term: Term,
        /// Whether the vote was granted.
        vote_granted: bool,
    },
    /// Leader replicating entries and/or heartbeating (type byte `3`).
    AppendEntries {
        /// Leader's current term.
        term: Term,
        /// Id of the leader, so followers can redirect clients.
        leader: NodeId,
        /// Index of the log entry immediately preceding the new ones.
        prev_log_index: LogIndex,
        /// Term of the `prev_log_index` entry.
        prev_log_term: Term,
        /// Leader's commit index.
        leader_commit: LogIndex,
        /// Entries to store (empty for a pure heartbeat).
        entries: Vec<Entry>,
    },
    /// Response to a [`Message::AppendEntries`] (type byte `4`).
    AppendEntriesReply {
        /// Responder's current term, for the leader to update itself.
        term: Term,
        /// Whether the entry check passed and entries were accepted.
        success: bool,
        /// Highest index known to match the leader on success.
        match_index: LogIndex,
        /// Hint for fast log backtracking on failure.
        conflict_index: LogIndex,
    },
    /// A flat snapshot of node state for hosts to surface (type byte `5`).
    StatusReport(StatusReport),
}

impl Message {
    /// Appends this message's frozen wire encoding to `out`.
    pub fn encode(&self, out: &mut Vec<u8>) {
        match self {
            Message::RequestVote {
                term,
                candidate,
                last_log_index,
                last_log_term,
            } => {
                out.push(tag::REQUEST_VOTE);
                put_u64(out, *term);
                put_u64(out, *candidate);
                put_u64(out, *last_log_index);
                put_u64(out, *last_log_term);
            }
            Message::RequestVoteReply { term, vote_granted } => {
                out.push(tag::REQUEST_VOTE_REPLY);
                put_u64(out, *term);
                out.push(u8::from(*vote_granted));
            }
            Message::AppendEntries {
                term,
                leader,
                prev_log_index,
                prev_log_term,
                leader_commit,
                entries,
            } => {
                out.push(tag::APPEND_ENTRIES);
                put_u64(out, *term);
                put_u64(out, *leader);
                put_u64(out, *prev_log_index);
                put_u64(out, *prev_log_term);
                put_u64(out, *leader_commit);
                put_u32(out, entries.len() as u32);
                for entry in entries {
                    put_u64(out, entry.term);
                    put_u32(out, entry.data.len() as u32);
                    out.extend_from_slice(&entry.data);
                }
            }
            Message::AppendEntriesReply {
                term,
                success,
                match_index,
                conflict_index,
            } => {
                out.push(tag::APPEND_ENTRIES_REPLY);
                put_u64(out, *term);
                out.push(u8::from(*success));
                put_u64(out, *match_index);
                put_u64(out, *conflict_index);
            }
            Message::StatusReport(status) => {
                out.push(tag::STATUS_REPORT);
                out.push(status.role.as_u8());
                put_u64(out, status.term);
                put_u64(out, status.leader_id);
                put_u64(out, status.commit_index);
                put_u64(out, status.last_applied);
                put_u64(out, status.log_len);
                put_u64(out, status.voted_for);
            }
        }
    }

    /// Convenience wrapper around [`Message::encode`] into a fresh buffer.
    pub fn to_vec(&self) -> Vec<u8> {
        let mut out = Vec::new();
        self.encode(&mut out);
        out
    }

    /// Decodes exactly one message from `buf`.
    ///
    /// Strict: empty input, an unknown type byte, a truncated or over-long
    /// payload, an invalid role byte, or any trailing bytes are errors. Never
    /// panics or indexes out of bounds on hostile input.
    pub fn decode(buf: &[u8]) -> Result<Message, WireError> {
        let mut r = Reader::new(buf);
        let type_byte = match r.read_u8() {
            Ok(b) => b,
            Err(_) => return Err(WireError::Empty),
        };

        let message = match type_byte {
            tag::REQUEST_VOTE => Message::RequestVote {
                term: r.read_u64()?,
                candidate: r.read_u64()?,
                last_log_index: r.read_u64()?,
                last_log_term: r.read_u64()?,
            },
            tag::REQUEST_VOTE_REPLY => Message::RequestVoteReply {
                term: r.read_u64()?,
                vote_granted: r.read_u8()? != 0,
            },
            tag::APPEND_ENTRIES => {
                let term = r.read_u64()?;
                let leader = r.read_u64()?;
                let prev_log_index = r.read_u64()?;
                let prev_log_term = r.read_u64()?;
                let leader_commit = r.read_u64()?;
                let count = r.read_u32()?;
                // Do not preallocate `count` entries: an attacker could claim a
                // huge count in a tiny frame. Grow on demand; a short buffer
                // fails fast on the first missing entry instead.
                let mut entries = Vec::new();
                for _ in 0..count {
                    let entry_term = r.read_u64()?;
                    let len = r.read_u32()? as usize;
                    let data = r.read_bytes(len)?;
                    entries.push(Entry {
                        term: entry_term,
                        data,
                    });
                }
                Message::AppendEntries {
                    term,
                    leader,
                    prev_log_index,
                    prev_log_term,
                    leader_commit,
                    entries,
                }
            }
            tag::APPEND_ENTRIES_REPLY => Message::AppendEntriesReply {
                term: r.read_u64()?,
                success: r.read_u8()? != 0,
                match_index: r.read_u64()?,
                conflict_index: r.read_u64()?,
            },
            tag::STATUS_REPORT => {
                let role_byte = r.read_u8()?;
                let role = Role::from_u8(role_byte)
                    .ok_or(WireError::InvalidRole(role_byte))?;
                Message::StatusReport(StatusReport {
                    role,
                    term: r.read_u64()?,
                    leader_id: r.read_u64()?,
                    commit_index: r.read_u64()?,
                    last_applied: r.read_u64()?,
                    log_len: r.read_u64()?,
                    voted_for: r.read_u64()?,
                })
            }
            other => return Err(WireError::UnknownType(other)),
        };

        if !r.is_at_end() {
            return Err(WireError::TrailingBytes);
        }
        Ok(message)
    }
}

/// Why [`Message::decode`] rejected a frame.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum WireError {
    /// The input was empty (no message type byte).
    Empty,
    /// The leading type byte matched no known message.
    UnknownType(u8),
    /// The payload ended before a required field could be read.
    Truncated,
    /// Bytes remained after a complete message was decoded.
    TrailingBytes,
    /// A `StatusReport` carried a role byte outside `0..=2`.
    InvalidRole(u8),
}

impl core::fmt::Display for WireError {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        match self {
            WireError::Empty => f.write_str("empty input: no message type byte"),
            WireError::UnknownType(b) => write!(f, "unknown message type byte: {b}"),
            WireError::Truncated => f.write_str("truncated payload: input ended early"),
            WireError::TrailingBytes => {
                f.write_str("trailing bytes after a complete message")
            }
            WireError::InvalidRole(b) => write!(f, "invalid role byte: {b}"),
        }
    }
}

/// Appends a `u32` in little-endian order.
fn put_u32(out: &mut Vec<u8>, value: u32) {
    out.extend_from_slice(&value.to_le_bytes());
}

/// Appends a `u64` in little-endian order.
fn put_u64(out: &mut Vec<u8>, value: u64) {
    out.extend_from_slice(&value.to_le_bytes());
}

/// A bounds-checked, forward-only cursor over a byte buffer.
struct Reader<'a> {
    buf: &'a [u8],
    pos: usize,
}

impl<'a> Reader<'a> {
    fn new(buf: &'a [u8]) -> Self {
        Reader { buf, pos: 0 }
    }

    /// Bytes not yet consumed. Never underflows: `pos <= buf.len()` always.
    fn remaining(&self) -> usize {
        self.buf.len() - self.pos
    }

    fn is_at_end(&self) -> bool {
        self.pos == self.buf.len()
    }

    fn read_u8(&mut self) -> Result<u8, WireError> {
        if self.remaining() < 1 {
            return Err(WireError::Truncated);
        }
        let value = self.buf[self.pos];
        self.pos += 1;
        Ok(value)
    }

    fn read_u32(&mut self) -> Result<u32, WireError> {
        if self.remaining() < 4 {
            return Err(WireError::Truncated);
        }
        let mut bytes = [0u8; 4];
        bytes.copy_from_slice(&self.buf[self.pos..self.pos + 4]);
        self.pos += 4;
        Ok(u32::from_le_bytes(bytes))
    }

    fn read_u64(&mut self) -> Result<u64, WireError> {
        if self.remaining() < 8 {
            return Err(WireError::Truncated);
        }
        let mut bytes = [0u8; 8];
        bytes.copy_from_slice(&self.buf[self.pos..self.pos + 8]);
        self.pos += 8;
        Ok(u64::from_le_bytes(bytes))
    }

    /// Reads `len` bytes. `len <= remaining()` is checked first, so the slice
    /// index and the `pos + len` addition can never overrun or overflow.
    fn read_bytes(&mut self, len: usize) -> Result<Vec<u8>, WireError> {
        if self.remaining() < len {
            return Err(WireError::Truncated);
        }
        let out = self.buf[self.pos..self.pos + len].to_vec();
        self.pos += len;
        Ok(out)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::NO_NODE;

    fn roundtrip(message: &Message) {
        let bytes = message.to_vec();
        let decoded = Message::decode(&bytes).expect("decode of self-encoded frame");
        assert_eq!(&decoded, message);
    }

    #[test]
    fn request_vote_roundtrip() {
        roundtrip(&Message::RequestVote {
            term: 10,
            candidate: 4,
            last_log_index: 99,
            last_log_term: 7,
        });
    }

    #[test]
    fn request_vote_reply_roundtrip_both_values() {
        for granted in [false, true] {
            roundtrip(&Message::RequestVoteReply {
                term: 3,
                vote_granted: granted,
            });
        }
    }

    #[test]
    fn append_entries_zero_entries_roundtrip() {
        roundtrip(&Message::AppendEntries {
            term: 1,
            leader: 1,
            prev_log_index: 0,
            prev_log_term: 0,
            leader_commit: 0,
            entries: vec![],
        });
    }

    #[test]
    fn append_entries_multiple_entries_roundtrip() {
        roundtrip(&Message::AppendEntries {
            term: 9,
            leader: 3,
            prev_log_index: 7,
            prev_log_term: 8,
            leader_commit: 5,
            entries: vec![
                Entry {
                    term: 8,
                    data: vec![],
                },
                Entry {
                    term: 9,
                    data: vec![1, 2, 3, 4],
                },
                Entry {
                    term: 9,
                    data: vec![255],
                },
            ],
        });
    }

    #[test]
    fn append_entries_reply_roundtrip_both_values() {
        for success in [false, true] {
            roundtrip(&Message::AppendEntriesReply {
                term: 2,
                success,
                match_index: 5,
                conflict_index: 0,
            });
        }
    }

    #[test]
    fn status_report_roundtrip_all_roles() {
        for role in [Role::Follower, Role::Candidate, Role::Leader] {
            roundtrip(&Message::StatusReport(StatusReport {
                role,
                term: 4,
                leader_id: 2,
                commit_index: 10,
                last_applied: 9,
                log_len: 12,
                voted_for: NO_NODE,
            }));
        }
    }

    #[test]
    fn vote_granted_nonzero_maps_to_true() {
        for (byte, expected) in [(0u8, false), (1, true), (7, true)] {
            let mut buf = vec![tag::REQUEST_VOTE_REPLY];
            buf.extend_from_slice(&5u64.to_le_bytes());
            buf.push(byte);
            match Message::decode(&buf).expect("valid reply frame") {
                Message::RequestVoteReply { term, vote_granted } => {
                    assert_eq!(term, 5);
                    assert_eq!(vote_granted, expected, "byte {byte}");
                }
                other => panic!("unexpected variant: {other:?}"),
            }
        }
    }

    #[test]
    fn success_nonzero_maps_to_true() {
        for (byte, expected) in [(0u8, false), (1, true), (7, true)] {
            let mut buf = vec![tag::APPEND_ENTRIES_REPLY];
            buf.extend_from_slice(&2u64.to_le_bytes());
            buf.push(byte);
            buf.extend_from_slice(&5u64.to_le_bytes());
            buf.extend_from_slice(&0u64.to_le_bytes());
            match Message::decode(&buf).expect("valid reply frame") {
                Message::AppendEntriesReply { success, .. } => {
                    assert_eq!(success, expected, "byte {byte}");
                }
                other => panic!("unexpected variant: {other:?}"),
            }
        }
    }

    #[test]
    fn multibyte_little_endian_layout() {
        let message = Message::RequestVote {
            term: 0x0102_0304_0506_0708,
            candidate: 0xFFFF_FFFF_0000_0000,
            last_log_index: 0x0000_0000_FFFF_FFFF,
            last_log_term: u64::MAX,
        };
        let bytes = message.to_vec();
        // term is written least-significant byte first.
        assert_eq!(
            &bytes[1..9],
            &[0x08, 0x07, 0x06, 0x05, 0x04, 0x03, 0x02, 0x01]
        );
        roundtrip(&message);
    }

    #[test]
    fn request_vote_exact_bytes() {
        let message = Message::RequestVote {
            term: 1,
            candidate: 2,
            last_log_index: 3,
            last_log_term: 4,
        };
        let expected: [u8; 33] = [
            1, // type byte
            1, 0, 0, 0, 0, 0, 0, 0, // term = 1
            2, 0, 0, 0, 0, 0, 0, 0, // candidate = 2
            3, 0, 0, 0, 0, 0, 0, 0, // last_log_index = 3
            4, 0, 0, 0, 0, 0, 0, 0, // last_log_term = 4
        ];
        assert_eq!(message.to_vec(), expected);
        assert_eq!(Message::decode(&expected).unwrap(), message);
    }

    #[test]
    fn empty_input_is_empty_error() {
        assert_eq!(Message::decode(&[]), Err(WireError::Empty));
    }

    #[test]
    fn unknown_type_byte_is_error() {
        assert_eq!(Message::decode(&[99]), Err(WireError::UnknownType(99)));
        assert_eq!(Message::decode(&[0]), Err(WireError::UnknownType(0)));
    }

    #[test]
    fn truncated_payload_is_error() {
        // Header present but no payload at all.
        assert_eq!(
            Message::decode(&[tag::REQUEST_VOTE]),
            Err(WireError::Truncated)
        );
        // A full frame with its last byte lopped off.
        let full = Message::RequestVote {
            term: 1,
            candidate: 2,
            last_log_index: 3,
            last_log_term: 4,
        }
        .to_vec();
        assert_eq!(
            Message::decode(&full[..full.len() - 1]),
            Err(WireError::Truncated)
        );
    }

    #[test]
    fn trailing_bytes_are_error() {
        let mut bytes = Message::RequestVoteReply {
            term: 1,
            vote_granted: true,
        }
        .to_vec();
        bytes.push(0);
        assert_eq!(Message::decode(&bytes), Err(WireError::TrailingBytes));
    }

    #[test]
    fn entry_len_overrun_is_truncated() {
        let mut buf = vec![tag::APPEND_ENTRIES];
        buf.extend_from_slice(&1u64.to_le_bytes()); // term
        buf.extend_from_slice(&2u64.to_le_bytes()); // leader
        buf.extend_from_slice(&0u64.to_le_bytes()); // prev_log_index
        buf.extend_from_slice(&0u64.to_le_bytes()); // prev_log_term
        buf.extend_from_slice(&0u64.to_le_bytes()); // leader_commit
        buf.extend_from_slice(&1u32.to_le_bytes()); // count = 1
        buf.extend_from_slice(&5u64.to_le_bytes()); // entry term
        buf.extend_from_slice(&100u32.to_le_bytes()); // claims 100 bytes...
        buf.extend_from_slice(&[1, 2, 3]); // ...but only 3 are present
        assert_eq!(Message::decode(&buf), Err(WireError::Truncated));
    }

    #[test]
    fn huge_entry_count_does_not_panic_or_overallocate() {
        let mut buf = vec![tag::APPEND_ENTRIES];
        buf.extend_from_slice(&1u64.to_le_bytes()); // term
        buf.extend_from_slice(&2u64.to_le_bytes()); // leader
        buf.extend_from_slice(&0u64.to_le_bytes()); // prev_log_index
        buf.extend_from_slice(&0u64.to_le_bytes()); // prev_log_term
        buf.extend_from_slice(&0u64.to_le_bytes()); // leader_commit
        buf.extend_from_slice(&u32::MAX.to_le_bytes()); // absurd count, no entries
        assert_eq!(Message::decode(&buf), Err(WireError::Truncated));
    }

    #[test]
    fn invalid_role_byte_is_error() {
        let mut buf = vec![tag::STATUS_REPORT, 9]; // role byte 9 is invalid
        for _ in 0..6 {
            buf.extend_from_slice(&0u64.to_le_bytes());
        }
        assert_eq!(Message::decode(&buf), Err(WireError::InvalidRole(9)));
    }

    #[test]
    fn wire_error_display_is_nonempty() {
        for err in [
            WireError::Empty,
            WireError::UnknownType(9),
            WireError::Truncated,
            WireError::TrailingBytes,
            WireError::InvalidRole(9),
        ] {
            assert!(!err.to_string().is_empty());
        }
    }
}
