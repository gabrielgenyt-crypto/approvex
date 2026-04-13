// =p [@user] — View your profile or another user's profile (staff only for others).

const { makeEmbed, errorEmbed } = require('../../utils/embed');
const { E, ROLES } = require('../../utils/constants');

module.exports = {
  name: 'p',
  aliases: ['profile'],
  description: 'View user profile.',
  async execute(message, args) {
    let target = null;

    // No argument — show own profile.
    if (!args.length && !message.mentions.users.size) {
      target = message.member;
    } else {
      // Checking someone else — must be staff.
      const isStaff = message.member.roles.cache.has(ROLES.staff)
        || message.member.permissions.has('Administrator');
      if (!isStaff) {
        return message.reply({ embeds: [errorEmbed('Only staff can view other profiles.')] });
      }

      if (message.mentions.members.size) {
        target = message.mentions.members.first();
      } else if (args[0]?.match(/^\d+$/)) {
        target = await message.guild.members.fetch(args[0]).catch(() => null);
      } else {
        target = message.guild.members.cache.find(m => m.user.username === args[0]);
      }
    }

    if (!target) return message.reply({ embeds: [errorEmbed('User not found.')] });

    const created = target.user.createdAt.toISOString().split('T')[0];
    const joined = target.joinedAt ? target.joinedAt.toISOString().split('T')[0] : 'Unknown';
    const accountAge = Math.floor((Date.now() - target.user.createdTimestamp) / 86400000);

    const embed = makeEmbed({
      title: `${E.star} User Profile`,
      thumbnail: target.displayAvatarURL({ dynamic: true, size: 256 }),
    });

    embed.setDescription([
      `${E.arrow} **Username:** \`${target.user.username}\``,
      `${E.arrow} **Display Name:** \`${target.displayName}\``,
      `${E.arrow} **Mention:** ${target}`,
      `${E.arrow} **User ID:** \`${target.id}\``,
      '',
      `${E.dot} **Account Created:** \`${created}\``,
      `${E.star} **Account Age:** \`${accountAge} days\``,
      `${E.dot} **Joined Server:** \`${joined}\``,
      `${E.tick} **Bot Account:** \`${target.user.bot}\``,
    ].join('\n'));

    message.reply({ embeds: [embed] });
  },
};
