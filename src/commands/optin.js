const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('optin')
    .setDescription('Opt-in to data collection for personalized AI responses'),
  
  async execute(interaction) {
    // TODO: Implement opt-in logic
    await interaction.reply({
      content: 'You have opted in to data collection.',
      ephemeral: true
    });
  },
};
