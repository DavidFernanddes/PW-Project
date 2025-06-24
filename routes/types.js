const express = require('express');
const db = require('../config/database');
const { ensureAuthenticated, ensureAdminOrManager } = require('../middleware/auth');
const { validateTaskType, validateId } = require('../middleware/validation');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(ensureAuthenticated);

// GET /api/types - Listar todos os tipos de tarefa
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT id, name, created_at, updated_at 
      FROM task_types 
      ORDER BY name ASC
    `);

    res.json({
      success: true,
      data: rows,
      count: rows.length
    });

  } catch (error) {
    console.error('Erro ao listar tipos de tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/types/:id - Obter tipo de tarefa pelo ID
router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.execute(`
      SELECT id, name, created_at, updated_at 
      FROM task_types 
      WHERE id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de tarefa não encontrado'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });

  } catch (error) {
    console.error('Erro ao obter tipo de tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/types - Criar novo tipo de tarefa (Apenas Admin/Gestor)
router.post('/', ensureAdminOrManager, validateTaskType, async (req, res) => {
  try {
    const { name } = req.body;

    // Verificar se o nome já existe
    const [existingTypes] = await db.execute(
      'SELECT id FROM task_types WHERE name = ?',
      [name]
    );

    if (existingTypes.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Já existe um tipo com este nome'
      });
    }

    // Inserir novo tipo de tarefa
    const [result] = await db.execute(`
      INSERT INTO task_types (name) 
      VALUES (?)
    `, [name]);

    // Obter o tipo de tarefa criado
    const [newType] = await db.execute(`
      SELECT id, name, created_at 
      FROM task_types 
      WHERE id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Tipo de tarefa criado com sucesso',
      data: newType[0]
    });

  } catch (error) {
    console.error('Erro ao criar tipo de tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/types/:id - Atualizar tipo de tarefa (Apenas Admin/Gestor)
router.put('/:id', ensureAdminOrManager, validateId, validateTaskType, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Verificar se o tipo de tarefa existe
    const [existingType] = await db.execute(
      'SELECT id FROM task_types WHERE id = ?',
      [id]
    );

    if (existingType.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de tarefa não encontrado'
      });
    }

    // Verificar se o nome já existe (excluindo o tipo atual)
    const [duplicateTypes] = await db.execute(
      'SELECT id FROM task_types WHERE name = ? AND id != ?',
      [name, id]
    );

    if (duplicateTypes.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Já existe um tipo com este nome'
      });
    }

    // Atualizar tipo de tarefa
    await db.execute(`
      UPDATE task_types 
      SET name = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [name, id]);

    // Obter tipo de tarefa atualizado
    const [updatedType] = await db.execute(`
      SELECT id, name, updated_at 
      FROM task_types 
      WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'Tipo de tarefa atualizado com sucesso',
      data: updatedType[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar tipo de tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/types/:id - Eliminar tipo de tarefa (Apenas Admin/Gestor)
router.delete('/:id', ensureAdminOrManager, validateId, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o tipo de tarefa existe
    const [existingType] = await db.execute(
      'SELECT id, name FROM task_types WHERE id = ?',
      [id]
    );

    if (existingType.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de tarefa não encontrado'
      });
    }

    // Verificar se o tipo está a ser usado por alguma tarefa
    const [tasksUsingType] = await db.execute(
      'SELECT COUNT(*) as task_count FROM tasks WHERE type_id = ?',
      [id]
    );

    if (tasksUsingType[0].task_count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível eliminar o tipo porque está associado a uma ou mais tarefas'
      });
    }

    // Eliminar tipo de tarefa
    await db.execute('DELETE FROM task_types WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Tipo de tarefa eliminado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao eliminar tipo de tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;