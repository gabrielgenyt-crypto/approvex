const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { isStaff } = require('../../utils/helpers');

const VERIFY_URL = 'https://discord.com/oauth2/authorize?client_id=1463894020701818963&redirect_uri=https://restorecord.com/api/callback&response_type=code&scope=identify+guilds.join&state=1400506341990334534&prompt=none';

module.exports = {
  name: 'verify',
  description: 'Send the verification panel.',
  async execute(message) {
    if (!isStaff(message.member)) return;
    await message.delete().catch(() => {});

    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setDescription('Please **verify** using the button below.\u{1F447}\n\u2022 We are trusted and can guarantee by verifying you are safe\n\u2022 We do this verification to ensure we can bring you back if our server gets deleted\n\u2022 We have over 6000+ vouches so you are in safe hands');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Authorize')
        .setStyle(ButtonStyle.Link)
        .setURL(VERIFY_URL)
        .setEmoji('\u2705'),
    );

    message.channel.send({ embeds: [embed], components: [row] });
  },
};
