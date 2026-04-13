// =warnings @user — Show warnings for a user.

const { PermissionFlagsBits } = require('discord.js');
const { makeEmbed, errorEmbed } = require('../../utils/embed');
const { getDb } = require('../../utils/db');
const { E } = require('../../utils/constants');

module.exports = {
  name: 'warnings',
  description: 'Show warnings for a user.',
  permissions: [PermissionFlagsBits.ModerateMembers],
  async execute(message) {
    const target = message.mentions.users.first();
    if (!target) return message.reply({ embeds: [errorEmbed('Mention a user to check warnings.')] });

    const db = getDb();
    const rows = db.prepare('SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY created DESC LIMIT 10')
      .all(message.guild.id, target.id);

    if (rows.length === 0) {
      return message.reply({ embeds: [makeEmbed({ description: `${E.tick} **${target.tag}** has no warnings.` })] });
    }

    const lines = rows.map((r, i) =>
      `**${i + 1}.** ${r.reason} — <@${r.mod_id}> (<t:${Math.floor(new Date(r.created).getTime() / 1000)}:R>)`
    );

    message.reply({ embeds: [makeEmbed({
      title: `${E.cross} Warnings for ${target.tag}`,
      description: lines.join('\n'),
    })] });
  },
};
