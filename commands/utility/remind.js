// =rm [time] — Set a reminder (e.g. =rm 5m, =rm 10s, =rm 2h, =rm 1d).

const { makeEmbed, errorEmbed } = require('../../utils/embed');
const { E } = require('../../utils/constants');

const UNITS = { s: 1, m: 60, h: 3600, d: 86400 };

function parseTime(str) {
  const match = str.match(/^(\d+)([smhd])$/i);
  if (!match) return null;
  return parseInt(match[1], 10) * UNITS[match[2].toLowerCase()];
}

module.exports = {
  name: 'rm',
  description: 'Set a reminder timer.',
  async execute(message, args) {
    await message.delete().catch(() => {});

    const timeStr = args[0];
    if (!timeStr) {
      return message.channel.send({
        embeds: [errorEmbed('Usage: `=rm 5m` / `=rm 10s` / `=rm 2h` / `=rm 1d`')],
      }).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    const seconds = parseTime(timeStr);
    if (seconds === null) {
      return message.channel.send({
        embeds: [errorEmbed('Invalid time format. Use s/m/h/d (e.g. `5m`).')],
      }).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    const channelLink = `https://discord.com/channels/${message.guild.id}/${message.channel.id}`;

    const setEmbed = makeEmbed({
      title: `${E.settings} Reminder Set`,
      description: `${E.dot} Your reminder has been set for \`${timeStr}\`.\nI will notify you when it's done.`,
    });
    const setMsg = await message.channel.send({ embeds: [setEmbed] });
    setTimeout(() => setMsg.delete().catch(() => {}), 5000);

    setTimeout(async () => {
      // DM the user.
      try {
        await message.author.send({
          embeds: [makeEmbed({ description: `${E.announce} Your timer is done!\nGo to: ${channelLink}` })],
        });
      } catch {
        // DMs may be closed — fall through to channel message.
      }

      // Channel message.
      message.channel.send({
        embeds: [makeEmbed({
          title: `${E.tick} Timer Finished`,
          description: `${message.author} your timer is done!\n\n${E.settings} Duration: \`${timeStr}\``,
        })],
      }).catch(() => {});
    }, seconds * 1000);
  },
};
