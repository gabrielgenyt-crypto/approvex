// =ticketpanel — Deploy the ticket panel with Purchase / Exchange / Support dropdown.

const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const { makeEmbed } = require('../../utils/embed');
const { E, BANNER } = require('../../utils/constants');

module.exports = {
  name: 'ticketpanel',
  description: 'Deploy the ticket panel with category dropdown.',
  permissions: [PermissionFlagsBits.ManageChannels],
  async execute(message) {
    await message.delete().catch(() => {});

    const embed = makeEmbed({
      title: `${E.ticket} ApproveX Support Center`,
      description: [
        `${E.star} **Welcome to our official support system.**`,
        '',
        `${E.settings} **How It Works**`,
        'Select the appropriate category from the dropdown menu below.',
        'Our team will respond as soon as possible.',
        '',
        `${E.money} **Purchase**`,
        `-# ${E.dot} Purchase a product`,
        '',
        `${E.share} **Exchange**`,
        `-# ${E.dot} Crypto to PayPal`,
        `-# ${E.dot} PayPal to Crypto`,
        `-# ${E.dot} Crypto to Crypto`,
        '',
        `${E.rocket} **Support**`,
        `-# ${E.dot} General help or inquiries`,
        `-# ${E.dot} Order support`,
        `-# ${E.dot} Replacement`,
        '',
        `${E.arrow} We typically respond within **5-30 minutes**.`,
        '',
        `-# ${E.cross} Please avoid creating multiple tickets.`,
        `-# ${E.dot} Please be patient.`,
      ].join('\n'),
      image: BANNER,
    });

    const menu = new StringSelectMenuBuilder()
      .setCustomId('ticket_category_select')
      .setPlaceholder('Select a ticket type...')
      .addOptions([
        { label: 'Purchase', value: 'purchase', emoji: '🛒', description: 'Purchase a product' },
        { label: 'Exchange', value: 'exchange', emoji: '🔄', description: 'Crypto / PayPal exchange' },
        { label: 'Support',  value: 'support',  emoji: '⚡', description: 'General help or inquiries' },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    message.channel.send({ embeds: [embed], components: [row] });
  },
};
