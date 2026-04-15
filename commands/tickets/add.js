const { E } = require('../../utils/constants');
const { isStaffOrMod } = require('../../utils/helpers');

module.exports = {
  name: 'add',
  description: 'Add a user to the ticket.',
  async execute(message, args) {
    if (!isStaffOrMod(message.member)) return;

    // try mention first, then fall back to raw user ID
    let target = message.mentions.members.first();

    if (!target && args[0]) {
      const id = args[0].replace(/[<@!>]/g, '');
      if (/^\d{17,20}$/.test(id)) {
        try {
          target = await message.guild.members.fetch(id);
        } catch {
          return message.channel.send({ content: `${E.deny} Couldn't find that user.` });
        }
      }
    }

    if (!target) {
      return message.channel.send({ content: `${E.deny} Usage: \`=add @user\` or \`=add <user_id>\`` });
    }

    await message.channel.permissionOverwrites.edit(target, { ViewChannel: true, SendMessages: true });
    message.channel.send({ content: `${E.success} ${target}` });
  },
};
