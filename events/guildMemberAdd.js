// Auto-welcome message when a user joins.

const { makeEmbed } = require('../utils/embed');
const { E, CHANNELS, BANNER } = require('../utils/constants');

module.exports = {
  name: 'guildMemberAdd',
  once: false,
  async execute(member) {
    if (!CHANNELS.welcome) return;

    const channel = await member.guild.channels.fetch(CHANNELS.welcome).catch(() => null);
    if (!channel) return;

    const memberCount = member.guild.memberCount;

    const embed = makeEmbed({
      title: `${E.tick} Welcome to ${member.guild.name}`,
      description: [
        `${E.star} Hey ${member}, welcome!`,
        '',
        `${E.dot} You are member **#${memberCount}**`,
        `${E.arrow} Check out our channels and get started.`,
        `${E.ticket} Need help? Open a ticket anytime.`,
        '',
        `${E.rocket} We're glad to have you here!`,
      ].join('\n'),
      thumbnail: member.displayAvatarURL({ dynamic: true, size: 256 }),
      image: BANNER,
    });

    channel.send({
      content: `${member}`,
      embeds: [embed],
      allowedMentions: { users: [member.id] },
    }).catch(() => {});
  },
};
