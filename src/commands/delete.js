const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delete')
    .setDescription('Delete all your stored data'),
  
  async execute(interaction) {
    // TODO: Implement data deletion logic
    await interaction.reply({
      content: 'Your data has been deleted.',
      ephemeral: true
    });
  },
};
