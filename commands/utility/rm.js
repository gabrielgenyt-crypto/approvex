const { makeEmbed } = require('../../utils/embed');
const { E } = require('../../utils/constants');
const { parseTime } = require('../../utils/helpers');

module.exports = {
  name: 'rm',
  description: 'Set a reminder timer.',
  async execute(message, args) {
    await message.delete().catch(() => {});

    const timeStr = args[0];
    if (!timeStr) {
      return message.channel.send({ content: `${E.deny} Usage: \`=rm 5m / 10s / 2h / 1d\`` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    const seconds = parseTime(timeStr);
    if (seconds === null) {
      return message.channel.send({ content: `${E.deny} Invalid time format. Use s/m/h/d` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    const channelLink = `https://discord.com/channels/${message.guild.id}/${message.channel.id}`;

    const embed = makeEmbed({
      title: `${E.time} Reminder Set`,
      description: `\u23F0 Your reminder has been set for \`${timeStr}\`.\nI will notify you when it's done.`,
    });
    message.channel.send({ embeds: [embed] })
      .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));

    setTimeout(async () => {
      // DM the user.
      try {
        await message.author.send({ content: `${E.notify} Your timer is now done!\nGo to: ${channelLink}` });
      } catch { /* DMs may be closed */ }

      // Channel message.
      const doneEmbed = makeEmbed({
        title: `${E.success} Timer Finished`,
        description: `${message.author} your timer is now done!\n\n${E.time} Created: \`${timeStr}\``,
      });
      message.channel.send({ embeds: [doneEmbed] }).catch(() => {});
    }, seconds * 1000);
  },
};
