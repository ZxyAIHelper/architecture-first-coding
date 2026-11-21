import { Battle } from './core.mjs';

// Application owns phases and checkpoint lifetime; combat fields stay in Battle.
export class RunSession {
  #battle = new Battle();
  #phase = 'menu';
  #opening = null;
  #restartCount = 0;

  execute(command, args = {}) {
    if (command === 'start' && this.#phase === 'menu') {
      this.#battle.beginWave();
      // Capture after entry income, so restore never runs entry logic twice.
      this.#opening = this.#battle.checkpoint();
      this.#phase = 'combat';
      return { ok: true };
    }
    if (command === 'step' && this.#phase === 'combat') {
      const result = this.#battle.step(args);
      if (result.ok && result.dead) this.#phase = 'wave_defeat';
      return result;
    }
    if (command === 'restart_wave' && this.#phase === 'wave_defeat') {
      this.#battle.restore(this.#opening);
      this.#phase = 'combat';
      // Keep attempt identity outside the restored checkpoint: ticks can repeat.
      this.#restartCount += 1;
      return { ok: true, rewound: true, feedbackReset: true };
    }
    if (command === 'finish_defeat' && this.#phase === 'wave_defeat') {
      this.#phase = 'finished';
      this.#opening = null;
      return { ok: true };
    }
    return { ok: false, error: 'invalid_phase_or_command' };
  }

  view() {
    return { phase: this.#phase, restartCount: this.#restartCount,
      battle: this.#battle.view() };
  }
}
