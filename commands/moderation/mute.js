// =mute @user [reason] — Timeout a user (10 minutes default).

const { PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embed');

module.exports = {
  name: 'mute',
  description: 'Timeout a user.',
  permissions: [PermissionFlagsBits.ModerateMembers],
  async execute(message, args) {
    const target = message.mentions.members.first();
    if (!target) return message.reply({ embeds: [errorEmbed('Mention a user to mute.')] });

    const reason = args.slice(1).join(' ') || 'No reason provided';
    await target.timeout(10 * 60 * 1000, reason);
    message.reply({
      embeds: [successEmbed(`**${target.user.tag}** has been muted for 10 minutes.\n**Reason:** ${reason}`)],
    });
  },
};
