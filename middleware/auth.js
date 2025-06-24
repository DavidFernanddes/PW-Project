// Middleware de autenticação
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json({
    success: false,
    message: 'Acesso negado. É necessário fazer login.'
  });
};

// Middleware de autorização
const ensureRole = (roles) => {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Acesso negado. É necessário fazer login.'
      });
    }

    // Permitir se o utilizador tiver algum dos papéis necessários
    if (roles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Não tem permissões suficientes.'
    });
  };
};

// Middleware apenas para administradores
const ensureAdmin = ensureRole(['Administrador']);

// Middleware para administradores ou gestores
const ensureAdminOrManager = ensureRole(['Administrador', 'Gestor']);

module.exports = {
  ensureAuthenticated,
  ensureRole,
  ensureAdmin,
  ensureAdminOrManager
};