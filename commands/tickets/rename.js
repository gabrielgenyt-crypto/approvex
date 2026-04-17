const { E } = require('../../utils/constants');
const { isStaffOrMod } = require('../../utils/helpers');

module.exports = {
  name: 'rename',
  description: 'Rename the current channel.',
  async execute(message, args) {
    if (!isStaffOrMod(message.member)) return;

    const name = args.join(' ');
    if (!name) {
      return message.channel.send({ content: `${E.deny} Please provide a name.` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    const cleanName = name.toLowerCase().replace(/\s+/g, '-');
    await message.delete().catch(() => {});
    // Preserve the channel topic so ticket data (userId|ticketId|categoryId) is not lost.
    // Other commands like =vouch and =close depend on it.
    await message.channel.edit({ name: cleanName, topic: message.channel.topic || undefined });
  },
};
