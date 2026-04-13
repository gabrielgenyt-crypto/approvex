// =delete — Delete ticket with transcript (staff only, not limited mods).

const { AttachmentBuilder } = require('discord.js');
const { makeEmbed } = require('../../utils/embed');
const { getDb } = require('../../utils/db');
const { E, CHANNELS } = require('../../utils/constants');
const { isStaff, isLimitedMod } = require('../../utils/helpers');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'delete',
  description: 'Delete ticket and save transcript.',
  async execute(message) {
    if (!isStaff(message.member)) return;
    if (isLimitedMod(message.member)) {
      return message.channel.send({ content: `${E.deny} You can not use this function.` });
    }

    const channel = message.channel;
    if (!channel.topic || !channel.topic.includes('|')) {
      return channel.send({ content: '\u274C Ticket data missing.' });
    }

    const [creatorId, ticketId] = channel.topic.split('|');

    // Generate transcript.
    let lines;
    try {
      const messages = await channel.messages.fetch({ limit: 100 });
      lines = messages
        .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
        .map(m => `[${m.createdAt.toISOString()}] ${m.author.tag}: ${m.content || '(embed/attachment)'}`)
        .join('\n');
    } catch (e) {
      console.error('Transcript error:', e);
      return channel.send({ content: `${E.deny} Failed to generate transcript.` });
    }

    const filename = `transcript-${ticketId}.txt`;
    const transcriptsDir = path.join(__dirname, '..', '..', 'transcripts');
    fs.mkdirSync(transcriptsDir, { recursive: true });
    const filepath = path.join(transcriptsDir, filename);
    fs.writeFileSync(filepath, lines, 'utf-8');

    // Save to DB.
    const db = getDb();
    db.prepare('INSERT OR REPLACE INTO transcripts (ticket_id, filepath) VALUES (?, ?)').run(ticketId, filepath);

    const embed = makeEmbed({
      title: `${E.tool} Ticket Transcript`,
      description: `${E.hashtag} Ticket ID: \`${ticketId}\``,
    });
    embed.addFields(
      { name: 'Ticket Owner', value: `<@${creatorId}>`, inline: true },
      { name: 'Channel', value: channel.name, inline: true },
    );

    // Send to transcript channel.
    if (CHANNELS.transcript) {
      const transcriptChannel = message.guild.channels.cache.get(CHANNELS.transcript);
      if (transcriptChannel) {
        const file = new AttachmentBuilder(filepath, { name: filename });
        await transcriptChannel.send({ embeds: [embed], files: [file] });
      }
    }

    // DM the creator.
    try {
      const user = await message.client.users.fetch(creatorId);
      const dmFile = new AttachmentBuilder(filepath, { name: filename });
      await user.send({
        content: '\uD83D\uDCC4 Your ticket has been closed. Here is the transcript.',
        embeds: [embed],
        files: [dmFile],
      });
    } catch (e) {
      console.log('DM failed:', e.message);
    }

    await channel.delete().catch(() => {});
  },
};
