const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { Server } = require('socket.io');
const http = require('http');
const winston = require('winston');

// Logger per Dashboard Web
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/dashboard.log' }),
    new winston.transports.Console()
  ]
});

class WebDashboard {
  constructor() {
    this.app = express();
    this.server = null;
    this.io = null;
    this.client = null;
    this.port = process.env.WEB_PORT || 3000;
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false, // Disable CSP per Socket.IO
      crossOriginEmbedderPolicy: false
    }));
    
    this.app.use(cors({
      origin: process.env.DASHBOARD_URL || `http://localhost:${this.port}`,
      credentials: true
    }));
    
    this.app.use(morgan('combined', {
      stream: { write: message => logger.info(message.trim()) }
    }));
    
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Static files
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    // Template engine setup (EJS)
    this.app.set('view engine', 'ejs');
    this.app.set('views', path.join(__dirname, 'views'));
  }

  setupRoutes() {
    // Route principale dashboard
    this.app.get('/', async (req, res) => {
      try {
        const stats = await this.getDashboardStats();
        res.render('dashboard', {
          title: 'MinfoAI Dashboard',
          stats: stats,
          botUser: this.client?.user || null
        });
      } catch (error) {
        logger.error('Errore caricamento dashboard:', error);
        res.status(500).render('error', { error: 'Errore caricamento dashboard' });
      }
    });

    // API Routes
    this.app.get('/api/stats', async (req, res) => {
      try {
        const stats = await this.getDashboardStats();
        res.json({ success: true, data: stats });
      } catch (error) {
        logger.error('Errore API stats:', error);
        res.status(500).json({ success: false, error: 'Errore recupero statistiche' });
      }
    });

    this.app.get('/api/guilds', async (req, res) => {
      try {
        if (!this.client) {
          return res.status(503).json({ success: false, error: 'Bot non connesso' });
        }
        
        const guilds = this.client.guilds.cache.map(guild => ({
          id: guild.id,
          name: guild.name,
          memberCount: guild.memberCount,
          icon: guild.iconURL(),
          owner: guild.ownerId
        }));
        
        res.json({ success: true, data: guilds });
      } catch (error) {
        logger.error('Errore API guilds:', error);
        res.status(500).json({ success: false, error: 'Errore recupero server' });
      }
    });

    this.app.get('/api/guilds/:guildId/stats', async (req, res) => {
      try {
        const guildId = req.params.guildId;
        const guild = this.client?.guilds.cache.get(guildId);
        
        if (!guild) {
          return res.status(404).json({ success: false, error: 'Server non trovato' });
        }
        
        const dbModule = require('../store/db');
        const guildStats = await dbModule.getGuildStats(guildId);
        
        res.json({ success: true, data: guildStats });
      } catch (error) {
        logger.error('Errore API guild stats:', error);
        res.status(500).json({ success: false, error: 'Errore statistiche server' });
      }
    });

    this.app.get('/api/guilds/:guildId/leaderboard', async (req, res) => {
      try {
        const guildId = req.params.guildId;
        const limit = parseInt(req.query.limit) || 10;
        
        const dbModule = require('../store/db');
        const leaderboard = await dbModule.getXPLeaderboard(guildId, limit);
        
        res.json({ success: true, data: leaderboard });
      } catch (error) {
        logger.error('Errore API leaderboard:', error);
        res.status(500).json({ success: false, error: 'Errore classifica XP' });
      }
    });

    this.app.get('/api/guilds/:guildId/moderation', async (req, res) => {
      try {
        const guildId = req.params.guildId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        const dbModule = require('../store/db');
        const moderationLogs = await dbModule.getModerationLogs(guildId, page, limit);
        
        res.json({ success: true, data: moderationLogs });
      } catch (error) {
        logger.error('Errore API moderation:', error);
        res.status(500).json({ success: false, error: 'Errore log moderazione' });
      }
    });

    // Configuration endpoints
    this.app.post('/api/guilds/:guildId/config', async (req, res) => {
      try {
        const guildId = req.params.guildId;
        const config = req.body;
        
        const dbModule = require('../store/db');
        await dbModule.updateGuildConfig(guildId, config);
        
        res.json({ success: true, message: 'Configurazione aggiornata' });
      } catch (error) {
        logger.error('Errore API config update:', error);
        res.status(500).json({ success: false, error: 'Errore aggiornamento configurazione' });
      }
    });

    this.app.get('/api/guilds/:guildId/config', async (req, res) => {
      try {
        const guildId = req.params.guildId;
        
        const dbModule = require('../store/db');
        const config = await dbModule.getGuildConfig(guildId);
        
        res.json({ success: true, data: config });
      } catch (error) {
        logger.error('Errore API config get:', error);
        res.status(500).json({ success: false, error: 'Errore recupero configurazione' });
      }
    });

    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        bot: {
          connected: this.client?.isReady() || false,
          guilds: this.client?.guilds.cache.size || 0,
          users: this.client?.users.cache.size || 0
        }
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).render('error', {
        error: 'Pagina non trovata',
        title: 'MinfoAI Dashboard - 404'
      });
    });

    // Error handler
    this.app.use((err, req, res, next) => {
      logger.error('Errore server:', err);
      res.status(500).render('error', {
        error: 'Errore interno del server',
        title: 'MinfoAI Dashboard - Errore'
      });
    });
  }

  setupSocketIO() {
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.DASHBOARD_URL || `http://localhost:${this.port}`,
        methods: ['GET', 'POST']
      }
    });

    this.io.on('connection', (socket) => {
      logger.info(`Client connesso: ${socket.id}`);

      // Join room per server specifico
      socket.on('join-guild', (guildId) => {
        socket.join(`guild:${guildId}`);
        logger.info(`Client ${socket.id} entrato in guild:${guildId}`);
      });

      // Leave room
      socket.on('leave-guild', (guildId) => {
        socket.leave(`guild:${guildId}`);
        logger.info(`Client ${socket.id} uscito da guild:${guildId}`);
      });

      socket.on('disconnect', () => {
        logger.info(`Client disconnesso: ${socket.id}`);
      });
    });
  }

  async getDashboardStats() {
    try {
      const stats = {
        bot: {
          guilds: this.client?.guilds.cache.size || 0,
          users: this.client?.users.cache.size || 0,
          channels: this.client?.channels.cache.size || 0,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          ping: this.client?.ws.ping || 0
        },
        system: {
          node: process.version,
          platform: process.platform,
          arch: process.arch,
          startTime: new Date(Date.now() - process.uptime() * 1000)
        }
      };

      // Statistiche database se disponibile
      try {
        const dbModule = require('../store/db');
        const dbStats = await dbModule.getGlobalStats();
        stats.database = dbStats;
      } catch (dbError) {
        logger.warn('Errore recupero statistiche database:', dbError);
        stats.database = { error: 'Database non disponibile' };
      }

      return stats;
    } catch (error) {
      logger.error('Errore getDashboardStats:', error);
      return { error: 'Errore recupero statistiche' };
    }
  }

  // Metodi per broadcast eventi in tempo reale
  broadcastModerationAction(guildId, action) {
    if (this.io) {
      this.io.to(`guild:${guildId}`).emit('moderation-action', action);
    }
  }

  broadcastXPUpdate(guildId, userUpdate) {
    if (this.io) {
      this.io.to(`guild:${guildId}`).emit('xp-update', userUpdate);
    }
  }

  broadcastServerStats(guildId, stats) {
    if (this.io) {
      this.io.to(`guild:${guildId}`).emit('stats-update', stats);
    }
  }

  start(client) {
    this.client = client;
    
    this.server = http.createServer(this.app);
    this.setupSocketIO();

    this.server.listen(this.port, () => {
      logger.info(`🌐 MinfoAI Dashboard avviata su http://localhost:${this.port}`);
      console.log(`🌐 Dashboard Web: http://localhost:${this.port}`);
    });

    this.server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Porta ${this.port} già in uso`);
        process.exit(1);
      } else {
        logger.error('Errore server dashboard:', error);
      }
    });
  }

  stop() {
    if (this.server) {
      this.server.close(() => {
        logger.info('🛑 MinfoAI Dashboard chiusa');
      });
    }
  }
}

// Istanza singleton
const webDashboard = new WebDashboard();

module.exports = webDashboard;
