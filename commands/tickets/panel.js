const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');
const { makeEmbed } = require('../../utils/embed');
const { E } = require('../../utils/constants');
const { isStaff, isLimitedMod } = require('../../utils/helpers');

module.exports = {
  name: 'panel',
  description: 'Send the ticket panel.',
  async execute(message) {
    if (!isStaff(message.member)) return;
    if (isLimitedMod(message.member)) {
      return message.channel.send({ content: `${E.deny} You can not use this function.` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    await message.delete().catch(() => {});

    const embed = makeEmbed({
      title: `${E.success} Approve Support Center`,
      description: [
        `${E.approve} **Approve Support Center**`,
        '***Welcome to our official support system.***',
        '',
        `${E.notify} **How It Works**`,
        'Select the appropriate category from the dropdown menu below.',
        'Our team will respond as soon as possible.',
        `${E.deny} Please read <#1494001878709567619> before buying`,
        '',
        `${E.purchase} **Purchase**`,
        '-# \u2022 Purchase a product',
        '',
        '<:exchange:1400509739187703989> **Exchange**',
        '-# \u2022 Crypto to PayPal',
        '-# \u2022 PayPal to Crypto',
        '-# \u2022 Crypto to Crypto',
        '',
        `${E.support} **Support**`,
        '-# \u2022 General help or inquiries',
        '-# \u2022 Order support',
        '-# \u2022 Replacement',
        '',
        '<a:time:1409669638975131678> **Response Time**',
        'We typically respond within **5\u201330 minutes**.',
        '',
        `-# ${E.arrowe} Please avoid creating multiple tickets.`,
        `-# ${E.arrowe} Please be patient`,
        '',
        '**We currently accept:**',
        '> - <:paypall:1400828106201108581> PayPal',
        '> - <:ltc:1400824170614358157> Litecoin',
        '> - <:crypto:1400509717863727144> Crypto',
        '> - <:Revolut:1483947738000392353> Revolut',
        '> - <:IBAN:1483947938509226157> IBAN',
        '> - <:Apple_pay:1483947585747030196> Apple Pay',
        '> - <:googlepay:1484977879065559250> Google Pay',
      ].join('\n'),
      footer: 'Select a category below to get started.',
    });

    const menu = new StringSelectMenuBuilder()
      .setCustomId('ticket_select')
      .setPlaceholder('Select a ticket type')
      .addOptions([
        { label: 'Purchase', value: 'purchase', emoji: E.purchase },
        { label: 'Exchange', value: 'exchange', emoji: E.exchange },
        { label: 'Support',  value: 'support',  emoji: E.support },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);
    message.channel.send({ embeds: [embed], components: [row] });
  },
};
