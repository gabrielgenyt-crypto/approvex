// =whois @user — Show detailed user information.

const { makeEmbed, errorEmbed } = require('../../utils/embed');
const { E, ROLES } = require('../../utils/constants');

module.exports = {
  name: 'whois',
  description: 'Show detailed user information.',
  async execute(message, args) {
    // Staff-only.
    const isStaff = message.member.roles.cache.has(ROLES.staff)
      || message.member.permissions.has('Administrator');
    if (!isStaff) {
      return message.reply({ embeds: [errorEmbed('Only staff can use this command.')] });
    }

    let member = null;
    if (message.mentions.members.size) {
      member = message.mentions.members.first();
    } else if (args[0]?.match(/^\d+$/)) {
      member = await message.guild.members.fetch(args[0]).catch(() => null);
    } else if (args[0]) {
      member = message.guild.members.cache.find(m => m.user.username === args[0]);
    }

    if (!member) return message.reply({ embeds: [errorEmbed('User not found.')] });

    const created = member.user.createdAt;
    const joined = member.joinedAt;
    const now = new Date();
    const accountAge = Math.floor((now - created) / 86400000);
    const joinedDays = joined ? Math.floor((now - joined) / 86400000) : 'Unknown';

    const sorted = [...message.guild.members.cache.values()]
      .sort((a, b) => (a.joinedTimestamp || 0) - (b.joinedTimestamp || 0));
    const joinPos = sorted.indexOf(member) + 1;

    const topRole = member.roles.highest.id !== message.guild.id
      ? member.roles.highest : 'None';

    const embed = makeEmbed({
      title: `${E.star} User Information`,
      thumbnail: member.displayAvatarURL({ dynamic: true, size: 256 }),
    });

    embed.addFields(
      { name: `${E.dot} Username`, value: `\`${member.user.username}\``, inline: true },
      { name: `${E.dot} Display Name`, value: `\`${member.displayName}\``, inline: true },
      { name: `${E.dot} User ID`, value: `\`${member.id}\``, inline: true },
      { name: `${E.arrow} Account Created`, value: `<t:${Math.floor(created.getTime() / 1000)}:R> (${accountAge}d)`, inline: true },
      { name: `${E.arrow} Joined Server`, value: joined ? `<t:${Math.floor(joined.getTime() / 1000)}:R> (${joinedDays}d)` : 'Unknown', inline: true },
      { name: `${E.arrow} Join Position`, value: `#${joinPos}`, inline: true },
      { name: `${E.star} Top Role`, value: `${topRole}`, inline: true },
      { name: `${E.settings} Total Roles`, value: `${member.roles.cache.size - 1}`, inline: true },
      { name: `${E.tick} Bot`, value: member.user.bot ? 'Yes' : 'No', inline: true },
    );

    message.reply({ embeds: [embed] });
  },
};
