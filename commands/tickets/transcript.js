// =ticket transcript — Save ticket transcript as a text file.

const { AttachmentBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embed');
const { getDb } = require('../../utils/db');

module.exports = {
  name: 'ticket transcript',
  description: 'Save ticket transcript.',
  async execute(message) {
    const db = getDb();
    const ticket = db.prepare("SELECT * FROM tickets WHERE channel_id = ? AND status = 'open'")
      .get(message.channel.id);
    if (!ticket) return message.reply({ embeds: [errorEmbed('This is not an open ticket channel.')] });

    const messages = await message.channel.messages.fetch({ limit: 100 });
    const lines = messages
      .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
      .map(m => `[${m.createdAt.toISOString()}] ${m.author.tag}: ${m.content || '(embed/attachment)'}`)
      .join('\n');

    const buffer = Buffer.from(lines, 'utf-8');
    const attachment = new AttachmentBuilder(buffer, { name: `transcript-${message.channel.name}.txt` });

    await message.channel.send({ embeds: [successEmbed('Transcript saved.')], files: [attachment] });
  },
};
