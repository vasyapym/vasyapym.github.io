//! The replicated log: an append-only sequence of [`Entry`] values with
//! 1-based public indexing.
//!
//! Index `0` means "before the first entry" (never a valid slot); the first
//! real entry lives at index `1`. Internally the entries are stored in a
//! `Vec<Entry>`, so index `i` maps to `entries[i - 1]`. This part owns every
//! entry ever appended — there is no compaction or snapshotting yet.
//!
//! The log is a passive data structure: it enforces its own bounds but knows
//! nothing about terms, commit indices, or elections. The Part 2 node state
//! machine drives it, using [`RaftLog::truncate_from`] for the follower-side
//! conflict repair described in §5.3 of the Raft paper.

use crate::types::{Entry, LogIndex, Term};

/// An append-only Raft log with 1-based indexing.
#[derive(Clone, Debug, Default)]
pub struct RaftLog {
    entries: Vec<Entry>,
}

impl RaftLog {
    /// Creates an empty log.
    pub fn new() -> Self {
        RaftLog {
            entries: Vec::new(),
        }
    }

    /// Index of the last entry, or `0` when the log is empty.
    pub fn last_index(&self) -> LogIndex {
        self.entries.len() as LogIndex
    }

    /// Term of the last entry, or `0` when the log is empty.
    pub fn last_term(&self) -> Term {
        self.entries.last().map(|e| e.term).unwrap_or(0)
    }

    /// Term of the entry at `index`, or `None` if `index` is out of range
    /// (including the reserved index `0`).
    pub fn term_at(&self, index: LogIndex) -> Option<Term> {
        self.entry(index).map(|e| e.term)
    }

    /// Borrows the entry at `index`, or `None` if `index` is out of range
    /// (including the reserved index `0`).
    pub fn entry(&self, index: LogIndex) -> Option<&Entry> {
        if index < 1 || index > self.last_index() {
            return None;
        }
        self.entries.get((index - 1) as usize)
    }

    /// Appends `entries` to the end of the log.
    ///
    /// The caller guarantees the batch is contiguous — it begins at
    /// `last_index() + 1`. Because [`Entry`] carries no index, contiguity is
    /// checked in debug builds via the equivalent Raft invariant that terms
    /// never decrease across the log.
    pub fn append(&mut self, entries: Vec<Entry>) {
        debug_assert!(
            {
                let mut prev = self.last_term();
                entries.iter().all(|e| {
                    let ok = e.term >= prev;
                    prev = e.term;
                    ok
                })
            },
            "appended entries must extend the log with non-decreasing terms"
        );
        self.entries.extend(entries);
    }

    /// Drops the entry at `index` and everything after it, returning how many
    /// entries were removed.
    ///
    /// A no-op returning `0` when `index` is past the end. This is the
    /// follower-side conflict repair: on an [`Entry`] mismatch the follower
    /// truncates its divergent suffix before accepting the leader's entries.
    pub fn truncate_from(&mut self, index: LogIndex) -> usize {
        if index > self.last_index() {
            return 0;
        }
        // `index` is 1-based; the reserved `0` clamps to "drop everything".
        let cut = index.saturating_sub(1) as usize;
        let removed = self.entries.len() - cut;
        self.entries.truncate(cut);
        removed
    }

    /// Borrows up to `max_entries` entries starting at `index`.
    ///
    /// The result is clamped to what the log holds and is empty when `index`
    /// is out of range or `max_entries` is `0`. Never panics.
    pub fn slice(&self, index: LogIndex, max_entries: usize) -> &[Entry] {
        if index < 1 || index > self.last_index() || max_entries == 0 {
            return &[];
        }
        let start = (index - 1) as usize;
        let end = start.saturating_add(max_entries).min(self.entries.len());
        &self.entries[start..end]
    }

    /// Number of entries in the log (equals [`RaftLog::last_index`]).
    pub fn len(&self) -> usize {
        self.entries.len()
    }

    /// Whether the log holds no entries.
    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn entry(term: Term, data: &[u8]) -> Entry {
        Entry {
            term,
            data: data.to_vec(),
        }
    }

    #[test]
    fn empty_log_edges() {
        let log = RaftLog::new();
        assert_eq!(log.last_index(), 0);
        assert_eq!(log.last_term(), 0);
        assert_eq!(log.len(), 0);
        assert!(log.is_empty());
        assert_eq!(log.term_at(0), None);
        assert_eq!(log.term_at(1), None);
        assert_eq!(log.entry(0), None);
        assert_eq!(log.entry(1), None);
        assert!(log.slice(1, 10).is_empty());
    }

