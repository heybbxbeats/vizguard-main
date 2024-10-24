const fs = require('fs');
const path = require('path');

function loadCommands() {
  const commands = new Map();
  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    commands.set(command.data.name, command);
  }

  return commands;
}

async function handleCommand(interaction, context) {
  const commands = loadCommands();
  const command = commands.get(interaction.commandName);

  if (!command) {
    await interaction.reply({ 
      content: 'Command not found.',
      ephemeral: true 
    });
    return;
  }

  try {
    await command.execute(interaction, context);
  } catch (error) {
    context.logger.error(`Error executing command ${interaction.commandName}: ${error.message}`, { 
      error, 
      stack: error.stack 
    });
    
    const reply = {
      content: 'An error occurred while executing this command.',
      ephemeral: true
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(reply);
    } else {
      await interaction.reply(reply);
    }
  }
}

module.exports = {
  loadCommands,
  handleCommand,
};