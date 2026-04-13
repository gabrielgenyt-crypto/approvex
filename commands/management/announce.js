// =announce [message] — Send an announcement embed.

const { PermissionFlagsBits } = require('discord.js');
const { makeEmbed, errorEmbed } = require('../../utils/embed');
const { E } = require('../../utils/constants');

module.exports = {
  name: 'announce',
  description: 'Send an announcement embed.',
  permissions: [PermissionFlagsBits.ManageMessages],
  async execute(message, args) {
    const text = args.join(' ');
    if (!text) return message.reply({ embeds: [errorEmbed('Provide a message to announce.')] });

    await message.delete().catch(() => {});
    message.channel.send({ embeds: [makeEmbed({
      title: `${E.announce} Announcement`,
      description: text,
      footer: `Announced by ${message.author.tag}`,
    })] });
  },
};
