const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { SlashCommandBuilder } = require('@discordjs/builders');

const commands = [
  new SlashCommandBuilder()
    .setName('newimage')
    .setDescription('Upload a new image (Admin only)')
    .addAttachmentOption(option => 
      option.setName('file')
        .setDescription('The image to upload')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('genre')
        .setDescription('The genre of the image')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('collection')
        .setDescription('The collection name')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('newvideo')
    .setDescription('Upload a new video (Admin only)')
    .addAttachmentOption(option => 
      option.setName('file')
        .setDescription('The video to upload')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('genre')
        .setDescription('The genre of the video')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('collection')
        .setDescription('The collection name')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('browse')
    .setDescription('Browse available content')
    .addStringOption(option =>
      option.setName('genre')
        .setDescription('Filter by genre')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show available commands and their usage')
];

async function registerCommands(logger) {
  try {
    logger.info('Started refreshing application (/) commands.');

    const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

    // Clear existing commands first
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: [] }
    );
    logger.info('Cleared existing commands.');

    // Register new commands
    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands.map(command => command.toJSON()) }
    );

    logger.info(`Successfully registered ${data.length} application (/) commands.`);
    return data;
  } catch (error) {
    logger.error('Error registering commands:', error);
    throw error;
  }
}

module.exports = {
  registerCommands,
};