const { E, ROLES } = require('../../utils/constants');

module.exports = {
  name: 'crole',
  description: 'Give the client role to a user (mod only).',
  async execute(message) {
    await message.delete().catch(() => {});

    if (!ROLES.mod || !message.member.roles.cache.has(ROLES.mod)) {
      return message.channel.send({ content: `${E.deny} You need moderator role!` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }
    if (ROLES.staff && message.member.roles.cache.has(ROLES.staff)) {
      return message.channel.send({ content: `${E.deny} Staff should use \`=role\` instead.` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    const target = message.mentions.members.first();
    if (!target) {
      return message.channel.send({ content: `${E.deny} Usage: \`=crole @user\`` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    if (!ROLES.customer) {
      return message.channel.send({ content: `${E.deny} Client role not configured.` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    const role = message.guild.roles.cache.get(ROLES.customer);
    if (!role) {
      return message.channel.send({ content: `${E.deny} Client role not found.` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    try {
      await target.roles.add(role);
      message.channel.send({ content: `${E.success} Successfully given ${role} to ${target}` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    } catch {
      message.channel.send({ content: `${E.deny} Failed to give role.` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }
  },
};
