const test = require("node:test");
const assert = require("node:assert/strict");

const {
  generateSessionCode,
  isValidSessionCode,
} = require("../src/utils/sessionCode");

test("generated session code contains exactly 6 characters", () => {
  const code = generateSessionCode();

  assert.equal(code.length, 6);
});

test("generated session code uses only allowed characters", () => {
  for (let i = 0; i < 100; i++) {
    const code = generateSessionCode();

    assert.match(code, /^[A-HJ-NP-Z2-9]{6}$/);
  }
});

test("generated session codes pass validation", () => {
  const code = generateSessionCode();

  assert.equal(isValidSessionCode(code), true);
});

test("valid session codes are accepted", () => {
  assert.equal(isValidSessionCode("ABC234"), true);
});

test("codes containing excluded characters are rejected", () => {
  assert.equal(isValidSessionCode("ABCI23"), false);
  assert.equal(isValidSessionCode("ABCO23"), false);
  assert.equal(isValidSessionCode("ABC023"), false);
  assert.equal(isValidSessionCode("ABC123"), false);
});

test("invalid code lengths are rejected", () => {
  assert.equal(isValidSessionCode("ABC23"), false);
  assert.equal(isValidSessionCode("ABC2345"), false);
});

test("non-string values are rejected", () => {
  assert.equal(isValidSessionCode(null), false);
  assert.equal(isValidSessionCode(123456), false);
  assert.equal(isValidSessionCode(undefined), false);
});
