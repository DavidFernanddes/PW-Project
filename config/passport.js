const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const db = require('./database');

module.exports = function(passport) {
  // Local Strategy
  passport.use(new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password'
    },
    async (username, password, done) => {
      try {
        console.log('🔍 Passport: Procurando utilizador:', username);
        
        // Find user by username
        const [rows] = await db.execute(
          'SELECT * FROM users WHERE username = ? AND active = true',
          [username]
        );

        console.log('📊 Passport: Utilizadores encontrados:', rows.length);

        if (rows.length === 0) {
          console.log('❌ Passport: Utilizador não encontrado ou inativo:', username);
          return done(null, false, { message: 'Utilizador não encontrado ou inativo' });
        }

        const user = rows[0];
        console.log('✅ Passport: Utilizador encontrado:', user.username, 'Role:', user.role);

        // Check password
        console.log('🔐 Passport: Verificando password...');
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('🔐 Passport: Password válida:', isMatch);
        
        if (!isMatch) {
          console.log('❌ Passport: Password incorreta para:', username);
          return done(null, false, { message: 'Password incorreta' });
        }

        // Return user (without password)
        const { password: userPassword, ...userWithoutPassword } = user;
        console.log('✅ Passport: Autenticação bem-sucedida para:', username);
        return done(null, userWithoutPassword);

      } catch (error) {
        console.error('❌ Passport: Erro na autenticação:', error);
        return done(error);
      }
    }
  ));

  // Serialize user for session
  passport.serializeUser((user, done) => {
    console.log('📝 Passport: Serializando utilizador:', user.id);
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      console.log('📖 Passport: Deserializando utilizador:', id);
      const [rows] = await db.execute(
        'SELECT id, name, username, role, active FROM users WHERE id = ? AND active = true',
        [id]
      );

      if (rows.length === 0) {
        console.log('❌ Passport: Utilizador não encontrado na deserialização:', id);
        return done(null, false);
      }

      console.log('✅ Passport: Utilizador deserializado:', rows[0].username);
      done(null, rows[0]);
    } catch (error) {
      console.error('❌ Passport: Erro ao deserializar utilizador:', error);
      done(error);
    }
  });
};