// =mytos — Display your personal TOS.

const { makeEmbed } = require('../../utils/embed');
const { getDb } = require('../../utils/db');
const { E, ROLES } = require('../../utils/constants');

module.exports = {
  name: 'mytos',
  description: 'Show your personal Terms of Service.',
  async execute(message) {
    await message.delete().catch(() => {});

    const allowed = [ROLES.staff, ROLES.seller, ROLES.owner].filter(Boolean);
    if (!allowed.some(id => message.member.roles.cache.has(id))) {
      return message.channel.send({
        embeds: [makeEmbed({ description: `${E.cross} You need a seller or staff role.` })],
      }).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    const db = getDb();
    const row = db.prepare("SELECT value FROM seller_config WHERE user_id = ? AND key = 'tos'")
      .get(message.author.id);

    const tosText = row ? row.value : '**No TOS set yet.**';

    message.channel.send({
      embeds: [makeEmbed({
        title: `${E.ticket} Terms of Service`,
        description: tosText,
      })],
    });
  },
};
