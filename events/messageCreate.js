// Prefix command router + AFK handler.

const { getDb } = require('../utils/db');
const { errorEmbed } = require('../utils/embed');
const { PREFIX } = require('../utils/constants');

module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    const db = getDb();

    // -- AFK check: remove AFK if the user speaks --
    const afkRow = db.prepare('SELECT reason FROM afk WHERE guild_id = ? AND user_id = ?')
      .get(message.guild.id, message.author.id);
    if (afkRow) {
      db.prepare('DELETE FROM afk WHERE guild_id = ? AND user_id = ?')
        .run(message.guild.id, message.author.id);
      message.reply({
        content: 'Welcome back! Your AFK status has been removed.',
        allowedMentions: { repliedUser: false },
      }).catch(() => {});
    }

    // -- AFK check: notify if someone mentions an AFK user --
    for (const mentioned of message.mentions.users.values()) {
      const row = db.prepare('SELECT reason FROM afk WHERE guild_id = ? AND user_id = ?')
        .get(message.guild.id, mentioned.id);
      if (row) {
        message.reply({
          content: `**${mentioned.displayName}** is AFK: ${row.reason}`,
          allowedMentions: { repliedUser: false },
        }).catch(() => {});
      }
    }

    // -- Command parsing --
    if (!message.content.startsWith(PREFIX)) return;

    const fullArgs = message.content.slice(PREFIX.length).trim().split(/\s+/);
    if (fullArgs.length === 0) return;

    // Try two-word command first (e.g. "ticket setup"), then single word.
    let commandName = fullArgs[0].toLowerCase();
    let args = fullArgs.slice(1);

    const twoWord = `${fullArgs[0]} ${(fullArgs[1] || '')}`.toLowerCase();
    if (client.commands.has(twoWord)) {
      commandName = twoWord;
      args = fullArgs.slice(2);
    }

    const command = client.commands.get(commandName);
    if (!command) return;

    // Permission check.
    if (command.permissions && !message.member.permissions.has(command.permissions)) {
      return message.reply({ embeds: [errorEmbed('You lack the required permissions.')] });
    }

    try {
      command.execute(message, args, client);
    } catch (err) {
      console.error(`[CMD] Error in ${commandName}:`, err);
      message.reply({ embeds: [errorEmbed('An error occurred while running that command.')] }).catch(() => {});
    }
  },
};
