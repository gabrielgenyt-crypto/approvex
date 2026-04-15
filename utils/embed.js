const { EmbedBuilder } = require('discord.js');
const { EMBED_COLOR, E, FOOTER } = require('./constants');

function makeEmbed({ title, description, footer, thumbnail, image } = {}) {
  const embed = new EmbedBuilder().setColor(EMBED_COLOR).setTimestamp();
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  embed.setFooter({ text: footer || FOOTER });
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (image) embed.setImage(image);
  return embed;
}

function successEmbed(description) {
  return makeEmbed({ description: `${E.success} ${description}` });
}

function errorEmbed(description) {
  return new EmbedBuilder()
    .setColor(0xed4245)
    .setDescription(`${E.deny} ${description}`)
    .setFooter({ text: FOOTER })
    .setTimestamp();
}

module.exports = { makeEmbed, successEmbed, errorEmbed };
