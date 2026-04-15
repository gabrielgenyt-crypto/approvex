const { E } = require('../../utils/constants');
const { isStaffOrMod } = require('../../utils/helpers');

module.exports = {
  name: 'remove',
  description: 'Remove a user from the ticket.',
  async execute(message, args) {
    if (!isStaffOrMod(message.member)) return;

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
      return message.channel.send({ content: `${E.deny} Usage: \`=remove @user\` or \`=remove <user_id>\`` });
    }

    await message.channel.permissionOverwrites.delete(target).catch(() => {});
    message.channel.send({ content: `\u274C Removed ${target}` });
  },
};
