// =ping — Bot latency.

const { makeEmbed } = require('../../utils/embed');
const { E } = require('../../utils/constants');

module.exports = {
  name: 'ping',
  description: 'Show bot latency.',
  async execute(message, _args, client) {
    const sent = await message.reply({ embeds: [makeEmbed({ description: `${E.reload} Pinging...` })] });
    const latency = sent.createdTimestamp - message.createdTimestamp;
    sent.edit({ embeds: [makeEmbed({
      title: `${E.star} Pong!`,
      description: [
        `${E.dot} **Bot Latency:** ${latency}ms`,
        `${E.arrow} **API Latency:** ${Math.round(client.ws.ping)}ms`,
      ].join('\n'),
    })] });
  },
};
