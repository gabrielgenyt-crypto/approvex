const { getDb } = require('../../utils/db');
const { E, ROLES } = require('../../utils/constants');
const { isManagerOrHigher } = require('../../utils/helpers');

module.exports = {
  name: 'securefee',
  description: 'Set the maximum exchange amount an exchanger can handle.',
  async execute(message, args) {
    const hasCeo = ROLES.ceo && message.member.roles.cache.has(ROLES.ceo);
    if (!isManagerOrHigher(message.member) && !hasCeo) return;

    // Parse target user (mention or ID)
    let target = message.mentions.members.first();
    if (!target && args[0]) {
      const id = args[0].replace(/[<@!>]/g, '');
      if (/^\d{17,20}$/.test(id)) {
        try {
          target = await message.guild.members.fetch(id);
        } catch {
          return message.channel.send({ content: `${E.deny} Couldn't find that user.` });
        }
      }
    }

    const amountRaw = args[1];
    if (!target || !amountRaw) {
      return message.channel.send({
        content: `${E.deny} Usage: \`=securefee @user <amount>\`\nExample: \`=securefee @user 10\``,
      });
    }

    const amount = parseFloat(amountRaw.replace(/[^0-9.]/g, ''));
    if (isNaN(amount) || amount < 0) {
      return message.channel.send({ content: `${E.deny} Please provide a valid amount.` });
    }

    const db = getDb();

    if (amount === 0) {
      db.prepare('DELETE FROM exchanger_limits WHERE user_id = ?').run(target.id);
      return message.channel.send({
        content: `${E.success} Removed the security fee limit for ${target}. They can no longer claim tickets (no budget set).`,
      });
    }

    db.prepare(
      'INSERT OR REPLACE INTO exchanger_limits (user_id, max_amount) VALUES (?, ?)',
    ).run(target.id, amount);

    // Show current active claims for context
    const activeSum = db.prepare(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM exchange_claims WHERE exchanger_id = ? AND status = 'active'",
    ).get(target.id);
    const used = activeSum.total;
    const remaining = Math.max(0, amount - used);

    message.channel.send({
      content: [
        `${E.success} Security fee limit set for ${target}:`,
        `${E.arrowe} **Max budget:** ${amount.toFixed(2)}\u20AC`,
        `${E.arrowe} **Currently used:** ${used.toFixed(2)}\u20AC`,
        `${E.arrowe} **Available:** ${remaining.toFixed(2)}\u20AC`,
      ].join('\n'),
    });
  },
};
