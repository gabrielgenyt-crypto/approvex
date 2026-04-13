// =warn @user [reason] — Warn a user (stored in DB).

const { PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embed');
const { getDb } = require('../../utils/db');

module.exports = {
  name: 'warn',
  description: 'Warn a user.',
  permissions: [PermissionFlagsBits.ModerateMembers],
  async execute(message, args) {
    const target = message.mentions.users.first();
    if (!target) return message.reply({ embeds: [errorEmbed('Mention a user to warn.')] });

    const reason = args.slice(1).join(' ') || 'No reason provided';
    const db = getDb();
    db.prepare('INSERT INTO warnings (guild_id, user_id, mod_id, reason) VALUES (?, ?, ?, ?)')
      .run(message.guild.id, target.id, message.author.id, reason);

    const count = db.prepare('SELECT COUNT(*) AS c FROM warnings WHERE guild_id = ? AND user_id = ?')
      .get(message.guild.id, target.id).c;

    message.reply({
      embeds: [successEmbed(`**${target.tag}** has been warned.\n**Reason:** ${reason}\n**Total warnings:** ${count}`)],
    });
  },
};
