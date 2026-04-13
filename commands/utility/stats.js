// =stats — Bot statistics.

const { makeEmbed } = require('../../utils/embed');
const { E } = require('../../utils/constants');
const os = require('os');

module.exports = {
  name: 'stats',
  description: 'Show bot statistics.',
  async execute(message, _args, client) {
    const ms = client.uptime;
    const s = Math.floor(ms / 1000) % 60;
    const m = Math.floor(ms / 60000) % 60;
    const h = Math.floor(ms / 3600000) % 24;
    const d = Math.floor(ms / 86400000);

    const memUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);

    message.reply({ embeds: [makeEmbed({
      title: `${E.star} Bot Statistics`,
      description: [
        `${E.dot} **Servers:** ${client.guilds.cache.size}`,
        `${E.general} **Users:** ${client.users.cache.size}`,
        `${E.settings} **Commands:** ${client.commands.size}`,
        `${E.arrow} **Uptime:** ${d}d ${h}h ${m}m ${s}s`,
        `${E.star} **Memory:** ${memUsed} MB`,
        `${E.share} **Node.js:** ${process.version}`,
        `${E.add} **Platform:** ${os.platform()} ${os.arch()}`,
        `${E.tick} **Ping:** ${Math.round(client.ws.ping)}ms`,
      ].join('\n'),
    })] });
  },
};
