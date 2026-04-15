const { E } = require('../../utils/constants');
const { isManagerOrHigher } = require('../../utils/helpers');

module.exports = {
  name: 'purge',
  description: 'Purge messages from the channel.',
  async execute(message, args) {
    if (!isManagerOrHigher(message.member)) {
      return message.channel.send({ content: `${E.deny} You need a higher role!` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }
    await message.delete().catch(() => {});

    const amount = parseInt(args[0], 10);
    if (isNaN(amount) || amount < 1) {
      return message.channel.send({ content: `${E.deny} Usage: \`=purge <amount>\`` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    let remaining = amount;
    let totalDeleted = 0;

    while (remaining > 0) {
      const batch = Math.min(remaining, 100);
      const fetched = await message.channel.messages.fetch({ limit: batch });
      if (fetched.size === 0) break;

      // split into bulk-deletable (<14 days) and old ones
      const now = Date.now();
      const fourteenDays = 14 * 24 * 60 * 60 * 1000;
      const recent = fetched.filter(m => (now - m.createdTimestamp) < fourteenDays);
      const old = fetched.filter(m => (now - m.createdTimestamp) >= fourteenDays);

      if (recent.size > 0) {
        const deleted = await message.channel.bulkDelete(recent, true).catch(() => null);
        if (deleted) totalDeleted += deleted.size;
      }

      // old messages have to go one by one
      for (const msg of old.values()) {
        await msg.delete().catch(() => {});
        totalDeleted++;
      }

      remaining -= fetched.size;
      if (fetched.size < batch) break;
    }

    message.channel.send({ content: `${E.light} ${totalDeleted} messages were removed.` })
      .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
  },
};
