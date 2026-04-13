// =ltc — Display your saved LTC address.

const { makeEmbed } = require('../../utils/embed');
const { getDb } = require('../../utils/db');
const { E, ROLES } = require('../../utils/constants');

module.exports = {
  name: 'ltc',
  description: 'Show your saved LTC address.',
  async execute(message) {
    await message.delete().catch(() => {});

    const allowed = [ROLES.staff, ROLES.seller, ROLES.owner].filter(Boolean);
    if (!allowed.some(id => message.member.roles.cache.has(id))) {
      return message.channel.send({
        embeds: [makeEmbed({ description: `${E.cross} You need a seller or staff role.` })],
      }).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    const db = getDb();
    const row = db.prepare("SELECT value FROM seller_config WHERE user_id = ? AND key = 'ltc'")
      .get(message.author.id);

    if (!row) {
      return message.channel.send({
        embeds: [makeEmbed({ description: `${E.cross} You have not set an LTC address. Use \`=set\` to configure.` })],
      });
    }

    message.channel.send({
      embeds: [makeEmbed({
        title: `${E.star} LTC Address`,
        description: `\`${row.value}\``,
      })],
    });
  },
};
