const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeSenegalPhone, formatSenegalPhone, whatsappLink } = require('../src/utils/phone');

test('normalizes Senegalese numbers to E.164', () => {
  for (const input of ['77 123 45 67', '771234567', '+221 77 123 45 67', '00221771234567', '221771234567', '77-123-45-67']) {
    assert.equal(normalizeSenegalPhone(input), '+221771234567', input);
  }
  assert.equal(normalizeSenegalPhone('33 820 00 00'), '+221338200000');
});

test('rejects invalid numbers', () => {
  for (const input of ['', null, '12345', '79 123 45 67', '7712345678', '+33612345678', 'abc']) {
    assert.equal(normalizeSenegalPhone(input), null, String(input));
  }
});

test('formats and builds wa.me links', () => {
  assert.equal(formatSenegalPhone('+221771234567'), '77 123 45 67');
  assert.equal(whatsappLink('+221771234567'), 'https://wa.me/221771234567');
  assert.equal(whatsappLink('+221771234567', 'Bonjour à vous'), 'https://wa.me/221771234567?text=Bonjour%20%C3%A0%20vous');
});
