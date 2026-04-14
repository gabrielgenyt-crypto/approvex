// Fires once when the bot is online. Syncs slash commands.

const { GUILD_ID } = require('../utils/constants');

module.exports = {
  name: 'clientReady',
  once: true,
  async execute(_event, client) {
    console.log(`[ApproveX] Logged in as ${client.user.tag}`);

    // Sync guild slash commands.
    if (GUILD_ID) {
      try {
        const synced = await client.application.commands.set(
          client.slashCommands || [],
          GUILD_ID,
        );
        console.log(`[ApproveX] Synced ${synced.size} slash commands.`);
      } catch (e) {
        console.error('[ApproveX] Slash sync error:', e);
      }
    }
  },
};
