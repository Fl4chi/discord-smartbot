const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('privacy')
    .setDescription('View privacy policy and data handling information'),
  
  async execute(interaction) {
    // TODO: Implement privacy policy display
    await interaction.reply({
      content: 'Privacy Policy: [Details about data collection and usage]',
      ephemeral: true
    });
  },
};
