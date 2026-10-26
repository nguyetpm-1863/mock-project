export class InvalidSeedInputError extends Error {
  constructor(fields: string[]) {
    super(`Invalid seed input: ${fields.join(', ')}`);
    this.name = InvalidSeedInputError.name;
  }
}
