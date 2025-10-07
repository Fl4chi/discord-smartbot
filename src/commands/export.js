const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('export')
    .setDescription('Export your data in a downloadable format'),
  
  async execute(interaction) {
    // TODO: Implement data export logic
    await interaction.reply({
      content: 'Your data export will be sent to you shortly.',
      ephemeral: true
    });
  },
};
