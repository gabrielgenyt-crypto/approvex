// =uptime — Bot uptime.

const { makeEmbed } = require('../../utils/embed');
const { E } = require('../../utils/constants');

module.exports = {
  name: 'uptime',
  description: 'Show bot uptime.',
  async execute(message, _args, client) {
    const ms = client.uptime;
    const s = Math.floor(ms / 1000) % 60;
    const m = Math.floor(ms / 60000) % 60;
    const h = Math.floor(ms / 3600000) % 24;
    const d = Math.floor(ms / 86400000);

    message.reply({ embeds: [makeEmbed({
      title: `${E.star} Uptime`,
      description: `${E.dot} **${d}d ${h}h ${m}m ${s}s**`,
    })] });
  },
};
