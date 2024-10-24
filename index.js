require('dotenv').config();
const { Client, Intents } = require('discord.js');
const winston = require('winston');
const { Storage } = require('megajs');
const fetch = require('node-fetch');
const { handleCommand } = require('./handlers/commandHandler');
const { registerCommands } = require('./handlers/registerCommands');
const MegaOperations = require('./megaOperations');

// Fix for fetch in Node.js environment
global.fetch = fetch;

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' })
  ]
});

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES
  ]
});

let megaOperations = null;

async function initializeMega(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      // Create storage instance with required credentials
      const storage = new Storage({
        email: process.env.MEGA_EMAIL,
        password: process.env.MEGA_PASSWORD,
        userAgent: 'VizGuard/1.0.0',
        autoload: true // Enable autoload of account data
      });

      // Wait for login to complete
      await storage.ready;

      // Verify storage is initialized
      if (!storage.root) {
        throw new Error('MEGA root folder not accessible');
      }

      logger.info('MEGA connection successful');
      megaOperations = new MegaOperations(storage, logger);
      return true;
    } catch (error) {
      logger.error(`MEGA initialization attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
  return false;
}

async function initializeBot() {
  try {
    // Validate environment variables
    const required = ['DISCORD_TOKEN', 'MEGA_EMAIL', 'MEGA_PASSWORD'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Initialize Discord client
    await client.login(process.env.DISCORD_TOKEN);
    logger.info(`Logged in as ${client.user.tag}`);

    // Initialize MEGA storage
    await initializeMega();

    // Register Discord commands
    await registerCommands(logger);
    
    logger.info('Bot initialization complete');
  } catch (error) {
    logger.error(`Error during initialization: ${error.message}`);
    process.exit(1);
  }
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  
  try {
    await handleCommand(interaction, { megaOperations, logger, client });
  } catch (error) {
    logger.error(`Error handling command: ${error.message}`);
    const reply = { 
      content: 'An error occurred. Please try again later.',
      ephemeral: true 
    };
    
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

initializeBot();