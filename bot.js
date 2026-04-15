require('dotenv').config();

const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel],
});

client.commands = new Collection();

// load commands from each subfolder
const commandsRoot = path.join(__dirname, 'commands');
for (const category of fs.readdirSync(commandsRoot)) {
  const categoryPath = path.join(commandsRoot, category);
  if (!fs.statSync(categoryPath).isDirectory()) continue;
  for (const file of fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'))) {
    const cmd = require(path.join(categoryPath, file));
    if (cmd.name) {
      client.commands.set(cmd.name, cmd);
      if (cmd.aliases) {
        for (const alias of cmd.aliases) {
          client.commands.set(alias, cmd);
        }
      }
    }
  }
}

// load event handlers
const eventsPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// keep the process alive if something breaks
client.on('error', (err) => {
  console.error('[Client] Error:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Process] Unhandled rejection:', reason);
});

client.login(process.env.BOT_TOKEN);
