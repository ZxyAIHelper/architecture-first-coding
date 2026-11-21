import test from 'node:test';
import assert from 'node:assert/strict';
import { RunSession } from './application.mjs';

// These tests cover observable ownership and rewind invariants, not source text.
test('rewind restores opening income, combat clock and deterministic random state', () => {
  const session = new RunSession();
  assert.equal(session.execute('start').ok, true);
  const opening = session.view().battle;
  session.execute('step', { earned: 8 });
  const firstStep = session.view().battle;
  session.execute('step', { damage: 10, earned: 3 });
  assert.equal(session.view().phase, 'wave_defeat');
  assert.equal(session.execute('restart_wave').feedbackReset, true);
  assert.deepEqual(session.view().battle, opening);
  assert.equal(session.view().restartCount, 1);
  session.execute('step', { earned: 8 });
  assert.deepEqual(session.view().battle, firstStep);
});

test('duplicate and wrong-phase commands cannot award income or rewind again', () => {
  const session = new RunSession();
  assert.equal(session.execute('restart_wave').ok, false);
  session.execute('start');
  assert.equal(session.execute('start').ok, false);
  session.execute('step', { damage: 10 });
  session.execute('restart_wave');
  const restored = session.view();
  assert.equal(session.execute('restart_wave').ok, false);
  assert.deepEqual(session.view(), restored);
  session.execute('step', { damage: 10 });
  session.execute('restart_wave');
  assert.equal(session.view().restartCount, 2);
  assert.equal(session.view().battle.coins, 5);
});

test('queries are isolated and invalid commands leave authoritative state unchanged', () => {
  const session = new RunSession();
  session.execute('start');
  const before = session.view();
  const display = session.view();
  display.battle.coins = 999;
  display.phase = 'finished';
  assert.deepEqual(session.view(), before);
  for (const damage of [-1, NaN, Infinity, 0.5, '10']) {
    assert.equal(session.execute('step', { damage }).ok, false);
    assert.deepEqual(session.view(), before);
  }
});

test('finishing defeat closes the checkpoint lifecycle', () => {
  const session = new RunSession();
  session.execute('start');
  session.execute('step', { damage: 10 });
  assert.equal(session.execute('finish_defeat').ok, true);
  const finished = session.view();
  assert.equal(session.execute('restart_wave').ok, false);
  assert.equal(session.execute('step').ok, false);
  assert.deepEqual(session.view(), finished);
});
