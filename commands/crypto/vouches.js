// =vouches @user — Show vouches for a user.

const { makeEmbed } = require('../../utils/embed');
const { getDb } = require('../../utils/db');
const { E } = require('../../utils/constants');

module.exports = {
  name: 'vouches',
  aliases: ['rep'],
  description: 'Show vouches for a user.',
  async execute(message) {
    const target = message.mentions.users.first() || message.author;

    const db = getDb();
    const rows = db.prepare('SELECT * FROM vouches WHERE guild_id = ? AND target_id = ? ORDER BY created DESC LIMIT 10')
      .all(message.guild.id, target.id);

    if (rows.length === 0) {
      return message.reply({ embeds: [makeEmbed({ description: `${E.dot} **${target.tag}** has no vouches yet.` })] });
    }

    const lines = rows.map((r, i) =>
      `**${i + 1}.** ${r.message} — <@${r.user_id}>`
    );

    message.reply({ embeds: [makeEmbed({
      title: `${E.star} Vouches for ${target.tag}`,
      description: lines.join('\n'),
    })] });
  },
};
