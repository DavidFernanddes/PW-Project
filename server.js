require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const passport = require('passport');
const path = require('path');

// Importar rotas
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');
const typeRoutes = require('./routes/types');

// Importar ligação à base de dados
const db = require('./config/database');

// Importar configuração do passport
require('./config/passport')(passport);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: false, // Desativar para desenvolvimento
}));

// Limitação de pedidos
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limitar cada IP a 100 pedidos por janela de tempo
  message: 'Muitos pedidos deste IP, tente novamente mais tarde.'
});
app.use('/api/', limiter);

// Configuração de CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Middleware para parsing do corpo dos pedidos
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuração de sessão
app.use(session({
  secret: process.env.SESSION_SECRET || 'gestao-tarefas-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Middleware do Passport
app.use(passport.initialize());
app.use(passport.session());

// Ficheiros estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/types', typeRoutes);

// Servir páginas do frontend
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

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Algo correu mal!'
  });
});

// Handler 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado'
  });
});

// Testar ligação à base de dados e iniciar servidor
async function startServer() {
  try {
    await db.execute('SELECT 1');
    console.log('Ligação à base de dados estabelecida');
    
    app.listen(PORT, () => {
      console.log(`Servidor a correr na porta ${PORT}`);
      console.log(`Frontend disponível em: http://localhost:${PORT}`);
      console.log(`API disponível em: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Erro ao ligar à base de dados:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;