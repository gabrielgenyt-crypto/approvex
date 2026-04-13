// =paneltos — Send the TOS panel with a dropdown for each product category.

const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const { makeEmbed } = require('../../utils/embed');
const { E, BANNER } = require('../../utils/constants');

/** TOS content keyed by dropdown value. */
const TOS_PAGES = {
  general: {
    title: `${E.star} General Terms of Service`,
    lines: [
      '**By purchasing any product, you agree to the following:**',
      '',
      `${E.cross} **No Refunds** — All sales are final.`,
      `${E.money} **Payment** — Must be completed before delivery.`,
      `${E.arrow} **Delivery** — Delivery times may vary.`,
      `${E.settings} **Replacement** — Only if the issue is on our side.`,
      `${E.lock} **Responsibility** — We are not responsible for misuse.`,
      `${E.cross} **Revoke Waves** — No reimbursement for mass revokes.`,
      `${E.dot} **Changes** — We may update TOS at any time.`,
    ],
  },
  nitro: {
    title: `${E.gift} Nitro TOS`,
    lines: [
      `${E.dot} 25-day revoke warranty`,
      `${E.dot} Must provide full video proof`,
      `${E.dot} Show claiming process + gift link`,
      `${E.dot} No proof = no replacement`,
      `${E.dot} Replacement depends on situation`,
      `${E.dot} 24h window for claims`,
      `${E.dot} Revoke email required`,
    ],
  },
  members: {
    title: `${E.add} Discord Members TOS`,
    lines: [
      `${E.dot} Members added via bot`,
      `${E.dot} If kicked = no refund`,
      `${E.dot} No warranty if Discord terminates tokens`,
    ],
  },
  socials: {
    title: `${E.share} Socials TOS`,
    lines: [
      `${E.dot} Refill only if requested in ticket`,
      `${E.dot} Orders may take up to 48h`,
      `${E.dot} Must provide Order ID`,
      `${E.dot} No Order ID = no warranty`,
      `${E.dot} Username change = order fails`,
      `${E.dot} Account must stay public`,
    ],
  },
  minecraft: {
    title: `${E.settings} Minecraft TOS`,
    lines: [
      '**Replacement if:**',
      `${E.dot} Pulled back within 7 days`,
      `${E.dot} Not as described`,
      `${E.dot} Locked within 7 days`,
      '',
      '**Your responsibility:**',
      `${E.dot} Secure account immediately`,
      `${E.dot} You are responsible after delivery`,
    ],
  },
  boosts: {
    title: `${E.rocket} Server Boosts TOS`,
    lines: [
      `${E.dot} No warranty if you kick/ban tokens`,
      `${E.dot} No warranty for token issues`,
    ],
  },
  accounts: {
    title: `${E.lock} Accounts TOS`,
    lines: [
      `${E.dot} No warranty for revoke waves`,
      `${E.dot} No warranty if access is lost`,
      `${E.dot} Must secure account immediately`,
      `${E.dot} Sharing / multiple IP = risk`,
      `${E.dot} Buyer mistakes = no replacement`,
    ],
  },
  fortnite: {
    title: `${E.settings} Fortnite TOS`,
    lines: [
      `${E.dot} Includes full account + webmail`,
      `${E.dot} Email change may be delayed`,
      `${E.dot} Depends on Epic security`,
      '',
      `${E.dot} No responsibility after delivery`,
      `${E.dot} Buying = agreeing to TOS`,
    ],
  },
};

module.exports = {
  name: 'paneltos',
  description: 'Send the TOS panel with category dropdown.',
  permissions: [PermissionFlagsBits.ManageMessages],
  async execute(message) {
    await message.delete().catch(() => {});

    const embed = makeEmbed({
      title: `${E.star} Terms of Service Panel`,
      description: [
        'Please read our Terms of Service carefully.',
        '',
        'Select a category below to view specific rules.',
        '',
        `${E.dot} If you have questions, contact support before purchasing.`,
      ].join('\n'),
      image: BANNER,
    });

    const menu = new StringSelectMenuBuilder()
      .setCustomId('tos_panel_select')
      .setPlaceholder('Select a TOS category...')
      .addOptions([
        { label: 'General TOS',      value: 'general',   emoji: '📜' },
        { label: 'Nitro',            value: 'nitro',     emoji: '🎁' },
        { label: 'Discord Members',  value: 'members',   emoji: '👥' },
        { label: 'Socials',          value: 'socials',   emoji: '📱' },
        { label: 'Minecraft',        value: 'minecraft',  emoji: '⛏️' },
        { label: 'Server Boosts',    value: 'boosts',    emoji: '🚀' },
        { label: 'Accounts',         value: 'accounts',  emoji: '🔐' },
        { label: 'Fortnite',         value: 'fortnite',  emoji: '🛠️' },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    message.channel.send({ embeds: [embed], components: [row] });
  },

  /** Exported so interactionCreate can access the page content. */
  TOS_PAGES,
};
