// =bal [address] — Check a Litecoin wallet balance.

const { EmbedBuilder } = require('discord.js');
const { EMBED_COLOR } = require('../../utils/constants');

module.exports = {
  name: 'bal',
  description: 'Check a Litecoin wallet balance.',
  async execute(message, args) {
    const address = args[0];
    if (!address) {
      return message.channel.send({ content: '\u274C Usage: `=bal <litecoin_address>`' });
    }

    try {
      const walletRes = await fetch(`https://api.blockcypher.com/v1/ltc/main/addrs/${address}/balance`);
      if (!walletRes.ok) {
        return message.channel.send({ content: '\u274C Invalid Litecoin address.' });
      }
      const wallet = await walletRes.json();

      const balance = wallet.balance / 1e8;
      const unconfirmed = wallet.unconfirmed_balance / 1e8;
      const totalReceived = wallet.total_received / 1e8;

      const priceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=eur');
      const priceData = await priceRes.json();
      const price = priceData.litecoin.eur;

      const embed = new EmbedBuilder()
        .setTitle('<a:Litecoin:1479989839536586894> Litecoin Wallet')
        .setColor(EMBED_COLOR)
        .addFields(
          { name: 'Address', value: `\`${address}\``, inline: false },
          { name: '<:Elite:1477777862177194186> Balance', value: `\u20AC${(balance * price).toFixed(2)}`, inline: true },
          { name: '<:warningg:1478489222657740800> Unconfirmed', value: `\u20AC${(unconfirmed * price).toFixed(2)}`, inline: true },
          { name: '<:Elite:1477777862177194186> Total Received', value: `\u20AC${(totalReceived * price).toFixed(2)}`, inline: false },
        )
        .setFooter({ text: 'Approve crypto System' })
        .setTimestamp();

      message.channel.send({ embeds: [embed] });
    } catch {
      message.channel.send({ content: '\u274C Failed to fetch wallet data.' });
    }
  },
};
