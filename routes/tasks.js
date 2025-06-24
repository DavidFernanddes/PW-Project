const express = require('express');
const db = require('../config/database');
const { ensureAuthenticated } = require('../middleware/auth');
const { validateTask, validateId } = require('../middleware/validation');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(ensureAuthenticated);

// Função auxiliar para registar operações sobre tarefas
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

// GET /api/tasks - Listar todas as tarefas com filtros
router.get('/', async (req, res) => {
  try {
    const { filter, user_id, type_id, completed } = req.query;
    
    let query;
    let params = [];
    let whereConditions = [];

    // Consulta base
    query = `
      SELECT t.id, t.name, t.description, t.end_date, t.completed, t.created_at, t.updated_at,
             u.name as user_name, u.id as user_id,
             tt.name as type_name, tt.id as type_id,
             c.name as created_by_name, c.id as created_by
      FROM tasks t
      INNER JOIN users u ON t.user_id = u.id
      LEFT JOIN task_types tt ON t.type_id = tt.id
      INNER JOIN users c ON t.created_by = c.id
    `;

    // CRÍTICO: Controlo de acesso baseado em funções - Utilizadores só podem ver as suas próprias tarefas
    if (req.user.role === 'Utilizador') {
      // Utilizadores só podem ver tarefas atribuídas a si OU criadas por si
      whereConditions.push('(t.user_id = ? OR t.created_by = ?)');
      params.push(req.user.id, req.user.id);
    }

    // Aplicar filtros adicionais
    if (filter === 'completed') {
      whereConditions.push('t.completed = true');
    } else if (filter === 'in-progress') {
      whereConditions.push('t.completed = false');
    }

    if (user_id && req.user.role !== 'Utilizador') {
      // Apenas admin/gestor pode filtrar por utilizador específico
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

    // Construir consulta final
    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }

    query += ' ORDER BY t.created_at DESC';

    const [rows] = await db.execute(query, params);

    res.json({
      success: true,
      data: rows,
      count: rows.length,
      filter: filter || 'all',
      user_role: req.user.role,
      user_id: req.user.id
    });

  } catch (error) {
    console.error('Erro ao listar tarefas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/tasks/filter/:filter - Listar tarefas por filtro (concluídas/em progresso/todas)
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

// GET /api/tasks/:id - Obter tarefa por ID
router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;

    let query = `
      SELECT t.id, t.name, t.description, t.end_date, t.completed, t.created_at, t.updated_at,
             u.name as user_name, u.id as user_id,
             tt.name as type_name, tt.id as type_id,
             c.name as created_by_name, c.id as created_by
      FROM tasks t
      INNER JOIN users u ON t.user_id = u.id
      LEFT JOIN task_types tt ON t.type_id = tt.id
      INNER JOIN users c ON t.created_by = c.id
      WHERE t.id = ?
    `;

    let params = [id];

    // Controlo de acesso baseado em funções para tarefa individual
    if (req.user.role === 'Utilizador') {
      query += ' AND (t.user_id = ? OR t.created_by = ?)';
      params.push(req.user.id, req.user.id);
    }

    const [rows] = await db.execute(query, params);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: req.user.role === 'Utilizador' ? 
          'Tarefa não encontrada ou não tem permissão para vê-la' : 
          'Tarefa não encontrada'
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

// POST /api/tasks - Criar nova tarefa
router.post('/', validateTask, async (req, res) => {
  try {
    const { name, description, end_date, user_id, type_id, completed } = req.body;

    // Verificar se o utilizador atribuído existe e está ativo
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

    // Verificar se o tipo de tarefa existe, se fornecido
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

    // Inserir nova tarefa
    const [result] = await db.execute(`
      INSERT INTO tasks (name, description, end_date, user_id, type_id, completed, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, description || null, end_date, user_id, type_id || null, completed || false, req.user.id]);

    // Registar a criação
    await logTaskOperation(result.insertId, req.user.id, 'CREATE', null, {
      name, description, end_date, user_id, type_id, completed
    });

    // Obter a tarefa criada com todos os detalhes
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

// PUT /api/tasks/:id - Atualizar tarefa
router.put('/:id', validateId, validateTask, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, end_date, user_id, type_id, completed } = req.body;

    // Obter dados atuais da tarefa para registo e verificação de permissões
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

    const task = currentTask[0];

    // Verificação de permissões: utilizadores só podem editar tarefas atribuídas a si ou criadas por si
    if (req.user.role === 'Utilizador') {
      if (task.user_id !== req.user.id && task.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Não tem permissão para editar esta tarefa'
        });
      }
    }
    // Admins e Gestores podem editar qualquer tarefa

    // Verificar se o utilizador atribuído existe e está ativo
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

    // Verificar se o tipo de tarefa existe, se fornecido
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

    // Atualizar tarefa
    await db.execute(`
      UPDATE tasks 
      SET name = ?, description = ?, end_date = ?, user_id = ?, type_id = ?, completed = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, description || null, end_date, user_id, type_id || null, completed, id]);

    // Registar a atualização
    await logTaskOperation(id, req.user.id, 'UPDATE', task, {
      name, description, end_date, user_id, type_id, completed
    });

    // Obter tarefa atualizada com todos os detalhes
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

// DELETE /api/tasks/:id - Eliminar tarefa
router.delete('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;

    // Obter dados da tarefa para registo e validação
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

    // Verificação de permissões: utilizadores só podem eliminar tarefas atribuídas a si ou criadas por si
    if (req.user.role === 'Utilizador') {
      if (task.user_id !== req.user.id && task.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Não tem permissão para eliminar esta tarefa'
        });
      }
    }
    // Admins e Gestores podem eliminar qualquer tarefa

    // Verificar se a tarefa está concluída
    if (task.completed) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível eliminar uma tarefa já concluída'
      });
    }

    // Registar a eliminação antes de eliminar
    await logTaskOperation(id, req.user.id, 'DELETE', task, null);

    // Eliminar tarefa
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