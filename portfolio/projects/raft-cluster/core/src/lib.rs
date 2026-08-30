//! # raft-core
//!
//! An understandable implementation of the Raft consensus algorithm
//! (Ongaro & Ousterhout, *In Search of an Understandable Consensus
//! Algorithm*), covering **leader election** and **log replication**.
//! Snapshots, log compaction, and membership changes are out of scope.
//!
//! ## Two consumers, one core
//!
//! This crate is built once and consumed twice:
//!
//! * **Browser demo** — compiled to `wasm32-unknown-unknown` as a `cdylib`
//!   with raw C-ABI exports (no `wasm-bindgen`), driving an in-page cluster.
//! * **Real cluster** — compiled to a `staticlib` for darwin/linux, wrapped
//!   by a Go/cgo layer behind a TCP RPC daemon.
//!
//! To keep the wasm bundle and toolchain minimal, the crate is **std-only
//! with zero external dependencies** (no serde, no rand, nothing from
//! crates.io).
//!
//! ## Caller-driven time
//!
//! The core **never reads a wall clock**. Every operation that depends on the
//! passage of time takes an explicit `now_ms: u64` supplied by the caller.
//! This makes the whole state machine deterministic and trivially testable,
//! and lets the wasm and Go hosts own their own clocks.
//!
//! ## Identifiers
//!
//! `NodeId`, `Term`, and `LogIndex` are all `u64`. A [`NodeId`](types::NodeId)
//! of `0` ([`NO_NODE`](types::NO_NODE)) means "none". Log indices are 1-based;
//! index `0` means "before the first entry".
//!
//! ## Module map
//!
//! * [`types`] — shared identifiers, [`Role`](types::Role),
//!   [`Entry`](types::Entry), [`Config`](types::Config), and the flat
//!   [`StatusReport`](types::StatusReport) snapshot.
//! * [`wire`] — the frozen little-endian binary codec shared by every
//!   consumer (browser fabric, Go RPC, and the future C ABI).
//! * [`log`] — the replicated [`RaftLog`](log::RaftLog) with 1-based indexing.
//! * [`node`] — the Raft state machine: [`Node`](node::Node),
//!   [`Outbound`](node::Outbound), and [`ProposeError`](node::ProposeError).
//! * `ffi` — the private C ABI (`raft_*` exports, contract in `ABI.md`) driven
//!   by both consumers: the wasm browser page and the Go/cgo daemon.

#![deny(unsafe_code)]

pub mod log;
pub mod node;
pub mod types;
pub mod wire;

// The C ABI: the `#[no_mangle] raft_*` exports are this module's API, so it
// stays private and adds nothing to the Rust-facing surface. It is also the
// crate's only file permitted to use `unsafe`.
mod ffi;

pub use node::{Node, Outbound, ProposeError};
pub use types::{
    Config, ConfigError, Entry, LogIndex, NodeId, Role, StatusReport, Term, NO_NODE,
};
