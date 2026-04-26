const EMBED_COLOR = 0x3498db;

// emojis used across embeds
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
  paypal:   '<:paypall:1400828106201108581>',
  logs:     '<:Like:1479991073098043403>',
  light:    '<:lightning:1478489166143557836>',
  approve:  '<:approve:1486322316659916890>',
  arrowe:   '<a:arrowe:1400825490909958268>',
  info:     '<:info:1478488967299989534>',
  ltc:      '<:ltc:1400824170614358157>',
  crypto:   '<:crypto:1400509717863727144>',
  revolut:  '<:Revolut:1483947738000392353>',
};

const PREFIX = '=';
const FOOTER = 'Approve Support System';

const ROLES = {
  staff:       process.env.STAFF_ROLE_ID       || null,
  manager:     process.env.MANAGER_ROLE_ID     || null,
  mod:         process.env.MOD_ROLE_ID         || null,
  seller:      process.env.SELLER_ROLE_ID      || null,
  customer:    process.env.CUSTOMER_ROLE_ID    || null,
  exchanger:   '1497275659284647987',
  approveteam: '1493262996158287882',
};

const CHANNELS = {
  transcript: process.env.TRANSCRIPT_CHANNEL_ID || null,
  log: process.env.LOG_CHANNEL_ID || null,
};

const TICKET_CATS = {
  purchase: process.env.PURCHASE_CATEGORY_ID || null,
  exchange: process.env.EXCHANGE_CATEGORY_ID || null,
  support:  process.env.SUPPORT_CATEGORY_ID  || null,
  closed:   process.env.CLOSED_CATEGORY_ID   || null,
  vouch:    process.env.VOUCH_CATEGORY_ID    || null,
};

const GUILD_ID = process.env.GUILD_ID || null;

// Fee percentages for exchange routes
const EXCHANGE_FEES = {
  paypal_to_crypto: 7,
  revolut: 10,
  crypto_to_crypto: 0,
  default: 7,
};

module.exports = { EMBED_COLOR, E, PREFIX, FOOTER, ROLES, CHANNELS, TICKET_CATS, GUILD_ID, EXCHANGE_FEES };
