// ApproveX — Shared constants and configuration.

/** Green-light embed colour used across all embeds. */
const EMBED_COLOR = 0x57f287;

/** Custom emoji strings keyed by purpose. */
const E = {
  dot:      '<:dot:1491081531568160859>',
  arrow:    '<:arrow:1491083421735194634>',
  add:      '<:add:1491081507266232483>',
  tick:     '<:tick:1491083573917253823>',
  cross:    '<:cross:1491083461920952360>',
  lock:     '<:lock:1491081435560280266>',
  share:    '<:share:1491081489050505457>',
  announce: '<:announce:1491081615001129051>',
  settings: '<:settings:1491081641286959195>',
  star:     '<:star:1491081658131153027>',
  gift:     '<:gift:1491081658131153027>',
  rocket:   '<:rocket:1491081553651171551>',
  reload:   '<:reload:1491083421735194634>',
  ticket:   '<:ticket:1491531888718909450>',
  money:    '<:money:1491531607633301685>',
  website:  '<:website:1491531512632443071>',
  discord:  '<:discord:1491531479757361304>',
  general:  '<:general:1491532694440513728>',
};

/** Bot prefix. */
const PREFIX = '=';

/** Bot branding. */
const BOT_NAME = 'ApproveX';
const FOOTER = 'ApproveX — Credits to autotem';

/** Banner image URL used in key embeds. */
const BANNER = 'https://cdn.discordapp.com/attachments/1493327393736233200/1493354077206216825/tmqzj14.png?ex=69dea9dd&is=69dd585d&hm=2cbefd82d84f21863316b4f207243f6dcbc0da967040cb35aa56e1e95cf0be6f&';

/** Role IDs. */
const ROLES = {
  staff: process.env.STAFF_ROLE_ID || '1493262996158287882',
  owner: process.env.OWNER_ROLE_ID || '1493261601719976154',
};

/** Channel IDs (set via .env). */
const CHANNELS = {
  welcome:    process.env.WELCOME_CHANNEL_ID || null,
  transcript: process.env.TRANSCRIPT_CHANNEL_ID || null,
  log:        process.env.LOG_CHANNEL_ID || null,
  vouch:      process.env.VOUCH_CHANNEL_ID || null,
};

module.exports = { EMBED_COLOR, E, PREFIX, BOT_NAME, FOOTER, BANNER, ROLES, CHANNELS };
