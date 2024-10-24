const { REST, Routes } = require('discord.js');
const { loadCommands } = require('./handlers/commandHandler');
const config = require('./config');

const commands = Array.from(loadCommands().values()).map(command => command.data.toJSON());
const rest = new REST({ version: '10' }).setToken(config.discordToken);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: [] }
    );
    console.log('Cleared existing commands.');

    const result = await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands }
    );

    console.log(`Successfully reloaded ${result.length} application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();