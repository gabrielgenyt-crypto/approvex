const {
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  AttachmentBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');
const { makeEmbed, errorEmbed } = require('../utils/embed');
const { getDb } = require('../utils/db');
const { buildTranscriptHtml } = require('../utils/transcript');
const { E, ROLES, CHANNELS, TICKET_CATS, EXCHANGE_FEES } = require('../utils/constants');
const { isManagerOrHigher, isStaffOrMod, isExchanger } = require('../utils/helpers');
const fs = require('fs');
const path = require('path');

// In-memory state for multi-step exchange flows (keyed by user id).
// Each entry: { sending, country, currency, receiving, crypto }
const exchangeFlows = new Map();

// Human-readable labels for exchange methods
const SEND_LABELS = {
  paypal_balance: 'PayPal Balance',
  paypal_card: 'PayPal Card',
  crypto: 'Crypto',
  revolut: 'Revolut',
  other: 'Other',
};

// Determine the fee percentage for a given exchange route
function getExchangeFee(sending, receiving) {
  const isPaypal = sending === 'paypal_balance' || sending === 'paypal_card';
  if (isPaypal && receiving === 'crypto') return EXCHANGE_FEES.paypal_to_crypto;
  if (sending === 'revolut' || receiving === 'revolut') return EXCHANGE_FEES.revolut;
  if (sending === 'crypto' && receiving === 'crypto') return EXCHANGE_FEES.crypto_to_crypto;
  if (isPaypal && receiving === 'revolut') return EXCHANGE_FEES.revolut;
  return EXCHANGE_FEES.default;
}

function ticketOverwrites(guild, userId, botId, ticketType) {
  const perms = [
    { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
    { id: userId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
  ];
  if (botId) {
    perms.push({ id: botId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.MentionEveryone] });
  }
  if (ROLES.staff) {
    perms.push({ id: ROLES.staff, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
  }
  if (ROLES.manager) {
    perms.push({ id: ROLES.manager, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
  }
  if (ROLES.mod) {
    perms.push({ id: ROLES.mod, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
  }
  // Exchangers can view exchange tickets (but cannot send messages until they claim)
  if (ticketType === 'exchange' && ROLES.exchanger) {
    perms.push({ id: ROLES.exchanger, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] });
  }
  return perms;
}

async function createTicketChannel(interaction, ticketType, fields) {
  const guild = interaction.guild;
  const user = interaction.user;

  const categoryId = TICKET_CATS[ticketType];
  const parent = categoryId ? guild.channels.cache.get(categoryId) : null;

  const channel = await guild.channels.create({
    name: `${ticketType}-${user.username}`,
    type: ChannelType.GuildText,
    parent: parent ? parent.id : undefined,
    permissionOverwrites: ticketOverwrites(guild, user.id, interaction.client.user?.id, ticketType),
  });

  const ticketId = Math.floor(1000 + Math.random() * 9000);
  await channel.edit({ topic: `${user.id}|${ticketId}|${categoryId || ''}` });

  const controlRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('close_ticket').setLabel('Close').setStyle(ButtonStyle.Danger),
  );

  const embed = makeEmbed({
    title: 'Ticket Opened',
    description: `${user} opened a **${ticketType}** ticket.`,
  });

  for (const f of fields) {
    embed.addFields({ name: f.name, value: `\`${f.value}\``, inline: false });
  }
  embed.addFields(
    { name: `${E.tool} Ticket ID`, value: `\`${ticketId}\``, inline: true },
    { name: 'Creator', value: `${user}`, inline: true },
  );

  await channel.send({
    content: `@everyone ${user}`,
    embeds: [embed],
    components: [controlRow],
    allowedMentions: { parse: ['everyone'], users: [user.id] },
  });

  if (ticketType === 'exchange') {
    const tosEmbed = makeEmbed({
      title: 'Approve \u2014 Platform Terms & Conditions',
      description: [
        '<:info:1478488967299989534> **Approve \u2014 Exchange Terms of Service**',
        '',
        '\u2022 If any of our exchanger scams, we are not reliable for this. So please deal at your own risk with certain exchangers',
        '\u2022 Fees are fixed, unless we say so',
        '\u2022 Any user initiating disputes or chargebacks maliciously will be Banned.',
        '\u2022 Approve is not responsible for third-party fees.',
        '',
        '<:paypall:1400828106201108581> **PayPal \u2014 Payment Standards**',
        '',
        '\u2022 Payments must be Friends & Family',
        '\u2022 No notes or descriptions',
        '\u2022 EUR (\u20AC) only',
        '\u2022 PayPal balance only',
        '\u2022 Third-party payments are prohibited',
        '',
        `${E.deny} **If you do not follow these rules you will:**`,
        `${E.arrowe} Not get a refund`,
        `${E.arrowe} May be charged extra fees`,
      ].join('\n'),
    });

    const tosRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('exchange_terms_accept').setLabel('Accept').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('exchange_terms_decline').setLabel('Decline').setStyle(ButtonStyle.Danger),
    );

    await channel.send({ embeds: [tosEmbed], components: [tosRow] });

    // "Waiting for Exchanger" claim message
    const claimEmbed = makeEmbed({
      title: `${E.exchange} Waiting for Exchanger`,
      description: [
        `${E.info} This exchange ticket is **waiting for an exchanger** to claim it.`,
        '',
        `${E.arrowe} Only verified exchangers can claim this ticket.`,
        `${E.arrowe} Once claimed, the exchanger will handle your exchange.`,
        `${E.arrowe} Do **not** deal with anyone who has not officially claimed this ticket.`,
      ].join('\n'),
    });

    const claimRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('claim_exchange').setLabel('Claim Ticket').setStyle(ButtonStyle.Success),
    );

    await channel.send({ embeds: [claimEmbed], components: [claimRow] });
  }

  // log to the ticket log channel
  if (CHANNELS.log) {
    const logChannel = guild.channels.cache.get(CHANNELS.log);
    if (logChannel) {
      const logEmbed = makeEmbed({
        title: 'Ticket Opened',
        description: `${E.logs} **${ticketType}** ticket opened by ${user}\n${E.hashtag} Ticket ID: \`${ticketId}\`\n${E.tool} Channel: ${channel}`,
      });
      logChannel.send({ embeds: [logEmbed] }).catch(() => {});
    }
  }

  await interaction.reply({
    embeds: [makeEmbed({ description: `${E.success} Ticket created: ${channel}` })],
    flags: MessageFlags.Ephemeral,
  });
}

// tos page content for the paneltos dropdown
const TOS_PAGES = {
  nitro: {
    title: '<a:nitro:1494697983806013520> Nitro',
    desc: [
      '\u2022 25-day revoke warranty.',
      '\u2022 If Nitro is claimed, you must provide a video from when we send you the link.',
      '\u2022 You must record yourself claiming the Nitro and clearly showing the gift link for a replacement. If you do not have this, we cannot provide anything.',
      '\u2022 Refunds or replacements are decided based on the situation (mainly replacements are provided).',
      '\u2022 You have 24 hours to request a refund or replacement after the email is sent via Discord.',
      '\u2022 A revoke email is required to receive a replacement.',
    ].join('\n'),
  },
  members: {
    title: '<:member:1493274578909401199> Discord Members',
    desc: [
      '\u2022 Members are added by a **bot** that you must add. If you or a **security** bot kick the members, no **refund** will be provided.',
      '\u2022 No **warranty** is provided if Discord terminates the tokens.',
    ].join('\n'),
  },
  socials: {
    title: '<:tiktok:1494710867881627688> , <:instagram:1494710719323836437> Socials',
    desc: [
      '\u2022 Social boost services (such as TikTok & Instagram) only include a refill warranty if requested in a ticket.',
      '\u2022 Orders can take up to 48 hours. If there are still issues, create a ticket and provide your Order ID.',
      '\u2022 If you do not have the Order ID, we cannot provide any warranty (it is always given in the ticket and must be saved).',
      '\u2022 Changing your username while an order is pending will cause the order to fail and no refund will be provided.',
      '\u2022 Your account must remain public at all times. If it is private, the order will fail and no refund will be provided.',
    ].join('\n'),
  },
  minecraft: {
    title: '<:minecraft:1493273365073498273> Minecraft',
    desc: [
      '**Full Replacement**',
      '\u2022 A full replacement is provided if:',
      '  \u2022 The account is pulled back by someone other than the buyer within 7 days.',
      '  \u2022 The product does not match its description.',
      '  \u2022 The account gets locked within 7 days.',
      '',
      '**Your Responsibilities**',
      '\u2022 You must change the password and security information immediately.',
      '\u2022 You are responsible for how you use the account.',
    ].join('\n'),
  },
  boosts: {
    title: '<a:server_boost:1492493880220979351> Server Boosts',
    desc: [
      '\u2022 No warranty is provided if you kick or ban tokens from the server.',
      '\u2022 No warranty is provided if anything happens to the tokens.',
    ].join('\n'),
  },
  accounts: {
    title: '<:netflix:1493274486517010442> , <:spotify:1493274296485937212> , <:youtube:1493274198708195558> Accounts',
    desc: [
      '\u2022 No warranty is provided for revoke waves or mass bans.',
      '\u2022 No warranty is provided if the account is reclaimed or access is lost after delivery.',
      '\u2022 You must secure the account immediately after receiving it (change password, email, and security details if possible).',
      '\u2022 Sharing the account, using it on multiple IPs, or suspicious activity may lead to the account being locked \u2014 no replacement will be provided.',
      '\u2022 If the account details are changed incorrectly or lost by the buyer, no replacement will be provided.',
    ].join('\n'),
  },
};

// help dropdown pages
function helpOverview() {
  return makeEmbed({
    title: `${E.tool} Help Overview`,
    description: [
      'Welcome to the **Approve System Help Panel**',
      '',
      'Use the dropdown to navigate:',
      '',
      `${E.tool} **Owner Commands**`,
      'Full system control (Owner only)',
      '',
      `${E.notify} **Manager Commands**`,
      'Management tools (Manager+)',
      '',
      `${E.support} **Moderator Commands**`,
      'Moderation tools',
      '',
      'Select a category from the menu below.',
    ].join('\n'),
  });
}

function helpAdmin() {
  const embed = makeEmbed({ title: `${E.tool} Owner Commands`, description: '**Owner-only commands**' });
  embed.addFields(
    { name: 'Tickets', value: '`=panel`\n`=delete`', inline: false },
  );
  return embed;
}

function helpManager() {
  const embed = makeEmbed({ title: `${E.notify} Manager Commands`, description: '**Manager & Owner commands**' });
  embed.addFields(
    { name: 'Tickets', value: '`=notify`\n`=ticket <id>`', inline: false },
    { name: 'Moderation', value: '`=nuke`\n`=purge`', inline: false },
  );
  return embed;
}

function helpMod() {
  const embed = makeEmbed({ title: `${E.support} Moderator Commands`, description: '**Moderator tools**' });
  embed.addFields(
    { name: 'Tickets', value: '`=close`\n`=add`\n`=remove`\n`=rename`\n`=vouch`', inline: false },
    { name: 'Role Tools', value: '`=crole @user`', inline: false },
    { name: 'Utilities', value: '`=calc`\n`=convert`\n`=rm`', inline: false },
  );
  return embed;
}

module.exports = {
  name: 'interactionCreate',
  once: false,

  TOS_PAGES,

  async execute(interaction) {
    try {
      await this._handle(interaction);
    } catch (err) {
      console.error('[interactionCreate] Unhandled error:', err);
      try {
        const msg = { content: 'An unexpected error occurred.', flags: MessageFlags.Ephemeral };
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp(msg);
        } else {
          await interaction.reply(msg);
        }
      } catch { /* nothing we can do */ }
    }
  },

  async _handle(interaction) {

    // slash commands
    if (interaction.isChatInputCommand()) {
      const cmd = interaction.client.slashCommands.find(c => c.data.name === interaction.commandName);
      if (cmd) return cmd.execute(interaction);
      return;
    }

    if (interaction.isStringSelectMenu()) {

      if (interaction.customId === 'ticket_select') {
        const type = interaction.values[0];

        if (type === 'purchase') {
          const modal = new ModalBuilder().setCustomId('modal_purchase').setTitle('Purchase Ticket Form');
          modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('product').setLabel('What product are you purchasing?').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('quantity').setLabel('Quantity').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('payment').setLabel('Payment Method').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('tos_accept').setLabel('Do you accept our Terms of Service? (Yes/No)').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(5)),
          );
          return interaction.showModal(modal);
        }

        if (type === 'exchange') {
          const modal = new ModalBuilder().setCustomId('modal_exchange').setTitle('Exchange Ticket Form');
          modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('exchange_type').setLabel('What type of exchange?').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('amount').setLabel('Amount').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('currency').setLabel('Currency').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('tos_accept').setLabel('Do you accept our Terms of Service? (Yes/No)').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(5)),
          );
          return interaction.showModal(modal);
        }

        if (type === 'support') {
          const modal = new ModalBuilder().setCustomId('modal_support').setTitle('Support Ticket Form');
          modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('issue').setLabel('How can we help you?').setStyle(TextInputStyle.Paragraph).setRequired(true)),
          );
          return interaction.showModal(modal);
        }
      }

      if (interaction.customId === 'tos_panel_select') {
        const page = TOS_PAGES[interaction.values[0]];
        if (!page) return interaction.reply({ embeds: [errorEmbed('Unknown category.')], flags: MessageFlags.Ephemeral });
        return interaction.reply({ embeds: [makeEmbed({ title: page.title, description: page.desc })], flags: MessageFlags.Ephemeral });
      }

      if (interaction.customId === 'help_select') {
        const val = interaction.values[0];
        let embed;
        if (val === 'overview') embed = helpOverview();
        else if (val === 'admin') embed = helpAdmin();
        else if (val === 'manager') embed = helpManager();
        else if (val === 'mod') embed = helpMod();
        else return;
        return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      }

      // ── Exchange panel flow: Step 1 — What are you sending? ──
      if (interaction.customId === 'exchange_send_select') {
        const sending = interaction.values[0];
        exchangeFlows.set(interaction.user.id, { sending });

        const isPaypal = sending === 'paypal_balance' || sending === 'paypal_card';

        if (isPaypal) {
          // PayPal users must specify their country first
          const countryMenu = new StringSelectMenuBuilder()
            .setCustomId('exchange_country_select')
            .setPlaceholder('Which country is your PayPal account from?')
            .addOptions([
              { label: 'Germany',        value: 'germany',        emoji: '\uD83C\uDDE9\uD83C\uDDEA' },
              { label: 'France',         value: 'france',         emoji: '\uD83C\uDDEB\uD83C\uDDF7' },
              { label: 'United Kingdom', value: 'united_kingdom', emoji: '\uD83C\uDDEC\uD83C\uDDE7' },
              { label: 'Netherlands',    value: 'netherlands',    emoji: '\uD83C\uDDF3\uD83C\uDDF1' },
              { label: 'Belgium',        value: 'belgium',        emoji: '\uD83C\uDDE7\uD83C\uDDEA' },
              { label: 'Spain',          value: 'spain',          emoji: '\uD83C\uDDEA\uD83C\uDDF8' },
              { label: 'Italy',          value: 'italy',          emoji: '\uD83C\uDDEE\uD83C\uDDF9' },
              { label: 'United States',  value: 'united_states',  emoji: '\uD83C\uDDFA\uD83C\uDDF8' },
              { label: 'Other',          value: 'other',          emoji: '\uD83C\uDF10' },
            ]);
          const row = new ActionRowBuilder().addComponents(countryMenu);
          return interaction.reply({
            embeds: [makeEmbed({
              title: `${E.paypal} PayPal Country`,
              description: `${E.info} Which country is your PayPal account registered in?\nThis helps us process your exchange correctly.`,
            })],
            components: [row],
            flags: MessageFlags.Ephemeral,
          });
        }

        // Non-PayPal: skip country, go straight to currency
        const currencyMenu = new StringSelectMenuBuilder()
          .setCustomId('exchange_currency_select')
          .setPlaceholder('Which currency?')
          .addOptions([
            { label: 'EUR (\u20AC)', value: 'eur' },
            { label: 'USD ($)',  value: 'usd' },
            { label: 'GBP (\u00A3)', value: 'gbp' },
          ]);
        const row = new ActionRowBuilder().addComponents(currencyMenu);
        return interaction.reply({
          embeds: [makeEmbed({
            title: `${E.exchange} Select Currency`,
            description: `${E.info} Which currency are you sending?`,
          })],
          components: [row],
          flags: MessageFlags.Ephemeral,
        });
      }

      // ── Exchange panel flow: Step 2 (PayPal only) — Country ──
      if (interaction.customId === 'exchange_country_select') {
        const flow = exchangeFlows.get(interaction.user.id);
        if (!flow) return interaction.reply({ embeds: [errorEmbed('Session expired. Please start again.')], flags: MessageFlags.Ephemeral });
        flow.country = interaction.values[0];

        const currencyMenu = new StringSelectMenuBuilder()
          .setCustomId('exchange_currency_select')
          .setPlaceholder('Which currency?')
          .addOptions([
            { label: 'EUR (\u20AC)', value: 'eur' },
            { label: 'USD ($)',  value: 'usd' },
            { label: 'GBP (\u00A3)', value: 'gbp' },
          ]);
        const row = new ActionRowBuilder().addComponents(currencyMenu);
        return interaction.reply({
          embeds: [makeEmbed({
            title: `${E.exchange} Select Currency`,
            description: `${E.info} Which currency are you sending?`,
          })],
          components: [row],
          flags: MessageFlags.Ephemeral,
        });
      }

      // ── Exchange panel flow: Step 3 — Currency ──
      if (interaction.customId === 'exchange_currency_select') {
        const flow = exchangeFlows.get(interaction.user.id);
        if (!flow) return interaction.reply({ embeds: [errorEmbed('Session expired. Please start again.')], flags: MessageFlags.Ephemeral });
        flow.currency = interaction.values[0];

        // Build "receive" options based on what they are sending
        const receiveOptions = [];
        const isPaypal = flow.sending === 'paypal_balance' || flow.sending === 'paypal_card';

        if (!isPaypal) {
          receiveOptions.push({ label: 'PayPal', value: 'paypal', emoji: E.paypal });
        }
        if (flow.sending !== 'crypto') {
          receiveOptions.push({ label: 'Crypto', value: 'crypto', emoji: E.crypto });
        }
        if (flow.sending !== 'revolut') {
          receiveOptions.push({ label: 'Revolut', value: 'revolut', emoji: E.revolut });
        }
        // Crypto-to-crypto is always available when sending crypto
        if (flow.sending === 'crypto') {
          receiveOptions.push({ label: 'Crypto (different coin)', value: 'crypto', emoji: E.crypto });
        }

        if (receiveOptions.length === 0) {
          receiveOptions.push({ label: 'Other', value: 'other', emoji: E.tool });
        }

        const sendLabel = SEND_LABELS[flow.sending] || flow.sending;
        const receiveMenu = new StringSelectMenuBuilder()
          .setCustomId('exchange_receive_select')
          .setPlaceholder(`${sendLabel} to?`)
          .addOptions(receiveOptions);
        const row = new ActionRowBuilder().addComponents(receiveMenu);
        return interaction.reply({
          embeds: [makeEmbed({
            title: `${E.exchange} ${sendLabel} To?`,
            description: `${E.info} What do you want to receive in exchange for your **${sendLabel}**?`,
          })],
          components: [row],
          flags: MessageFlags.Ephemeral,
        });
      }

      // ── Exchange panel flow: Step 4 — What do you want to receive? ──
      if (interaction.customId === 'exchange_receive_select') {
        const flow = exchangeFlows.get(interaction.user.id);
        if (!flow) return interaction.reply({ embeds: [errorEmbed('Session expired. Please start again.')], flags: MessageFlags.Ephemeral });
        flow.receiving = interaction.values[0];

        if (flow.receiving === 'crypto') {
          // Ask which crypto
          const cryptoMenu = new StringSelectMenuBuilder()
            .setCustomId('exchange_crypto_select')
            .setPlaceholder('Which cryptocurrency?')
            .addOptions([
              { label: 'Solana (SOL)',   value: 'solana',   emoji: E.crypto },
              { label: 'Litecoin (LTC)', value: 'litecoin', emoji: E.ltc },
              { label: 'Bitcoin (BTC)',  value: 'bitcoin',  emoji: E.crypto },
            ]);
          const row = new ActionRowBuilder().addComponents(cryptoMenu);
          return interaction.reply({
            embeds: [makeEmbed({
              title: `${E.crypto} Select Cryptocurrency`,
              description: `${E.info} Which cryptocurrency would you like to receive?`,
            })],
            components: [row],
            flags: MessageFlags.Ephemeral,
          });
        }

        // No crypto selection needed — go straight to amount modal
        const modal = new ModalBuilder()
          .setCustomId('modal_exchange_amount')
          .setTitle('Exchange Amount');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('exchange_amount')
              .setLabel('How much do you want to exchange?')
              .setPlaceholder('e.g. 25')
              .setStyle(TextInputStyle.Short)
              .setRequired(true),
          ),
        );
        return interaction.showModal(modal);
      }

      // ── Exchange panel flow: Step 5 (crypto only) — Which crypto? ──
      if (interaction.customId === 'exchange_crypto_select') {
        const flow = exchangeFlows.get(interaction.user.id);
        if (!flow) return interaction.reply({ embeds: [errorEmbed('Session expired. Please start again.')], flags: MessageFlags.Ephemeral });
        flow.crypto = interaction.values[0];

        const modal = new ModalBuilder()
          .setCustomId('modal_exchange_amount')
          .setTitle('Exchange Amount');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('exchange_amount')
              .setLabel('How much do you want to exchange?')
              .setPlaceholder('e.g. 25')
              .setStyle(TextInputStyle.Short)
              .setRequired(true),
          ),
        );
        return interaction.showModal(modal);
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'modal_purchase') {
        return createTicketChannel(interaction, 'purchase', [
          { name: 'Product', value: interaction.fields.getTextInputValue('product') },
          { name: 'Quantity', value: interaction.fields.getTextInputValue('quantity') },
          { name: 'Payment Method', value: interaction.fields.getTextInputValue('payment') },
          { name: 'Accepted TOS', value: interaction.fields.getTextInputValue('tos_accept') },
        ]);
      }

      if (interaction.customId === 'modal_exchange') {
        return createTicketChannel(interaction, 'exchange', [
          { name: 'Exchange Type', value: interaction.fields.getTextInputValue('exchange_type') },
          { name: 'Amount', value: interaction.fields.getTextInputValue('amount') },
          { name: 'Currency', value: interaction.fields.getTextInputValue('currency') },
          { name: 'Accepted TOS', value: interaction.fields.getTextInputValue('tos_accept') },
        ]);
      }

      if (interaction.customId === 'modal_support') {
        return createTicketChannel(interaction, 'support', [
          { name: 'Issue', value: interaction.fields.getTextInputValue('issue') },
        ]);
      }

      // ── Exchange panel flow: Final step — Amount entered, show summary & create ticket ──
      if (interaction.customId === 'modal_exchange_amount') {
        const flow = exchangeFlows.get(interaction.user.id);
        if (!flow) return interaction.reply({ embeds: [errorEmbed('Session expired. Please start again from the exchange panel.')], flags: MessageFlags.Ephemeral });

        const rawAmount = interaction.fields.getTextInputValue('exchange_amount').trim();
        const amount = parseFloat(rawAmount);
        if (isNaN(amount) || amount <= 0) {
          return interaction.reply({ embeds: [errorEmbed('Please enter a valid positive number.')], flags: MessageFlags.Ephemeral });
        }
        if (amount < 2) {
          return interaction.reply({ embeds: [errorEmbed('The minimum exchange amount is 2.00\u20AC.')], flags: MessageFlags.Ephemeral });
        }

        flow.amount = amount;

        const feePercent = getExchangeFee(flow.sending, flow.receiving);
        const feeAmount = Math.round(amount * feePercent) / 100;
        const totalAfterFee = Math.round((amount - feeAmount) * 100) / 100;

        const sendLabel = SEND_LABELS[flow.sending] || flow.sending;
        const currencyLabel = (flow.currency || 'eur').toUpperCase();
        const receiveLabel = flow.receiving === 'crypto'
          ? (flow.crypto || 'crypto').charAt(0).toUpperCase() + (flow.crypto || 'crypto').slice(1)
          : (flow.receiving || 'unknown').charAt(0).toUpperCase() + (flow.receiving || 'unknown').slice(1);
        const countryLabel = flow.country
          ? flow.country.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
          : null;

        // Build ticket fields
        const fields = [
          { name: 'Sending', value: sendLabel },
          { name: 'Receiving', value: receiveLabel },
          { name: 'Currency', value: currencyLabel },
          { name: 'Amount', value: `${amount.toFixed(2)} ${currencyLabel}` },
          { name: 'Fee', value: `${feePercent}% (${feeAmount.toFixed(2)} ${currencyLabel})` },
          { name: 'You Receive', value: `~${totalAfterFee.toFixed(2)} ${currencyLabel}` },
        ];
        if (countryLabel) fields.splice(1, 0, { name: 'Country', value: countryLabel });

        // Clean up the flow state
        exchangeFlows.delete(interaction.user.id);

        return createTicketChannel(interaction, 'exchange', fields);
      }

      if (interaction.customId === 'modal_set_pp') {
        const db = getDb();
        db.prepare('INSERT OR REPLACE INTO seller_config (user_id, key, value) VALUES (?, ?, ?)').run(interaction.user.id, 'pp', interaction.fields.getTextInputValue('pp_value'));
        return interaction.reply({ content: `${E.success} PayPal saved for you.`, flags: MessageFlags.Ephemeral });
      }
      if (interaction.customId === 'modal_set_ltc') {
        const db = getDb();
        db.prepare('INSERT OR REPLACE INTO seller_config (user_id, key, value) VALUES (?, ?, ?)').run(interaction.user.id, 'ltc', interaction.fields.getTextInputValue('ltc_value'));
        return interaction.reply({ content: `${E.success} LTC saved for you.`, flags: MessageFlags.Ephemeral });
      }
      if (interaction.customId === 'modal_set_tos') {
        const db = getDb();
        db.prepare('INSERT OR REPLACE INTO seller_config (user_id, key, value) VALUES (?, ?, ?)').run(interaction.user.id, 'tos', interaction.fields.getTextInputValue('tos_value'));
        return interaction.reply({ content: `${E.success} TOS saved for you.`, flags: MessageFlags.Ephemeral });
      }
    }

    if (!interaction.isButton()) return;

    if (interaction.customId === 'copy_value') {
      const ppField = interaction.message.embeds[0]?.fields?.find(f => f.name === 'PayPal Email');
      return interaction.reply({ content: ppField ? ppField.value : 'No value found.', flags: MessageFlags.Ephemeral });
    }

    if (interaction.customId === 'exchange_terms_accept' || interaction.customId === 'exchange_terms_decline') {
      const accepted = interaction.customId === 'exchange_terms_accept';
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('exchange_terms_accept').setLabel('Accept').setStyle(ButtonStyle.Success).setDisabled(true),
        new ButtonBuilder().setCustomId('exchange_terms_decline').setLabel('Decline').setStyle(ButtonStyle.Danger).setDisabled(true),
      );
      await interaction.message.edit({ components: [disabledRow] });
      const msg = accepted
        ? `${interaction.user} has agreed to the Terms of Service ${E.success}`
        : `${interaction.user} has declined to the Terms of Service ${E.deny}`;
      return interaction.reply({ content: msg });
    }

    // ── Exchanger claim button ──
    if (interaction.customId === 'claim_exchange') {
      // Only exchangers (or staff) can claim
      if (!isExchanger(interaction.member) && !isStaffOrMod(interaction.member)) {
        return interaction.reply({ content: `${E.deny} Only verified exchangers can claim tickets.`, flags: MessageFlags.Ephemeral });
      }

      const channel = interaction.channel;
      if (!channel.topic || !channel.topic.includes('|')) {
        return interaction.reply({ content: `${E.deny} Ticket data missing.`, flags: MessageFlags.Ephemeral });
      }

      const [creatorId, ticketId] = channel.topic.split('|');

      // Prevent exchanger from claiming their own ticket
      if (interaction.user.id === creatorId) {
        return interaction.reply({ content: `${E.deny} You cannot claim your own ticket.`, flags: MessageFlags.Ephemeral });
      }

      const db = getDb();

      // Check if already claimed
      const existing = db.prepare('SELECT exchanger_id FROM exchange_claims WHERE ticket_id = ? AND status = ?').get(ticketId, 'active');
      if (existing) {
        return interaction.reply({ content: `${E.deny} This ticket has already been claimed by <@${existing.exchanger_id}>.`, flags: MessageFlags.Ephemeral });
      }

      // Parse the ticket amount from the embed fields
      let ticketAmount = 0;
      const firstMsg = (await channel.messages.fetch({ limit: 5 })).find(m =>
        m.author.id === interaction.client.user?.id && m.embeds[0]?.fields?.some(f => f.name === 'Amount'),
      );
      if (firstMsg) {
        const amountField = firstMsg.embeds[0].fields.find(f => f.name === 'Amount');
        if (amountField) {
          const parsed = parseFloat(amountField.value.replace(/[^0-9.]/g, ''));
          if (!isNaN(parsed)) ticketAmount = parsed;
        }
      }

      // Check exchanger security fee limit (staff bypass this check)
      if (isExchanger(interaction.member) && !isStaffOrMod(interaction.member)) {
        const limitRow = db.prepare('SELECT max_amount FROM exchanger_limits WHERE user_id = ?').get(interaction.user.id);
        if (!limitRow) {
          return interaction.reply({
            content: `${E.deny} You do not have a security fee limit set. Ask a manager to run \`/securefee\` for you first.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        // Sum of all active claims for this exchanger
        const activeSum = db.prepare(
          'SELECT COALESCE(SUM(amount), 0) AS total FROM exchange_claims WHERE exchanger_id = ? AND status = ?',
        ).get(interaction.user.id, 'active');
        const usedBudget = activeSum.total;
        const remaining = limitRow.max_amount - usedBudget;

        if (ticketAmount > remaining) {
          return interaction.reply({
            content: `${E.deny} You cannot claim this ticket. Your remaining budget is **${remaining.toFixed(2)}\u20AC** but this ticket is **${ticketAmount.toFixed(2)}\u20AC**.`,
            flags: MessageFlags.Ephemeral,
          });
        }
      }

      // Record the claim
      db.prepare(
        'INSERT INTO exchange_claims (ticket_id, channel_id, exchanger_id, amount, status) VALUES (?, ?, ?, ?, ?)',
      ).run(ticketId, channel.id, interaction.user.id, ticketAmount, 'active');

      // Grant the exchanger send-message permission in this channel
      await channel.permissionOverwrites.edit(interaction.user, {
        ViewChannel: true,
        SendMessages: true,
      });

      // Disable the claim button and update the embed
      const claimedEmbed = makeEmbed({
        title: `${E.exchange} Ticket Claimed`,
        description: [
          `${E.success} This ticket has been claimed by ${interaction.user}.`,
          '',
          `${E.arrowe} The exchanger will now handle your exchange.`,
          `${E.arrowe} Only deal with ${interaction.user} \u2014 do not trust anyone else.`,
        ].join('\n'),
      });

      const disabledClaimRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('claim_exchange').setLabel(`Claimed by ${interaction.user.username}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
      );

      await interaction.message.edit({ embeds: [claimedEmbed], components: [disabledClaimRow] });
      return interaction.reply({ content: `${E.success} ${interaction.user} has claimed this exchange ticket.` });
    }

    if (interaction.customId === 'set_pp') {
      const allowed = [ROLES.staff, ROLES.seller, ROLES.approveteam].filter(Boolean);
      if (!allowed.some(id => interaction.member.roles.cache.has(id))) {
        return interaction.reply({ content: `${E.deny} You are not a staff member.`, flags: MessageFlags.Ephemeral });
      }
      const db = getDb();
      const existing = db.prepare("SELECT value FROM seller_config WHERE user_id = ? AND key = 'pp'").get(interaction.user.id);
      if (existing) {
        db.prepare("DELETE FROM seller_config WHERE user_id = ? AND key = 'pp'").run(interaction.user.id);
        return interaction.reply({ content: `${E.deny} Your PayPal was removed.`, flags: MessageFlags.Ephemeral });
      }
      const modal = new ModalBuilder().setCustomId('modal_set_pp').setTitle('Set PayPal');
      modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('pp_value').setLabel('Enter PayPal email').setStyle(TextInputStyle.Short).setRequired(true)));
      return interaction.showModal(modal);
    }

    if (interaction.customId === 'set_ltc') {
      const allowed = [ROLES.staff, ROLES.seller, ROLES.approveteam].filter(Boolean);
      if (!allowed.some(id => interaction.member.roles.cache.has(id))) {
        return interaction.reply({ content: `${E.deny} You need a higher role!`, flags: MessageFlags.Ephemeral });
      }
      const db = getDb();
      const existing = db.prepare("SELECT value FROM seller_config WHERE user_id = ? AND key = 'ltc'").get(interaction.user.id);
      if (existing) {
        db.prepare("DELETE FROM seller_config WHERE user_id = ? AND key = 'ltc'").run(interaction.user.id);
        return interaction.reply({ content: `${E.deny} Your LTC was removed.`, flags: MessageFlags.Ephemeral });
      }
      const modal = new ModalBuilder().setCustomId('modal_set_ltc').setTitle('Set LTC Address');
      modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ltc_value').setLabel('Enter LTC address').setStyle(TextInputStyle.Short).setRequired(true)));
      return interaction.showModal(modal);
    }

    if (interaction.customId === 'set_tos') {
      const allowed = [ROLES.staff, ROLES.seller, ROLES.approveteam].filter(Boolean);
      if (!allowed.some(id => interaction.member.roles.cache.has(id))) {
        return interaction.reply({ content: `${E.deny} You need a higher role!`, flags: MessageFlags.Ephemeral });
      }
      const db = getDb();
      const existing = db.prepare("SELECT value FROM seller_config WHERE user_id = ? AND key = 'tos'").get(interaction.user.id);
      if (existing) {
        db.prepare("DELETE FROM seller_config WHERE user_id = ? AND key = 'tos'").run(interaction.user.id);
        return interaction.reply({ content: `${E.deny} Your TOS was removed.`, flags: MessageFlags.Ephemeral });
      }
      const modal = new ModalBuilder().setCustomId('modal_set_tos').setTitle('Set TOS Message');
      modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('tos_value').setLabel('Enter TOS message').setStyle(TextInputStyle.Paragraph).setRequired(true)));
      return interaction.showModal(modal);
    }

    if (interaction.customId === 'close_ticket') {
      await interaction.deferReply();

      const canClose = isStaffOrMod(interaction.member) || isExchanger(interaction.member);
      if (!canClose) {
        return interaction.followUp({ content: `${E.deny} You need a higher role!`, flags: MessageFlags.Ephemeral });
      }

      const channel = interaction.channel;
      if (TICKET_CATS.closed && channel.parentId === TICKET_CATS.closed) {
        return interaction.followUp({ content: `${E.deny} This ticket is already closed.`, flags: MessageFlags.Ephemeral });
      }

      // If the closer is an exchanger (not staff), require client approval first
      const isExchangeTicket = TICKET_CATS.exchange && channel.parentId === TICKET_CATS.exchange;
      if (isExchangeTicket && isExchanger(interaction.member) && !isStaffOrMod(interaction.member)) {
        const creatorId = channel.topic ? channel.topic.split('|')[0] : null;

        const approvalEmbed = makeEmbed({
          title: `${E.info} Close Request`,
          description: [
            `${E.exchange} **${interaction.user}** (exchanger) wants to close this ticket.`,
            '',
            `${E.arrowe} <@${creatorId}>, please confirm that the exchange is complete.`,
            `${E.arrowe} If you are not satisfied, click **Decline** to keep the ticket open.`,
          ].join('\n'),
          footer: `Requested by ${interaction.user.tag}`,
        });

        const approvalRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('client_accept_close').setLabel('Accept & Close').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('client_decline_close').setLabel('Decline').setStyle(ButtonStyle.Danger),
        );

        return interaction.followUp({ content: creatorId ? `<@${creatorId}>` : '', embeds: [approvalEmbed], components: [approvalRow] });
      }

      // Staff/mod close: proceed immediately
      let creator = null;
      if (channel.topic) {
        try {
          const creatorId = channel.topic.split('|')[0];
          creator = interaction.guild.members.cache.get(creatorId);
        } catch { /* ignore */ }
      }

      if (TICKET_CATS.closed) {
        const closedCat = interaction.guild.channels.cache.get(TICKET_CATS.closed);
        if (closedCat) await channel.edit({ parent: closedCat.id });
      }
      if (creator) await channel.permissionOverwrites.delete(creator).catch(() => {});

      // Mark exchange claim as completed if applicable
      if (channel.topic && channel.topic.includes('|')) {
        const [_cid, tId] = channel.topic.split('|');
        const db = getDb();
        db.prepare("UPDATE exchange_claims SET status = 'completed' WHERE ticket_id = ? AND status = 'active'").run(tId);
      }

      const embed = makeEmbed({
        title: `${E.deny} Ticket Closed`,
        description: 'This ticket has been moved to the closed category.\n\nUse the button below to reopen if needed.',
        footer: `Closed by ${interaction.user.tag}`,
      });

      const reopenRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('reopen_ticket').setLabel('Reopen').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('delete_ticket').setLabel('Delete').setStyle(ButtonStyle.Danger),
      );

      return interaction.followUp({ embeds: [embed], components: [reopenRow] });
    }

    // ── Client accepts exchanger close request ──
    if (interaction.customId === 'client_accept_close') {
      const channel = interaction.channel;
      if (!channel.topic || !channel.topic.includes('|')) {
        return interaction.reply({ content: `${E.deny} Ticket data missing.`, flags: MessageFlags.Ephemeral });
      }

      const [creatorId, ticketId] = channel.topic.split('|');

      // Only the ticket creator can accept
      if (interaction.user.id !== creatorId) {
        return interaction.reply({ content: `${E.deny} Only the ticket creator can accept the close request.`, flags: MessageFlags.Ephemeral });
      }

      await interaction.deferReply();

      // Disable the approval buttons
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('client_accept_close').setLabel('Accept & Close').setStyle(ButtonStyle.Success).setDisabled(true),
        new ButtonBuilder().setCustomId('client_decline_close').setLabel('Decline').setStyle(ButtonStyle.Danger).setDisabled(true),
      );
      await interaction.message.edit({ components: [disabledRow] });

      // Mark exchange claim as completed
      const db = getDb();
      db.prepare("UPDATE exchange_claims SET status = 'completed' WHERE ticket_id = ? AND status = 'active'").run(ticketId);

      // Close the ticket
      const creator = interaction.guild.members.cache.get(creatorId);
      if (TICKET_CATS.closed) {
        const closedCat = interaction.guild.channels.cache.get(TICKET_CATS.closed);
        if (closedCat) await channel.edit({ parent: closedCat.id });
      }
      if (creator) await channel.permissionOverwrites.delete(creator).catch(() => {});

      const embed = makeEmbed({
        title: `${E.success} Exchange Completed & Ticket Closed`,
        description: `${interaction.user} confirmed the exchange is complete.\n\nUse the button below to reopen if needed.`,
        footer: `Accepted by ${interaction.user.tag}`,
      });

      const reopenRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('reopen_ticket').setLabel('Reopen').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('delete_ticket').setLabel('Delete').setStyle(ButtonStyle.Danger),
      );

      return interaction.followUp({ embeds: [embed], components: [reopenRow] });
    }

    // ── Client declines exchanger close request ──
    if (interaction.customId === 'client_decline_close') {
      const channel = interaction.channel;
      if (!channel.topic || !channel.topic.includes('|')) {
        return interaction.reply({ content: `${E.deny} Ticket data missing.`, flags: MessageFlags.Ephemeral });
      }

      const [creatorId] = channel.topic.split('|');

      // Only the ticket creator can decline
      if (interaction.user.id !== creatorId) {
        return interaction.reply({ content: `${E.deny} Only the ticket creator can respond to the close request.`, flags: MessageFlags.Ephemeral });
      }

      // Disable the approval buttons
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('client_accept_close').setLabel('Accept & Close').setStyle(ButtonStyle.Success).setDisabled(true),
        new ButtonBuilder().setCustomId('client_decline_close').setLabel('Decline').setStyle(ButtonStyle.Danger).setDisabled(true),
      );
      await interaction.message.edit({ components: [disabledRow] });

      return interaction.reply({ content: `${E.deny} ${interaction.user} has declined the close request. The ticket remains open.` });
    }

    if (interaction.customId === 'reopen_ticket') {
      await interaction.deferReply();
      if (!isManagerOrHigher(interaction.member)) {
        return interaction.followUp({ content: `${E.deny} You need a higher role!`, flags: MessageFlags.Ephemeral });
      }
      const channel = interaction.channel;
      if (!channel.topic || !channel.topic.includes('|')) {
        return interaction.followUp({ content: '\u274C Ticket data missing.', flags: MessageFlags.Ephemeral });
      }
      const [creatorId, _ticketId, originalCategoryId] = channel.topic.split('|');
      const creator = interaction.guild.members.cache.get(creatorId);
      if (originalCategoryId) {
        const origCat = interaction.guild.channels.cache.get(originalCategoryId);
        if (origCat) await channel.edit({ parent: origCat.id });
      }
      if (creator) {
        await channel.permissionOverwrites.edit(creator, { ViewChannel: true, SendMessages: true });
      }
      return interaction.followUp({ content: '\u2705 Ticket reopened.' });
    }

    if (interaction.customId === 'delete_ticket') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      if (!isManagerOrHigher(interaction.member)) {
        return interaction.followUp({ content: `${E.deny} Only managers and owners can delete tickets.`, flags: MessageFlags.Ephemeral });
      }
      const channel = interaction.channel;

      // generate transcript before deleting
      if (channel.topic && channel.topic.includes('|')) {
        const [creatorId, ticketId] = channel.topic.split('|');

        let msgs;
        try {
          msgs = await channel.messages.fetch({ limit: 100 });
        } catch { /* ignore */ }

        if (msgs && msgs.size > 0) {
          const html = buildTranscriptHtml(msgs, {
            channelName: channel.name,
            ticketId: ticketId || 'unknown',
            guildName: interaction.guild.name,
          });

          const filename = `transcript-${ticketId}.html`;
          const transcriptsDir = path.join(__dirname, '..', 'transcripts');
          fs.mkdirSync(transcriptsDir, { recursive: true });
          const filepath = path.join(transcriptsDir, filename);
          fs.writeFileSync(filepath, html, 'utf-8');

          const db = getDb();
          db.prepare('INSERT OR REPLACE INTO transcripts (ticket_id, filepath) VALUES (?, ?)').run(ticketId, filepath);

          const embed = makeEmbed({
            title: `${E.tool} Ticket Transcript`,
            description: `${E.hashtag} Ticket ID: \`${ticketId}\``,
          });
          embed.addFields(
            { name: 'Ticket Owner', value: `<@${creatorId}>`, inline: true },
            { name: 'Channel', value: channel.name, inline: true },
          );

          if (CHANNELS.transcript) {
            const transcriptChannel = interaction.guild.channels.cache.get(CHANNELS.transcript);
            if (transcriptChannel) {
              const file = new AttachmentBuilder(filepath, { name: filename });
              await transcriptChannel.send({ content: `Ticket Owner ID: ${creatorId}`, embeds: [embed], files: [file] });
            }
          }

          try {
            const user = await interaction.client.users.fetch(creatorId);
            const dmFile = new AttachmentBuilder(filepath, { name: filename });
            await user.send({
              content: '\uD83D\uDCC4 Your ticket has been closed. Here is the transcript.',
              embeds: [embed],
              files: [dmFile],
            });
          } catch { /* dm might be closed */ }
        }
      }

      // Release exchanger budget before deleting
      if (channel.topic && channel.topic.includes('|')) {
        const [_cid2, tId2] = channel.topic.split('|');
        const db2 = getDb();
        db2.prepare("UPDATE exchange_claims SET status = 'completed' WHERE ticket_id = ? AND status = 'active'").run(tId2);
      }

      await interaction.followUp({ content: `${E.deny} Deleting ticket...`, flags: MessageFlags.Ephemeral });
      await channel.delete().catch(() => {});
    }
  },
};
