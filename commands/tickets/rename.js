// =ticket rename [name] — Rename ticket channel.

const { successEmbed, errorEmbed } = require('../../utils/embed');
const { getDb } = require('../../utils/db');

module.exports = {
  name: 'ticket rename',
  description: 'Rename the current ticket channel.',
  async execute(message, args) {
    const db = getDb();
    const ticket = db.prepare("SELECT * FROM tickets WHERE channel_id = ? AND status = 'open'")
      .get(message.channel.id);
    if (!ticket) return message.reply({ embeds: [errorEmbed('This is not an open ticket channel.')] });

    const name = args.join('-');
    if (!name) return message.reply({ embeds: [errorEmbed('Provide a new name.')] });

    await message.channel.setName(`ticket-${name}`);
    message.reply({ embeds: [successEmbed(`Ticket renamed to **ticket-${name}**.`)] });
  },
};
