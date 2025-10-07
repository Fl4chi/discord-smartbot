const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('optout')
    .setDescription('Opt-out from data collection'),
  
  async execute(interaction) {
    // TODO: Implement opt-out logic
    await interaction.reply({
      content: 'You have opted out from data collection.',
      ephemeral: true
    });
  },
};
