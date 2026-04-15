const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { getDb } = require('../../utils/db');
const { E, EMBED_COLOR } = require('../../utils/constants');
const { isSellerOrHigher } = require('../../utils/helpers');

module.exports = {
  name: 'pp',
  description: 'Show your PayPal info and TOS.',
  async execute(message) {
    await message.delete().catch(() => {});
    if (!isSellerOrHigher(message.member)) return;

    const db = getDb();
    const ppRow = db.prepare("SELECT value FROM seller_config WHERE user_id = ? AND key = 'pp'").get(message.author.id);
    const tosRow = db.prepare("SELECT value FROM seller_config WHERE user_id = ? AND key = 'tos'").get(message.author.id);

    if (!ppRow) {
      return message.channel.send({ content: `${E.deny} You have not set PayPal.` });
    }

    const tos = tosRow ? tosRow.value : '**NO TOS YET!**';

    const { EmbedBuilder } = require('discord.js');
    const embed = new EmbedBuilder()
      .setTitle(`${E.paypal} PayPal Information`)
      .setColor(EMBED_COLOR)
      .addFields(
        { name: 'Terms of Service', value: tos, inline: false },
        { name: 'PayPal Email', value: ppRow.value, inline: false },
      )
      .setFooter({ text: 'Approve Support System' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('copy_value').setLabel('Copy').setStyle(ButtonStyle.Primary),
    );

    message.channel.send({ embeds: [embed], components: [row] });
  },
};
