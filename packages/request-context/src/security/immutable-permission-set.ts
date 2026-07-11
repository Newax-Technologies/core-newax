export class ImmutablePermissionSet implements ReadonlySet<string> {
  private readonly valuesSet: Set<string>;

  constructor(values: Iterable<string>) {
    this.valuesSet = new Set(
      [...values]
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
        .sort(),
    );
  }

  get size(): number {
    return this.valuesSet.size;
  }

  has(value: string): boolean {
    return this.valuesSet.has(value);
  }

  entries(): SetIterator<[string, string]> {
    return this.valuesSet.entries();
  }

  keys(): SetIterator<string> {
    return this.valuesSet.keys();
  }

  values(): SetIterator<string> {
    return this.valuesSet.values();
  }

  forEach(
    callbackfn: (value: string, value2: string, set: ReadonlySet<string>) => void,
    thisArg?: unknown,
  ): void {
    for (const value of this.valuesSet) {
      callbackfn.call(thisArg, value, value, this);
    }
  }

  [Symbol.iterator](): SetIterator<string> {
    return this.values();
  }

  get [Symbol.toStringTag](): string {
    return 'ImmutablePermissionSet';
  }
}
