// =ticket add @user — Add user to ticket.

const { successEmbed, errorEmbed } = require('../../utils/embed');
const { getDb } = require('../../utils/db');

module.exports = {
  name: 'ticket add',
  description: 'Add a user to the current ticket.',
  async execute(message) {
    const db = getDb();
    const ticket = db.prepare("SELECT * FROM tickets WHERE channel_id = ? AND status = 'open'")
      .get(message.channel.id);
    if (!ticket) return message.reply({ embeds: [errorEmbed('This is not an open ticket channel.')] });

    const target = message.mentions.members.first();
    if (!target) return message.reply({ embeds: [errorEmbed('Mention a user to add.')] });

    await message.channel.permissionOverwrites.edit(target, {
      ViewChannel: true,
      SendMessages: true,
    });

    message.reply({ embeds: [successEmbed(`${target.user.tag} has been added to this ticket.`)] });
  },
};
