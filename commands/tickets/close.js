// =ticket close — Close current ticket.

const { makeEmbed, errorEmbed } = require('../../utils/embed');
const { getDb } = require('../../utils/db');
const { E } = require('../../utils/constants');

module.exports = {
  name: 'ticket close',
  description: 'Close current ticket.',
  async execute(message) {
    const db = getDb();
    const ticket = db.prepare("SELECT * FROM tickets WHERE channel_id = ? AND status = 'open'")
      .get(message.channel.id);

    if (!ticket) return message.reply({ embeds: [errorEmbed('This is not an open ticket channel.')] });

    db.prepare("UPDATE tickets SET status = 'closed' WHERE channel_id = ?").run(message.channel.id);

    await message.channel.send({
      embeds: [makeEmbed({ description: `${E.lock} Ticket closed by ${message.author}. This channel will be deleted in 5 seconds.` })],
    });

    setTimeout(() => message.channel.delete().catch(() => {}), 5000);
  },
};
