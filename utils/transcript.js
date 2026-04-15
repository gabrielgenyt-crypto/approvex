function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatTimestamp(date) {
  return date.toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function buildTranscriptHtml(messages, { channelName, ticketId, guildName }) {
  const sorted = [...messages.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);

  const rows = sorted.map(m => {
    const name = escapeHtml(m.author.displayName || m.author.username);
    const tag = escapeHtml(m.author.tag);
    const time = formatTimestamp(m.createdAt);
    const isBot = m.author.bot;
    const color = isBot ? '#5865f2' : '#fff';

    let body = '';
    if (m.content) {
      body += `<div class="text">${escapeHtml(m.content)}</div>`;
    }
    for (const embed of m.embeds) {
      const title = embed.title ? `<div class="embed-title">${escapeHtml(embed.title)}</div>` : '';
      const desc = embed.description ? `<div class="embed-desc">${escapeHtml(embed.description)}</div>` : '';
      const fields = embed.fields.map(f =>
        `<div class="embed-field"><span class="field-name">${escapeHtml(f.name)}</span> ${escapeHtml(f.value)}</div>`
      ).join('');
      body += `<div class="embed" style="border-left-color:${embed.hexColor || '#5865f2'}">${title}${desc}${fields}</div>`;
    }
    for (const att of m.attachments.values()) {
      if (att.contentType && att.contentType.startsWith('image/')) {
        body += `<div class="attachment"><img src="${escapeHtml(att.url)}" alt="image"></div>`;
      } else {
        body += `<div class="attachment"><a href="${escapeHtml(att.url)}">${escapeHtml(att.name || 'file')}</a></div>`;
      }
    }
    if (!body) body = '<div class="text" style="opacity:.5">(no content)</div>';

    const avatar = m.author.displayAvatarURL ? m.author.displayAvatarURL({ size: 64 }) : '';
    const avatarHtml = avatar
      ? `<img class="avatar" src="${escapeHtml(avatar)}" alt="">`
      : '<div class="avatar"></div>';

    return `<div class="msg">
      ${avatarHtml}
      <div class="content">
        <div class="header">
          <span class="name" style="color:${color}">${name}</span>
          <span class="tag">${tag}</span>
          <span class="time">${time}</span>
        </div>
        ${body}
      </div>
    </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Transcript - ${escapeHtml(channelName)}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#313338; color:#dcddde; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:15px; }
  .header-bar { background:#2b2d31; padding:16px 24px; border-bottom:1px solid #1e1f22; }
  .header-bar h1 { font-size:18px; color:#f2f3f5; font-weight:600; }
  .header-bar .meta { font-size:13px; color:#949ba4; margin-top:4px; }
  .messages { padding:16px 0; }
  .msg { display:flex; gap:16px; padding:4px 24px; }
  .msg:hover { background:#2e3035; }
  .msg + .msg { margin-top:8px; }
  .avatar { width:40px; height:40px; border-radius:50%; flex-shrink:0; background:#5865f2; }
  .content { min-width:0; flex:1; }
  .header { display:flex; align-items:baseline; gap:8px; flex-wrap:wrap; }
  .name { font-weight:600; font-size:15px; }
  .tag { font-size:12px; color:#949ba4; }
  .time { font-size:12px; color:#949ba4; }
  .text { margin-top:2px; white-space:pre-wrap; word-break:break-word; line-height:1.4; }
  .embed { margin-top:6px; background:#2b2d31; border-left:4px solid #5865f2; border-radius:4px; padding:10px 14px; max-width:520px; }
  .embed-title { font-weight:600; color:#f2f3f5; margin-bottom:4px; }
  .embed-desc { font-size:14px; color:#dcddde; margin-bottom:4px; }
  .embed-field { font-size:14px; margin-top:4px; }
  .field-name { font-weight:600; color:#f2f3f5; }
  .attachment { margin-top:6px; }
  .attachment img { max-width:400px; max-height:300px; border-radius:8px; }
  .attachment a { color:#00aff4; text-decoration:none; }
  .attachment a:hover { text-decoration:underline; }
</style>
</head>
<body>
<div class="header-bar">
  <h1># ${escapeHtml(channelName)}</h1>
  <div class="meta">${escapeHtml(guildName)} &middot; Ticket ${escapeHtml(ticketId)} &middot; ${sorted.length} messages</div>
</div>
<div class="messages">
${rows}
</div>
</body>
</html>`;
}

module.exports = { buildTranscriptHtml };
