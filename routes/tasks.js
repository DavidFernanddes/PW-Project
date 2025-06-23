const express = require('express');
const db = require('../config/database');
const { ensureAuthenticated } = require('../middleware/auth');
const { validateTask, validateId } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(ensureAuthenticated);

// Helper function to log task operations
async function logTaskOperation(taskId, userId, action, oldValues = null, newValues = null) {
  try {
    await db.execute(`
      INSERT INTO task_logs (task_id, user_id, action, old_values, new_values) 
      VALUES (?, ?, ?, ?, ?)
    `, [taskId, userId, action, JSON.stringify(oldValues), JSON.stringify(newValues)]);
  } catch (error) {
    console.error('Erro ao registar log da tarefa:', error);
  }
}

// GET /api/tasks - List all tasks with filters
router.get('/', async (req, res) => {
  try {
    const { filter, user_id, type_id, completed } = req.query;
    let query = `
      SELECT t.id, t.name, t.description, t.end_date, t.completed, t.created_at, t.updated_at,
             u.name as user_name, u.id as user_id,
             tt.name as type_name, tt.id as type_id,
             c.name as created_by_name
      FROM tasks t
      INNER JOIN users u ON t.user_id = u.id
      LEFT JOIN task_types tt ON t.type_id = tt.id
      INNER JOIN users c ON t.created_by = c.id
    `;
    
    let params = [];
    let whereConditions = [];

    // Apply filters
    if (filter === 'completed') {
      whereConditions.push('t.completed = true');
    } else if (filter === 'in-progress') {
      whereConditions.push('t.completed = false');
    }

    if (user_id) {
      whereConditions.push('t.user_id = ?');
      params.push(user_id);
    }

    if (type_id) {
      whereConditions.push('t.type_id = ?');
      params.push(type_id);
    }

    if (completed !== undefined) {
      whereConditions.push('t.completed = ?');
      params.push(completed === 'true');
    }

    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }

    query += ' ORDER BY t.created_at DESC';

    const [rows] = await db.execute(query, params);

    res.json({
      success: true,
      data: rows,
      count: rows.length,
      filter: filter || 'all'
    });

  } catch (error) {
    console.error('Erro ao listar tarefas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/tasks/filter/:filter - List tasks by filter (completed/in-progress/all)
router.get('/filter/:filter', async (req, res) => {
  try {
    const { filter } = req.params;
    let query = `
      SELECT t.id, t.name, t.description, t.end_date, t.completed, t.created_at,
             u.name as user_name, u.id as user_id,
             tt.name as type_name, tt.id as type_id
      FROM tasks t
      INNER JOIN users u ON t.user_id = u.id
      LEFT JOIN task_types tt ON t.type_id = tt.id
    `;

    if (filter === 'completed') {
      query += ' WHERE t.completed = true';
    } else if (filter === 'in-progress') {
      query += ' WHERE t.completed = false';
    }

    query += ' ORDER BY t.created_at DESC';

    const [rows] = await db.execute(query);

    res.json({
      success: true,
      data: rows,
      count: rows.length,
      filter
    });

  } catch (error) {
    console.error('Erro ao filtrar tarefas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/tasks/:id - Get task by ID
router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.execute(`
      SELECT t.id, t.name, t.description, t.end_date, t.completed, t.created_at, t.updated_at,
             u.name as user_name, u.id as user_id,
             tt.name as type_name, tt.id as type_id,
             c.name as created_by_name, c.id as created_by
      FROM tasks t
      INNER JOIN users u ON t.user_id = u.id
      LEFT JOIN task_types tt ON t.type_id = tt.id
      INNER JOIN users c ON t.created_by = c.id
      WHERE t.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tarefa não encontrada'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });

  } catch (error) {
    console.error('Erro ao obter tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/tasks - Create new task
router.post('/', validateTask, async (req, res) => {
  try {
    const { name, description, end_date, user_id, type_id, completed } = req.body;

    // Verify that the assigned user exists and is active
    const [userCheck] = await db.execute(
      'SELECT id FROM users WHERE id = ? AND active = true',
      [user_id]
    );

    if (userCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Utilizador não encontrado ou inativo'
      });
    }

    // Verify task type exists if provided
    if (type_id) {
      const [typeCheck] = await db.execute(
        'SELECT id FROM task_types WHERE id = ?',
        [type_id]
      );

      if (typeCheck.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de tarefa não encontrado'
        });
      }
    }

    // Insert new task
    const [result] = await db.execute(`
      INSERT INTO tasks (name, description, end_date, user_id, type_id, completed, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, description || null, end_date, user_id, type_id || null, completed || false, req.user.id]);

    // Log the creation
    await logTaskOperation(result.insertId, req.user.id, 'CREATE', null, {
      name, description, end_date, user_id, type_id, completed
    });

    // Get the created task with all details
    const [newTask] = await db.execute(`
      SELECT t.id, t.name, t.description, t.end_date, t.completed, t.created_at,
             u.name as user_name, u.id as user_id,
             tt.name as type_name, tt.id as type_id
      FROM tasks t
      INNER JOIN users u ON t.user_id = u.id
      LEFT JOIN task_types tt ON t.type_id = tt.id
      WHERE t.id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Tarefa criada com sucesso',
      data: newTask[0]
    });

  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', validateId, validateTask, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, end_date, user_id, type_id, completed } = req.body;

    // Get current task data for logging
    const [currentTask] = await db.execute(
      'SELECT * FROM tasks WHERE id = ?',
      [id]
    );

    if (currentTask.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tarefa não encontrada'
      });
    }

    // Verify that the assigned user exists and is active
    const [userCheck] = await db.execute(
      'SELECT id FROM users WHERE id = ? AND active = true',
      [user_id]
    );

    if (userCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Utilizador não encontrado ou inativo'
      });
    }

    // Verify task type exists if provided
    if (type_id) {
      const [typeCheck] = await db.execute(
        'SELECT id FROM task_types WHERE id = ?',
        [type_id]
      );

      if (typeCheck.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de tarefa não encontrado'
        });
      }
    }

    // Update task
    await db.execute(`
      UPDATE tasks 
      SET name = ?, description = ?, end_date = ?, user_id = ?, type_id = ?, completed = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, description || null, end_date, user_id, type_id || null, completed, id]);

    // Log the update
    await logTaskOperation(id, req.user.id, 'UPDATE', currentTask[0], {
      name, description, end_date, user_id, type_id, completed
    });

    // Get updated task with all details
    const [updatedTask] = await db.execute(`
      SELECT t.id, t.name, t.description, t.end_date, t.completed, t.updated_at,
             u.name as user_name, u.id as user_id,
             tt.name as type_name, tt.id as type_id
      FROM tasks t
      INNER JOIN users u ON t.user_id = u.id
      LEFT JOIN task_types tt ON t.type_id = tt.id
      WHERE t.id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'Tarefa atualizada com sucesso',
      data: updatedTask[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;

    // Get task data for logging and validation
    const [existingTask] = await db.execute(
      'SELECT * FROM tasks WHERE id = ?',
      [id]
    );

    if (existingTask.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tarefa não encontrada'
      });
    }

    const task = existingTask[0];

    // Check if task is completed
    if (task.completed) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível eliminar uma tarefa já concluída'
      });
    }

    // Log the deletion before deleting
    await logTaskOperation(id, req.user.id, 'DELETE', task, null);

    // Delete task
    await db.execute('DELETE FROM tasks WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Tarefa eliminada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao eliminar tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;