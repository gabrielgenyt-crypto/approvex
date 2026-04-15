const { getDb } = require('../../utils/db');
const { E } = require('../../utils/constants');
const { isSellerOrHigher } = require('../../utils/helpers');

module.exports = {
  name: 'ltc',
  description: 'Show your saved LTC address.',
  async execute(message) {
    await message.delete().catch(() => {});
    if (!isSellerOrHigher(message.member)) return;

    const db = getDb();
    const row = db.prepare("SELECT value FROM seller_config WHERE user_id = ? AND key = 'ltc'").get(message.author.id);

    if (!row) {
      return message.channel.send({ content: `${E.deny} You have not set LTC.` });
    }

    message.channel.send({ content: row.value });
  },
};
