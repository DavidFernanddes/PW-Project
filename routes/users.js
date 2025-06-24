const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { ensureAuthenticated, ensureAdminOrManager } = require('../middleware/auth');
const { validateUser, validateId } = require('../middleware/validation');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(ensureAuthenticated);

// GET /api/users - Listar todos os utilizadores
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT id, name, username, active, role, created_at, updated_at 
      FROM users 
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: rows,
      count: rows.length
    });

  } catch (error) {
    console.error('Erro ao listar utilizadores:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/users/active - Listar apenas utilizadores ativos
router.get('/active', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT id, name, username, role, created_at 
      FROM users 
      WHERE active = true 
      ORDER BY name ASC
    `);

    res.json({
      success: true,
      data: rows,
      count: rows.length
    });

  } catch (error) {
    console.error('Erro ao listar utilizadores ativos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/users/:id - Obter utilizador por ID
router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.execute(`
      SELECT id, name, username, active, role, created_at, updated_at 
      FROM users 
      WHERE id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilizador não encontrado'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });

  } catch (error) {
    console.error('Erro ao obter utilizador:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/users - Criar novo utilizador (Apenas Admin/Gestor)
router.post('/', ensureAdminOrManager, validateUser, async (req, res) => {
  try {
    const { name, username, password, role, active } = req.body;

    // Verificar se o username já existe
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Já existe um utilizador com este username'
      });
    }

    // Encriptar password (valor por defeito se não for fornecida)
    const hashedPassword = await bcrypt.hash(password || 'password123', 12);

    // Inserir novo utilizador
    const [result] = await db.execute(`
      INSERT INTO users (name, username, password, role, active) 
      VALUES (?, ?, ?, ?, ?)
    `, [name, username, hashedPassword, role, active || false]);

    // Obter o utilizador criado
    const [newUser] = await db.execute(`
      SELECT id, name, username, active, role, created_at 
      FROM users 
      WHERE id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Utilizador criado com sucesso',
      data: newUser[0]
    });

  } catch (error) {
    console.error('Erro ao criar utilizador:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/users/:id - Atualizar utilizador (Apenas Admin/Gestor)
router.put('/:id', ensureAdminOrManager, validateId, validateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, password, role, active } = req.body;

    // Verificar se o utilizador existe
    const [existingUser] = await db.execute(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilizador não encontrado'
      });
    }

    // Verificar se o username já existe (excluindo o próprio utilizador)
    const [duplicateUsers] = await db.execute(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [username, id]
    );

    if (duplicateUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Já existe um utilizador com este username'
      });
    }

    // Preparar query de atualização
    let updateQuery = `
      UPDATE users 
      SET name = ?, username = ?, role = ?, active = ?, updated_at = CURRENT_TIMESTAMP
    `;
    let updateParams = [name, username, role, active];

    // Incluir password se fornecida
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      updateQuery += ', password = ?';
      updateParams.push(hashedPassword);
    }

    updateQuery += ' WHERE id = ?';
    updateParams.push(id);

    await db.execute(updateQuery, updateParams);

    // Obter utilizador atualizado
    const [updatedUser] = await db.execute(`
      SELECT id, name, username, active, role, updated_at 
      FROM users 
      WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'Utilizador atualizado com sucesso',
      data: updatedUser[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar utilizador:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/users/:id - Eliminar utilizador (Apenas Admin)
router.delete('/:id', ensureAdminOrManager, validateId, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevenir autoeliminação
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Não pode eliminar a sua própria conta'
      });
    }

    // Verificar se o utilizador existe
    const [existingUser] = await db.execute(
      'SELECT id, name FROM users WHERE id = ?',
      [id]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilizador não encontrado'
      });
    }

    // Verificar se o utilizador tem tarefas associadas
    const [userTasks] = await db.execute(
      'SELECT COUNT(*) as task_count FROM tasks WHERE user_id = ? OR created_by = ?',
      [id, id]
    );

    if (userTasks[0].task_count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível eliminar o utilizador porque tem tarefas associadas'
      });
    }

    // Eliminar utilizador
    await db.execute('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Utilizador eliminado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao eliminar utilizador:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;