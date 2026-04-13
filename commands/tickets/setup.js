// =ticketpanel — Deploy the ticket panel with an Open Ticket button.

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { makeEmbed } = require('../../utils/embed');
const { E } = require('../../utils/constants');

module.exports = {
  name: 'ticketpanel',
  description: 'Deploy the ticket panel with an Open Ticket button.',
  permissions: [PermissionFlagsBits.ManageChannels],
  async execute(message) {
    await message.delete().catch(() => {});

    const embed = makeEmbed({
      title: `${E.ticket} ApproveX Support`,
      description: [
        `${E.dot} Need help or want to place an order?`,
        `${E.arrow} Click the button below to open a ticket.`,
        '',
        `${E.star} A staff member will assist you shortly.`,
        `${E.lock} Your ticket is private and only visible to you and staff.`,
      ].join('\n'),
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('create_ticket')
        .setLabel('Open Ticket')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🎫'),
    );

    message.channel.send({ embeds: [embed], components: [row] });
  },
};
