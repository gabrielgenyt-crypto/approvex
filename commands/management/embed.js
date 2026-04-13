// =embed [title] | [description] — Create a custom embed.

const { makeEmbed, errorEmbed } = require('../../utils/embed');

module.exports = {
  name: 'embed',
  description: 'Create a custom embed.',
  async execute(message, args) {
    const full = args.join(' ');
    const parts = full.split('|').map(s => s.trim());
    if (parts.length < 2) {
      return message.reply({ embeds: [errorEmbed('Usage: `=embed Title | Description`')] });
    }

    await message.delete().catch(() => {});
    message.channel.send({ embeds: [makeEmbed({
      title: parts[0],
      description: parts.slice(1).join('\n'),
    })] });
  },
};
