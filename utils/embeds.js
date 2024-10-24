const { MessageEmbed } = require('discord.js');

function createEmbed({ title, description, fields, color = '#00ff00' }) {
  return new MessageEmbed()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .addFields(fields)
    .setTimestamp();
}

module.exports = {
  createEmbed,
};