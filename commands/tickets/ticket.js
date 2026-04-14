// =ticket [id] — Look up a saved transcript by ticket ID.

const { AttachmentBuilder } = require('discord.js');
const { makeEmbed } = require('../../utils/embed');
const { getDb } = require('../../utils/db');
const { E } = require('../../utils/constants');
const { isStaff } = require('../../utils/helpers');
const fs = require('fs');

module.exports = {
  name: 'ticket',
  description: 'Look up a ticket transcript.',
  async execute(message, args) {
    if (!isStaff(message.member)) return;

    const ticketId = args[0];
    if (!ticketId) {
      return message.channel.send({ content: `${E.deny} Please provide a ticket ID.` });
    }

    const db = getDb();
    const row = db.prepare('SELECT filepath FROM transcripts WHERE ticket_id = ?').get(ticketId);
    if (!row) {
      return message.channel.send({ content: `${E.deny} Transcript not found.` });
    }

    if (!fs.existsSync(row.filepath)) {
      return message.channel.send({ content: '\u274C Transcript file missing.' });
    }

    const embed = makeEmbed({
      title: `${E.tool} Ticket Transcript`,
      description: `${E.hashtag} Ticket ID: \`${ticketId}\``,
    });

    const file = new AttachmentBuilder(row.filepath, { name: `transcript-${ticketId}.txt` });
    message.channel.send({ embeds: [embed], files: [file] });
  },
};
