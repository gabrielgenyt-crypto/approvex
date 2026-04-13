// Handle button and select-menu interactions (ticket panel, self-roles).

const {
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { makeEmbed, errorEmbed } = require('../utils/embed');
const { getDb } = require('../utils/db');
const { E, ROLES } = require('../utils/constants');

/** Friendly labels for each self-role ID (configure in =selfrole). */
const ROLE_LABELS = {};

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction) {
    // -- Self-role select menu --
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

    // -- Button interactions --
    if (!interaction.isButton()) return;

    // -- Create Ticket --
    if (interaction.customId === 'create_ticket') {
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

      // Find or create Tickets category.
      let ticketCategory = guild.channels.cache.find(
        ch => ch.type === ChannelType.GuildCategory && ch.name.toLowerCase() === 'tickets'
      );
      if (!ticketCategory) {
        ticketCategory = await guild.channels.create({
          name: 'Tickets',
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
          ],
        });
      }

      // Build permission overwrites.
      const overwrites = [
        { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
        { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
      ];
      if (interaction.client.user) {
        overwrites.push({ id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages] });
      }
      // Allow staff role to see tickets.
      if (ROLES.staff) {
        overwrites.push({ id: ROLES.staff, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ReadMessageHistory] });
      }

      // Create ticket channel.
      const channel = await guild.channels.create({
        name: `ticket-${user.username}`,
        type: ChannelType.GuildText,
        parent: ticketCategory.id,
        permissionOverwrites: overwrites,
      });

      db.prepare('INSERT INTO tickets (guild_id, channel_id, user_id) VALUES (?, ?, ?)')
        .run(guild.id, channel.id, user.id);

      // Control buttons inside the ticket.
      const controlRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_claim')
          .setLabel('Claim')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setCustomId('ticket_close')
          .setLabel('Close')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔒'),
      );

      await channel.send({
        embeds: [makeEmbed({
          title: `${E.ticket} Ticket Opened`,
          description: [
            `${E.dot} Welcome ${user}, a staff member will be with you shortly.`,
            `${E.arrow} Describe your issue or order below.`,
            `${E.settings} Use \`=ticket close\` or click the button when finished.`,
          ].join('\n'),
        })],
        components: [controlRow],
      });

      interaction.reply({
        embeds: [makeEmbed({ description: `${E.tick} Ticket created: ${channel}` })],
        ephemeral: true,
      });
    }

    // -- Claim Ticket --
    if (interaction.customId === 'ticket_claim') {
      const db = getDb();
      const ticket = db.prepare("SELECT * FROM tickets WHERE channel_id = ? AND status = 'open'")
        .get(interaction.channel.id);

      if (!ticket) {
        return interaction.reply({ embeds: [errorEmbed('This is not an open ticket.')], ephemeral: true });
      }

      // Check staff.
      const isStaff = interaction.member.roles.cache.has(ROLES.staff)
        || interaction.member.permissions.has(PermissionFlagsBits.Administrator);
      if (!isStaff) {
        return interaction.reply({ embeds: [errorEmbed('Only staff can claim tickets.')], ephemeral: true });
      }

      if (ticket.claimed_by) {
        return interaction.reply({ embeds: [errorEmbed(`Already claimed by <@${ticket.claimed_by}>.`)], ephemeral: true });
      }

      db.prepare('UPDATE tickets SET claimed_by = ? WHERE channel_id = ?')
        .run(interaction.user.id, interaction.channel.id);

      interaction.reply({
        embeds: [makeEmbed({ description: `${E.tick} Ticket claimed by ${interaction.user}.` })],
      });
    }

    // -- Close Ticket --
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
