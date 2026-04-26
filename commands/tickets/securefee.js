const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getDb } = require('../../utils/db');
const { E } = require('../../utils/constants');
const { isManagerOrHigher } = require('../../utils/helpers');

module.exports = {
  slash: true,
  data: new SlashCommandBuilder()
    .setName('securefee')
    .setDescription('Set the maximum exchange amount an exchanger can handle')
    .addUserOption(opt =>
      opt.setName('user').setDescription('The exchanger to configure').setRequired(true),
    )
    .addNumberOption(opt =>
      opt
        .setName('amount')
        .setDescription('Maximum amount in EUR (e.g. 10)')
        .setRequired(true)
        .setMinValue(0),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    if (!isManagerOrHigher(interaction.member)) {
      return interaction.reply({ content: `${E.deny} Only managers and owners can use this command.`, ephemeral: true });
    }

    const target = interaction.options.getUser('user');
    const amount = interaction.options.getNumber('amount');

    const db = getDb();

    if (amount === 0) {
      // Remove the limit entirely
      db.prepare('DELETE FROM exchanger_limits WHERE user_id = ?').run(target.id);
      return interaction.reply({
        content: `${E.success} Removed the security fee limit for ${target}. They can no longer claim tickets (no budget set).`,
      });
    }

    db.prepare(
      'INSERT OR REPLACE INTO exchanger_limits (user_id, max_amount) VALUES (?, ?)',
    ).run(target.id, amount);

    // Show current active claims for context
    const activeSum = db.prepare(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM exchange_claims WHERE exchanger_id = ? AND status = 'active'",
    ).get(target.id);
    const used = activeSum.total;
    const remaining = Math.max(0, amount - used);

    return interaction.reply({
      content: [
        `${E.success} Security fee limit set for ${target}:`,
        `${E.arrowe} **Max budget:** ${amount.toFixed(2)}\u20AC`,
        `${E.arrowe} **Currently used:** ${used.toFixed(2)}\u20AC`,
        `${E.arrowe} **Available:** ${remaining.toFixed(2)}\u20AC`,
      ].join('\n'),
    });
  },
};
