// =kick @user [reason] — Kick a user from the server.

const { PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embed');

module.exports = {
  name: 'kick',
  description: 'Kick a user.',
  permissions: [PermissionFlagsBits.KickMembers],
  async execute(message, args) {
    const target = message.mentions.members.first();
    if (!target) return message.reply({ embeds: [errorEmbed('Mention a user to kick.')] });
    if (!target.kickable) return message.reply({ embeds: [errorEmbed('I cannot kick that user.')] });

    const reason = args.slice(1).join(' ') || 'No reason provided';
    await target.kick(reason);
    message.reply({
      embeds: [successEmbed(`**${target.user.tag}** has been kicked.\n**Reason:** ${reason}`)],
    });
  },
};
