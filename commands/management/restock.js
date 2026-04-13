// =restock [item] [howmany] [which ping] — Send a restock announcement embed.

const { makeEmbed, errorEmbed } = require('../../utils/embed');
const { E, ROLES } = require('../../utils/constants');

module.exports = {
  name: 'restock',
  description: 'Announce a restock with item, quantity, and role ping.',
  async execute(message, args) {
    // Staff-only check.
    const isStaff = message.member.roles.cache.has(ROLES.staff)
      || message.member.roles.cache.has(ROLES.owner)
      || message.member.permissions.has('Administrator');
    if (!isStaff) {
      return message.reply({ embeds: [errorEmbed('Only staff can use this command.')] });
    }

    if (args.length < 3) {
      return message.reply({
        embeds: [errorEmbed('Usage: `=restock [item] [howmany] [which ping]`\nExample: `=restock "Discord Nitro" 10 @Restock`')],
      });
    }

    // Parse arguments — support quoted item names.
    let item, quantity, pingArg;
    const raw = args.join(' ');

    // Check for quoted item name.
    const quoteMatch = raw.match(/^"([^"]+)"\s+(\S+)\s+(.+)$/);
    if (quoteMatch) {
      item = quoteMatch[1];
      quantity = quoteMatch[2];
      pingArg = quoteMatch[3].trim();
    } else {
      item = args[0];
      quantity = args[1];
      pingArg = args.slice(2).join(' ');
    }

    // Validate quantity is a number.
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      return message.reply({ embeds: [errorEmbed('Quantity must be a positive number.')] });
    }

    // Resolve the role ping — could be a mention, role name, or role ID.
    let rolePing = pingArg;
    const mentionedRole = message.mentions.roles.first();
    if (mentionedRole) {
      rolePing = `<@&${mentionedRole.id}>`;
    } else {
      // Try to find role by name or ID.
      const role = message.guild.roles.cache.find(
        r => r.name.toLowerCase() === pingArg.toLowerCase() || r.id === pingArg
      );
      if (role) {
        rolePing = `<@&${role.id}>`;
      }
    }

    await message.delete().catch(() => {});

    const embed = makeEmbed({
      title: `${E.rocket} Restock Alert`,
      description: [
        `${E.star} **Item:** ${item}`,
        `${E.add} **Quantity:** ${qty}`,
        '',
        `${E.arrow} Grab yours before they're gone!`,
        `${E.ticket} Open a ticket to purchase.`,
      ].join('\n'),
    });

    await message.channel.send({
      content: rolePing,
      embeds: [embed],
      allowedMentions: { roles: message.mentions.roles.map(r => r.id) },
    });
  },
};
