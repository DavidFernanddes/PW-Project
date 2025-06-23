const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { ensureAuthenticated, ensureAdminOrManager } = require('../middleware/auth');
const { validateUser, validateId } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(ensureAuthenticated);

// GET /api/users - List all users
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

// GET /api/users/active - List active users only
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

// GET /api/users/:id - Get user by ID
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

// POST /api/users - Create new user (Admin/Manager only)
router.post('/', ensureAdminOrManager, validateUser, async (req, res) => {
  try {
    const { name, username, password, role, active } = req.body;

    // Check if username already exists
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

    // Hash password (default if not provided)
    const hashedPassword = await bcrypt.hash(password || 'password123', 12);

    // Insert new user
    const [result] = await db.execute(`
      INSERT INTO users (name, username, password, role, active) 
      VALUES (?, ?, ?, ?, ?)
    `, [name, username, hashedPassword, role, active || false]);

    // Get the created user
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

// PUT /api/users/:id - Update user (Admin/Manager only)
router.put('/:id', ensureAdminOrManager, validateId, validateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, password, role, active } = req.body;

    // Check if user exists
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

    // Check if username already exists (excluding current user)
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

    // Prepare update query
    let updateQuery = `
      UPDATE users 
      SET name = ?, username = ?, role = ?, active = ?, updated_at = CURRENT_TIMESTAMP
    `;
    let updateParams = [name, username, role, active];

    // Include password if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      updateQuery += ', password = ?';
      updateParams.push(hashedPassword);
    }

    updateQuery += ' WHERE id = ?';
    updateParams.push(id);

    await db.execute(updateQuery, updateParams);

    // Get updated user
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

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', ensureAdminOrManager, validateId, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Não pode eliminar a sua própria conta'
      });
    }

    // Check if user exists
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

    // Check if user has associated tasks
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

    // Delete user
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