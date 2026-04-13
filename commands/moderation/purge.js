// =purge [amount] — Purge messages from the channel.

const { E, ROLES } = require('../../utils/constants');
const { isLimitedMod } = require('../../utils/helpers');

module.exports = {
  name: 'purge',
  description: 'Purge messages from the channel.',
  async execute(message, args) {
    if (isLimitedMod(message.member)) {
      return message.channel.send({ content: `${E.deny} You can not use this function.` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }
    await message.delete().catch(() => {});

    const allowed = [ROLES.staff].filter(Boolean);
    if (!allowed.some(id => message.member.roles.cache.has(id))) {
      return message.channel.send({ content: `${E.deny} You need a higher role!` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    const amount = parseInt(args[0], 10);
    if (isNaN(amount) || amount < 1) {
      return message.channel.send({ content: `${E.deny} Usage: \`=purge <amount>\`` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    const deleted = await message.channel.bulkDelete(amount, true).catch(() => null);
    if (!deleted) return;

    message.channel.send({ content: `${E.light} ${deleted.size} messages were removed.` })
      .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
  },
};
