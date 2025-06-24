const { body, param, validationResult } = require('express-validator');

// Lida com erros de validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: errors.array()
    });
  }
  next();
};

// Regras de validação para Utilizador
const validateUser = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome deve ter entre 2 e 255 caracteres'),
  
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username é obrigatório')
    .isLength({ min: 3, max: 100 })
    .withMessage('Username deve ter entre 3 e 100 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username só pode conter letras, números e underscore'),
  
  body('role')
    .notEmpty()
    .withMessage('Role é obrigatório')
    .isIn(['Administrador', 'Utilizador', 'Gestor'])
    .withMessage('Role inválido'),
  
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active deve ser booleano'),
  
  handleValidationErrors
];

// Regras de validação para Tarefa
const validateTask = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Nome da tarefa é obrigatório')
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome deve ter entre 2 e 255 caracteres'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Descrição não pode ter mais de 1000 caracteres'),
  
  body('end_date')
    .notEmpty()
    .withMessage('Data fim é obrigatória')
    .isISO8601()
    .withMessage('Data fim deve estar no formato YYYY-MM-DD')
    .custom((value) => {
      const inputDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (inputDate < today) {
        throw new Error('Data fim não pode estar no passado');
      }
      return true;
    }),
  
  body('user_id')
    .notEmpty()
    .withMessage('Utilizador é obrigatório')
    .isInt({ min: 1 })
    .withMessage('ID do utilizador deve ser um número positivo'),
  
  body('type_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID do tipo deve ser um número positivo'),
  
  body('completed')
    .optional()
    .isBoolean()
    .withMessage('Completed deve ser booleano'),
  
  handleValidationErrors
];

// Regras de validação para Tipo de Tarefa
const validateTaskType = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Nome do tipo é obrigatório')
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome deve ter entre 2 e 255 caracteres'),
  
  handleValidationErrors
];

// Regras de validação para Login
const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username é obrigatório'),
  
  body('password')
    .notEmpty()
    .withMessage('Password é obrigatória'),
  
  handleValidationErrors
];

// Validação do parâmetro ID
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID deve ser um número positivo'),
  
  handleValidationErrors
];

module.exports = {
  validateUser,
  validateTask,
  validateTaskType,
  validateLogin,
  validateId,
  handleValidationErrors
};