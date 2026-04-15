const { makeEmbed } = require('../../utils/embed');
const { E } = require('../../utils/constants');
const { safeCalculate } = require('../../utils/helpers');

module.exports = {
  name: 'calc',
  aliases: ['calculate'],
  description: 'Evaluate a math expression.',
  async execute(message, args) {
    await message.delete().catch(() => {});

    const expression = args.join(' ');
    if (!expression) {
      return message.channel.send({ content: `${E.deny} Please provide a calculation.\nExample: \`=calc 5+5\`` });
    }

    const result = safeCalculate(expression);
    if (result === null) {
      return message.channel.send({ content: `${E.deny} Invalid calculation.` });
    }

    const embed = makeEmbed({ title: `${E.tool} Calculator Result` });
    embed.addFields(
      { name: `${E.logs} Expression`, value: `\`${expression}\``, inline: false },
      { name: `${E.light} Result`, value: `\`${result}\``, inline: false },
    );

    message.channel.send({ embeds: [embed] });
  },
};
