// =ticket claim — Claim a ticket as staff.

const { PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embed');
const { getDb } = require('../../utils/db');

module.exports = {
  name: 'ticket claim',
  description: 'Claim a ticket as staff.',
  permissions: [PermissionFlagsBits.ManageChannels],
  async execute(message) {
    const db = getDb();
    const ticket = db.prepare("SELECT * FROM tickets WHERE channel_id = ? AND status = 'open'")
      .get(message.channel.id);
    if (!ticket) return message.reply({ embeds: [errorEmbed('This is not an open ticket channel.')] });

    if (ticket.claimed_by) {
      return message.reply({ embeds: [errorEmbed(`Already claimed by <@${ticket.claimed_by}>.`)] });
    }

    db.prepare('UPDATE tickets SET claimed_by = ? WHERE channel_id = ?')
      .run(message.author.id, message.channel.id);

    message.reply({ embeds: [successEmbed(`Ticket claimed by ${message.author}.`)] });
  },
};
