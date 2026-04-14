// =vouch — Move ticket to vouch category and give customer role.

const { E, TICKET_CATS, ROLES } = require('../../utils/constants');
const { isStaffOrMod } = require('../../utils/helpers');

module.exports = {
  name: 'vouch',
  description: 'Move ticket to vouch category.',
  async execute(message) {
    if (!isStaffOrMod(message.member)) return;

    const channel = message.channel;
    if (!channel.topic || !channel.topic.includes('|')) {
      return channel.send({ content: '\u274C Ticket data missing.' });
    }

    const [creatorId] = channel.topic.split('|');
    const creator = message.guild.members.cache.get(creatorId);
    if (!creator) {
      return channel.send({ content: '\u274C Ticket creator not found.' });
    }

    // Move to vouch category.
    if (!TICKET_CATS.vouch) {
      return channel.send({ content: '\u274C Vouch category not configured.' });
    }
    const vouchCat = message.guild.channels.cache.get(TICKET_CATS.vouch);
    if (!vouchCat) {
      return channel.send({ content: '\u274C Vouch category not found.' });
    }

    const newName = `vouch-${creator.user.username}`.toLowerCase().replace(/\s+/g, '-');
    await channel.edit({ name: newName, parent: vouchCat.id });

    // Give customer role.
    if (ROLES.customer) {
      const customerRole = message.guild.roles.cache.get(ROLES.customer);
      if (customerRole && !creator.roles.cache.has(ROLES.customer)) {
        await creator.roles.add(customerRole).catch(() => {});
        await channel.send({ content: `${E.success} Successfully given ${creator} the **Customer role**.` });
      } else {
        await channel.send({ content: `${E.notify} ${creator} already has the **Customer role**.` });
      }
    }

    // Vouch message.
    channel.send({
      content: [
        `\uD83D\uDC4D\uD83C\uDFFC  **Please leave a vouch for your purchase & react if we are legit!**`,
        `${E.arrowe} <#1493260009235021974>`,
        `${E.arrowe} <#1493259438264549386>`,
      ].join('\n'),
    });
  },
};
