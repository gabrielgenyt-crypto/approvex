// ApproveX — Shared constants and configuration.

/** Embed colour (blue, matching the Python bot's 0x3498db). */
const EMBED_COLOR = 0x3498db;

/** Custom emoji strings — matching the original Python bot. */
const E = {
  success:  '<:warningg:1478489222657740800>',
  support:  '<:lightning:1478489166143557836>',
  exchange: '<:Starr:1480675838557950032>',
  purchase: '<a:customer:1400509713040408669>',
  notify:   '<:akey:1480005245894397985>',
  deny:     '<:warningg:1478489222657740800>',
  hashtag:  '<:akey:1480005245894397985>',
  time:     '<:akey:1480005245894397985>',
  tool:     '<:Tool:1478142607539441871>',
  paypal:   '<:paypal:1400828106201108581>',
  logs:     '<:Like:1479991073098043403>',
  light:    '<:lightning:1478489166143557836>',
  approve:  '<:approve:1486322316659916890>',
  arrowe:   '<a:arrowe:1400825490909958268>',
};

/** Bot prefix. */
const PREFIX = '=';

/** Footer text. */
const FOOTER = 'Approve Support System';

/** Role IDs (from .env). */
const ROLES = {
  staff:    process.env.STAFF_ROLE_ID    || null,
  manager:  process.env.MANAGER_ROLE_ID  || null,
  mod:      process.env.MOD_ROLE_ID      || null,
  seller:   process.env.SELLER_ROLE_ID   || null,
  customer: process.env.CUSTOMER_ROLE_ID || null,
};

/** Channel IDs (from .env). */
const CHANNELS = {
  transcript: process.env.TRANSCRIPT_CHANNEL_ID || null,
};

/** Ticket category IDs (from .env). */
const TICKET_CATS = {
  purchase: process.env.PURCHASE_CATEGORY_ID || null,
  exchange: process.env.EXCHANGE_CATEGORY_ID || null,
  support:  process.env.SUPPORT_CATEGORY_ID  || null,
  closed:   process.env.CLOSED_CATEGORY_ID   || null,
  vouch:    process.env.VOUCH_CATEGORY_ID    || null,
};

/** Guild ID for slash commands. */
const GUILD_ID = process.env.GUILD_ID || null;

module.exports = { EMBED_COLOR, E, PREFIX, FOOTER, ROLES, CHANNELS, TICKET_CATS, GUILD_ID };
