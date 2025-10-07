// src/nlp/persona.js
// NLP personality configuration and response generation

const db = require('../store/db');

/**
 * Bot personality configuration
 */
const PERSONA = {
  name: 'SmartBot',
  traits: [
    'friendly',
    'helpful',
    'knowledgeable',
    'professional',
    'empathetic'
  ],
  tone: 'conversational',
  language: 'italian',
  capabilities: [
    'answering questions',
    'having conversations',
    'providing information',
    'helping with tasks',
    'server moderation assistance'
  ]
};

/**
 * Intent patterns for message classification
 */
const INTENT_PATTERNS = {
  greeting: [
    /^(ciao|salve|buongiorno|buonasera|hey|hola|hello)/i,
    /^(hi|sup|yo)/i
  ],
  farewell: [
    /^(arrivederci|ciao|addio|bye|goodbye|see you|ci vediamo)/i
  ],
  thanks: [
    /(grazie|thanks|thank you|thx|ty|appreciated)/i
  ],
  help: [
    /(aiuto|help|assist|supporto|come|how)/i,
    /(what can you do|cosa puoi fare|comandi|commands)/i
  ],
  question: [
    /\?$/,
    /^(cosa|chi|come|quando|dove|perché|quale)/i,
    /^(what|who|how|when|where|why|which)/i
  ],
  moderation: [
    /(ban|kick|mute|warn|timeout|moderazione|punizione)/i
  ]
};

/**
 * Response templates by intent
 */
const RESPONSE_TEMPLATES = {
  greeting: [
    'Ciao! Come posso aiutarti oggi? 👋',
    'Salve! Sono qui per aiutarti. Cosa ti serve?',
    'Hey! Dimmi pure, sono tutto orecchi! 👂',
    'Ciao! 😊 Cosa posso fare per te?'
  ],
  farewell: [
    'Arrivederci! A presto! 👋',
    'Ciao! Se hai bisogno di me, sono qui!',
    'Alla prossima! 😊',
    'Ci vediamo! Buona giornata!'
  ],
  thanks: [
    'Prego! 😊 Felice di aiutare!',
    'Di niente! Sono qui per questo!',
    'Figurati! 👍',
    'Con piacere! Se hai bisogno di altro, chiedimi pure!'
  ],
  help: [
    'Posso aiutarti con molte cose! Usa `/help` per vedere tutti i comandi disponibili.',
    'Sono qui per aiutarti! Prova i comandi `/help` per iniziare.',
    'Ci sono molti comandi disponibili! Digita `/help` per esplorarli.',
    'Sono un assistente versatile! Usa `/help` per scoprire tutte le mie funzionalità.'
  ],
  unknown: [
    'Hmm, non sono sicuro di aver capito. Puoi riformulare?',
    'Interessante! Puoi spiegarmi meglio?',
    'Non ho ben capito. Prova a dirlo in modo diverso? 🤔',
    'Scusa, non sono sicuro di cosa intendi. Puoi essere più specifico?'
  ],
  error: [
    'Ops! Ho avuto un problema. Riprova tra poco.',
    'Scusa, qualcosa è andato storto. 😔',
    'Errore! I miei circuiti si sono confusi un attimo...'
  ]
};

/**
 * Detect intent from message
 * @param {string} message - User message
 * @returns {string} Detected intent
 */
function detectIntent(message) {
  const lowerMessage = message.toLowerCase().trim();
  
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(lowerMessage)) {
        return intent;
      }
    }
  }
  
  return 'unknown';
}

/**
 * Get random response template
 * @param {string} intent - Intent type
 * @returns {string} Response template
 */
