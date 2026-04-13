// =serverinfo — Show server stats.

const { makeEmbed } = require('../../utils/embed');
const { E } = require('../../utils/constants');

module.exports = {
  name: 'serverinfo',
  aliases: ['sinfo'],
  description: 'Show server stats.',
  async execute(message) {
    const { guild } = message;
    await guild.members.fetch();

    const embed = makeEmbed({
      title: `${E.star} ${guild.name}`,
      thumbnail: guild.iconURL({ dynamic: true, size: 256 }),
    });

    embed.addFields(
      { name: `${E.general} Members`, value: `${guild.memberCount}`, inline: true },
      { name: `${E.dot} Roles`, value: `${guild.roles.cache.size}`, inline: true },
      { name: `${E.share} Channels`, value: `${guild.channels.cache.size}`, inline: true },
      { name: `${E.star} Boosts`, value: `${guild.premiumSubscriptionCount || 0}`, inline: true },
      { name: `${E.settings} Boost Tier`, value: `${guild.premiumTier || 'None'}`, inline: true },
      { name: `${E.arrow} Created`, value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
    );

    message.reply({ embeds: [embed] });
  },
};
