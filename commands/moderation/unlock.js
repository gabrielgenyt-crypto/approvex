// =unlock [#channel] — Unlock a channel.

const { PermissionFlagsBits } = require('discord.js');
const { makeEmbed } = require('../../utils/embed');
const { E } = require('../../utils/constants');

module.exports = {
  name: 'unlock',
  description: 'Unlock a channel.',
  permissions: [PermissionFlagsBits.ManageChannels],
  async execute(message) {
    const channel = message.mentions.channels.first() || message.channel;

    await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      SendMessages: true,
      AddReactions: true,
    });

    message.channel.send({ embeds: [makeEmbed({
      title: `${E.tick} Channel Unlocked`,
      description: `${E.arrow} **Channel:** ${channel}\n${E.tick} Members can now type and interact.`,
    })] });
  },
};
