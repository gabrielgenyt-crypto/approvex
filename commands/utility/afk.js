// =afk [reason] — Set AFK status.

const { successEmbed } = require('../../utils/embed');
const { getDb } = require('../../utils/db');

module.exports = {
  name: 'afk',
  description: 'Set AFK status.',
  async execute(message, args) {
    const reason = args.join(' ') || 'AFK';
    const db = getDb();
    db.prepare('INSERT OR REPLACE INTO afk (guild_id, user_id, reason) VALUES (?, ?, ?)')
      .run(message.guild.id, message.author.id, reason);

    message.reply({ embeds: [successEmbed(`You are now AFK: **${reason}**`)] });
  },
};
