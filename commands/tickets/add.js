const { E } = require('../../utils/constants');
const { isStaffOrMod } = require('../../utils/helpers');

module.exports = {
  name: 'add',
  description: 'Add a user to the ticket.',
  async execute(message) {
    if (!isStaffOrMod(message.member)) return;

    const target = message.mentions.members.first();
    if (!target) return;

    await message.channel.permissionOverwrites.edit(target, { ViewChannel: true, SendMessages: true });
    message.channel.send({ content: `${E.success} ${target}` });
  },
};
