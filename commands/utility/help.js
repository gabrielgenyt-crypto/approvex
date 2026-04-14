// =help — Show the help panel with a 3-page dropdown.

const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');
const { makeEmbed } = require('../../utils/embed');
const { E } = require('../../utils/constants');

module.exports = {
  name: 'help',
  description: 'Show the help panel.',
  async execute(message) {
    const embed = makeEmbed({
      title: `${E.tool} Approve Help Panel`,
      description: [
        'Welcome to the **Approve Help System**',
        '',
        'Use the dropdown below to view commands:',
        '',
        `${E.tool} Owner Commands`,
        `${E.notify} Manager Commands`,
        `${E.support} Moderator Commands`,
        '',
        'Only you will see the selected page.',
      ].join('\n'),
    });

    const menu = new StringSelectMenuBuilder()
      .setCustomId('help_select')
      .setPlaceholder('Select a help category...')
      .addOptions([
        { label: 'Overview', value: 'overview', emoji: '\uD83D\uDCD8', description: 'General bot overview' },
        { label: 'Owner Commands', value: 'admin', emoji: '\uD83D\uDEE0\uFE0F', description: 'Owner only commands' },
        { label: 'Manager Commands', value: 'manager', emoji: '\uD83D\uDD11', description: 'Manager & Owner commands' },
        { label: 'Moderator Commands', value: 'mod', emoji: '\uD83D\uDEE1\uFE0F', description: 'Moderator commands' },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);
    message.channel.send({ embeds: [embed], components: [row] });
  },
};
