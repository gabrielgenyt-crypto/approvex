const { ROLES } = require('./constants');

function isStaff(member) {
  return ROLES.staff && member.roles.cache.has(ROLES.staff);
}

function isManager(member) {
  return ROLES.manager && member.roles.cache.has(ROLES.manager);
}

function isManagerOrHigher(member) {
  return isStaff(member) || isManager(member);
}

// has mod but not staff/manager
function isLimitedMod(member) {
  const hasMod = ROLES.mod && member.roles.cache.has(ROLES.mod);
  return hasMod && !isManagerOrHigher(member);
}

function isStaffOrMod(member) {
  return isManagerOrHigher(member) || (ROLES.mod && member.roles.cache.has(ROLES.mod));
}

function isSellerOrHigher(member) {
  return isStaffOrMod(member) || (ROLES.seller && member.roles.cache.has(ROLES.seller));
}

// "5m", "10s", "2h", "1d" -> seconds
function parseTime(str) {
  const match = str.match(/^(\d+)([smhd])$/i);
  if (!match) return null;
  const val = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
  return val * multipliers[unit];
}

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

module.exports = { isStaff, isManager, isManagerOrHigher, isLimitedMod, isStaffOrMod, isSellerOrHigher, parseTime, safeCalculate };
