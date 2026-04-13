// =clear [amount] — Purge messages from the channel.

const { PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embed');

module.exports = {
  name: 'clear',
  aliases: ['purge'],
  description: 'Purge messages from the channel.',
  permissions: [PermissionFlagsBits.ManageMessages],
  async execute(message, args) {
    const amount = parseInt(args[0], 10);
    if (isNaN(amount) || amount < 1 || amount > 100) {
      return message.reply({ embeds: [errorEmbed('Provide a number between 1 and 100.')] });
    }

    const deleted = await message.channel.bulkDelete(amount + 1, true).catch(() => null);
    if (!deleted) return message.reply({ embeds: [errorEmbed('Failed to delete messages.')] });

    const msg = await message.channel.send({
      embeds: [successEmbed(`Deleted **${deleted.size - 1}** messages.`)],
    });
    setTimeout(() => msg.delete().catch(() => {}), 5000);
  },
};
