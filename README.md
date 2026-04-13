# ApproveX

Discord bot for the **Approve Server** (`discord.gg/approvex`).  
Handles digital goods sales (Discord Boosts, Nitro, Netflix, Spotify, and more), tickets, moderation, and server management.

**Credits to autotem**

## Features

### Ticket System
- `=ticketpanel` — Deploy the ticket panel with Open Ticket button
- `=ticket close` — Close current ticket
- `=ticket claim` / `=ticket unclaim` — Claim or unclaim a ticket
- `=ticket add @user` / `=ticket remove @user` — Add or remove users
- `=ticket rename [name]` — Rename ticket channel
- `=ticket priority [low/medium/high]` — Set ticket priority
- `=ticket transcript` — Save ticket transcript
- `=ticket stats` — Show ticket statistics

### Sales & Vouches
- `=restock [item] [quantity] [role ping]` — Announce a restock
- `=sold @buyer [amount] [payment] [description] [trans-id]` — Log a sale
- `=vouch @user [message]` — Vouch for a user
- `=vouches @user` — Show vouches for a user
- `=sales [@user]` — Show sales stats

### Server Management
- `=tos` — Send Terms of Service
- `=rules` — Send server rules
- `=announce [message]` — Send an announcement
- `=embed [title] | [description]` — Create a custom embed
- `=selfrole` — Deploy self-role selection panel

### Moderation
- `=ban @user [reason]` — Ban a user
- `=kick @user [reason]` — Kick a user
- `=warn @user [reason]` — Warn a user
- `=warnings @user` — Show warnings
- `=mute @user` / `=unmute @user` — Timeout or remove timeout
- `=lock [#channel]` / `=unlock [#channel]` — Lock or unlock a channel
- `=clear [amount]` — Purge messages

### Utility
- `=help` — List all commands
- `=ping` — Bot latency
- `=uptime` — Bot uptime
- `=stats` — Bot statistics
- `=serverinfo` — Server information
- `=whois @user` — Detailed user info (staff only)
- `=p [@user]` — User profile
- `=afk [reason]` / `=unafk` — AFK status
- `=snipe` — Show last deleted message

## Setup

1. Clone the repo
2. Copy `.env.example` to `.env` and fill in your bot token and channel/role IDs
3. Run `npm install`
4. Run `npm start`

## Configuration

Edit `utils/constants.js` to customize:
- `EMBED_COLOR` — Bot theme color (default: green-light `0x57f287`)
- `ROLES.staff` — Staff role ID
- `ROLES.owner` — Owner role ID
- Channel IDs via `.env`

## Tech Stack

- **discord.js** v14
- **better-sqlite3** for persistent data
- **Node.js** 20+
