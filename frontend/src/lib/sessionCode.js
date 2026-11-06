// Must match the backend (src/utils/sessionCode.js): no 0, O, 1 or I.
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 6;

export function generateCode(length = CODE_LENGTH, random = defaultRandom) {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += CODE_ALPHABET[random(CODE_ALPHABET.length)];
  }
  return code;
}

function defaultRandom(max) {
  // Rejection sampling keeps every character equally likely.
  const limit = 256 - (256 % max);
  const buf = new Uint8Array(1);
  let value;
  do {
    globalThis.crypto.getRandomValues(buf);
    value = buf[0];
  } while (value >= limit);
  return value % max;
}

// Users may type lowercase letters or spaces. Store and compare codes in one form.
export function normalizeCode(input) {
  return String(input ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export function isValidCodeFormat(input) {
  const code = normalizeCode(input);
  return (
    code.length === CODE_LENGTH &&
    [...code].every((ch) => CODE_ALPHABET.includes(ch))
  );
}

// Tries up to maxTries random codes. `isTaken(code)` returns true when the code is in use.
export async function findFreeCode(isTaken, { maxTries = 10, generate = generateCode } = {}) {
  for (let i = 0; i < maxTries; i += 1) {
    const code = generate();
    if (!(await isTaken(code))) return code;
  }
  throw new Error('Could not find a free session code. Please try again.');
}
