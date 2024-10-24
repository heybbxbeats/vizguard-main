require('dotenv').config();

module.exports = {
  discordToken: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  megaEmail: process.env.MEGA_EMAIL,
  megaPassword: process.env.MEGA_PASSWORD,
  webhookUrl: process.env.DISCORD_WEBHOOK_URL,
  rateLimit: 5, // requests per minute
  rateLimitWindow: 60000, // 1 minute in milliseconds
  premiumRoleId: process.env.PREMIUM_ROLE_ID,
};