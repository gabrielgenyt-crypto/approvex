// =close — Close the current ticket (move to closed category).

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { makeEmbed } = require('../../utils/embed');
const { E, TICKET_CATS } = require('../../utils/constants');
const { isStaffOrMod } = require('../../utils/helpers');

module.exports = {
  name: 'close',
  description: 'Close the current ticket.',
  async execute(message) {
    if (!isStaffOrMod(message.member)) return;

    if (TICKET_CATS.closed && message.channel.parentId === TICKET_CATS.closed) {
      return message.channel.send({ content: `${E.deny} This ticket is already closed.` });
    }
    if (!message.channel.topic || !message.channel.topic.includes('|')) {
      return message.channel.send({ content: '\u274C Ticket data missing.' });
    }

    const [creatorId] = message.channel.topic.split('|');
    const creator = message.guild.members.cache.get(creatorId);

    if (TICKET_CATS.closed) {
      const closedCat = message.guild.channels.cache.get(TICKET_CATS.closed);
      if (closedCat) await message.channel.edit({ parent: closedCat.id });
    }
    if (creator) await message.channel.permissionOverwrites.delete(creator).catch(() => {});

    const embed = makeEmbed({
      title: `${E.success} Ticket Closed`,
      description: 'This ticket has been moved to the closed category.\n\nWould you like to reopen it?',
      footer: `Closed by ${message.author.tag}`,
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('reopen_ticket').setLabel('Reopen').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('delete_ticket').setLabel('Delete').setStyle(ButtonStyle.Danger),
    );

    message.channel.send({ embeds: [embed], components: [row] });
  },
};
