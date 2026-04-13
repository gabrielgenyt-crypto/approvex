// =notify @user — DM a user with a link to the current channel.

const { E } = require('../../utils/constants');
const { isStaffOrMod } = require('../../utils/helpers');

module.exports = {
  name: 'notify',
  description: 'DM a user with a link to this channel.',
  async execute(message) {
    await message.delete().catch(() => {});
    if (!isStaffOrMod(message.member)) return;

    const target = message.mentions.members.first();
    if (!target) {
      return message.channel.send({ content: `${E.deny} Usage: \`=notify @user\`` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    const link = `https://discord.com/channels/${message.guild.id}/${message.channel.id}`;

    try {
      await target.send({ content: `${E.notify} You have been notified in ${link}` });
      message.channel.send({ content: `${E.success} User notified successfully.` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    } catch {
      message.channel.send({ content: `${E.deny} Could not send DM to the user.` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }
  },
};
