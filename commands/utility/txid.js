// =txid [coin] [txid] — Post a blockchain transaction link.

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');
const { E, EMBED_COLOR, ROLES } = require('../../utils/constants');

module.exports = {
  name: 'txid',
  description: 'Post a blockchain transaction link.',
  async execute(message, args) {
    await message.delete().catch(() => {});

    // Role check.
    const allowed = [ROLES.staff, ROLES.seller].filter(Boolean);
    if (!allowed.some(id => message.member.roles.cache.has(id))) {
      return message.channel.send({ content: `${E.deny} You need a higher role!` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    const [coin, txid] = args;
    if (!coin || !txid) {
      return message.channel.send({ content: `${E.deny} Wrong usage.\nExample: \`=txid BTC 1237hsad712g3\`` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 6000));
    }

    const link = `https://blockchair.com/search?q=${txid}`;

    const embed = new EmbedBuilder()
      .setTitle(`${E.light} Transaction Sent`)
      .setColor(EMBED_COLOR)
      .addFields(
        { name: `${E.logs} Coin`, value: `\`${coin.toUpperCase()}\``, inline: true },
        { name: `${E.tool} TXID`, value: `\`${txid}\``, inline: false },
      )
      .setFooter({ text: 'Approve Support System' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('View Blockchain').setURL(link).setStyle(ButtonStyle.Link).setEmoji(E.logs),
    );

    message.channel.send({ embeds: [embed], components: [row] });
  },
};
