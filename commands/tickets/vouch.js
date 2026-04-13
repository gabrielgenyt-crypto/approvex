// =ticket vouch — Move ticket to vouch category and give customer role.

const { makeEmbed, errorEmbed } = require('../../utils/embed');
const { getDb } = require('../../utils/db');
const { E, ROLES, TICKET_CATEGORIES, CHANNELS } = require('../../utils/constants');

module.exports = {
  name: 'ticket vouch',
  description: 'Move ticket to vouch category and give customer role.',
  async execute(message) {
    const db = getDb();
    const ticket = db.prepare("SELECT * FROM tickets WHERE channel_id = ? AND status = 'open'")
      .get(message.channel.id);

    if (!ticket) return message.reply({ embeds: [errorEmbed('This is not an open ticket channel.')] });

    // Require staff or mod.
    const isStaff = message.member.roles.cache.has(ROLES.staff)
      || (ROLES.mod && message.member.roles.cache.has(ROLES.mod));
    if (!isStaff) {
      return message.reply({ embeds: [errorEmbed('Only staff can use this command.')] });
    }

    const creator = await message.guild.members.fetch(ticket.user_id).catch(() => null);
    if (!creator) {
      return message.reply({ embeds: [errorEmbed('Ticket creator not found in this server.')] });
    }

    // Move to vouch category.
    const vouchCategoryId = TICKET_CATEGORIES.vouch;
    if (vouchCategoryId) {
      const vouchCategory = message.guild.channels.cache.get(vouchCategoryId);
      if (vouchCategory) {
        const newName = `vouch-${creator.user.username}`.toLowerCase().replace(/\s+/g, '-');
        await message.channel.edit({ name: newName, parent: vouchCategory.id });
      } else {
        return message.reply({ embeds: [errorEmbed('Vouch category not found. Check VOUCH_CATEGORY_ID in .env.')] });
      }
    } else {
      return message.reply({ embeds: [errorEmbed('Vouch category not configured. Set VOUCH_CATEGORY_ID in .env.')] });
    }

    // Give customer role.
    if (ROLES.customer) {
      const customerRole = message.guild.roles.cache.get(ROLES.customer);
      if (customerRole && !creator.roles.cache.has(ROLES.customer)) {
        await creator.roles.add(customerRole).catch(() => {});
        await message.channel.send({
          embeds: [makeEmbed({ description: `${E.tick} Given ${creator} the **Customer** role.` })],
        });
      } else if (customerRole) {
        await message.channel.send({
          embeds: [makeEmbed({ description: `${E.dot} ${creator} already has the **Customer** role.` })],
        });
      }
    }

    // Vouch prompt.
    const vouchChannel = CHANNELS.vouch ? `<#${CHANNELS.vouch}>` : 'the vouch channel';
    await message.channel.send({
      embeds: [makeEmbed({
        title: `${E.star} Leave a Vouch`,
        description: [
          `${E.arrow} Please leave a vouch for your purchase!`,
          `${E.dot} Head to ${vouchChannel} and use \`=vouch @seller message\``,
        ].join('\n'),
      })],
    });
  },
};
