import { describe, it, expect } from 'vitest';
import {
  CODE_ALPHABET,
  CODE_LENGTH,
  generateCode,
  normalizeCode,
  isValidCodeFormat,
  findFreeCode,
} from './sessionCode';

describe('generateCode', () => {
  it('returns a code of the right length using only allowed characters', () => {
    for (let i = 0; i < 200; i += 1) {
      const code = generateCode();
      expect(code).toHaveLength(CODE_LENGTH);
      expect([...code].every((c) => CODE_ALPHABET.includes(c))).toBe(true);
    }
  });

  it('never uses easily confused characters', () => {
    for (const bad of ['0', 'O', '1', 'I']) {
      expect(CODE_ALPHABET.includes(bad)).toBe(false);
    }
  });

  it('uses the injected random source', () => {
    expect(generateCode(4, () => 0)).toBe('AAAA');
  });

  it('produces mostly different codes', () => {
    const codes = new Set(Array.from({ length: 500 }, () => generateCode()));
    expect(codes.size).toBeGreaterThan(495);
  });
});

describe('normalizeCode', () => {
  it('uppercases and strips spaces and symbols', () => {
    expect(normalizeCode(' ab c-234 ')).toBe('ABC234');
  });
  it('handles empty input', () => {
    expect(normalizeCode(undefined)).toBe('');
    expect(normalizeCode(null)).toBe('');
  });
});

describe('isValidCodeFormat', () => {
  it('accepts a good code in any case', () => {
    expect(isValidCodeFormat('abc234')).toBe(true);
  });
  it('rejects wrong length', () => {
    expect(isValidCodeFormat('ABC')).toBe(false);
    expect(isValidCodeFormat('ABC2345')).toBe(false);
  });
  it('rejects characters outside the alphabet', () => {
    expect(isValidCodeFormat('ABC0O1')).toBe(false);
  });
});

describe('findFreeCode', () => {
  it('returns the first code that is not taken', async () => {
    const queue = ['AAAAAA', 'BBBBBB', 'CCCCCC'];
    const taken = new Set(['AAAAAA', 'BBBBBB']);
    const code = await findFreeCode(async (c) => taken.has(c), { generate: () => queue.shift() });
    expect(code).toBe('CCCCCC');
  });

  it('gives up after maxTries', async () => {
    await expect(
      findFreeCode(async () => true, { maxTries: 3, generate: () => 'AAAAAA' }),
    ).rejects.toThrow(/free session code/i);
  });
});

describe('backend compatibility', () => {
  it('uses the same alphabet as the backend session codes', () => {
    expect(CODE_ALPHABET).toBe('ABCDEFGHJKLMNPQRSTUVWXYZ23456789');
  });
});
