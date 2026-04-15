const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { E } = require('../../utils/constants');
const { isStaffOrMod } = require('../../utils/helpers');

module.exports = {
  slash: true,
  data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('Add a user to this ticket')
    .addUserOption(opt =>
      opt.setName('user').setDescription('The member to add').setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    if (!isStaffOrMod(interaction.member)) {
      return interaction.reply({ content: `${E.deny} You need a higher role!`, ephemeral: true });
    }

    const target = interaction.options.getMember('user');
    if (!target) {
      return interaction.reply({ content: `${E.deny} Couldn't find that user in this server.`, ephemeral: true });
    }

    await interaction.channel.permissionOverwrites.edit(target, { ViewChannel: true, SendMessages: true });
    return interaction.reply({ content: `${E.success} ${target}` });
  },
};
