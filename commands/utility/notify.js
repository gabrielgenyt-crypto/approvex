// =notify @user — DM a user with a link to the current channel.

const { makeEmbed, errorEmbed } = require('../../utils/embed');
const { E, ROLES } = require('../../utils/constants');

module.exports = {
  name: 'notify',
  description: 'DM a user with a link to this channel.',
  async execute(message) {
    await message.delete().catch(() => {});

    // Require staff or mod role.
    const allowed = [ROLES.staff, ROLES.mod, ROLES.owner].filter(Boolean);
    if (!allowed.some(id => message.member.roles.cache.has(id))) {
      return message.channel.send({
        embeds: [errorEmbed('You need a staff or mod role.')],
      }).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    const target = message.mentions.members.first();
    if (!target) {
      return message.channel.send({
        embeds: [errorEmbed('Usage: `=notify @user`')],
      }).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    const link = `https://discord.com/channels/${message.guild.id}/${message.channel.id}`;

    try {
      await target.send({
        embeds: [makeEmbed({ description: `${E.announce} You have been notified in ${link}` })],
      });
      const msg = await message.channel.send({
        embeds: [makeEmbed({ description: `${E.tick} ${target} has been notified.` })],
      });
      setTimeout(() => msg.delete().catch(() => {}), 5000);
    } catch {
      const msg = await message.channel.send({
        embeds: [errorEmbed('Could not send DM to that user.')],
      });
      setTimeout(() => msg.delete().catch(() => {}), 5000);
    }
  },
};
