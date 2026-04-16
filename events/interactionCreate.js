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
} = require('discord.js');
const { makeEmbed, errorEmbed } = require('../utils/embed');
const { getDb } = require('../utils/db');
const { buildTranscriptHtml } = require('../utils/transcript');
const { E, ROLES, CHANNELS, TICKET_CATS } = require('../utils/constants');
const { isManagerOrHigher, isStaffOrMod } = require('../utils/helpers');
const fs = require('fs');
const path = require('path');

function ticketOverwrites(guild, userId, botId) {
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
    permissionOverwrites: ticketOverwrites(guild, user.id, interaction.client.user?.id),
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
  general: { title: '\uD83D\uDCDC Terms of Service', desc: '**By purchasing any product, you agree to the following:**\n\n**No Refunds**\nAll sales are final.\n\n**Payment**\nMust be completed before delivery.\n\n**Delivery**\nDelivery times may vary.\n\n**Replacement**\nOnly if issue is on our side.\n\n**Responsibility**\nWe are not responsible for misuse.\n\n**Revoke Waves**\nNo reimbursement for mass revokes.\n\n**Changes**\nWe may update TOS anytime.' },
  nitro: { title: '\uD83C\uDF81 Nitro TOS', desc: '\u2022 25-day revoke warranty\n\u2022 Must provide full video proof\n\u2022 Show claiming process + gift link\n\u2022 No proof = no replacement\n\u2022 Replacement depends on situation\n\u2022 24h window for claims\n\u2022 Revoke email required' },
  members: { title: '\uD83D\uDC65 Discord Members TOS', desc: '\u2022 Members added via bot\n\u2022 If kicked = no refund\n\u2022 No warranty if Discord terminates tokens' },
  socials: { title: '\uD83D\uDCF1 Socials TOS', desc: '\u2022 Refill only if requested in ticket\n\u2022 Orders may take up to 48h\n\u2022 Must provide Order ID\n\u2022 No Order ID = no warranty\n\u2022 Username change = order fails\n\u2022 Account must stay public' },
  minecraft: { title: '\u26CF\uFE0F Minecraft TOS', desc: '**Replacement if:**\n\u2022 Pulled back within 7 days\n\u2022 Not as described\n\u2022 Locked within 7 days\n\n**Your responsibility:**\n\u2022 Secure account immediately\n\u2022 You are responsible after delivery' },
  boosts: { title: '\uD83D\uDE80 Server Boosts TOS', desc: '\u2022 No warranty if you kick/ban tokens\n\u2022 No warranty for token issues' },
  accounts: { title: '\uD83D\uDD10 Accounts TOS', desc: '\u2022 No warranty for revoke waves\n\u2022 No warranty if access is lost\n\u2022 Must secure account immediately\n\u2022 Sharing/multiple IP = risk\n\u2022 Buyer mistakes = no replacement' },
  fortnite: { title: '\uD83D\uDEE0\uFE0F Fortnite TOS', desc: '\u2022 Includes full account + webmail\n\u2022 Email change may be delayed\n\u2022 Depends on Epic security\n\n\u2022 No responsibility after delivery\n\u2022 Buying = agreeing to TOS' },
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

    if (interaction.customId === 'set_pp') {
      const allowed = [ROLES.staff, ROLES.seller].filter(Boolean);
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
      const allowed = [ROLES.staff, ROLES.seller].filter(Boolean);
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
      const allowed = [ROLES.staff, ROLES.seller].filter(Boolean);
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
      if (!isStaffOrMod(interaction.member)) {
        return interaction.followUp({ content: `${E.deny} You need a higher role!`, flags: MessageFlags.Ephemeral });
      }
      const channel = interaction.channel;
      if (TICKET_CATS.closed && channel.parentId === TICKET_CATS.closed) {
        return interaction.followUp({ content: `${E.deny} This ticket is already closed.`, flags: MessageFlags.Ephemeral });
      }

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
              await transcriptChannel.send({ embeds: [embed], files: [file] });
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

      await interaction.followUp({ content: `${E.deny} Deleting ticket...`, flags: MessageFlags.Ephemeral });
      await channel.delete().catch(() => {});
    }
  },
};
