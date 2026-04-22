const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');
const { makeEmbed } = require('../../utils/embed');
const { E } = require('../../utils/constants');
const { isStaffOrMod } = require('../../utils/helpers');

module.exports = {
  name: 'exchangepanel',
  description: 'Send the exchange panel.',
  async execute(message) {
    if (!isStaffOrMod(message.member)) return;

    await message.delete().catch(() => {});

    const embed = makeEmbed({
      title: `${E.exchange} Approve Exchanges`,
      description: [
        `${E.approve} **Approve Exchanges**`,
        '***Transform your money cheaply, quickly, and with ease.***',
        '',
        `${E.info} **How It Works**`,
        'Our exchange service allows you to convert between different payment',
        'methods and cryptocurrencies in just a few simple steps. Select what',
        'you are sending, choose what you want to receive, enter your amount,',
        'and one of our verified exchangers will handle the rest for you.',
        '',
        `${E.paypal} **Minimum Amount**`,
        'Our minimum exchange amount is **2.00\u20AC** and applies to every',
        'single deal without exception. This threshold is non-negotiable',
        'and must be met before any transaction can be processed.',
        '',
        `${E.success} **Friendly Reminder**`,
        `${E.arrowe} Do not deal with Moderators directly \u2014 only interact with`,
        'the person who has officially claimed your deal.',
        `${E.arrowe} Never unclaim your Exchanger or Middleman once you have`,
        'already sent the money, as this may result in loss of funds.',
        `${E.arrowe} If you are unsure about any step of the process, please`,
        'reach out to an Administrator before proceeding.',
        `${E.arrowe} Do not trust any speculations from Moderators about being`,
        'able to exchange \u2014 only verified exchangers can process deals.',
        `${E.arrowe} Read every message from the bot very carefully to avoid`,
        'mistakes and ensure a smooth transaction.',
        '',
        `${E.tool} **Accepted Methods**`,
        `> ${E.paypal} PayPal`,
        `> ${E.crypto} Crypto (Solana, Litecoin, Bitcoin)`,
        `> ${E.revolut} Revolut`,
        '',
        `${E.light} **Fee Overview**`,
        `${E.arrowe} PayPal to Crypto \u2014 **7%**`,
        `${E.arrowe} Revolut \u2014 **10%**`,
        `${E.arrowe} Crypto to Crypto \u2014 **0%**`,
        '',
        '-# Select what you are sending from the dropdown below to get started.',
      ].join('\n'),
      footer: 'Approve Exchange System',
    });

    const menu = new StringSelectMenuBuilder()
      .setCustomId('exchange_send_select')
      .setPlaceholder('What are you sending?')
      .addOptions([
        { label: 'PayPal Balance', value: 'paypal_balance', emoji: E.paypal },
        { label: 'PayPal Card',    value: 'paypal_card',    emoji: E.paypal },
        { label: 'Crypto',         value: 'crypto',         emoji: E.crypto },
        { label: 'Revolut',        value: 'revolut',        emoji: E.revolut },
        { label: 'Other',          value: 'other',          emoji: E.tool },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);
    message.channel.send({
      content: '@everyone',
      embeds: [embed],
      components: [row],
      allowedMentions: { parse: ['everyone'] },
    });
  },
};
