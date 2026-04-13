// =bal [address] — Check a Litecoin wallet balance.

const { makeEmbed, errorEmbed } = require('../../utils/embed');
const { E } = require('../../utils/constants');

module.exports = {
  name: 'bal',
  description: 'Check a Litecoin wallet balance.',
  async execute(message, args) {
    const address = args[0];
    if (!address) {
      return message.reply({ embeds: [errorEmbed('Usage: `=bal <litecoin_address>`')] });
    }

    try {
      // Fetch wallet data.
      const walletRes = await fetch(`https://api.blockcypher.com/v1/ltc/main/addrs/${address}/balance`);
      if (!walletRes.ok) {
        return message.reply({ embeds: [errorEmbed('Invalid Litecoin address.')] });
      }
      const wallet = await walletRes.json();

      const balance = wallet.balance / 1e8;
      const unconfirmed = wallet.unconfirmed_balance / 1e8;
      const totalReceived = wallet.total_received / 1e8;

      // Fetch LTC → EUR price.
      const priceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=eur');
      const priceData = await priceRes.json();
      const price = priceData.litecoin.eur;

      const balEur = (balance * price).toFixed(2);
      const unconfEur = (unconfirmed * price).toFixed(2);
      const recvEur = (totalReceived * price).toFixed(2);

      const embed = makeEmbed({ title: `${E.money} Litecoin Wallet` });
      embed.addFields(
        { name: 'Address', value: `\`${address}\``, inline: false },
        { name: `${E.star} Balance`, value: `\u20AC${balEur}`, inline: true },
        { name: `${E.cross} Unconfirmed`, value: `\u20AC${unconfEur}`, inline: true },
        { name: `${E.star} Total Received`, value: `\u20AC${recvEur}`, inline: false },
      );

      message.reply({ embeds: [embed] });
    } catch {
      message.reply({ embeds: [errorEmbed('Failed to fetch wallet data. Try again later.')] });
    }
  },
};
