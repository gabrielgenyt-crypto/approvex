// =ticket unclaim — Unclaim a ticket.

const { PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embed');
const { getDb } = require('../../utils/db');

module.exports = {
  name: 'ticket unclaim',
  description: 'Unclaim a ticket.',
  permissions: [PermissionFlagsBits.ManageChannels],
  async execute(message) {
    const db = getDb();
    const ticket = db.prepare("SELECT * FROM tickets WHERE channel_id = ? AND status = 'open'")
      .get(message.channel.id);
    if (!ticket) return message.reply({ embeds: [errorEmbed('This is not an open ticket channel.')] });

    if (!ticket.claimed_by) {
      return message.reply({ embeds: [errorEmbed('This ticket is not claimed.')] });
    }

    db.prepare('UPDATE tickets SET claimed_by = NULL WHERE channel_id = ?')
      .run(message.channel.id);

    message.reply({ embeds: [successEmbed('Ticket has been unclaimed.')] });
  },
};
