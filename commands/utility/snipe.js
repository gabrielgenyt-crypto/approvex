// =snipe — Show last deleted message in this channel.

const { makeEmbed, errorEmbed } = require('../../utils/embed');
const { getDb } = require('../../utils/db');
const { E } = require('../../utils/constants');

module.exports = {
  name: 'snipe',
  description: 'Show last deleted message.',
  async execute(message) {
    const db = getDb();
    const row = db.prepare('SELECT * FROM snipes WHERE guild_id = ? AND channel_id = ?')
      .get(message.guild.id, message.channel.id);

    if (!row) return message.reply({ embeds: [errorEmbed('Nothing to snipe.')] });

    message.reply({ embeds: [makeEmbed({
      title: `${E.arrow} Sniped Message`,
      description: `${E.dot} ${row.content}`,
      footer: `${row.author_tag} — ${row.created}`,
    })] });
  },
};
