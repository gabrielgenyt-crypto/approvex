const { GUILD_ID, TICKET_CATS, ROLES } = require('../utils/constants');

module.exports = {
  name: 'clientReady',
  once: true,
  async execute(_event, client) {
    console.log(`[ApproveX] Logged in as ${client.user.tag}`);

    if (GUILD_ID) {
      try {
        const slashData = client.slashCommands.map(cmd => cmd.data.toJSON());
        const synced = await client.application.commands.set(slashData, GUILD_ID);
        console.log(`[ApproveX] Synced ${synced.size} slash commands.`);
      } catch (e) {
        console.error('[ApproveX] Slash sync error:', e);
      }

      // Ensure exchanger role can only see the exchange category
      if (ROLES.exchanger) {
        const guild = client.guilds.cache.get(GUILD_ID);
        if (guild) {
          // Grant ViewChannel on the exchange category
          if (TICKET_CATS.exchange) {
            const exchangeCat = guild.channels.cache.get(TICKET_CATS.exchange);
            if (exchangeCat) {
              await exchangeCat.permissionOverwrites.edit(ROLES.exchanger, {
                ViewChannel: true,
                SendMessages: false,
              }).catch(e => console.error('[ApproveX] Failed to set exchanger perms on exchange category:', e));
              console.log('[ApproveX] Exchanger role granted view on exchange category.');
            }
          }

          // Deny ViewChannel on all other ticket categories
          const otherCats = ['purchase', 'support', 'closed', 'vouch'];
          for (const catKey of otherCats) {
            const catId = TICKET_CATS[catKey];
            if (!catId) continue;
            const cat = guild.channels.cache.get(catId);
            if (!cat) continue;
            await cat.permissionOverwrites.edit(ROLES.exchanger, {
              ViewChannel: false,
            }).catch(e => console.error(`[ApproveX] Failed to deny exchanger perms on ${catKey} category:`, e));
          }
          console.log('[ApproveX] Exchanger role denied view on non-exchange categories.');
        }
      }
    }
  },
};
