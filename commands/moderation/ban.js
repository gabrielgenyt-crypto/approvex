// =ban @user [reason] — Ban a user from the server.

const { PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embed');

module.exports = {
  name: 'ban',
  description: 'Ban a user.',
  permissions: [PermissionFlagsBits.BanMembers],
  async execute(message, args) {
    const target = message.mentions.members.first();
    if (!target) return message.reply({ embeds: [errorEmbed('Mention a user to ban.')] });
    if (!target.bannable) return message.reply({ embeds: [errorEmbed('I cannot ban that user.')] });

    const reason = args.slice(1).join(' ') || 'No reason provided';
    await target.ban({ reason });
    message.reply({
      embeds: [successEmbed(`**${target.user.tag}** has been banned.\n**Reason:** ${reason}`)],
    });
  },
};
