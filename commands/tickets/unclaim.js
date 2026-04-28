const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { makeEmbed } = require('../../utils/embed');
const { getDb } = require('../../utils/db');
const { E, ROLES } = require('../../utils/constants');
const { isExchanger, isStaffOrMod } = require('../../utils/helpers');

module.exports = {
  name: 'unclaim',
  description: 'Unclaim an exchange ticket you accidentally claimed.',
  async execute(message) {
    if (!isExchanger(message.member) && !isStaffOrMod(message.member)) {
      return message.channel.send({ content: `${E.deny} Only exchangers or staff can use this command.` });
    }

    const channel = message.channel;
    if (!channel.topic || !channel.topic.includes('|')) {
      return channel.send({ content: `${E.deny} Ticket data missing.` });
    }

    const [_creatorId, ticketId] = channel.topic.split('|');
    const db = getDb();

    const claim = db.prepare(
      'SELECT exchanger_id FROM exchange_claims WHERE ticket_id = ? AND status = ?',
    ).get(ticketId, 'active');

    if (!claim) {
      return channel.send({ content: `${E.deny} This ticket is not currently claimed.` });
    }

    // Only the exchanger who claimed it (or staff) can unclaim
    if (claim.exchanger_id !== message.author.id && !isStaffOrMod(message.member)) {
      return channel.send({ content: `${E.deny} Only the exchanger who claimed this ticket can unclaim it.` });
    }

    // Remove the claim from the database
    db.prepare(
      "UPDATE exchange_claims SET status = 'unclaimed' WHERE ticket_id = ? AND status = 'active'",
    ).run(ticketId);

    // Restore exchanger role view access
    if (ROLES.exchanger) {
      await channel.permissionOverwrites.edit(ROLES.exchanger, {
        ViewChannel: true,
        SendMessages: false,
      });
    }

    // Remove the claiming exchanger's personal permission overwrite
    const exchanger = message.guild.members.cache.get(claim.exchanger_id);
    if (exchanger) {
      await channel.permissionOverwrites.delete(exchanger).catch(() => {});
    }

    // Send a new claim embed with an active claim button
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

    channel.send({ content: `${E.success} <@${claim.exchanger_id}> has unclaimed this ticket. It is now available for another exchanger.` });
  },
};
