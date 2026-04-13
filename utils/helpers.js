// ApproveX — Shared helper functions.

const { ROLES } = require('./constants');

/** Check if a member has the staff role. */
function isStaff(member) {
  return ROLES.staff && member.roles.cache.has(ROLES.staff);
}

/** Check if a member is a "limited mod" (has mod but NOT staff). */
function isLimitedMod(member) {
  const hasMod = ROLES.mod && member.roles.cache.has(ROLES.mod);
  const hasStaff = isStaff(member);
  return hasMod && !hasStaff;
}

/** Check if a member has staff OR mod role. */
function isStaffOrMod(member) {
  return isStaff(member) || (ROLES.mod && member.roles.cache.has(ROLES.mod));
}

/** Check if a member has staff, mod, or seller role. */
function isSellerOrHigher(member) {
  return isStaffOrMod(member) || (ROLES.seller && member.roles.cache.has(ROLES.seller));
}

/** Parse a time string like "5m", "10s", "2h", "1d" into seconds. */
function parseTime(str) {
  const match = str.match(/^(\d+)([smhd])$/i);
  if (!match) return null;
  const val = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
  return val * multipliers[unit];
}

/** Safely evaluate a basic math expression. */
function safeCalculate(expr) {
  if (!/^[0-9+\-*/().% ]+$/.test(expr)) return null;
  try {
    let processed = expr.replace(
      /(\d+\.?\d*)\s*([+-])\s*(\d+\.?\d*)%/g,
      (_m, base, op, pct) => `${base}${op}(${base}*${pct}/100)`
    );
    processed = processed.replace(/(\d+\.?\d*)%/g, '($1/100)');
    // eslint-disable-next-line no-eval
    const result = eval(processed);
    if (typeof result !== 'number' || !isFinite(result)) return null;
    return Math.round(result * 1e6) / 1e6;
  } catch {
    return null;
  }
}

module.exports = { isStaff, isLimitedMod, isStaffOrMod, isSellerOrHigher, parseTime, safeCalculate };
