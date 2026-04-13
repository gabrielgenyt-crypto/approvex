// =pp — Display your saved PayPal info + TOS.

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { makeEmbed } = require('../../utils/embed');
const { getDb } = require('../../utils/db');
const { E, ROLES } = require('../../utils/constants');

module.exports = {
  name: 'pp',
  description: 'Show your PayPal info and TOS.',
  async execute(message) {
    await message.delete().catch(() => {});

    const allowed = [ROLES.staff, ROLES.seller, ROLES.owner].filter(Boolean);
    if (!allowed.some(id => message.member.roles.cache.has(id))) {
      return message.channel.send({
        embeds: [makeEmbed({ description: `${E.cross} You need a seller or staff role.` })],
      }).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    const db = getDb();
    const ppRow = db.prepare("SELECT value FROM seller_config WHERE user_id = ? AND key = 'pp'")
      .get(message.author.id);
    const tosRow = db.prepare("SELECT value FROM seller_config WHERE user_id = ? AND key = 'tos'")
      .get(message.author.id);

    if (!ppRow) {
      return message.channel.send({
        embeds: [makeEmbed({ description: `${E.cross} You have not set a PayPal email. Use \`=set\` to configure.` })],
      });
    }

    const tos = tosRow ? tosRow.value : '**No TOS set yet.**';

    const embed = makeEmbed({
      title: `${E.money} PayPal Information`,
    });
    embed.addFields(
      { name: 'Terms of Service', value: tos, inline: false },
      { name: 'PayPal Email', value: ppRow.value, inline: false },
    );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`copy_value:${ppRow.value}`)
        .setLabel('Copy')
        .setStyle(ButtonStyle.Primary),
    );

    message.channel.send({ embeds: [embed], components: [row] });
  },
};
