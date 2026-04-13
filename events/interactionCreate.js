// Handle button, select-menu, and modal interactions.

const {
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const { makeEmbed, errorEmbed } = require('../utils/embed');
const { getDb } = require('../utils/db');
const { E, ROLES, TICKET_CATEGORIES } = require('../utils/constants');

/** Friendly labels for each self-role ID (configure in =selfrole). */
const ROLE_LABELS = {};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build standard ticket permission overwrites. */
function ticketOverwrites(guild, userId, botId) {
  const perms = [
    { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
    { id: userId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
  ];
  if (botId) {
    perms.push({ id: botId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages] });
  }
  if (ROLES.staff) {
    perms.push({ id: ROLES.staff, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ReadMessageHistory] });
  }
  if (ROLES.mod) {
    perms.push({ id: ROLES.mod, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
  }
  return perms;
}

/** Create a ticket channel and insert into DB. */
async function createTicketChannel(interaction, ticketType, fields) {
  const guild = interaction.guild;
  const user = interaction.user;
  const db = getDb();

  // Check for existing open ticket.
  const existing = db.prepare(
    "SELECT channel_id FROM tickets WHERE guild_id = ? AND user_id = ? AND status = 'open'"
  ).get(guild.id, user.id);

  if (existing) {
    return interaction.reply({
      embeds: [makeEmbed({ description: `${E.cross} You already have an open ticket: <#${existing.channel_id}>` })],
      ephemeral: true,
    });
  }

  // Resolve category.
  const categoryId = TICKET_CATEGORIES[ticketType] || null;
  let parent = categoryId ? guild.channels.cache.get(categoryId) : null;
  if (!parent) {
    parent = guild.channels.cache.find(
      ch => ch.type === ChannelType.GuildCategory && ch.name.toLowerCase() === 'tickets'
    );
  }
  if (!parent) {
    parent = await guild.channels.create({
      name: 'Tickets',
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
      ],
    });
  }

  const channel = await guild.channels.create({
    name: `${ticketType}-${user.username}`,
    type: ChannelType.GuildText,
    parent: parent.id,
    permissionOverwrites: ticketOverwrites(guild, user.id, interaction.client.user?.id),
  });

  db.prepare('INSERT INTO tickets (guild_id, channel_id, user_id, ticket_type) VALUES (?, ?, ?, ?)')
    .run(guild.id, channel.id, user.id, ticketType);

  // Control buttons.
  const controlRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_claim').setLabel('Claim').setStyle(ButtonStyle.Success).setEmoji('✅'),
    new ButtonBuilder().setCustomId('ticket_close').setLabel('Close').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
  );

  // Build ticket embed with form answers.
  const embed = makeEmbed({
    title: `${E.ticket} ${ticketType.charAt(0).toUpperCase() + ticketType.slice(1)} Ticket`,
    description: [
      `${E.dot} Welcome ${user}, a staff member will be with you shortly.`,
      `${E.arrow} Ticket type: **${ticketType}**`,
    ].join('\n'),
  });

  if (fields && fields.length) {
    for (const f of fields) {
      embed.addFields({ name: f.name, value: `\`${f.value}\``, inline: false });
    }
  }

  embed.addFields(
    { name: `${E.settings} Creator`, value: `${user}`, inline: true },
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
      title: `${E.star} Exchange Terms & Conditions`,
      description: [
        `${E.dot} **Exchange Rules**`,
        `${E.arrow} If any exchanger scams, we are not liable. Deal at your own risk.`,
        `${E.arrow} Fees are fixed unless stated otherwise.`,
        `${E.arrow} Malicious disputes or chargebacks will result in a ban.`,
        '',
        `${E.money} **PayPal Standards**`,
        `${E.arrow} Payments must be Friends & Family`,
        `${E.arrow} No notes or descriptions`,
        `${E.arrow} EUR only, PayPal balance only`,
        `${E.arrow} Third-party payments are prohibited`,
        '',
        `${E.cross} **Failure to follow these rules means:**`,
        `${E.dot} No refund`,
        `${E.dot} Possible extra fees`,
      ].join('\n'),
    });

    const tosRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('exchange_accept').setLabel('Accept').setStyle(ButtonStyle.Success).setEmoji('✅'),
      new ButtonBuilder().setCustomId('exchange_decline').setLabel('Decline').setStyle(ButtonStyle.Danger).setEmoji('❌'),
    );

    await channel.send({ embeds: [tosEmbed], components: [tosRow] });
  }

  await interaction.reply({
    embeds: [makeEmbed({ description: `${E.tick} Ticket created: ${channel}` })],
    ephemeral: true,
  });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction) {

    // ── Self-role select menu ──────────────────────────────────────────────
    if (interaction.isStringSelectMenu() && interaction.customId === 'selfrole_menu') {
      await interaction.deferReply({ ephemeral: true });

      const member = interaction.member;
      const selected = new Set(interaction.values);
      const allRoleIds = Object.keys(ROLE_LABELS);

      const added = [];
      const removed = [];

      for (const roleId of allRoleIds) {
        const hasRole = member.roles.cache.has(roleId);
        if (selected.has(roleId) && !hasRole) {
          await member.roles.add(roleId).catch(() => {});
          added.push(ROLE_LABELS[roleId]);
        } else if (!selected.has(roleId) && hasRole) {
          await member.roles.remove(roleId).catch(() => {});
          removed.push(ROLE_LABELS[roleId]);
        }
      }

      const lines = [];
      if (added.length) lines.push(`${E.tick} **Added:** ${added.join(', ')}`);
      if (removed.length) lines.push(`${E.cross} **Removed:** ${removed.join(', ')}`);
      if (!lines.length) lines.push(`${E.dot} No role changes were made.`);

      return interaction.editReply({
        embeds: [makeEmbed({ description: lines.join('\n') })],
      });
    }

    // ── TOS panel dropdown ───────────────────────────────────────────────
    if (interaction.isStringSelectMenu() && interaction.customId === 'tos_panel_select') {
      const { TOS_PAGES } = require('../commands/management/paneltos');
      const page = TOS_PAGES[interaction.values[0]];
      if (!page) {
        return interaction.reply({ embeds: [errorEmbed('Unknown TOS category.')], ephemeral: true });
      }
      return interaction.reply({
        embeds: [makeEmbed({ title: page.title, description: page.lines.join('\n') })],
        ephemeral: true,
      });
    }

    // ── Ticket category dropdown ───────────────────────────────────────────
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_category_select') {
      const ticketType = interaction.values[0];

      if (ticketType === 'purchase') {
        const modal = new ModalBuilder().setCustomId('modal_purchase').setTitle('Purchase Ticket');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('product').setLabel('What product are you purchasing?').setStyle(TextInputStyle.Short).setRequired(true),
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('quantity').setLabel('Quantity').setStyle(TextInputStyle.Short).setRequired(true),
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('payment').setLabel('Payment Method').setStyle(TextInputStyle.Short).setRequired(true),
          ),
        );
        return interaction.showModal(modal);
      }

      if (ticketType === 'exchange') {
        const modal = new ModalBuilder().setCustomId('modal_exchange').setTitle('Exchange Ticket');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('exchange_type').setLabel('What type of exchange?').setStyle(TextInputStyle.Short).setRequired(true),
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('amount').setLabel('Amount').setStyle(TextInputStyle.Short).setRequired(true),
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('currency').setLabel('Currency').setStyle(TextInputStyle.Short).setRequired(true),
          ),
        );
        return interaction.showModal(modal);
      }

      if (ticketType === 'support') {
        const modal = new ModalBuilder().setCustomId('modal_support').setTitle('Support Ticket');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('issue').setLabel('How can we help you?').setStyle(TextInputStyle.Paragraph).setRequired(true),
          ),
        );
        return interaction.showModal(modal);
      }
    }

    // ── Modal submissions ──────────────────────────────────────────────────
    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'modal_purchase') {
        return createTicketChannel(interaction, 'purchase', [
          { name: 'Product', value: interaction.fields.getTextInputValue('product') },
          { name: 'Quantity', value: interaction.fields.getTextInputValue('quantity') },
          { name: 'Payment Method', value: interaction.fields.getTextInputValue('payment') },
        ]);
      }

      if (interaction.customId === 'modal_exchange') {
        return createTicketChannel(interaction, 'exchange', [
          { name: 'Exchange Type', value: interaction.fields.getTextInputValue('exchange_type') },
          { name: 'Amount', value: interaction.fields.getTextInputValue('amount') },
          { name: 'Currency', value: interaction.fields.getTextInputValue('currency') },
        ]);
      }

      if (interaction.customId === 'modal_support') {
        return createTicketChannel(interaction, 'support', [
          { name: 'Issue', value: interaction.fields.getTextInputValue('issue') },
        ]);
      }

      // ── Seller config modals ─────────────────────────────────────────────
      if (interaction.customId === 'modal_config_pp') {
        const db = getDb();
        const val = interaction.fields.getTextInputValue('pp_value');
        db.prepare('INSERT OR REPLACE INTO seller_config (user_id, key, value) VALUES (?, ?, ?)')
          .run(interaction.user.id, 'pp', val);
        return interaction.reply({ embeds: [makeEmbed({ description: `${E.tick} PayPal saved.` })], ephemeral: true });
      }

      if (interaction.customId === 'modal_config_ltc') {
        const db = getDb();
        const val = interaction.fields.getTextInputValue('ltc_value');
        db.prepare('INSERT OR REPLACE INTO seller_config (user_id, key, value) VALUES (?, ?, ?)')
          .run(interaction.user.id, 'ltc', val);
        return interaction.reply({ embeds: [makeEmbed({ description: `${E.tick} LTC address saved.` })], ephemeral: true });
      }

      if (interaction.customId === 'modal_config_tos') {
        const db = getDb();
        const val = interaction.fields.getTextInputValue('tos_value');
        db.prepare('INSERT OR REPLACE INTO seller_config (user_id, key, value) VALUES (?, ?, ?)')
          .run(interaction.user.id, 'tos', val);
        return interaction.reply({ embeds: [makeEmbed({ description: `${E.tick} TOS saved.` })], ephemeral: true });
      }
    }

    // ── Button interactions ────────────────────────────────────────────────
    if (!interaction.isButton()) return;

    // ── Config buttons (PP / LTC / TOS) ────────────────────────────────────
    if (interaction.customId === 'config_pp') {
      const db = getDb();
      const existing = db.prepare("SELECT value FROM seller_config WHERE user_id = ? AND key = 'pp'")
        .get(interaction.user.id);

      if (existing) {
        db.prepare("DELETE FROM seller_config WHERE user_id = ? AND key = 'pp'")
          .run(interaction.user.id);
        return interaction.reply({ embeds: [makeEmbed({ description: `${E.cross} Your PayPal has been removed.` })], ephemeral: true });
      }

      const modal = new ModalBuilder().setCustomId('modal_config_pp').setTitle('Set PayPal');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('pp_value').setLabel('Enter PayPal email').setStyle(TextInputStyle.Short).setRequired(true),
        ),
      );
      return interaction.showModal(modal);
    }

    if (interaction.customId === 'config_ltc') {
      const db = getDb();
      const existing = db.prepare("SELECT value FROM seller_config WHERE user_id = ? AND key = 'ltc'")
        .get(interaction.user.id);

      if (existing) {
        db.prepare("DELETE FROM seller_config WHERE user_id = ? AND key = 'ltc'")
          .run(interaction.user.id);
        return interaction.reply({ embeds: [makeEmbed({ description: `${E.cross} Your LTC address has been removed.` })], ephemeral: true });
      }

      const modal = new ModalBuilder().setCustomId('modal_config_ltc').setTitle('Set LTC Address');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('ltc_value').setLabel('Enter LTC address').setStyle(TextInputStyle.Short).setRequired(true),
        ),
      );
      return interaction.showModal(modal);
    }

    if (interaction.customId === 'config_tos') {
      const db = getDb();
      const existing = db.prepare("SELECT value FROM seller_config WHERE user_id = ? AND key = 'tos'")
        .get(interaction.user.id);

      if (existing) {
        db.prepare("DELETE FROM seller_config WHERE user_id = ? AND key = 'tos'")
          .run(interaction.user.id);
        return interaction.reply({ embeds: [makeEmbed({ description: `${E.cross} Your TOS has been removed.` })], ephemeral: true });
      }

      const modal = new ModalBuilder().setCustomId('modal_config_tos').setTitle('Set TOS');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('tos_value').setLabel('Enter your Terms of Service').setStyle(TextInputStyle.Paragraph).setRequired(true),
        ),
      );
      return interaction.showModal(modal);
    }

    // ── Copy button ────────────────────────────────────────────────────────
    if (interaction.customId.startsWith('copy_value:')) {
      const val = interaction.customId.slice('copy_value:'.length);
      return interaction.reply({ content: val, ephemeral: true });
    }

    // ── Exchange TOS Accept / Decline ──────────────────────────────────────
    if (interaction.customId === 'exchange_accept') {
      // Disable buttons.
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('exchange_accept').setLabel('Accept').setStyle(ButtonStyle.Success).setEmoji('✅').setDisabled(true),
        new ButtonBuilder().setCustomId('exchange_decline').setLabel('Decline').setStyle(ButtonStyle.Danger).setEmoji('❌').setDisabled(true),
      );
      await interaction.message.edit({ components: [disabledRow] });
      return interaction.reply({
        embeds: [makeEmbed({ description: `${E.tick} ${interaction.user} has **accepted** the Terms of Service.` })],
      });
    }

    if (interaction.customId === 'exchange_decline') {
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('exchange_accept').setLabel('Accept').setStyle(ButtonStyle.Success).setEmoji('✅').setDisabled(true),
        new ButtonBuilder().setCustomId('exchange_decline').setLabel('Decline').setStyle(ButtonStyle.Danger).setEmoji('❌').setDisabled(true),
      );
      await interaction.message.edit({ components: [disabledRow] });
      return interaction.reply({
        embeds: [makeEmbed({ description: `${E.cross} ${interaction.user} has **declined** the Terms of Service.` })],
      });
    }

    // ── Claim Ticket ───────────────────────────────────────────────────────
    if (interaction.customId === 'ticket_claim') {
      const db = getDb();
      const ticket = db.prepare("SELECT * FROM tickets WHERE channel_id = ? AND status = 'open'")
        .get(interaction.channel.id);

      if (!ticket) {
        return interaction.reply({ embeds: [errorEmbed('This is not an open ticket.')], ephemeral: true });
      }

      const isStaff = interaction.member.roles.cache.has(ROLES.staff)
        || (ROLES.mod && interaction.member.roles.cache.has(ROLES.mod))
        || interaction.member.permissions.has(PermissionFlagsBits.Administrator);
      if (!isStaff) {
        return interaction.reply({ embeds: [errorEmbed('Only staff can claim tickets.')], ephemeral: true });
      }

      if (ticket.claimed_by) {
        return interaction.reply({ embeds: [errorEmbed(`Already claimed by <@${ticket.claimed_by}>.`)], ephemeral: true });
      }

      db.prepare('UPDATE tickets SET claimed_by = ? WHERE channel_id = ?')
        .run(interaction.user.id, interaction.channel.id);

      return interaction.reply({
        embeds: [makeEmbed({ description: `${E.tick} Ticket claimed by ${interaction.user}.` })],
      });
    }

    // ── Close Ticket ───────────────────────────────────────────────────────
    if (interaction.customId === 'ticket_close') {
      const db = getDb();
      const ticket = db.prepare("SELECT * FROM tickets WHERE channel_id = ? AND status = 'open'")
        .get(interaction.channel.id);

      if (!ticket) {
        return interaction.reply({ embeds: [errorEmbed('This is not an open ticket.')], ephemeral: true });
      }

      db.prepare("UPDATE tickets SET status = 'closed' WHERE channel_id = ?")
        .run(interaction.channel.id);

      await interaction.reply({
        embeds: [makeEmbed({ description: `${E.lock} Ticket closed by ${interaction.user}. This channel will be deleted in 5 seconds.` })],
      });

      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
  },
};
