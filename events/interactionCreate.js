// Handle all button, select-menu, and modal interactions.

const {
  ChannelType,
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
const { E, ROLES, TICKET_CATS, CHANNELS } = require('../utils/constants');
const { isStaff, isStaffOrMod } = require('../utils/helpers');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Ticket helpers
// ---------------------------------------------------------------------------

function ticketOverwrites(guild, userId, botId) {
  const perms = [
    { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
    { id: userId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
  ];
  if (botId) {
    perms.push({ id: botId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages] });
  }
  if (ROLES.staff) {
    perms.push({ id: ROLES.staff, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
  }
  if (ROLES.mod) {
    perms.push({ id: ROLES.mod, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
  }
  return perms;
}

async function createTicketChannel(interaction, ticketType, fields) {
  const guild = interaction.guild;
  const user = interaction.user;

  // Resolve category.
  const categoryId = TICKET_CATS[ticketType];
  const parent = categoryId ? guild.channels.cache.get(categoryId) : null;

  const channel = await guild.channels.create({
    name: `${ticketType}-${user.username}`,
    type: ChannelType.GuildText,
    parent: parent ? parent.id : undefined,
    permissionOverwrites: ticketOverwrites(guild, user.id, interaction.client.user?.id),
  });

  // Generate a random ticket ID and store metadata in channel topic.
  const ticketId = Math.floor(1000 + Math.random() * 9000);
  await channel.edit({ topic: `${user.id}|${ticketId}|${categoryId || ''}` });

  // Close button.
  const controlRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('close_ticket').setLabel('Close').setStyle(ButtonStyle.Danger),
  );

  // Ticket embed with form answers.
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
    allowedMentions: { users: [user.id], everyone: true },
  });

  // Exchange tickets get TOS terms.
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

  await interaction.reply({
    embeds: [makeEmbed({ description: `${E.success} Ticket created: ${channel}` })],
    ephemeral: true,
  });
}

/** Generate a plain-text transcript of a channel. */
async function generateTranscript(channel) {
  try {
    const messages = await channel.messages.fetch({ limit: 100 });
    const lines = messages
      .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
      .map(m => `[${m.createdAt.toISOString()}] ${m.author.tag}: ${m.content || '(embed/attachment)'}`)
      .join('\n');
    return Buffer.from(lines, 'utf-8');
  } catch (e) {
    console.error('Transcript error:', e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// TOS pages (for =paneltos dropdown)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Help pages (for =help dropdown)
// ---------------------------------------------------------------------------

function helpOverview() {
  return makeEmbed({
    title: `${E.tool} Help Overview`,
    description: [
      'Welcome to the **Approve System Help Panel**',
      '',
      'Use the dropdown to navigate:',
      '',
      `${E.tool} **Admin Commands**`,
      'Full system control (Staff only)',
      '',
      `${E.support} **Moderator Commands**`,
      'Limited moderation tools',
      '',
      'Select a category from the menu below.',
    ].join('\n'),
  });
}

function helpAdmin() {
  const embed = makeEmbed({ title: `${E.tool} Admin Commands`, description: '**Staff-only commands**' });
  embed.addFields(
    { name: 'Ticket System', value: '`=panel`\n`=close`\n`=delete`\n`=vouch`', inline: false },
    { name: 'Management', value: '`=rename`\n`=add`\n`=remove`\n`=notify`', inline: false },
    { name: 'System', value: '`=nuke`\n`=purge`\n`=ticket <id>`', inline: false },
  );
  return embed;
}

function helpMod() {
  const embed = makeEmbed({ title: `${E.support} Moderator Commands`, description: '**Moderator tools**' });
  embed.addFields(
    { name: 'Tickets', value: '`=close`\n`=add`\n`=remove`\n`=rename`', inline: false },
    { name: 'Role Tools', value: '`=crole @user`', inline: false },
    { name: 'Utilities', value: '`=notify`\n`=calc`\n`=convert`\n`=rm`', inline: false },
  );
  return embed;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

module.exports = {
  name: 'interactionCreate',
  once: false,

  // Exported for other modules.
  TOS_PAGES,

  async execute(interaction) {

    // ── Select menus ─────────────────────────────────────────────────────

    if (interaction.isStringSelectMenu()) {

      // Ticket category dropdown.
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

      // TOS panel dropdown.
      if (interaction.customId === 'tos_panel_select') {
        const page = TOS_PAGES[interaction.values[0]];
        if (!page) return interaction.reply({ embeds: [errorEmbed('Unknown category.')], ephemeral: true });
        return interaction.reply({ embeds: [makeEmbed({ title: page.title, description: page.desc })], ephemeral: true });
      }

      // Help dropdown.
      if (interaction.customId === 'help_select') {
        const val = interaction.values[0];
        let embed;
        if (val === 'overview') embed = helpOverview();
        else if (val === 'admin') embed = helpAdmin();
        else if (val === 'mod') embed = helpMod();
        else return;
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }

    // ── Modal submissions ────────────────────────────────────────────────

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

      // Seller config modals.
      if (interaction.customId === 'modal_set_pp') {
        const db = getDb();
        db.prepare('INSERT OR REPLACE INTO seller_config (user_id, key, value) VALUES (?, ?, ?)').run(interaction.user.id, 'pp', interaction.fields.getTextInputValue('pp_value'));
        return interaction.reply({ content: `${E.success} PayPal saved for you.`, ephemeral: true });
      }
      if (interaction.customId === 'modal_set_ltc') {
        const db = getDb();
        db.prepare('INSERT OR REPLACE INTO seller_config (user_id, key, value) VALUES (?, ?, ?)').run(interaction.user.id, 'ltc', interaction.fields.getTextInputValue('ltc_value'));
        return interaction.reply({ content: `${E.success} LTC saved for you.`, ephemeral: true });
      }
      if (interaction.customId === 'modal_set_tos') {
        const db = getDb();
        db.prepare('INSERT OR REPLACE INTO seller_config (user_id, key, value) VALUES (?, ?, ?)').run(interaction.user.id, 'tos', interaction.fields.getTextInputValue('tos_value'));
        return interaction.reply({ content: `${E.success} TOS saved for you.`, ephemeral: true });
      }
    }

    // ── Button interactions ──────────────────────────────────────────────

    if (!interaction.isButton()) return;

    // Copy button.
    if (interaction.customId === 'copy_value') {
      // The value is stored in the embed field — just send the PayPal from the embed.
      const ppField = interaction.message.embeds[0]?.fields?.find(f => f.name === 'PayPal Email');
      return interaction.reply({ content: ppField ? ppField.value : 'No value found.', ephemeral: true });
    }

    // Exchange TOS accept/decline.
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

    // Seller config buttons (PP / LTC / TOS).
    if (interaction.customId === 'set_pp') {
      const allowed = [ROLES.staff, ROLES.seller].filter(Boolean);
      if (!allowed.some(id => interaction.member.roles.cache.has(id))) {
        return interaction.reply({ content: `${E.deny} You are not a staff member.`, ephemeral: true });
      }
      const db = getDb();
      const existing = db.prepare("SELECT value FROM seller_config WHERE user_id = ? AND key = 'pp'").get(interaction.user.id);
      if (existing) {
        db.prepare("DELETE FROM seller_config WHERE user_id = ? AND key = 'pp'").run(interaction.user.id);
        return interaction.reply({ content: `${E.deny} Your PayPal was removed.`, ephemeral: true });
      }
      const modal = new ModalBuilder().setCustomId('modal_set_pp').setTitle('Set PayPal');
      modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('pp_value').setLabel('Enter PayPal email').setStyle(TextInputStyle.Short).setRequired(true)));
      return interaction.showModal(modal);
    }

    if (interaction.customId === 'set_ltc') {
      const allowed = [ROLES.staff, ROLES.seller].filter(Boolean);
      if (!allowed.some(id => interaction.member.roles.cache.has(id))) {
        return interaction.reply({ content: `${E.deny} You need a higher role!`, ephemeral: true });
      }
      const db = getDb();
      const existing = db.prepare("SELECT value FROM seller_config WHERE user_id = ? AND key = 'ltc'").get(interaction.user.id);
      if (existing) {
        db.prepare("DELETE FROM seller_config WHERE user_id = ? AND key = 'ltc'").run(interaction.user.id);
        return interaction.reply({ content: `${E.deny} Your LTC was removed.`, ephemeral: true });
      }
      const modal = new ModalBuilder().setCustomId('modal_set_ltc').setTitle('Set LTC Address');
      modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ltc_value').setLabel('Enter LTC address').setStyle(TextInputStyle.Short).setRequired(true)));
      return interaction.showModal(modal);
    }

    if (interaction.customId === 'set_tos') {
      const allowed = [ROLES.staff, ROLES.seller].filter(Boolean);
      if (!allowed.some(id => interaction.member.roles.cache.has(id))) {
        return interaction.reply({ content: `${E.deny} You need a higher role!`, ephemeral: true });
      }
      const db = getDb();
      const existing = db.prepare("SELECT value FROM seller_config WHERE user_id = ? AND key = 'tos'").get(interaction.user.id);
      if (existing) {
        db.prepare("DELETE FROM seller_config WHERE user_id = ? AND key = 'tos'").run(interaction.user.id);
        return interaction.reply({ content: `${E.deny} Your TOS was removed.`, ephemeral: true });
      }
      const modal = new ModalBuilder().setCustomId('modal_set_tos').setTitle('Set TOS Message');
      modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('tos_value').setLabel('Enter TOS message').setStyle(TextInputStyle.Paragraph).setRequired(true)));
      return interaction.showModal(modal);
    }

    // Close ticket button.
    if (interaction.customId === 'close_ticket') {
      await interaction.deferReply();
      if (!isStaffOrMod(interaction.member)) {
        return interaction.followup.send({ content: `${E.deny} You need a higher role!`, ephemeral: true });
      }
      const channel = interaction.channel;
      if (TICKET_CATS.closed && channel.parentId === TICKET_CATS.closed) {
        return interaction.followup.send({ content: `${E.deny} This ticket is already closed.`, ephemeral: true });
      }

      // Parse topic for creator.
      let creator = null;
      if (channel.topic) {
        try {
          const creatorId = channel.topic.split('|')[0];
          creator = interaction.guild.members.cache.get(creatorId);
        } catch { /* ignore */ }
      }

      // Move to closed category.
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

      return interaction.followup.send({ embeds: [embed], components: [reopenRow] });
    }

    // Reopen ticket button.
    if (interaction.customId === 'reopen_ticket') {
      await interaction.deferReply();
      if (!isStaff(interaction.member)) {
        return interaction.followup.send({ content: `${E.deny} You need a higher role!`, ephemeral: true });
      }
      const channel = interaction.channel;
      if (!channel.topic || !channel.topic.includes('|')) {
        return interaction.followup.send({ content: '\u274C Ticket data missing.', ephemeral: true });
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
      return interaction.followup.send({ content: '\u2705 Ticket reopened.' });
    }

    // Delete ticket button.
    if (interaction.customId === 'delete_ticket') {
      await interaction.deferReply({ ephemeral: true });
      if (!isStaff(interaction.member)) {
        return interaction.followup.send({ content: `${E.deny} You need a higher role!`, ephemeral: true });
      }
      const channel = interaction.channel;
      if (!channel.topic || !channel.topic.includes('|')) {
        return interaction.followup.send({ content: '\u274C Ticket data missing.', ephemeral: true });
      }
      const [creatorId, ticketId] = channel.topic.split('|');

      // Generate transcript.
      const transcriptBuf = await generateTranscript(channel);
      if (!transcriptBuf) {
        return interaction.followup.send({ content: `${E.deny} Failed to generate transcript.`, ephemeral: true });
      }

      const filename = `transcript-${ticketId}.txt`;
      const transcriptsDir = path.join(__dirname, '..', 'transcripts');
      fs.mkdirSync(transcriptsDir, { recursive: true });
      const filepath = path.join(transcriptsDir, filename);
      fs.writeFileSync(filepath, transcriptBuf);

      // Save to DB.
      const db = getDb();
      db.prepare('INSERT OR REPLACE INTO transcripts (ticket_id, filepath) VALUES (?, ?)').run(ticketId, filepath);

      // Send to transcript channel.
      if (CHANNELS.transcript) {
        const transcriptChannel = interaction.guild.channels.cache.get(CHANNELS.transcript);
        if (transcriptChannel) {
          const embed = makeEmbed({
            title: `${E.tool} Ticket Transcript`,
            description: `${E.hashtag} Ticket ID: \`${ticketId}\``,
          });
          embed.addFields(
            { name: 'Ticket Owner', value: `<@${creatorId}>`, inline: true },
            { name: 'Channel', value: channel.name, inline: true },
          );
          const file = new AttachmentBuilder(filepath, { name: filename });
          await transcriptChannel.send({ embeds: [embed], files: [file] });
        }
      }

      // DM the creator.
      try {
        const user = await interaction.client.users.fetch(creatorId);
        const dmEmbed = makeEmbed({
          title: `${E.tool} Ticket Transcript`,
          description: `${E.hashtag} Ticket ID: \`${ticketId}\``,
        });
        const dmFile = new AttachmentBuilder(filepath, { name: filename });
        await user.send({ content: '\uD83D\uDCC4 Your ticket has been closed. Here is the transcript.', embeds: [dmEmbed], files: [dmFile] });
      } catch (e) {
        console.log('DM failed:', e.message);
      }

      await interaction.followup.send({ content: `${E.deny} Deleting ticket...`, ephemeral: true });
      await channel.delete().catch(() => {});
    }
  },
};
