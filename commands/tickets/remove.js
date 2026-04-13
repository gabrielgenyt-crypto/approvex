// =ticket remove @user — Remove user from ticket.

const { successEmbed, errorEmbed } = require('../../utils/embed');
const { getDb } = require('../../utils/db');

module.exports = {
  name: 'ticket remove',
  description: 'Remove a user from the current ticket.',
  async execute(message) {
    const db = getDb();
    const ticket = db.prepare("SELECT * FROM tickets WHERE channel_id = ? AND status = 'open'")
      .get(message.channel.id);
    if (!ticket) return message.reply({ embeds: [errorEmbed('This is not an open ticket channel.')] });

    const target = message.mentions.members.first();
    if (!target) return message.reply({ embeds: [errorEmbed('Mention a user to remove.')] });

    await message.channel.permissionOverwrites.edit(target, {
      ViewChannel: false,
      SendMessages: false,
    });

    message.reply({ embeds: [successEmbed(`${target.user.tag} has been removed from this ticket.`)] });
  },
};
