const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { validateLogin } = require('../middleware/validation');
const { ensureAuthenticated } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', validateLogin, (req, res, next) => {
  // Verifica se o utilizador já está autenticado
  if (req.isAuthenticated()) {
    return res.json({
      success: true,
      message: 'Já está autenticado',
      user: {
        id: req.user.id,
        name: req.user.name,
        username: req.user.username,
        role: req.user.role
      }
    });
  }

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Erro no login:', err);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info.message || 'Credenciais inválidas'
      });
    }

    req.logIn(user, (err) => {
      if (err) {
        console.error('Erro ao iniciar sessão:', err);
        return res.status(500).json({
          success: false,
          message: 'Erro ao iniciar sessão'
        });
      }

      return res.json({
        success: true,
        message: 'Login efetuado com sucesso',
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role
        }
      });
    });
  })(req, res, next);
});

// POST /api/auth/logout
router.post('/logout', ensureAuthenticated, (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Erro no logout:', err);
      return res.status(500).json({
        success: false,
        message: 'Erro ao terminar sessão'
      });
    }

    req.session.destroy((err) => {
      if (err) {
        console.error('Erro ao destruir sessão:', err);
        return res.status(500).json({
          success: false,
          message: 'Erro ao terminar sessão'
        });
      }

      res.clearCookie('connect.sid');
      return res.json({
        success: true,
        message: 'Logout efetuado com sucesso'
      });
    });
  });
});

// GET /api/auth/me
router.get('/me', ensureAuthenticated, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      username: req.user.username,
      role: req.user.role
    }
  });
});

// GET /api/auth/status
router.get('/status', (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({
      success: true,
      authenticated: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        username: req.user.username,
        role: req.user.role
      }
    });
  }

  res.json({
    success: true,
    authenticated: false,
    user: null
  });
});

// POST /api/auth/register (apenas para o administrador criar utilizadores)
router.post('/register', ensureAuthenticated, async (req, res) => {
  try {
    // Apenas o administrador pode criar utilizadores
    if (req.user.role !== 'Administrador') {
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem criar utilizadores'
      });
    }

    const { name, username, password, role, active } = req.body;

    // Verifica se o username já existe
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username já existe'
      });
    }

    // Encripta a palavra-passe
    const hashedPassword = await bcrypt.hash(password || 'password123', 12);

    // Insere novo utilizador
    const [result] = await db.execute(
      'INSERT INTO users (name, username, password, role, active) VALUES (?, ?, ?, ?, ?)',
      [name, username, hashedPassword, role, active || false]
    );

    res.status(201).json({
      success: true,
      message: 'Utilizador criado com sucesso',
      user: {
        id: result.insertId,
        name,
        username,
        role,
        active: active || false
      }
    });

  } catch (error) {
    console.error('Erro ao criar utilizador:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;