const crypto = require("node:crypto");

// Excludes I, O, 0 and 1 to avoid confusion
const CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const CODE_LENGTH = 6;

/**
 * Generates a cryptographically random six-character session code.
 */
function generateSessionCode() {
  let code = "";

  for (let i = 0; i < CODE_LENGTH; i++) {
    const randomIndex = crypto.randomInt(0, CHARACTERS.length);
    code += CHARACTERS[randomIndex];
  }

  return code;
}

/**
 * Checks whether a session code has the expected format.
 */
function isValidSessionCode(code) {
  if (typeof code !== "string") {
    return false;
  }

  const pattern = /^[A-HJ-NP-Z2-9]{6}$/;
  return pattern.test(code);
}

module.exports = {
  generateSessionCode,
  isValidSessionCode,
};