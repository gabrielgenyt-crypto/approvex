// =calc [expression] — Evaluate a math expression.

const { makeEmbed, errorEmbed } = require('../../utils/embed');
const { E } = require('../../utils/constants');

/**
 * Safely evaluate a basic math expression.
 * Only allows digits, operators, parentheses, dots, spaces, and percent signs.
 */
function safeCalculate(expr) {
  if (!/^[0-9+\-*/().% ]+$/.test(expr)) return null;

  try {
    // Handle percentage after + or - (e.g. "100+10%" => "100+(100*10/100)")
    let processed = expr.replace(
      /(\d+\.?\d*)\s*([+-])\s*(\d+\.?\d*)%/g,
      (_m, base, op, pct) => `${base}${op}(${base}*${pct}/100)`
    );

    // Standalone percent (e.g. "50%" => "(50/100)")
    processed = processed.replace(/(\d+\.?\d*)%/g, '($1/100)');

    // eslint-disable-next-line no-eval
    const result = eval(processed);
    if (typeof result !== 'number' || !isFinite(result)) return null;
    return Math.round(result * 1e6) / 1e6;
  } catch {
    return null;
  }
}

module.exports = {
  name: 'calc',
  aliases: ['calculate'],
  description: 'Evaluate a math expression.',
  async execute(message, args) {
    await message.delete().catch(() => {});

    const expression = args.join(' ');
    if (!expression) {
      return message.channel.send({
        embeds: [errorEmbed('Usage: `=calc 5+5` or `=calc 100+10%`')],
      }).then(m => setTimeout(() => m.delete().catch(() => {}), 6000));
    }

    const result = safeCalculate(expression);
    if (result === null) {
      return message.channel.send({
        embeds: [errorEmbed('Invalid calculation.')],
      }).then(m => setTimeout(() => m.delete().catch(() => {}), 6000));
    }

    const embed = makeEmbed({ title: `${E.settings} Calculator` });
    embed.addFields(
      { name: `${E.arrow} Expression`, value: `\`${expression}\``, inline: false },
      { name: `${E.star} Result`, value: `\`${result}\``, inline: false },
    );

    message.channel.send({ embeds: [embed] });
  },
};
