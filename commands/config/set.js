// =set — Open the personal config panel (PP / LTC / TOS buttons).

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { makeEmbed } = require('../../utils/embed');
const { E, ROLES } = require('../../utils/constants');

module.exports = {
  name: 'set',
  description: 'Open your personal config panel.',
  async execute(message) {
    await message.delete().catch(() => {});

    // Require staff, seller, or owner role.
    const allowed = [ROLES.staff, ROLES.seller, ROLES.owner].filter(Boolean);
    if (!allowed.some(id => message.member.roles.cache.has(id))) {
      return message.channel.send({
        embeds: [makeEmbed({ description: `${E.cross} You need a seller or staff role to use this.` })],
      }).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    const embed = makeEmbed({
      title: `${E.settings} Personal Config Panel`,
      description: [
        'Use the buttons below to configure **your personal settings**.',
        '',
        `${E.money} **PayPal** — set or remove your PayPal email`,
        `${E.star} **LTC** — set or remove your Litecoin address`,
        `${E.ticket} **TOS** — set or remove your Terms of Service`,
        '',
        `${E.dot} Each staff/seller has their **own settings**.`,
      ].join('\n'),
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('config_pp')
        .setLabel('PayPal')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('💳'),
      new ButtonBuilder()
        .setCustomId('config_ltc')
        .setLabel('LTC')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🪙'),
      new ButtonBuilder()
        .setCustomId('config_tos')
        .setLabel('TOS')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📜'),
    );

    message.channel.send({ embeds: [embed], components: [row] });
  },
};
