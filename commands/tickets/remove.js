// =remove @user — Remove a user from the current ticket.

const { isStaffOrMod } = require('../../utils/helpers');

module.exports = {
  name: 'remove',
  description: 'Remove a user from the ticket.',
  async execute(message) {
    if (!isStaffOrMod(message.member)) return;

    const target = message.mentions.members.first();
    if (!target) return;

    await message.channel.permissionOverwrites.delete(target).catch(() => {});
    message.channel.send({ content: `\u274C Removed ${target}` });
  },
};
