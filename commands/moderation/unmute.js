// =unmute @user — Remove timeout from a user.

const { PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embed');

module.exports = {
  name: 'unmute',
  description: 'Remove timeout from a user.',
  permissions: [PermissionFlagsBits.ModerateMembers],
  async execute(message) {
    const target = message.mentions.members.first();
    if (!target) return message.reply({ embeds: [errorEmbed('Mention a user to unmute.')] });

    await target.timeout(null);
    message.reply({
      embeds: [successEmbed(`**${target.user.tag}** has been unmuted.`)],
    });
  },
};
