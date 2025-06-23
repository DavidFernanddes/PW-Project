// Authentication middleware
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json({
    success: false,
    message: 'Acesso negado. É necessário fazer login.'
  });
};

// Authorization middleware
const ensureRole = (roles) => {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Acesso negado. É necessário fazer login.'
      });
    }

    // Allow if user has any of the required roles
    if (roles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Não tem permissões suficientes.'
    });
  };
};

// Admin only middleware
const ensureAdmin = ensureRole(['Administrador']);

// Admin or Manager middleware
const ensureAdminOrManager = ensureRole(['Administrador', 'Gestor']);

module.exports = {
  ensureAuthenticated,
  ensureRole,
  ensureAdmin,
  ensureAdminOrManager
};