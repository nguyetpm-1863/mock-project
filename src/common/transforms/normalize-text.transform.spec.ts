import type { TransformFnParams } from 'class-transformer';
import { normalizeText } from './normalize-text.transform.js';

const run = (value: unknown) => normalizeText({ value } as TransformFnParams);

describe('normalizeText', () => {
  it('trims and converts decomposed Unicode to NFC', () => {
    const decomposed = '  quả táo  '.normalize('NFD');

    expect(run(decomposed)).toBe('quả táo'.normalize('NFC'));
  });

  it('leaves non-string values untouched', () => {
    expect(run(42)).toBe(42);
  });
});
