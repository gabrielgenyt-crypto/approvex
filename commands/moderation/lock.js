// =lock [#channel] — Lock a channel (prevent @everyone from sending messages).

const { PermissionFlagsBits } = require('discord.js');
const { makeEmbed } = require('../../utils/embed');
const { E } = require('../../utils/constants');

module.exports = {
  name: 'lock',
  description: 'Lock a channel.',
  permissions: [PermissionFlagsBits.ManageChannels],
  async execute(message) {
    const channel = message.mentions.channels.first() || message.channel;

    await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      SendMessages: false,
      AddReactions: false,
    });

    message.channel.send({ embeds: [makeEmbed({
      title: `${E.lock} Channel Locked`,
      description: `${E.arrow} **Channel:** ${channel}\n${E.cross} Members can only view and read history.`,
    })] });
  },
};
