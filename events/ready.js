// Fires once when the bot is online.

const { ActivityType } = require('discord.js');
const { BOT_NAME } = require('../utils/constants');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`[${BOT_NAME}] Logged in as ${client.user.tag}`);
    client.user.setActivity('Approve Server', { type: ActivityType.Watching });
  },
};
