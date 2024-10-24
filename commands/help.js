const { SlashCommandBuilder } = require('@discordjs/builders');
const { createEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show available commands and their usage'),

  async execute(interaction) {
    const embed = createEmbed({
      title: 'VizGuard Bot Commands',
      description: 'Here are the available commands:',
      fields: [
        { name: '/newimage', value: 'Upload a new image (Admin only)', inline: true },
        { name: '/newvideo', value: 'Upload a new video (Admin only)', inline: true },
        { name: '/browse', value: 'Browse available content', inline: true },
        { name: '/mystats', value: 'View your download statistics', inline: true },
        { name: '/help', value: 'Show this help message', inline: true }
      ]
    });

    await interaction.reply({ embeds: [embed] });
  },
};