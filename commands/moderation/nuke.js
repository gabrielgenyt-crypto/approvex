// =nuke [#channel] — Recreate a channel (clone + delete).

const { PermissionFlagsBits } = require('discord.js');
const { makeEmbed, errorEmbed } = require('../../utils/embed');
const { E, ROLES } = require('../../utils/constants');

module.exports = {
  name: 'nuke',
  description: 'Recreate a channel (clone + delete).',
  permissions: [PermissionFlagsBits.ManageChannels],
  async execute(message) {
    // Block limited mods (mod role without staff role).
    if (ROLES.mod && message.member.roles.cache.has(ROLES.mod) && !message.member.roles.cache.has(ROLES.staff)) {
      return message.reply({ embeds: [errorEmbed('You do not have permission to use this command.')] });
    }

    const target = message.mentions.channels.first() || message.channel;

    const newChannel = await target.clone({ reason: `Nuked by ${message.author.tag}` });
    await newChannel.setPosition(target.position).catch(() => {});
    await target.delete().catch(() => {});

    newChannel.send({
      embeds: [makeEmbed({
        title: `${E.settings} Channel Nuked`,
        description: `${E.tick} Successfully nuked ${newChannel}.`,
      })],
    });
  },
};
