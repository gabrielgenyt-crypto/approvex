// =rules — Send server rules embed.

const { makeEmbed } = require('../../utils/embed');
const { E, BANNER } = require('../../utils/constants');

module.exports = {
  name: 'rules',
  description: 'Send server rules embed.',
  async execute(message) {
    await message.delete().catch(() => {});

    const embed = makeEmbed({
      title: `${E.star} Server Rules`,
      image: BANNER,
    });

    embed.setDescription([
      `${E.dot} **1.** Be respectful to all members and staff.`,
      `${E.lock} **2.** No sharing of personal information.`,
      `${E.cross} **3.** No spamming, flooding, or excessive pinging.`,
      `${E.announce} **4.** No advertising without permission.`,
      `${E.settings} **5.** Follow Discord's Terms of Service and Community Guidelines.`,
      `${E.star} **6.** No NSFW content of any kind.`,
      `${E.share} **7.** Use the correct channels for their intended purpose.`,
      `${E.ticket} **8.** Do not abuse the ticket system.`,
      `${E.arrow} **9.** Staff decisions are final — appeal via tickets.`,
      `${E.money} **10.** No scamming or fraudulent activity. Instant ban.`,
      `${E.rocket} **11.** Do not resell products purchased here without permission.`,
      `${E.tick} **12.** Have fun and enjoy the community!`,
    ].join('\n'));

    message.channel.send({ embeds: [embed] });
  },
};
