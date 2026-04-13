// Snipe tracking — store last deleted message per channel.

const { getDb } = require('../utils/db');

module.exports = {
  name: 'messageDelete',
  once: false,
  async execute(message) {
    if (!message.guild || message.author?.bot) return;

    const db = getDb();
    db.prepare(
      "INSERT OR REPLACE INTO snipes (guild_id, channel_id, author_tag, content, created) VALUES (?, ?, ?, ?, datetime('now'))"
    ).run(message.guild.id, message.channel.id, message.author.tag, message.content || '(no text)');
  },
};
