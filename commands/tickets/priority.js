// =ticket priority [low/medium/high] — Set ticket priority.

const { successEmbed, errorEmbed } = require('../../utils/embed');
const { getDb } = require('../../utils/db');
const { E } = require('../../utils/constants');

const VALID = ['low', 'medium', 'high'];
const LABELS = { low: `${E.dot} Low`, medium: `${E.arrow} Medium`, high: `${E.cross} High` };

module.exports = {
  name: 'ticket priority',
  description: 'Set ticket priority.',
  async execute(message, args) {
    const db = getDb();
    const ticket = db.prepare("SELECT * FROM tickets WHERE channel_id = ? AND status = 'open'")
      .get(message.channel.id);
    if (!ticket) return message.reply({ embeds: [errorEmbed('This is not an open ticket channel.')] });

    const level = args[0]?.toLowerCase();
    if (!VALID.includes(level)) {
      return message.reply({ embeds: [errorEmbed('Usage: `=ticket priority low/medium/high`')] });
    }

    db.prepare('UPDATE tickets SET priority = ? WHERE channel_id = ?')
      .run(level, message.channel.id);

    message.reply({ embeds: [successEmbed(`Priority set to ${LABELS[level]}.`)] });
  },
};
