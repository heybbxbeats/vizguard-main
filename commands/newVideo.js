const { SlashCommandBuilder } = require('@discordjs/builders');
const { uploadToMega } = require('../megaOperations');
const { createEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
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

  async execute(interaction, { megaStorage, logger }) {
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({ 
        content: 'You do not have permission to use this command.',
        ephemeral: true 
      });
    }

    const attachment = interaction.options.getAttachment('file');
    const genre = interaction.options.getString('genre');
    const collectionName = interaction.options.getString('collection');

    if (!attachment || !genre || !collectionName) {
      return interaction.reply({ 
        content: 'Please provide a file, genre, and collection name.',
        ephemeral: true 
      });
    }

    await interaction.deferReply();

    try {
      const fileExtension = attachment.name.split('.').pop().toLowerCase();
      const validTypes = ['mp4', 'webm', 'mov'];
      
      if (!validTypes.includes(fileExtension)) {
        return interaction.editReply({
          content: 'Invalid file type. Please upload a valid video file.',
          ephemeral: true
        });
      }

      const fileId = Math.floor(1000 + Math.random() * 9000).toString();
      const fullFileName = `${fileId}.${fileExtension}`;

      await uploadToMega(attachment, genre, collectionName, fullFileName, { megaStorage, logger });

      const embed = createEmbed({
        title: 'New Video Added',
        description: 'A new video has been added to the collection.',
        fields: [
          { name: 'Genre', value: genre, inline: true },
          { name: 'Collection', value: collectionName, inline: true },
          { name: 'File ID', value: fileId, inline: true }
        ]
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error(`Error uploading video: ${error.message}`, { error, stack: error.stack });
      await interaction.editReply({ 
        content: 'An error occurred while uploading the video. Please try again later.',
        ephemeral: true
      });
    }
  },
};