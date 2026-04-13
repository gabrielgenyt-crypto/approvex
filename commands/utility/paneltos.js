// =paneltos — Send the TOS panel with a dropdown for each product category.

const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');
const { makeEmbed } = require('../../utils/embed');

module.exports = {
  name: 'paneltos',
  description: 'Send the TOS panel.',
  async execute(message) {
    const embed = makeEmbed({
      title: '\uD83D\uDCDC Terms of Service Panel',
      description: [
        'Please read our Terms of Service carefully.',
        '',
        'Select a category below to view specific rules.',
        '',
        'If you have questions, contact support before purchasing.',
      ].join('\n'),
    });

    const menu = new StringSelectMenuBuilder()
      .setCustomId('tos_panel_select')
      .setPlaceholder('Select a TOS category...')
      .addOptions([
        { label: 'General TOS',     value: 'general',   emoji: '\uD83D\uDCDC' },
        { label: 'Nitro',           value: 'nitro',     emoji: '\uD83C\uDF81' },
        { label: 'Discord Members', value: 'members',   emoji: '\uD83D\uDC65' },
        { label: 'Socials',         value: 'socials',   emoji: '\uD83D\uDCF1' },
        { label: 'Minecraft',       value: 'minecraft',  emoji: '\u26CF\uFE0F' },
        { label: 'Server Boosts',   value: 'boosts',    emoji: '\uD83D\uDE80' },
        { label: 'Accounts',        value: 'accounts',  emoji: '\uD83D\uDD10' },
        { label: 'Fortnite',        value: 'fortnite',  emoji: '\uD83D\uDEE0\uFE0F' },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);
    message.channel.send({ embeds: [embed], components: [row] });
  },
};