    #[test]
    fn append_and_term_lookups() {
        let mut log = RaftLog::new();
        log.append(vec![entry(1, b"a"), entry(1, b"b"), entry(2, b"c")]);

        assert_eq!(log.len(), 3);
        assert!(!log.is_empty());
        assert_eq!(log.last_index(), 3);
        assert_eq!(log.last_term(), 2);

        assert_eq!(log.term_at(1), Some(1));
        assert_eq!(log.term_at(2), Some(1));
        assert_eq!(log.term_at(3), Some(2));
        assert_eq!(log.term_at(4), None);
        assert_eq!(log.term_at(0), None);

        assert_eq!(log.entry(1), Some(&entry(1, b"a")));
        assert_eq!(log.entry(3), Some(&entry(2, b"c")));
        assert_eq!(log.entry(4), None);
    }

    #[test]
    fn append_in_two_contiguous_batches() {
        let mut log = RaftLog::new();
        log.append(vec![entry(1, b"a"), entry(1, b"b")]);
        log.append(vec![entry(2, b"c")]);
        assert_eq!(log.last_index(), 3);
        assert_eq!(log.term_at(3), Some(2));
    }

    #[test]
    fn truncate_from_middle() {
        let mut log = RaftLog::new();
        log.append(vec![
            entry(1, b"a"),
            entry(1, b"b"),
            entry(2, b"c"),
            entry(3, b"d"),
        ]);
        let removed = log.truncate_from(3);
        assert_eq!(removed, 2);
        assert_eq!(log.last_index(), 2);
        assert_eq!(log.last_term(), 1);
        assert_eq!(log.entry(3), None);
    }

    #[test]
    fn truncate_from_end() {
        let mut log = RaftLog::new();
        log.append(vec![entry(1, b"a"), entry(1, b"b")]);
        let removed = log.truncate_from(2);
        assert_eq!(removed, 1);
        assert_eq!(log.last_index(), 1);
    }

    #[test]
    fn truncate_from_first_drops_all() {
        let mut log = RaftLog::new();
        log.append(vec![entry(1, b"a"), entry(1, b"b")]);
        let removed = log.truncate_from(1);
        assert_eq!(removed, 2);
        assert!(log.is_empty());
        assert_eq!(log.last_index(), 0);
    }

    #[test]
    fn truncate_from_out_of_range_is_noop() {
        let mut log = RaftLog::new();
        log.append(vec![entry(1, b"a"), entry(1, b"b")]);
        assert_eq!(log.truncate_from(3), 0);
        assert_eq!(log.truncate_from(99), 0);
        assert_eq!(log.last_index(), 2);
        // No-op on an empty log too.
        let mut empty = RaftLog::new();
        assert_eq!(empty.truncate_from(1), 0);
    }

    #[test]
    fn slice_clamping() {
        let mut log = RaftLog::new();
        log.append(vec![
            entry(1, b"a"),
            entry(1, b"b"),
            entry(2, b"c"),
            entry(2, b"d"),
        ]);

        // Fewer than requested: clamps to the tail.
        let tail = log.slice(3, 10);
        assert_eq!(tail, &[entry(2, b"c"), entry(2, b"d")]);

        // Exact window from the start.
        let head = log.slice(1, 2);
        assert_eq!(head, &[entry(1, b"a"), entry(1, b"b")]);

        // max_entries == 0 is always empty.
        assert!(log.slice(1, 0).is_empty());

        // Out-of-range indices are empty, never a panic.
        assert!(log.slice(0, 5).is_empty());
        assert!(log.slice(5, 5).is_empty());

        // Saturating math: a huge window does not overflow.
        assert_eq!(log.slice(1, usize::MAX).len(), 4);
    }

    /// §5.3 of the Raft paper: a follower carries a stale, divergent suffix
    /// that the leader overwrites once the preceding entry matches.
    #[test]
    fn paper_5_3_follower_suffix_overwrite() {
        // Follower log: terms 1,1,1,2,2,3 — the 2,2,3 tail is stale.
        let mut follower = RaftLog::new();
        follower.append(vec![
            entry(1, b"x1"),
            entry(1, b"x2"),
            entry(1, b"x3"),
            entry(2, b"y1"),
            entry(2, b"y2"),
            entry(3, b"z1"),
        ]);

        // Leader's AppendEntries matches at prev_log_index = 3 (term 1) and
        // carries entries for indices 4 and 5 in term 4. The follower repairs
        // by truncating its divergent suffix from index 4, then appending.
        assert_eq!(follower.term_at(3), Some(1));
        let removed = follower.truncate_from(4);
        assert_eq!(removed, 3);
        follower.append(vec![entry(4, b"L4"), entry(4, b"L5")]);

        assert_eq!(follower.last_index(), 5);
        assert_eq!(follower.last_term(), 4);
        assert_eq!(follower.term_at(4), Some(4));
        assert_eq!(follower.term_at(5), Some(4));
        assert_eq!(follower.entry(4), Some(&entry(4, b"L4")));
        // The stale index-6 entry is gone.
        assert_eq!(follower.entry(6), None);
    }
}
