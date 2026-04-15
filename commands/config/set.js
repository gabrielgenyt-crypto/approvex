const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { makeEmbed } = require('../../utils/embed');
const { E } = require('../../utils/constants');
const { isSellerOrHigher } = require('../../utils/helpers');

module.exports = {
  name: 'set',
  description: 'Open your personal config panel.',
  async execute(message) {
    await message.delete().catch(() => {});

    if (!isSellerOrHigher(message.member)) return;

    const embed = makeEmbed({
      title: `${E.tool} Personal Config Panel`,
      description: [
        'Use the buttons to configure **your personal settings**.',
        '',
        `${E.purchase} PayPal`,
        `${E.exchange} LTC`,
        `${E.support} TOS`,
        '',
        'Each staff member has their **own settings**.',
      ].join('\n'),
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('set_pp').setLabel('PP').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('set_ltc').setLabel('LTC').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('set_tos').setLabel('TOS').setStyle(ButtonStyle.Secondary),
    );

    message.channel.send({ embeds: [embed], components: [row] });
  },
};
