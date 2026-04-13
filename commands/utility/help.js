// =help — List all commands (categorized embed).

const { makeEmbed } = require('../../utils/embed');
const { E } = require('../../utils/constants');
const fs = require('fs');
const path = require('path');

const CATEGORIES = {
  moderation: { emoji: E.lock, label: 'Moderation' },
  crypto:     { emoji: E.money, label: 'Sales & Vouches' },
  management: { emoji: E.settings, label: 'Server Management' },
  tickets:    { emoji: E.ticket, label: 'Ticket System' },
  utility:    { emoji: E.general, label: 'Utility' },
};

module.exports = {
  name: 'help',
  description: 'List all commands.',
  async execute(message) {
    const embed = makeEmbed({
      title: `${E.star} ApproveX — Commands`,
    });

    const commandsRoot = path.join(__dirname, '..');

    for (const [folder, meta] of Object.entries(CATEGORIES)) {
      const dirPath = path.join(commandsRoot, folder);
      if (!fs.existsSync(dirPath)) continue;

      const cmds = fs.readdirSync(dirPath)
        .filter(f => f.endsWith('.js'))
        .map(f => {
          const cmd = require(path.join(dirPath, f));
          return `\`=${cmd.name}\` — ${cmd.description}`;
        });

      embed.addFields({
        name: `${meta.emoji} ${meta.label}`,
        value: cmds.join('\n') || 'None',
        inline: false,
      });
    }

    message.reply({ embeds: [embed] });
  },
};
