// =txid [coin] [txid] — Post a blockchain transaction link.

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { makeEmbed, errorEmbed } = require('../../utils/embed');
const { E, ROLES } = require('../../utils/constants');

module.exports = {
  name: 'txid',
  description: 'Post a blockchain transaction link.',
  async execute(message, args) {
    await message.delete().catch(() => {});

    // Require staff or seller role.
    const allowed = [ROLES.staff, ROLES.seller, ROLES.owner].filter(Boolean);
    if (!allowed.some(id => message.member.roles.cache.has(id))) {
      return message.channel.send({
        embeds: [errorEmbed('You need a staff or seller role.')],
      }).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    const [coin, txid] = args;
    if (!coin || !txid) {
      return message.channel.send({
        embeds: [errorEmbed('Usage: `=txid BTC abc123...`')],
      }).then(m => setTimeout(() => m.delete().catch(() => {}), 6000));
    }

    const link = `https://blockchair.com/search?q=${txid}`;

    const embed = makeEmbed({ title: `${E.star} Transaction Sent` });
    embed.addFields(
      { name: `${E.money} Coin`, value: `\`${coin.toUpperCase()}\``, inline: true },
      { name: `${E.settings} TXID`, value: `\`${txid}\``, inline: false },
    );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('View Blockchain')
        .setURL(link)
        .setStyle(ButtonStyle.Link)
        .setEmoji('🔗'),
    );

    message.channel.send({ embeds: [embed], components: [row] });
  },
};
