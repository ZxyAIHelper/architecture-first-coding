const CONSTRUCTION_PRICE = 30;

// Core geometry owns occupancy. Coordinates are zero-based columns in this model.
class Floor {
  #cells;

  constructor(cells = []) {
    this.#cells = structuredClone(cells);
  }

  validate(column) {
    if (!Number.isInteger(column) || column < 0 || column >= 4) return 'invalid_cell';
    return this.#cells.some(cell => cell.column === column) ? 'occupied' : null;
  }

  withPlacement(column) {
    return new Floor([...this.#cells, { id: this.#cells.length + 1, column }]);
  }

  view() {
    return structuredClone(this.#cells);
  }
}

// Core ledger is the sole cash owner; callers cannot assign or mutate its balance.
class Ledger {
  #cash;

  constructor(cash) {
    this.#cash = cash;
  }

  canPay(amount) {
    return this.#cash >= amount;
  }

  withDebit(amount) {
    return new Ledger(this.#cash - amount);
  }

  view() {
    return { cash: this.#cash };
  }
}

// Core run coordinates domain submission; Floor and Ledger never call each other.
export class MallRun {
  #floor = new Floor();
  #ledger;
  #revision = 0;

  constructor(initialCash = 100) {
    if (!Number.isSafeInteger(initialCash) || initialCash < 0) {
      throw new TypeError('initialCash must be a nonnegative safe integer');
    }
    this.#ledger = new Ledger(initialCash);
  }

  quote(column) {
    const error = this.#floor.validate(column)
      ?? (this.#ledger.canPay(CONSTRUCTION_PRICE) ? null : 'insufficient_cash');
    return error ? { ok: false, error, revision: this.#revision }
      : { ok: true, column, price: CONSTRUCTION_PRICE, revision: this.#revision };
  }

  build(column, expectedRevision) {
    if (expectedRevision !== this.#revision) return { ok: false, error: 'stale_revision' };
    // Recompute the authoritative quote. A caller-supplied preview is never trusted.
    const proposal = this.quote(column);
    if (!proposal.ok) return proposal;

    // Prepare both owners before replacing either. No await, I/O or callback can
    // interleave between validation and commit. This is an in-memory transaction.
    const nextFloor = this.#floor.withPlacement(column);
    const nextLedger = this.#ledger.withDebit(proposal.price);
    this.#floor = nextFloor;
    this.#ledger = nextLedger;
    this.#revision += 1;
    return { ok: true, revision: this.#revision, price: proposal.price };
  }

  view() {
    return { revision: this.#revision, shops: this.#floor.view(), ...this.#ledger.view() };
  }
}
