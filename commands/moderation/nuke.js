// =nuke [#channel] — Recreate a channel (clone + delete).

const { makeEmbed } = require('../../utils/embed');
const { E, ROLES } = require('../../utils/constants');
const { isLimitedMod } = require('../../utils/helpers');

module.exports = {
  name: 'nuke',
  description: 'Recreate a channel (clone + delete).',
  async execute(message) {
    if (isLimitedMod(message.member)) {
      return message.channel.send({ content: `${E.deny} You can not use this function.` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }
    await message.delete().catch(() => {});

    // Role check.
    const allowed = [ROLES.staff].filter(Boolean);
    if (!allowed.some(id => message.member.roles.cache.has(id))) {
      return message.channel.send({ content: `${E.deny} You need a higher role!` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

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
