// =unafk — Remove AFK status.

const { successEmbed } = require('../../utils/embed');
const { getDb } = require('../../utils/db');

module.exports = {
  name: 'unafk',
  aliases: ['removeafk'],
  description: 'Remove AFK status.',
  async execute(message) {
    const db = getDb();
    const row = db.prepare('SELECT reason FROM afk WHERE guild_id = ? AND user_id = ?')
      .get(message.guild.id, message.author.id);

    if (!row) return;

    db.prepare('DELETE FROM afk WHERE guild_id = ? AND user_id = ?')
      .run(message.guild.id, message.author.id);

    message.reply({ embeds: [successEmbed(`Welcome back ${message.author}!`)] });
  },
};
