// Senegal phone helpers. Canonical storage format is E.164: +221XXXXXXXXX.
// Mobile prefixes: 70, 71, 72, 75, 76, 77, 78. Landline: 33.
const SN_LOCAL = /^(7[0-8]|33)\d{7}$/;

function normalizeSenegalPhone(input) {
  if (!input) return null;
  let digits = String(input).replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  else if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('221') && digits.length === 12) digits = digits.slice(3);
  if (!SN_LOCAL.test(digits)) return null;
  return `+221${digits}`;
}

// "+221771234567" -> "77 123 45 67"
function formatSenegalPhone(e164) {
  if (!e164) return '';
  const local = e164.replace(/^\+221/, '');
  return local.replace(/^(\d{2})(\d{3})(\d{2})(\d{2})$/, '$1 $2 $3 $4');
}

// wa.me expects digits only, with country code.
function whatsappLink(e164, text) {
  if (!e164) return null;
  const url = `https://wa.me/${e164.replace(/\D/g, '')}`;
  return text ? `${url}?text=${encodeURIComponent(text)}` : url;
}

module.exports = { normalizeSenegalPhone, formatSenegalPhone, whatsappLink };
