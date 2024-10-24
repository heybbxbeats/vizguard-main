const { SlashCommandBuilder } = require('@discordjs/builders');
const { createEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
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

  async execute(interaction, { megaOperations, logger }) {
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
      const validTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      
      if (!validTypes.includes(fileExtension)) {
        return interaction.editReply({
          content: 'Invalid file type. Please upload a valid image file.',
          ephemeral: true
        });
      }

      const fileId = Math.floor(1000 + Math.random() * 9000).toString();
      const fullFileName = `${fileId}.${fileExtension}`;

      const { link } = await megaOperations.uploadToMega(attachment, genre, collectionName, fullFileName);

      const embed = createEmbed({
        title: 'New Image Added',
        description: 'A new image has been added to the collection.',
        fields: [
          { name: 'Genre', value: genre, inline: true },
          { name: 'Collection', value: collectionName, inline: true },
          { name: 'File ID', value: fileId, inline: true },
          { name: 'Download Link', value: link || 'Link generation failed', inline: false }
        ]
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error(`Error uploading image: ${error.message}`, { error, stack: error.stack });
      await interaction.editReply({ 
        content: 'An error occurred while uploading the image. Please try again later.',
        ephemeral: true
      });
    }
  },
};