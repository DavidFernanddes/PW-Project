require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const passport = require('passport');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');
const typeRoutes = require('./routes/types');

// Import database connection
const db = require('./config/database');

// Import passport configuration
require('./config/passport')(passport);

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Muitos pedidos deste IP, tente novamente mais tarde.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'gestao-tarefas-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/types', typeRoutes);

// Serve frontend pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/tasks', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'TaskManagement.html'));
});

app.get('/users', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'Users.html'));
});

app.get('/types', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'TaskType.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Algo correu mal!'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado'
  });
});

// Test database connection and start server
async function startServer() {
  try {
    await db.execute('SELECT 1');
    console.log('✅ Conexão com a base de dados estabelecida');
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor a correr na porta ${PORT}`);
      console.log(`📱 Frontend disponível em: http://localhost:${PORT}`);
      console.log(`🔗 API disponível em: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Erro ao conectar com a base de dados:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;