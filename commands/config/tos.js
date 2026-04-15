const { makeEmbed } = require('../../utils/embed');
const { getDb } = require('../../utils/db');
const { E } = require('../../utils/constants');
const { isSellerOrHigher } = require('../../utils/helpers');

module.exports = {
  name: 'tos',
  description: 'Show your personal Terms of Service.',
  async execute(message) {
    await message.delete().catch(() => {});
    if (!isSellerOrHigher(message.member)) return;

    const db = getDb();
    const row = db.prepare("SELECT value FROM seller_config WHERE user_id = ? AND key = 'tos'").get(message.author.id);

    const tosText = row ? row.value : '\u274C **NO TOS YET!**';

    const embed = makeEmbed({ title: `${E.support} Terms of Service` });
    embed.addFields({ name: 'Terms of Service', value: tosText, inline: false });

    message.channel.send({ embeds: [embed] });
  },
};
