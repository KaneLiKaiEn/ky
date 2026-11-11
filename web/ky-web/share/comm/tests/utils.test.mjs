import assert from "node:assert/strict";
import { test } from "node:test";
import { plain, sourceModules } from "./helpers.mjs";

const utils = sourceModules()("comm/utils");

test("catalog search keeps ancestors, numeric ordering, cycle/orphan nodes and original rows", () => {
  const rows = [
    { catalog_id: 1, catalog_name: "root", metadata: "keep" },
    { catalog_id: 2, parent_id: 1, catalog_name: "Second", sort_no: "10" },
    { catalog_id: 3, parent_id: 1, catalog_name: "First", sort_no: "2" },
    { catalog_id: 4, parent_id: 99, catalog_name: "orphan" },
    { catalog_id: 5, parent_id: 6 },
    { catalog_id: 6, parent_id: 5 },
  ];
  const tree = utils.catalogTree(rows);
  const root = tree.find((node) => node.key === 1);
  assert.equal(root.row, rows[0]);
  assert.equal(root.row.metadata, "keep");
  assert.deepEqual(plain(root.children.map((node) => node.key)), [3, 2]);
  assert.equal(tree.length, 4);
  const filtered = utils.catalogTree(rows, " FIRST ");
  assert.equal(filtered[0].key, 1);
  assert.equal(filtered[0].children[0].key, 3);
});

test("DTO cleanup strips presentation fields recursively while retaining wire values and tags", () => {
  const row = utils.cleanRow({
    row_id: 7,
    sort_no: 2,
    extra: { __key: "ui", server: 3 },
    children: [],
    key: "ui",
    report_options: [],
    date: new Date(2026, 0, 2),
  });
  assert.deepEqual(plain(row), {
    row_id: 7,
    sort_no: "2",
    extra: { server: 3 },
    date: "2026-01-02",
  });
  assert.equal(utils.encodeTags(["[A][B]", "A", " C "]), "[A][B][C]");
  assert.deepEqual(
    plain(utils.pickRow({ ...row, other: 9 }, ["row_id", "extra"])),
    { row_id: 7, extra: { server: 3 } },
  );
});

test("file conversions preserve bytes, empty data and application failure messages", async () => {
  const blob = utils.base64Blob("AP9hYmM=", "application/pdf");
  assert.deepEqual(
    [...new Uint8Array(await blob.arrayBuffer())],
    [0, 255, 97, 98, 99],
  );
  assert.equal(blob.type, "application/pdf");
  assert.equal(utils.base64Blob("", "image/png").size, 0);
  assert.throws(
    () => utils.base64Blob(123, "image/png", "custom input"),
    /custom input/,
  );
  assert.throws(() => utils.base64Blob("%%%", "image/png"));
  let result = "data:image/png;base64,AP9hYmM=",
    fail = false;
  const { fileBase64 } = sourceModules({
    globals: {
      FileReader: class {
        readAsDataURL() {
          this.result = result;
          if (fail) this.onerror();
          else this.onload();
        }
      },
    },
  })("comm/utils");
  assert.equal(await fileBase64({}), "AP9hYmM=");
  result = "malformed";
  assert.equal(await fileBase64({}), "");
  fail = true;
  await assert.rejects(fileBase64({}, "custom read"), /custom read/);
});

test("batch persistence resumes deletions, cleans rows, and stops after resource changes", async () => {
  let fail = true,
    current = true;
  const sent = [],
    completed = new Set();
  const changes = {
    rows: [{ row_id: 3, __key: "ui", note: "keep" }],
    deletedIds: [1, 2],
    completed,
    fields: ["row_id", "note"],
    assertCurrent() {
      if (!current) throw new Error("changed");
    },
    async save(rows, deleted) {
      sent.push({ rows, deleted });
      if (deleted === 2 && fail) {
        fail = false;
        throw new Error("offline");
      }
    },
  };
  await assert.rejects(utils.persistRowChanges(changes), /offline/);
  await utils.persistRowChanges(changes);
  assert.deepEqual(
    sent.map((call) => call.deleted),
    [1, 2, 2, undefined],
  );
  assert.deepEqual(plain(sent.at(-1).rows), [{ row_id: 3, note: "keep" }]);
  current = false;
  await assert.rejects(
    utils.persistRowChanges({ ...changes, rows: [], completed: new Set() }),
    /changed/,
  );
  const count = sent.length;
  await utils.persistRowChanges({
    ...changes,
    rows: [],
    deletedIds: [],
    assertCurrent() {},
  });
  assert.equal(sent.length, count);
});
