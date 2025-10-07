# 🤖 SmartBot Discord - AI-Powered Moderation & Assistant

[![Discord.js](https://img.shields.io/badge/discord.js-v14-blue.svg)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/node.js-v18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-orange.svg)](LICENSE)

SmartBot è un bot Discord intelligente e completo che combina funzionalità di moderazione avanzata, assistenza AI conversazionale, e protezione automatica contro spam e raid.

## ✨ Caratteristiche Principali

### 🛡️ Sistema di Moderazione Automatica
- **Auto-Moderation**: Rilevamento e azione automatica su spam, flood e contenuti inappropriati
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
- SQLite3 (incluso con Node.js)

### Installazione

1. **Clona il repository**
```bash
git clone https://github.com/Fl4chi/discord-smartbot.git
cd discord-smartbot
```

2. **Installa le dipendenze**
```bash
npm install
```

3. **Configura il database**
```bash
mkdir data
sqlite3 data/bot.db < migrations/schema.sql
```

4. **Configura le variabili d'ambiente**
```bash
cp .env.example .env
```

Modifica `.env` con i tuoi dati:
```env
DISCORD_TOKEN=il_tuo_token_discord
CLIENT_ID=il_tuo_client_id
GUILD_ID=il_tuo_guild_id_per_test (opzionale)
NODE_ENV=development
```

5. **Avvia il bot**
```bash
npm start
```

Per lo sviluppo con auto-reload:
```bash
npm run dev
```

## 📁 Struttura del Progetto

```
discord-smartbot/
├── src/
│   ├── bot/
│   │   ├── index.js          # Inizializzazione bot e gestione eventi
│   │   ├── moderation.js     # Sistema di moderazione
│   │   └── antiraid.js       # Protezione anti-raid
│   ├── commands/             # Slash commands
│   │   ├── index.js          # Caricatore comandi
│   │   ├── help.js          # Comando help
│   │   ├── info.js          # Informazioni bot
│   │   ├── ask.js           # AI conversation
│   │   ├── ban.js           # Ban utenti
│   │   ├── kick.js          # Kick utenti
│   │   ├── timeout.js       # Timeout utenti
│   │   ├── warn.js          # Avvisi utenti
│   │   ├── antiraid.js      # Gestione protezione raid
│   │   └── config.js        # Configurazione server
│   ├── nlp/
│   │   ├── index.js         # NLP handler principale
│   │   └── persona.js       # Personalità e intents AI
│   ├── store/
│   │   └── db.js            # Database layer (SQLite)
│   ├── jobs/
│   │   └── retention.js     # Job di retention dati
│   └── policies/
│       ├── privacy-it.md    # Privacy policy italiano
│       └── privacy-en.md    # Privacy policy inglese
├── migrations/
│   └── schema.sql           # Schema database
├── data/                     # Database files (gitignored)
├── .env.example             # Template variabili ambiente
├── .gitignore
├── index.js                 # Entry point
├── package.json
└── README.md
```

## 🎮 Comandi Disponibili

### Comandi Generali
- `/help` - Mostra tutti i comandi disponibili
- `/info` - Informazioni sul bot
- `/ask <question>` - Fai una domanda al bot AI
- `/ping` - Verifica latenza del bot

### Comandi di Moderazione (Staff Only)
- `/ban <user> [reason] [days]` - Banna un utente
- `/kick <user> [reason]` - Espelle un utente
- `/timeout <user> <duration> [reason]` - Silenzia temporaneamente
- `/warn <user> <reason>` - Avverte un utente
- `/warnings <user>` - Visualizza avvisi di un utente
- `/modlog <user>` - Storico moderazione utente

### Comandi Anti-Raid (Admin Only)
- `/antiraid enable` - Abilita protezione raid
- `/antiraid disable` - Disabilita protezione raid
- `/antiraid status` - Stato protezione raid
- `/antiraid activate` - Attiva modalità raid manualmente

### Comandi Configurazione (Admin Only)
- `/config set <option> <value>` - Imposta configurazione
- `/config view` - Visualizza configurazione attuale
- `/config reset` - Reset configurazione default

## 🔧 Configurazione Avanzata

### Configurazioni per Guild

Ogni server può configurare:
- **welcomeChannelId**: Canale per messaggi di benvenuto
- **modlogChannelId**: Canale per log di moderazione
- **statsChannelId**: Canale per statistiche settimanali
- **antispamEnabled**: Abilita/disabilita anti-spam
- **antiInviteEnabled**: Abilita/disabilita anti-invite
- **antiraidEnabled**: Abilita/disabilita anti-raid
- **strictMode**: Modalità strict (più restrittiva)

### Auto-Moderazione

Il sistema di auto-moderazione include:

**Anti-Spam**:
- Rilevamento messaggi duplicati
- Rilevamento flood (troppi messaggi in poco tempo)
- Rilevamento mention spam (troppe menzioni)
- Azioni: Timeout automatico (5-10 minuti)

**Anti-Raid**:
- Monitoraggio join sospetti
- Rilevamento account nuovi
- Rilevamento join coordinati
- Attivazione automatica modalità raid
- Azioni: Kick/ban automatico account sospetti

**Anti-Invite**:
- Blocco link discord.gg e discord.com/invite
- Azioni: Cancellazione messaggio + timeout

### Data Retention

Il bot gestisce automaticamente la retention dei dati:
- **Messaggi**: 30 giorni
- **Log moderazione**: Indefinito
- **Conversazioni AI**: 90 giorni
- **Statistiche**: Aggregate dopo 6 mesi

Job automatici:
- Pulizia giornaliera (3 AM)
- Analytics settimanali (Domenica 2 AM)
- Cache cleanup (ogni ora)

## 🔒 Privacy e Sicurezza

Il bot è completamente conforme al GDPR:
- Privacy policy disponibile in italiano e inglese
- Dati crittografati nel database
- Accesso limitato solo a sviluppatori autorizzati
- Nessuna vendita o condivisione dati con terze parti
- Diritti utente: accesso, rettifica, cancellazione

Vedi [Privacy Policy (IT)](src/policies/privacy-it.md) o [Privacy Policy (EN)](src/policies/privacy-en.md)

## 🛠️ Sviluppo

### Setup Ambiente di Sviluppo

```bash
# Installa dipendenze
npm install

# Crea database di sviluppo
mkdir data
sqlite3 data/bot.db < migrations/schema.sql

# Configura .env per development
cp .env.example .env

# Avvia in modalità sviluppo
npm run dev
```

### Testing

```bash
# Run tests (se implementati)
npm test

# Lint code
npm run lint
```

### Best Practices

1. **Commit Messages**: Usa conventional commits (feat:, fix:, docs:, etc.)
2. **Code Style**: Segui ESLint configuration
3. **Documentation**: Documenta tutte le funzioni complesse
4. **Error Handling**: Gestisci sempre gli errori con try-catch
5. **Logging**: Usa console.log per info, console.error per errori

## 📦 Dipendenze Principali

- **discord.js** v14 - Framework Discord
- **sqlite3** - Database
- **sqlite** - Promise wrapper per sqlite3
- **node-cron** - Scheduler per job periodici
- **dotenv** - Gestione variabili ambiente

## 🚨 Troubleshooting

### Il bot non si avvia
- Verifica che il token Discord sia corretto in `.env`
- Controlla che Node.js sia versione 18 o superiore: `node --version`
- Verifica che tutte le dipendenze siano installate: `npm install`

### Comandi slash non visibili
- Assicurati che il bot abbia il permesso `applications.commands`
- Riavvia Discord o attendi qualche minuto (può richiedere fino a 1 ora)
- Verifica che CLIENT_ID sia corretto

### Database errors
- Verifica che la cartella `data/` esista
- Riesegui la migrazione: `sqlite3 data/bot.db < migrations/schema.sql`
- Controlla i permessi della cartella

### Bot non risponde ai comandi
- Verifica che il bot sia online nel server
- Controlla i log per errori: `npm start`
- Verifica che il bot abbia i permessi necessari nel server

## 🤝 Contribuire

I contributi sono benvenuti! Per contribuire:

1. Fork il repository
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Commit le tue modifiche (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

### Idee per Contributi

- [ ] Sistema di livelli e XP per gli utenti
- [ ] Comandi di economia virtuale
- [ ] Sistema di ticket per supporto
- [ ] Integrazione con API esterne (weather, news, etc.)
- [ ] Dashboard web per configurazione
- [ ] Sistema di backup automatico
- [ ] Multi-language support completo
- [ ] Voice channel moderation
- [ ] Custom emoji reactions
- [ ] Music player integration

## 📝 Changelog

Vedi [GitHub Releases](https://github.com/Fl4chi/discord-smartbot/releases) per il changelog completo.

## 📄 Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi il file `LICENSE` per i dettagli.

## 👥 Autori

- **Fl4chi** - *Sviluppo iniziale* - [GitHub](https://github.com/Fl4chi)

## 🙏 Ringraziamenti

- Discord.js community per l'eccellente documentazione
- Tutti i contributori che hanno aiutato a migliorare il progetto
- La community Discord per il feedback e i test

## 📞 Supporto

Se hai domande o problemi:
- Apri una [Issue](https://github.com/Fl4chi/discord-smartbot/issues)
- Unisciti al [Server Discord di Supporto](#) (se disponibile)
- Usa il comando `/support` nel bot

---

<div align="center">
  <sub>Built with ❤️ by Fl4chi</sub>
  <br>
  <sub>Powered by Discord.js and AI</sub>
</div>
