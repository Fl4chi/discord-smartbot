const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('import')
    .setDescription('Import data from a previous export'),
  
  async execute(interaction) {
    // TODO: Implement data import logic
    await interaction.reply({
      content: 'Please provide your data export file to import.',
      ephemeral: true
    });
  },
};
