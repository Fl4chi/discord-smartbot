const { NlpManager } = require('node-nlp');
const manager = new NlpManager({ languages: ['it', 'en'] });
manager.addDocument('it', 'sei stupido', 'toxic');
manager.addDocument('it', 'vai via', 'toxic');
manager.addDocument('it', 'ciao come va', 'greet');
manager.train();

async function analyzeMessage(msg) {
  const result = await manager.process('it', msg.content);
  if (result.intent === 'toxic' || result.sentiment.score < -0.5) {
    await msg.reply('⚠️ Attenzione: linguaggio non consentito su questo server!');
    if (msg.member?.timeout) {
      await msg.member.timeout(60 * 1000, 'Linguaggio tossico rilevato da MinfoAI');
    }
  }
}

module.exports = { analyzeMessage };
