const { SlashCommandBuilder } = require('@discordjs/builders');
const { createEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('browse')
    .setDescription('Browse available content')
    .addStringOption(option => 
      option.setName('genre')
        .setDescription('The genre to browse')
        .setRequired(false)),

  async execute(interaction, { megaOperations, logger }) {
    await interaction.deferReply();

    try {
      const genre = interaction.options.getString('genre');
      const collections = await megaOperations.browseContent(genre);

      const embed = createEmbed({
        title: 'Available Collections',
        description: genre ? `Collections in ${genre}:` : 'All collections:',
        fields: [
          { 
            name: 'Collections', 
            value: collections.length ? 
              collections.map(c => `${c.name} (${c.path})`).join('\n') : 
              'No collections found' 
          }
        ]
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error(`Error browsing collections: ${error.message}`, { error, stack: error.stack });
      await interaction.editReply({ 
        content: 'An error occurred while browsing collections. Please try again later.',
        ephemeral: true
      });
    }
  },
};