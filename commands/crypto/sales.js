// =sales [@user] — Show sales stats for a user.

const { makeEmbed } = require('../../utils/embed');
const { getDb } = require('../../utils/db');
const { E } = require('../../utils/constants');

module.exports = {
  name: 'sales',
  description: 'Show sales stats for a user.',
  async execute(message) {
    const target = message.mentions.users.first() || message.author;

    const db = getDb();
    const count = db.prepare('SELECT COUNT(*) AS c FROM sales WHERE guild_id = ? AND seller_id = ?')
      .get(message.guild.id, target.id).c;
    const totalRow = db.prepare('SELECT COALESCE(SUM(amount), 0) AS total FROM sales WHERE guild_id = ? AND seller_id = ?')
      .get(message.guild.id, target.id);

    message.reply({ embeds: [makeEmbed({
      title: `${E.money} Sales Stats — ${target.tag}`,
      description: [
        `${E.star} **Total Sales:** ${count}`,
        `${E.money} **Total Revenue:** $${totalRow.total.toFixed(2)}`,
      ].join('\n'),
    })] });
  },
};
