// =tos — Send the Terms of Service embed tailored for digital goods.

const { makeEmbed } = require('../../utils/embed');
const { E, BANNER } = require('../../utils/constants');

module.exports = {
  name: 'tos',
  description: 'Send the Terms of Service embed.',
  async execute(message) {
    await message.delete().catch(() => {});

    const embed = makeEmbed({
      title: `${E.star} ApproveX — Terms of Service`,
      image: BANNER,
    });

    embed.setDescription([
      `${E.money} **1. Orders & Pricing**`,
      'All prices are listed in EUR/USD unless stated otherwise. Prices may vary depending on the product. Custom quotes are provided before purchase.',
      '',
      `${E.share} **2. Payments**`,
      'We accept PayPal, Crypto (BTC, ETH, LTC), and other agreed methods. Full payment is required before delivery. Chargebacks or disputes will result in a permanent ban.',
      '',
      `${E.arrow} **3. Delivery**`,
      'Digital goods (Discord Nitro, Boosts, Netflix, Spotify, etc.) are delivered after payment confirmation. Delivery times vary — we will keep you updated in your ticket.',
      '',
      `${E.settings} **4. Product Warranty**`,
      'Replacement policies depend on the product type. Check with staff before purchasing for warranty details. Some products are non-replaceable after delivery.',
      '',
      `${E.cross} **5. Refunds**`,
      'Refunds are only issued if we fail to deliver the agreed product. No refunds after delivery or usage. Partial refunds may be considered case-by-case.',
      '',
      `${E.lock} **6. Account Safety**`,
      'We are not responsible for accounts being banned or suspended after delivery. Use products at your own risk. Follow all platform terms of service.',
      '',
      `${E.ticket} **7. Support**`,
      'Support is provided through our ticket system. We aim to respond within 24 hours. Abuse of the support system may result in restricted access.',
      '',
      `${E.star} **8. Conduct**`,
      'Treat all staff and members with respect. Harassment, spam, or disruptive behaviour will result in removal from the server and a permanent blacklist.',
      '',
      `${E.announce} **9. Confidentiality**`,
      'We do not share your personal information or transaction details with third parties. All communications are kept confidential.',
      '',
      `${E.tick} **10. Agreement**`,
      'By purchasing any product or remaining in this server, you agree to these terms. We reserve the right to update these terms at any time.',
    ].join('\n'));

    message.channel.send({ embeds: [embed] });
  },
};
