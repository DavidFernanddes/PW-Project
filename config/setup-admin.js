require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function setupAdmin() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'gestao_tarefas'
    });

    console.log('✅ Conectado à base de dados');

    // Check if admin user exists
    const [existingAdmin] = await connection.execute(
      'SELECT id, username FROM users WHERE username = ?',
      ['admin']
    );

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    if (existingAdmin.length > 0) {
      // Update existing admin user
      await connection.execute(
        'UPDATE users SET password = ?, active = true WHERE username = ?',
        [hashedPassword, 'admin']
      );
      console.log('   Utilizador admin atualizado com sucesso');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    } else {
      // Create new admin user
      await connection.execute(
        'INSERT INTO users (name, username, password, active, role) VALUES (?, ?, ?, ?, ?)',
        ['Administrador', 'admin', hashedPassword, true, 'Administrador']
      );
      console.log('   Utilizador admin criado com sucesso');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    }

    // Verify the admin user
    const [adminUser] = await connection.execute(
      'SELECT id, name, username, active, role FROM users WHERE username = ?',
      ['admin']
    );

    if (adminUser.length > 0) {
      console.log('   Verificação do utilizador admin:');
      console.log('   ID:', adminUser[0].id);
      console.log('   Nome:', adminUser[0].name);
      console.log('   Username:', adminUser[0].username);
      console.log('   Ativo:', adminUser[0].active ? 'Sim' : 'Não');
      console.log('   Role:', adminUser[0].role);
    }

    // Test password verification
    const [passwordTest] = await connection.execute(
      'SELECT password FROM users WHERE username = ?',
      ['admin']
    );

    if (passwordTest.length > 0) {
      const isValidPassword = await bcrypt.compare('admin123', passwordTest[0].password);
      console.log('Teste de password:', isValidPassword ? 'SUCESSO' : 'FALHOU');
    }

  } catch (error) {
    console.error('Erro ao configurar utilizador admin:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Conexão fechada');
    }
  }
}

// Run the setup
setupAdmin();