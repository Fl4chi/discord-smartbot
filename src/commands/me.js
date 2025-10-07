const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('me')
    .setDescription('View your stored data and preferences'),
  
  async execute(interaction) {
    // TODO: Implement user data retrieval
    await interaction.reply({
      content: 'Your data: [Display user preferences and stored information]',
      ephemeral: true
    });
  },
};
