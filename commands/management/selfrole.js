// =selfrole — Send a self-role selection panel with a dropdown menu.
// Configure the SELF_ROLES array below with your server's role IDs.

const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const { makeEmbed } = require('../../utils/embed');
const { E } = require('../../utils/constants');

/**
 * Role options displayed in the dropdown.
 * Update these with your actual role IDs and labels.
 */
const SELF_ROLES = [
  {
    label: 'Restock Ping',
    value: 'RESTOCK_ROLE_ID',
    description: 'Get notified for restocks',
    emoji: '📦',
  },
  {
    label: 'Giveaway Ping',
    value: 'GIVEAWAY_ROLE_ID',
    description: 'Get notified for giveaways',
    emoji: '🎉',
  },
  {
    label: 'Announcement Ping',
    value: 'ANNOUNCEMENT_ROLE_ID',
    description: 'Get notified for announcements',
    emoji: '📢',
  },
];

module.exports = {
  name: 'selfrole',
  description: 'Send the self-role selection panel.',
  permissions: [PermissionFlagsBits.ManageRoles],
  async execute(message) {
    const embed = makeEmbed({
      title: `${E.star} Self Roles`,
      description: [
        'Choose the notification roles you want to receive.',
        'Select from the dropdown below to toggle roles on or off.',
        '',
        `${E.rocket} **Restock Ping** — restock notifications`,
        `${E.gift} **Giveaway Ping** — giveaway notifications`,
        `${E.announce} **Announcement Ping** — announcement notifications`,
      ].join('\n'),
    });

    const menu = new StringSelectMenuBuilder()
      .setCustomId('selfrole_menu')
      .setPlaceholder('Select your roles...')
      .setMinValues(0)
      .setMaxValues(SELF_ROLES.length)
      .addOptions(SELF_ROLES);

    const row = new ActionRowBuilder().addComponents(menu);

    await message.channel.send({ embeds: [embed], components: [row] });
    if (message.deletable) await message.delete().catch(() => {});
  },
};