function getResponseTemplate(intent) {
  const templates = RESPONSE_TEMPLATES[intent] || RESPONSE_TEMPLATES.unknown;
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Generate contextual response
 * @param {string} message - User message
 * @param {Object} context - Conversation context
 * @returns {Promise<string>} Generated response
 */
async function generateResponse(message, context = {}) {
  try {
    const intent = detectIntent(message);
    
    // Get conversation history if available
    let conversationHistory = [];
    if (context.userId) {
      conversationHistory = await db.getConversationHistory(context.userId, 5);
    }
    
    // Generate response based on intent
    let response = getResponseTemplate(intent);
    
    // Add contextual enhancements
    if (intent === 'question') {
      // For questions, try to provide helpful info
      if (message.match(/comandi|commands|cosa puoi fare/i)) {
        response = 'Posso aiutarti con diverse cose! Ecco alcuni comandi utili:\n' +
                   '• `/help` - Mostra tutti i comandi\n' +
                   '• `/info` - Informazioni sul bot\n' +
                   '• `/ask` - Fai una domanda\n' +
                   'E molto altro! Usa `/help` per l\'elenco completo.';
      } else if (message.match(/moderazione|moderation/i)) {
        response = 'Per la moderazione, gli staff hanno accesso a:\n' +
                   '• `/ban` - Banna un utente\n' +
                   '• `/kick` - Espelle un utente\n' +
                   '• `/timeout` - Silenzia temporaneamente\n' +
                   '• `/warn` - Avverte un utente\n' +
                   '• `/antiraid` - Gestisce protezione raid\n' +
                   'Tutto viene registrato automaticamente!';
      } else {
        response = 'Quella è una buona domanda! ' + response;
      }
    }
    
    // Add personality touches
    if (Math.random() > 0.7) {
      const emojis = ['😊', '👍', '✨', '💡', '🌟'];
      response += ' ' + emojis[Math.floor(Math.random() * emojis.length)];
    }
    
    return response;
  } catch (error) {
    console.error('Error generating response:', error);
    return getResponseTemplate('error');
  }
}

/**
 * Analyze sentiment of message
 * @param {string} message - User message
 * @returns {Object} Sentiment analysis
 */
function analyzeSentiment(message) {
  const positive = ['bello', 'ottimo', 'fantastico', 'perfetto', 'grazie', 'great', 'good', 'awesome', 'love', 'thanks'];
  const negative = ['male', 'brutto', 'pessimo', 'odio', 'bad', 'terrible', 'hate', 'worst', 'awful'];
  
  const lowerMessage = message.toLowerCase();
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  positive.forEach(word => {
    if (lowerMessage.includes(word)) positiveCount++;
  });
  
  negative.forEach(word => {
    if (lowerMessage.includes(word)) negativeCount++;
  });
  
  if (positiveCount > negativeCount) {
    return { sentiment: 'positive', score: positiveCount };
  } else if (negativeCount > positiveCount) {
    return { sentiment: 'negative', score: negativeCount };
  } else {
    return { sentiment: 'neutral', score: 0 };
  }
}

/**
 * Extract entities from message (simple version)
 * @param {string} message - User message
 * @returns {Object} Extracted entities
 */
function extractEntities(message) {
  const entities = {
    mentions: [],
    commands: [],
    urls: [],
    numbers: []
  };
  
  // Extract mentions
  const mentionMatches = message.match(/<@!?(\d+)>/g);
  if (mentionMatches) {
    entities.mentions = mentionMatches.map(m => m.match(/\d+/)[0]);
  }
  
  // Extract commands
  const commandMatches = message.match(/\/(\w+)/g);
  if (commandMatches) {
    entities.commands = commandMatches.map(c => c.substring(1));
  }
  
  // Extract URLs
  const urlMatches = message.match(/https?:\/\/[^\s]+/g);
  if (urlMatches) {
    entities.urls = urlMatches;
  }
  
  // Extract numbers
  const numberMatches = message.match(/\d+/g);
  if (numberMatches) {
    entities.numbers = numberMatches.map(n => parseInt(n));
  }
  
  return entities;
}

/**
 * Get persona information
 * @returns {Object} Persona configuration
 */
function getPersona() {
  return { ...PERSONA };
}

/**
 * Update persona configuration
 * @param {Object} updates - Updates to apply
 */
function updatePersona(updates) {
  Object.assign(PERSONA, updates);
}

module.exports = {
  PERSONA,
  detectIntent,
  generateResponse,
  analyzeSentiment,
  extractEntities,
  getPersona,
  updatePersona
};
