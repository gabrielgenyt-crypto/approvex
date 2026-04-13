// =ticket stats — Show ticket statistics.

const { makeEmbed } = require('../../utils/embed');
const { getDb } = require('../../utils/db');
const { E } = require('../../utils/constants');

module.exports = {
  name: 'ticket stats',
  description: 'Show ticket statistics.',
  async execute(message) {
    const db = getDb();
    const gid = message.guild.id;

    const total = db.prepare('SELECT COUNT(*) AS c FROM tickets WHERE guild_id = ?').get(gid).c;
    const open = db.prepare("SELECT COUNT(*) AS c FROM tickets WHERE guild_id = ? AND status = 'open'").get(gid).c;
    const closed = db.prepare("SELECT COUNT(*) AS c FROM tickets WHERE guild_id = ? AND status = 'closed'").get(gid).c;
    const claimed = db.prepare("SELECT COUNT(*) AS c FROM tickets WHERE guild_id = ? AND status = 'open' AND claimed_by IS NOT NULL").get(gid).c;

    message.reply({ embeds: [makeEmbed({
      title: `${E.ticket} Ticket Statistics`,
      description: [
        `${E.star} **Total Tickets:** ${total}`,
        `${E.add} **Open:** ${open}`,
        `${E.lock} **Closed:** ${closed}`,
        `${E.tick} **Claimed:** ${claimed}`,
      ].join('\n'),
    })] });
  },
};
