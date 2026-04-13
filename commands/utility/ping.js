// =ping — Show bot latency.

const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'ping',
  description: 'Show bot latency.',
  async execute(message, _args, client) {
    const sent = await message.channel.send({ content: '\uD83C\uDFD3 Pinging...' });
    const response = sent.createdTimestamp - message.createdTimestamp;
    const api = Math.round(client.ws.ping);

    const embed = new EmbedBuilder()
      .setTitle('Bot Latency')
      .setColor(0x2b2d31)
      .addFields(
        { name: 'API Latency', value: `${api}ms`, inline: true },
        { name: 'Response Time', value: `${response}ms`, inline: true },
      )
      .setTimestamp();

    sent.edit({ content: null, embeds: [embed] });
  },
};
