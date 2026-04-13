// Prefix command router.

const { errorEmbed } = require('../utils/embed');
const { PREFIX } = require('../utils/constants');

module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;
    if (!message.content.startsWith(PREFIX)) return;

    const fullArgs = message.content.slice(PREFIX.length).trim().split(/\s+/);
    if (fullArgs.length === 0) return;

    let commandName = fullArgs[0].toLowerCase();
    let args = fullArgs.slice(1);

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
      await command.execute(message, args, client);
    } catch (err) {
      console.error(`[CMD] Error in ${commandName}:`, err);
      message.reply({ embeds: [errorEmbed('An error occurred while running that command.')] }).catch(() => {});
    }
  },
};
