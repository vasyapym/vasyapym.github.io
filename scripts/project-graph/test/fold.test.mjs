import test from "node:test";
import assert from "node:assert/strict";
import { fold, latestActiveNodeBy, openOffersFor, traceChain } from "../src/fold.mjs";

const ts = "2026-08-23T10:00:00Z";

const node = (id, extra = {}) => ({
  type: "node.added",
  id,
  ts,
  kind: "iteration",
  actor: "design-iteration",
  title: `node ${id}`,
  ...extra,
});

const edge = (id, from, to, rel = "continues", extra = {}) => ({
  type: "edge.added",
  id,
  ts,
  from,
  to,
  rel,
  ...extra,
});

const entries = (...events) => events.map((event, i) => ({ line: i + 1, event }));

test("folds nodes, status updates and edges into current state", () => {
  const state = fold(
    entries(
      node("n1", { kind: "snapshot", actor: "user" }),
      node("n2"),
      edge("e1", "n1", "n2"),
      { type: "node.status", ts, id: "n2", status: "superseded", reason: "replaced direction" },
    ),
  );

  assert.equal(state.nodes.get("n2").status, "superseded");
  assert.equal(state.nodes.get("n2").statusReason, "replaced direction");
  assert.equal(state.edges.get("e1").rel, "continues");
  assert.deepEqual([...state.nodeOrder], ["n1", "n2"]);
});

test("unknown event type reports its line number", () => {
  assert.throws(() => fold(entries(node("n1"), { type: "node.deleted", id: "n1", ts })), /line 2: unknown event type "node\.deleted"/);
});

test("invalid JSON object shape is rejected with line numbers", () => {
  assert.throws(() => fold([{ line: 3, event: { type: "node.added", ts } }]), /line 3/);
  assert.throws(() => fold(entries(node("n1"), { type: "node.status", ts, id: "nX", status: "active" })), /line 2.*unknown node/);
});

test("duplicate node ids are rejected", () => {
  assert.throws(() => fold(entries(node("n1"), node("n1"))), /duplicate node id/);
});

test("edges must reference already-known endpoints", () => {
  assert.throws(() => fold(entries(node("n1"), edge("e1", "n1", "n9"))), /unknown target "n9"/);
  assert.throws(() => fold(entries(node("n1"), edge("e1", "n0", "n1"))), /unknown source "n0"/);
});

test("handoff acknowledgement enforces addressee and single ack", () => {
  const offer = { type: "handoff.offered", id: "h1", ts, from: "n1", toActor: "code-iteration" };
  const base = entries(node("n1"), offer);
  const ack = (by) => ({ line: base.length + 1, event: { type: "handoff.acknowledged", ts, handoff: "h1", by } });

  assert.throws(() => fold([...base, ack("design-iteration")]), /addressed to "code-iteration", acknowledged by "design-iteration"/);
  assert.throws(
    () =>
      fold([
        ...base,
        ack("code-iteration"),
        { line: base.length + 2, event: { type: "handoff.acknowledged", ts, handoff: "h1", by: "code-iteration" } },
      ]),
    /acknowledged twice/,
  );
});

test("an edge carrying context.handoff closes the offer", () => {
  const state = fold(
    entries(
      node("n1"),
      node("n2", { actor: "code-iteration" }),
      { type: "handoff.offered", id: "h1", ts, from: "n1", toActor: "code-iteration" },
      { type: "handoff.acknowledged", ts, handoff: "h1", by: "code-iteration" },
      edge("e1", "n1", "n2", "handoff:design-to-code", { context: { handoff: "h1" } }),
    ),
  );
  const [offer] = [...state.offers.values()];
  assert.equal(offer.closedBy, "e1");
  assert.deepEqual(openOffersFor(state), []);
});

test("openOffersFor filters by actor and stage", () => {
  const state = fold(
    entries(
      node("n1"),
      node("n2"),
      { type: "handoff.offered", id: "h1", ts, from: "n1", toActor: "code-iteration" },
      { type: "handoff.offered", id: "h2", ts, from: "n1", toActor: "code-iteration" },
      { type: "handoff.acknowledged", ts, handoff: "h2", by: "code-iteration" },
    ),
  );
  const open = openOffersFor(state);
  assert.deepEqual(open.map((offer) => `${offer.id}:${offer.ack === null ? "offered" : "claimed"}`), ["h1:offered", "h2:claimed"]);
  assert.deepEqual(openOffersFor(state, "design-iteration"), []);
});

test("latestActiveNodeBy returns the most recent active node per actor", () => {
  const state = fold(
    entries(
      node("n1", { actor: "design-iteration" }),
      node("n2", { actor: "code-iteration" }),
      node("n3", { actor: "design-iteration", status: "superseded" }),
      node("n4", { actor: "design-iteration" }),
    ),
  );
  assert.equal(latestActiveNodeBy(state, "design-iteration").id, "n4");
  assert.equal(latestActiveNodeBy(state, "code-iteration").id, "n2");
  assert.equal(latestActiveNodeBy(state, undefined).id, "n4");
});

test("traceChain follows continues and handoff edges and stops at forks", () => {
  const linear = fold(
    entries(node("n1", { actor: "user", kind: "snapshot" }), node("n2"), edge("e1", "n1", "n2"), node("n3"), edge("e2", "n2", "n3")),
  );
  assert.deepEqual(traceChain(linear), ["n1", "n2", "n3"]);

  const viaHandoff = fold(
    entries(node("n1"), node("n2", { actor: "code-iteration" }), edge("e1", "n1", "n2", "handoff:design-to-code")),
  );
  assert.deepEqual(traceChain(viaHandoff), ["n1", "n2"]);

  const forked = fold(
    entries(node("n1"), node("n2"), node("n3"), edge("e1", "n1", "n2"), edge("e2", "n1", "n3", "fork")),
  );
  const chain = traceChain(forked);
  assert.deepEqual(chain[0], "n1");
  assert.equal(chain[1].forkAt, "n1");

  const revisionOnly = fold(entries(node("n1"), node("n2"), edge("e1", "n1", "n2", "revision")));
  assert.deepEqual(traceChain(revisionOnly), ["n1"]);

  assert.deepEqual(traceChain(linear, "n2"), ["n2", "n3"]);
});
