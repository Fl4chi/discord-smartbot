# 🤖 MinfoAI Discord - AI-Powered Moderation & Assistant
[![Discord.js](https://img.shields.io/badge/discord.js-v14-blue.svg)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/node.js-v18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-orange.svg)](LICENSE)

MinfoAI è un bot Discord intelligente e completo che combina funzionalità di moderazione avanzata basata su AI, assistenza conversazionale, dashboard web, sistema di gamification XP e protezione automatica contro spam e raid.

## ✨ Caratteristiche Principali

### 🛡️ Sistema di Moderazione AI Avanzata
- **AI-Powered Auto-Moderation**: Intelligenza artificiale per moderazione automatica
- **Smart Content Analysis**: Analisi avanzata del contenuto con machine learning
- **Anti-Raid Protection**: Protezione avanzata contro attacchi coordinati e raid
- **Anti-Spam**: Sistema intelligente di rilevamento spam con azioni graduate
- **Anti-Invite**: Blocco automatico di link di invito non autorizzati
- **Moderation Commands**: Ban, kick, timeout, warn con logging completo
- **Audit Logging**: Registrazione dettagliata di tutte le azioni di moderazione

### 🧠 Intelligenza Artificiale
- **NLP Conversazionale**: Conversazioni naturali con riconoscimento intent
- **Sentiment Analysis**: Analisi del sentiment dei messaggi
- **Context-Aware Responses**: Risposte contestuali basate sulla cronologia
- **Learning System**: Apprendimento dalle interazioni per migliorare le risposte

### 🌐 Dashboard Web Interattiva
- **Express.js Dashboard**: Pannello di controllo web completo
- **Real-time Statistics**: Statistiche server in tempo reale
- **Configuration Interface**: Interfaccia per configurare il bot
- **Member Management**: Gestione membri tramite web
- **Moderation Logs**: Visualizzazione log di moderazione

### 🎮 Sistema Gamification XP
- **XP System**: Sistema di esperienza per membri attivi
- **Level System**: Livelli progressivi basati su XP
- **Badge System**: Badge e achievement per varie attività
- **Leaderboard**: Classifiche XP del server
- **Reward System**: Ricompense automatiche per milestone

### 📊 Statistiche e Analytics
- **Server Statistics**: Statistiche dettagliate su membri, comandi e moderazione
- **Usage Tracking**: Tracciamento utilizzo comandi e funzionalità
- **Automated Reports**: Report settimanali automatici (opzionale)
- **Data Retention**: Gestione automatica della retention dei dati

### ⚙️ Configurazione Flessibile
- **Per-Guild Settings**: Configurazioni personalizzate per ogni server
- **Welcome Messages**: Messaggi di benvenuto personalizzabili
- **Moderation Channels**: Canali dedicati per log e notifiche
- **Customizable Rules**: Regole di auto-moderazione personalizzabili

## 🚀 Quick Start

### Prerequisiti
- Node.js 18.x o superiore
- npm o yarn
- Un bot Discord (token da [Discord Developer Portal](https://discord.com/developers/applications))
- Database PostgreSQL o SQLite

### Installazione
```bash
# Clona il repository
git clone https://github.com/Fl4chi/discord-smartbot.git
cd discord-smartbot

# Installa le dipendenze
npm install

# Copia e configura il file ambiente
cp .env.example .env
# Modifica .env con i tuoi token e configurazioni

# Configura il database
psql -U postgres -d your_database < schema.sql

# Avvia il bot
npm start
```

### Configurazione .env
```env
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_bot_client_id
GUILD_ID=your_test_guild_id
DATABASE_URL=postgresql://user:password@localhost:5432/minfoai
WEB_PORT=3000
OPENAI_API_KEY=your_openai_api_key
```

## 📋 Comandi Disponibili

### Moderazione
- `/ban` - Banna un utente dal server
- `/kick` - Espelle un utente dal server  
- `/timeout` - Mette in timeout un utente
- `/warn` - Avverte un utente
- `/modlogs` - Visualizza i log di moderazione

### XP e Gamification
- `/xp` - Mostra il tuo XP e livello
- `/leaderboard` - Mostra la classifica XP del server
- `/badges` - Visualizza i tuoi badge
- `/profile` - Mostra il profilo completo

### Configurazione
- `/setup` - Configurazione iniziale del bot
- `/config` - Modifica le impostazioni del server
- `/welcome` - Configura messaggi di benvenuto

### Statistiche
- `/stats` - Statistiche del server
- `/activity` - Attività recente del bot

## 🌐 Dashboard Web

Accedi alla dashboard web su `http://localhost:3000` per:
- Visualizzare statistiche in tempo reale
- Configurare il bot tramite interfaccia grafica
- Gestire membri e moderazione
- Visualizzare log e attività

## 🏗️ Struttura del Progetto

```
discord-smartbot/
├── src/
│   ├── bot/
│   │   ├── aiModeration.js    # Sistema AI moderazione
│   │   └── client.js          # Client Discord
│   ├── commands/
│   │   ├── moderation/        # Comandi moderazione
│   │   ├── xp.js             # Sistema XP e gamification
│   │   └── config.js         # Comandi configurazione
│   ├── events/               # Event handlers Discord
│   ├── store/
│   │   └── db.js            # Database e funzioni
│   └── web/
│       └── dashboard.js     # Dashboard Express.js
├── migrations/              # Migrazioni database
├── index.js                # Entry point
├── package.json
└── README.md
```

## 🤝 Contribuire

1. Fai un fork del progetto
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Committa i tuoi cambiamenti (`git commit -m 'Add some AmazingFeature'`)
4. Pusha sul branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Distribuito sotto licenza MIT. Vedi `LICENSE` per maggiori informazioni.

---

# 🤖 MinfoAI Discord - AI-Powered Moderation & Assistant (English)

MinfoAI is a smart and comprehensive Discord bot that combines advanced AI-based moderation features, conversational assistance, web dashboard, XP gamification system, and automatic protection against spam and raids.

## ✨ Key Features

### 🛡️ Advanced AI Moderation System
- **AI-Powered Auto-Moderation**: Artificial intelligence for automatic moderation
- **Smart Content Analysis**: Advanced content analysis with machine learning
- **Anti-Raid Protection**: Advanced protection against coordinated attacks and raids
- **Anti-Spam**: Intelligent spam detection system with graduated actions
- **Anti-Invite**: Automatic blocking of unauthorized invitation links
- **Moderation Commands**: Ban, kick, timeout, warn with complete logging
- **Audit Logging**: Detailed logging of all moderation actions

### 🧠 Artificial Intelligence
- **Conversational NLP**: Natural conversations with intent recognition
- **Sentiment Analysis**: Message sentiment analysis
- **Context-Aware Responses**: Contextual responses based on history
- **Learning System**: Learning from interactions to improve responses

### 🌐 Interactive Web Dashboard
- **Express.js Dashboard**: Complete web control panel
- **Real-time Statistics**: Real-time server statistics
- **Configuration Interface**: Interface to configure the bot
- **Member Management**: Member management via web
- **Moderation Logs**: Moderation log visualization

### 🎮 XP Gamification System
- **XP System**: Experience system for active members
- **Level System**: Progressive levels based on XP
- **Badge System**: Badges and achievements for various activities
- **Leaderboard**: Server XP rankings
- **Reward System**: Automatic rewards for milestones

### 📊 Statistics and Analytics
- **Server Statistics**: Detailed statistics on members, commands and moderation
- **Usage Tracking**: Command and feature usage tracking
- **Automated Reports**: Automatic weekly reports (optional)
- **Data Retention**: Automatic data retention management

### ⚙️ Flexible Configuration
- **Per-Guild Settings**: Custom configurations for each server
- **Welcome Messages**: Customizable welcome messages
- **Moderation Channels**: Dedicated channels for logs and notifications
- **Customizable Rules**: Customizable auto-moderation rules

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- npm or yarn
- A Discord bot (token from [Discord Developer Portal](https://discord.com/developers/applications))
- PostgreSQL or SQLite database

### Installation
```bash
# Clone the repository
git clone https://github.com/Fl4chi/discord-smartbot.git
cd discord-smartbot

# Install dependencies
npm install

# Copy and configure environment file
cp .env.example .env
# Edit .env with your tokens and configurations

# Setup database
psql -U postgres -d your_database < schema.sql

# Start the bot
npm start
```

## 📋 Available Commands

### Moderation
- `/ban` - Ban a user from the server
- `/kick` - Kick a user from the server
- `/timeout` - Timeout a user
- `/warn` - Warn a user
- `/modlogs` - View moderation logs

### XP and Gamification
- `/xp` - Show your XP and level
- `/leaderboard` - Show server XP leaderboard
- `/badges` - View your badges
- `/profile` - Show complete profile

### Configuration
- `/setup` - Initial bot setup
- `/config` - Modify server settings
- `/welcome` - Configure welcome messages

### Statistics
- `/stats` - Server statistics
- `/activity` - Recent bot activity

## 🌐 Web Dashboard

Access the web dashboard at `http://localhost:3000` to:
- View real-time statistics
- Configure the bot via graphical interface
- Manage members and moderation
- View logs and activity

## 🤝 Contributing

1. Fork the project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
