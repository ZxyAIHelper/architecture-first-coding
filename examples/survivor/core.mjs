// Core owns combat state. No UI, session reference, callback or storage is held here.
export class Battle {
  #state = { wave: 0, health: 10, coins: 0, tick: 0, random: 1 };

  beginWave() {
    this.#state.wave += 1;
    this.#state.health = 10;
    this.#state.coins += 5;
    this.#state.tick = 0;
  }

  step({ damage = 0, earned = 0 } = {}) {
    if (![damage, earned].every(value => Number.isSafeInteger(value) && value >= 0)
      || !Number.isSafeInteger(this.#state.coins + earned)) {
      return { ok: false, error: 'invalid_input' };
    }
    this.#state.health = Math.max(0, this.#state.health - damage);
    this.#state.coins += earned;
    this.#state.tick += 1;
    this.#state.random = (Math.imul(this.#state.random, 1664525) + 1013904223) >>> 0;
    return { ok: true, dead: this.#state.health === 0 };
  }

  checkpoint() {
    return structuredClone(this.#state);
  }

  restore(checkpoint) {
    // Only a checkpoint captured by this session is accepted by the application.
    // This is an in-memory rewind contract, not an untrusted save-file loader.
    this.#state = structuredClone(checkpoint);
  }

  view() {
    return structuredClone(this.#state);
  }
}
