const { makeEmbed } = require('../../utils/embed');
const { E } = require('../../utils/constants');
const { isManagerOrHigher } = require('../../utils/helpers');

module.exports = {
  name: 'nuke',
  description: 'Delete every message in the channel.',
  async execute(message) {
    if (!isManagerOrHigher(message.member)) {
      return message.channel.send({ content: `${E.deny} Only managers and owners can use this.` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }
    console.log(`[nuke] Used by ${message.author.tag} (${message.author.id}) in #${message.channel.name}`);
    await message.delete().catch(() => {});

    const channel = message.channel;
    let totalDeleted = 0;
    const now = Date.now();
    const fourteenDays = 14 * 24 * 60 * 60 * 1000;

    // keep fetching until the channel is empty
    while (true) {
      const fetched = await channel.messages.fetch({ limit: 100 });
      if (fetched.size === 0) break;

      const recent = fetched.filter(m => (now - m.createdTimestamp) < fourteenDays);
      const old = fetched.filter(m => (now - m.createdTimestamp) >= fourteenDays);

      if (recent.size > 0) {
        const deleted = await channel.bulkDelete(recent, true).catch(() => null);
        if (deleted) totalDeleted += deleted.size;
      }

      for (const msg of old.values()) {
        await msg.delete().catch(() => {});
        totalDeleted++;
      }

      if (fetched.size < 100) break;
    }

    channel.send({
      embeds: [makeEmbed({
        title: `${E.tool} Channel Nuked`,
        description: `${E.success} Deleted ${totalDeleted} messages from ${channel}`,
      })],
    });
  },
};
