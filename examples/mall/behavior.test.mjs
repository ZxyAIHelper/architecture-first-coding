import test from 'node:test';
import assert from 'node:assert/strict';
import { RetailSession } from './application.mjs';

// Verify state transitions and failure atomicity through the application boundary.
test('quoting is read-only and confirmation debits the authoritative price once', () => {
  const session = new RetailSession();
  const before = session.view();
  const proposal = session.quote(0);
  assert.deepEqual(session.view(), before);
  assert.equal(proposal.price, 30);
  proposal.price = 0;
  assert.equal(session.command('build', proposal).price, 30);
  assert.deepEqual(session.view(), { revision: 1, shops: [{ id: 1, column: 0 }], cash: 70 });
  const committed = session.view();
  assert.equal(session.command('build', proposal).error, 'stale_revision');
  assert.deepEqual(session.view(), committed);
});

test('an intervening build invalidates an otherwise valid quote', () => {
  const session = new RetailSession();
  const oldProposal = session.quote(0);
  session.command('build', session.quote(1));
  const committed = session.view();
  assert.equal(session.command('build', oldProposal).error, 'stale_revision');
  assert.deepEqual(session.view(), committed);
  assert.equal(session.command('build', session.quote(0)).ok, true);
});

test('insufficient cash, occupied cells and invalid coordinates do not partially commit', () => {
  const poor = new RetailSession(29);
  const before = poor.view();
  assert.equal(poor.command('build', { column: 0, revision: 0 }).error, 'insufficient_cash');
  assert.deepEqual(poor.view(), before);

  const session = new RetailSession();
  session.command('build', session.quote(0));
  const committed = session.view();
  assert.equal(session.command('build', { column: 0, revision: 1 }).error, 'occupied');
  for (const column of [-1, 4, 0.5, NaN, '1']) {
    assert.equal(session.command('build', { column, revision: 1 }).error, 'invalid_cell');
  }
  assert.deepEqual(session.view(), committed);
});

test('exact funds succeed and subsequent insufficient funds preserve the existing shop', () => {
  const session = new RetailSession(30);
  assert.equal(session.command('build', session.quote(0)).ok, true);
  assert.equal(session.view().cash, 0);
  const committed = session.view();
  assert.equal(session.command('build', { column: 1, revision: 1 }).error, 'insufficient_cash');
  assert.deepEqual(session.view(), committed);
});

test('snapshots and previews cannot mutate occupancy, cash or revision', () => {
  const session = new RetailSession();
  session.command('build', session.quote(0));
  const committed = session.view();
  const display = session.view();
  display.shops[0].column = 3;
  display.shops.push({ id: 10, column: 1 });
  display.cash = 999;
  display.revision = 0;
  const preview = session.quote(1);
  preview.column = 3;
  assert.deepEqual(session.view(), committed);
  assert.equal(session.quote(0).error, 'occupied');
});

test('unknown commands and missing revisions are rejected without mutation', () => {
  const session = new RetailSession();
  const before = session.view();
  assert.equal(session.command('refund').error, 'unknown_command');
  assert.equal(session.command('build', { column: 0 }).error, 'stale_revision');
  assert.deepEqual(session.view(), before);
});
