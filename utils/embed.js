// ApproveX — Embed builder helpers for consistent styling.

const { EmbedBuilder } = require('discord.js');
const { EMBED_COLOR, E, FOOTER } = require('./constants');

/**
 * Create a pre-styled green-light embed.
 * @param {object} opts
 * @param {string} [opts.title]
 * @param {string} [opts.description]
 * @param {string} [opts.footer]
 * @param {string} [opts.thumbnail]
 * @param {string} [opts.image]
 * @returns {EmbedBuilder}
 */
function makeEmbed({ title, description, footer, thumbnail, image } = {}) {
  const embed = new EmbedBuilder().setColor(EMBED_COLOR).setTimestamp();
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  embed.setFooter({ text: footer || FOOTER });
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (image) embed.setImage(image);
  return embed;
}

/** Quick success embed. */
function successEmbed(description) {
  return makeEmbed({ description: `${E.tick} ${description}` });
}

/** Quick error embed. */
function errorEmbed(description) {
  return new EmbedBuilder()
    .setColor(0xed4245)
    .setDescription(`${E.cross} ${description}`)
    .setFooter({ text: FOOTER })
    .setTimestamp();
}

module.exports = { makeEmbed, successEmbed, errorEmbed };
