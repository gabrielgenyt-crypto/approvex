const { makeEmbed } = require('../../utils/embed');
const { E } = require('../../utils/constants');
const { isManagerOrHigher } = require('../../utils/helpers');

module.exports = {
  name: 'nuke',
  description: 'Recreate a channel (clone + delete).',
  async execute(message) {
    if (!isManagerOrHigher(message.member)) {
      return message.channel.send({ content: `${E.deny} You need a higher role!` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }
    await message.delete().catch(() => {});

    const target = message.mentions.channels.first() || message.channel;
    const category = target.parent;
    const position = target.position;
    const name = target.name;
    const overwrites = target.permissionOverwrites.cache;
    const topic = target.topic;
    const slowmode = target.rateLimitPerUser;

    await target.delete().catch(() => {});

    const newChannel = await message.guild.channels.create({
      name,
      parent: category ? category.id : undefined,
      position,
      topic,
      rateLimitPerUser: slowmode,
      permissionOverwrites: overwrites.map(o => ({
        id: o.id,
        allow: o.allow.toArray(),
        deny: o.deny.toArray(),
      })),
    });

    newChannel.send({
      embeds: [makeEmbed({
        title: `${E.tool} Channel Nuked`,
        description: `${E.success} Successfully nuked ${newChannel}`,
      })],
    });
  },
};
