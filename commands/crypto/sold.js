// =sold @buyer [amount] [payment] [description] [trans-id] — Log a sale.

const { makeEmbed, errorEmbed } = require('../../utils/embed');
const { getDb } = require('../../utils/db');
const { E } = require('../../utils/constants');

module.exports = {
  name: 'sold',
  description: 'Log a sale with transaction details.',
  async execute(message, args) {
    const buyer = message.mentions.users.first();
    if (!buyer) return message.reply({ embeds: [errorEmbed('Usage: `=sold @buyer <amount> <payment> <description> [trans-id]`')] });

    const amount = parseFloat(args[1]);
    if (isNaN(amount)) return message.reply({ embeds: [errorEmbed('Provide a valid amount.')] });

    const payment = args[2] || 'Unknown';
    const description = args[3] || 'No description';
    const transId = args[4] || null;

    const db = getDb();
    db.prepare('INSERT INTO sales (guild_id, seller_id, buyer_id, amount, payment, description, trans_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(message.guild.id, message.author.id, buyer.id, amount, payment, description, transId);

    const saleCount = db.prepare('SELECT COUNT(*) AS c FROM sales WHERE guild_id = ? AND seller_id = ?')
      .get(message.guild.id, message.author.id).c;

    const embed = makeEmbed({
      title: `${E.tick} Sale Logged`,
      description: [
        `${E.star} **Seller:** ${message.author}`,
        `${E.add} **Buyer:** ${buyer}`,
        `${E.money} **Amount:** $${amount.toFixed(2)}`,
        `${E.share} **Payment:** ${payment}`,
        `${E.dot} **Description:** ${description}`,
        transId ? `${E.arrow} **Transaction ID:** \`${transId}\`` : '',
        `${E.rocket} **Seller's Total Sales:** ${saleCount}`,
      ].filter(Boolean).join('\n'),
    });

    message.reply({ embeds: [embed] });
  },
};
