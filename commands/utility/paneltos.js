const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { makeEmbed } = require('../../utils/embed');

const VERIFY_URL = 'https://discord.com/oauth2/authorize?client_id=1495406522375602326&redirect_uri=https://restorecord.com/api/callback&response_type=code&scope=identify+guilds.join&state=1493233742007894168&prompt=none';

module.exports = {
  name: 'paneltos',
  description: 'Send the TOS panel.',
  async execute(message) {
    await message.delete().catch(() => {});

    const embed = makeEmbed({
      title: '\uD83D\uDCDC Terms of Service (TOS)',
      description: [
        'By purchasing any product from this server, you automatically agree to the following terms:',
        '',
        '\u2022 **No Refunds** : All sales are final. Refunds will not be issued once a product has been delivered.',
        '\u2022 **Payment**: Payments must be completed in full before receiving any product or service.',
        '\u2022 **Replacement**: We provide replacements if the product issue was from our side.',
        '\u2022 **Responsibility**: We are not responsible for any misuse of our products.',
        '\u2022 **Revoke Waves**: Any products revoked on a massive revoke wave will not be reimbursed.',
        '\u2022 **Changes to TOS**: We reserve the right to update these terms at any time without prior notice.',
        '',
        'Please click the dropdown below to see our ToS for each product/service.',
        '',
        'If you have any questions, please contact support before purchasing.',
      ].join('\n'),
    });

    const menu = new StringSelectMenuBuilder()
      .setCustomId('tos_panel_select')
      .setPlaceholder('Select a TOS category...')
      .addOptions([
        { label: 'Nitro',           value: 'nitro',     emoji: { id: '1494697983806013520', name: 'nitro',        animated: true } },
        { label: 'Discord Members', value: 'members',   emoji: { id: '1493274578909401199', name: 'member' } },
        { label: 'Socials',         value: 'socials',   emoji: { id: '1494710867881627688', name: 'tiktok' } },
        { label: 'Minecraft',       value: 'minecraft', emoji: { id: '1493273365073498273', name: 'minecraft' } },
        { label: 'Server Boosts',   value: 'boosts',    emoji: { id: '1492493880220979351', name: 'server_boost', animated: true } },
        { label: 'Accounts',        value: 'accounts',  emoji: { id: '1493274486517010442', name: 'netflix' } },
      ]);

    const selectRow = new ActionRowBuilder().addComponents(menu);

    const verifyRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Verify')
        .setStyle(ButtonStyle.Link)
        .setURL(VERIFY_URL),
    );

    message.channel.send({ embeds: [embed], components: [selectRow, verifyRow] });
  },
};
