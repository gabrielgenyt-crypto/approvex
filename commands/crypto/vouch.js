// =vouch @user [message] — Vouch for a user.

const { makeEmbed, errorEmbed } = require('../../utils/embed');
const { getDb } = require('../../utils/db');
const { E } = require('../../utils/constants');

module.exports = {
  name: 'vouch',
  description: 'Vouch for a user.',
  async execute(message, args) {
    const target = message.mentions.users.first();
    if (!target) return message.reply({ embeds: [errorEmbed('Usage: `=vouch @user [message]`')] });

    if (target.id === message.author.id) {
      return message.reply({ embeds: [errorEmbed('You cannot vouch for yourself.')] });
    }

    const vouchMsg = args.slice(1).join(' ') || 'Great service!';

    const db = getDb();
    db.prepare('INSERT INTO vouches (guild_id, user_id, target_id, message) VALUES (?, ?, ?, ?)')
      .run(message.guild.id, message.author.id, target.id, vouchMsg);

    const count = db.prepare('SELECT COUNT(*) AS c FROM vouches WHERE guild_id = ? AND target_id = ?')
      .get(message.guild.id, target.id).c;

    message.reply({ embeds: [makeEmbed({
      title: `${E.tick} +rep ${target.tag}`,
      description: [
        `${E.star} **From:** ${message.author}`,
        `${E.dot} **Message:** ${vouchMsg}`,
        `${E.arrow} **Total Vouches:** ${count}`,
      ].join('\n'),
    })] });
  },
};
