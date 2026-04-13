// =convert [from] [to] [amount] — Convert between EUR and USD.

const { makeEmbed } = require('../../utils/embed');
const { E } = require('../../utils/constants');

const CURRENCY_MAP = { '\u20AC': 'EUR', '$': 'USD' };

module.exports = {
  name: 'convert',
  aliases: ['co'],
  description: 'Convert between EUR and USD.',
  async execute(message, args) {
    await message.delete().catch(() => {});

    const [fromRaw, toRaw, amountRaw] = args;
    if (!fromRaw || !toRaw || !amountRaw) {
      return message.channel.send({ content: `${E.deny} Wrong usage.\nExample: \`=convert \u20AC $ 10\`` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 6000));
    }

    const base = CURRENCY_MAP[fromRaw];
    const target = CURRENCY_MAP[toRaw];
    const amount = parseFloat(amountRaw);

    if (!base || !target || isNaN(amount)) {
      return message.channel.send({ content: `${E.deny} Only \u20AC and $ are supported.` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 6000));
    }

    try {
      const res = await fetch(`https://api.frankfurter.app/latest?amount=${amount}&from=${base}&to=${target}`);
      const data = await res.json();
      const result = data.rates[target];

      const embed = makeEmbed({ title: `${E.exchange} Currency Conversion` });
      embed.addFields(
        { name: 'From', value: `\`${amount} ${fromRaw}\``, inline: true },
        { name: 'To', value: `\`${Math.round(result * 100) / 100} ${toRaw}\``, inline: true },
      );

      message.channel.send({ embeds: [embed] });
    } catch {
      message.channel.send({ content: `${E.deny} Failed to fetch exchange rate.` });
    }
  },
};
