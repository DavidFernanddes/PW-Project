const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const db = require('./database');

module.exports = function(passport) {
  // Estratégia Local
  passport.use(new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password'
    },
    async (username, password, done) => {
      try {
        // Procurar utilizador pelo nome de utilizador
        const [rows] = await db.execute(
          'SELECT * FROM users WHERE username = ? AND active = true',
          [username]
        );

        if (rows.length === 0) {
          return done(null, false, { message: 'Utilizador não encontrado ou inativo' });
        }

        const user = rows[0];

        // Verificar password
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
          return done(null, false, { message: 'Password incorreta' });
        }

        // Retornar utilizador (sem a password)
        const { password: userPassword, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);

      } catch (error) {
        console.error('Erro na autenticação:', error);
        return done(error);
      }
    }
  ));

  // Serializar utilizador para a sessão
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Desserializar utilizador da sessão
  passport.deserializeUser(async (id, done) => {
    try {
      const [rows] = await db.execute(
        'SELECT id, name, username, role, active FROM users WHERE id = ? AND active = true',
        [id]
      );

      if (rows.length === 0) {
        return done(null, false);
      }

      done(null, rows[0]);
    } catch (error) {
      console.error('Erro ao desserializar utilizador:', error);
      done(error);
    }
  });
};