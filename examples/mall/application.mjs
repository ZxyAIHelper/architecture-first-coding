import { MallRun } from './core.mjs';

// Application owns the current run's lifetime. Pricing and funds checks stay core.
export class RetailSession {
  #run;

  constructor(initialCash = 100) {
    this.#run = new MallRun(initialCash);
  }

  quote(column) {
    return this.#run.quote(column);
  }

  command(action, { column, revision } = {}) {
    if (action !== 'build') return { ok: false, error: 'unknown_command' };
    return this.#run.build(column, revision);
  }

  view() {
    return this.#run.view();
  }
}
