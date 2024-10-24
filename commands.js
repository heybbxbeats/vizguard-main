const { MessageEmbed } = require('discord.js');
const { uploadToMega, checkDuplicateId } = require('./megaOperations');
const { generateUniqueId, isRateLimited, updateRateLimit } = require('./utils');
const config = require('./config');
const axios = require('axios');

async function handleCommand(interaction, { megaStorage, logger, client }) {
  const { commandName } = interaction;

  if (isRateLimited(interaction.user.id)) {
    await interaction.reply({ content: 'You are being rate limited. Please try again later.', ephemeral: true });
    return;
  }

  updateRateLimit(interaction.user.id);

  try {
    switch (commandName) {
      case 'newimage':
      case 'newvideo':
        await handleNewMediaCommand(interaction, { megaStorage, logger });
        break;
      case 'browse':
        await handleBrowseCommand(interaction, { megaStorage, logger });
        break;
      case 'mystats':
        await handleMyStatsCommand(interaction, { logger });
        break;
      case 'help':
        await handleHelpCommand(interaction);
        break;
      default:
        await interaction.reply({ content: 'Unknown command', ephemeral: true });
    }
  } catch (error) {
    logger.error(`Error handling command ${commandName}: ${error.message}`, { error, stack: error.stack });
    await interaction.reply({ content: 'An error occurred while processing your command. Please try again later.', ephemeral: true });
  }
}

async function handleNewMediaCommand(interaction, { megaStorage, logger }) {
  if (!interaction.member.permissions.has('Administrator')) {
    await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    return;
  }

  const attachment = interaction.options.getAttachment('file');
  const genre = interaction.options.getString('genre');
  const collectionName = interaction.options.getString('collection');

  if (!attachment || !genre || !collectionName) {
    await interaction.reply({ content: 'Please provide a file, genre, and collection name.', ephemeral: true });
    return;
  }

  await interaction.deferReply();

  try {
    const fileId = generateUniqueId();
    const fileExtension = attachment.name.split('.').pop().toLowerCase();
    const fullFileName = `${fileId}.${fileExtension}`;

    // Validate file type based on command
    const isValidFileType = validateFileType(interaction.commandName, fileExtension);
    if (!isValidFileType) {
      await interaction.editReply({ content: `Invalid file type for ${interaction.commandName}. Please upload a valid ${interaction.commandName === 'newimage' ? 'image' : 'video'} file.`, ephemeral: true });
      return;
    }

    await uploadToMega(attachment, genre, collectionName, fullFileName, { megaStorage, logger });

    const embed = new MessageEmbed()
      .setColor('#00ff00')
      .setTitle('New Content Added')
      .setDescription(`A new ${interaction.commandName === 'newimage' ? 'image' : 'video'} has been added to the collection.`)
      .addFields(
        { name: 'Genre', value: genre, inline: true },
        { name: 'Collection', value: collectionName, inline: true },
        { name: 'File ID', value: fileId, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    await sendWebhookNotification(genre, collectionName, fileId, logger);
  } catch (error) {
    logger.error(`Error uploading file: ${error.message}`, { error, stack: error.stack });
    await interaction.editReply({ content: 'An error occurred while uploading the file. Please try again later.' });
  }
}

function validateFileType(commandName, fileExtension) {
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const videoTypes = ['mp4', 'webm', 'mov'];
  
  if (commandName === 'newimage') {
    return imageTypes.includes(fileExtension);
  } else if (commandName === 'newvideo') {
    return videoTypes.includes(fileExtension);
  }
  return false;
}

async function handleBrowseCommand(interaction, { megaStorage, logger }) {
  const genre = interaction.options.getString('genre');

  await interaction.deferReply();

  try {
    const collections = await getCollections(megaStorage, genre);
    const embed = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle('Available Collections')
      .setDescription(genre ? `Collections in ${genre}:` : 'All collections:')
      .addFields(
        { name: 'Collections', value: collections.join('\n') || 'No collections found' }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.error(`Error browsing collections: ${error.message}`, { error, stack: error.stack });
    await interaction.editReply({ content: 'An error occurred while browsing collections. Please try again later.' });
  }
}

async function handleMyStatsCommand(interaction, { logger }) {
  await interaction.reply({ content: 'Stats feature coming soon!' });
}

async function handleHelpCommand(interaction) {
  const embed = new MessageEmbed()
    .setColor('#00ff00')
    .setTitle('VizGuard Bot Commands')
    .setDescription('Here are the available commands:')
    .addFields(
      { name: '/newimage', value: 'Upload a new image (Admin only)', inline: true },
      { name: '/newvideo', value: 'Upload a new video (Admin only)', inline: true },
      { name: '/browse', value: 'Browse available content', inline: true },
      { name: '/mystats', value: 'View your download statistics', inline: true },
      { name: '/help', value: 'Show this help message', inline: true }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function getCollections(megaStorage, genre) {
  const rootFolder = await megaStorage.getFolder('/');
  const folders = await rootFolder.getChildren();

  if (genre) {
    const genreFolder = folders.find(folder => folder.name.toLowerCase() === genre.toLowerCase());
    if (!genreFolder) return [];
    return (await genreFolder.getChildren()).map(folder => folder.name);
  }

  return folders.map(folder => folder.name);
}

async function sendWebhookNotification(genre, collectionName, fileId, logger) {
  try {
    const webhookUrl = config.webhookUrl;
    if (!webhookUrl) {
      logger.error('Webhook URL is not configured');
      return;
    }

    const message = {
      embeds: [{
        title: 'New Content Notification',
        description: 'A new item has been added to the collection.',
        color: 0x00ff00,
        fields: [
          { name: 'Genre', value: genre, inline: true },
          { name: 'Collection', value: collectionName, inline: true },
          { name: 'File ID', value: fileId, inline: true }
        ],
        timestamp: new Date().toISOString()
      }]
    };

    await axios.post(webhookUrl, message);
    logger.info('Webhook notification sent successfully');
  } catch (error) {
    logger.error(`Failed to send webhook: ${error.message}`, { error, stack: error.stack });
  }
}

module.exports = {
  handleCommand,
};