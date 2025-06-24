require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function setupTestData() {
  let connection;

  try {
    // Criar ligação à base de dados
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'gestao_tarefas'
    });

    console.log('Conectado à base de dados');

    // Gerar hash das passwords
    const adminPassword = await bcrypt.hash('admin123', 12);
    const userPassword = await bcrypt.hash('123456', 12);

    console.log('\nA criar utilizador administrador...');

    // Criar ou atualizar utilizador admin
    const [existingAdmin] = await connection.execute(
      'SELECT id, username FROM users WHERE username = ?',
      ['admin']
    );

    if (existingAdmin.length > 0) {
      await connection.execute(
        'UPDATE users SET password = ?, active = true WHERE username = ?',
        [adminPassword, 'admin']
      );
      console.log('Admin atualizado com sucesso');
    } else {
      await connection.execute(
        'INSERT INTO users (name, username, password, active, role) VALUES (?, ?, ?, ?, ?)',
        ['Administrador', 'admin', adminPassword, true, 'Administrador']
      );
      console.log('Admin criado com sucesso');
    }

    console.log('\nA criar utilizadores de teste...');

    // Criar ou atualizar utilizadores de teste
    const testUsers = [
      { name: 'João Silva', username: 'jsilva', role: 'Utilizador', active: true },
      { name: 'Ana Costa', username: 'acosta', role: 'Gestor', active: true },
      { name: 'Pedro Santos', username: 'psantos', role: 'Utilizador', active: true },
      { name: 'Maria Oliveira', username: 'moliveira', role: 'Utilizador', active: true },
      { name: 'Carlos Ferreira', username: 'cferreira', role: 'Utilizador', active: false },
      { name: 'Rita Mendes', username: 'rmendes', role: 'Gestor', active: true },
      { name: 'Paulo Rodrigues', username: 'prodrigues', role: 'Utilizador', active: true },
      { name: 'Sofia Almeida', username: 'salmeida', role: 'Utilizador', active: false }
    ];

    for (const user of testUsers) {
      const [existingUser] = await connection.execute(
        'SELECT id FROM users WHERE username = ?',
        [user.username]
      );

      if (existingUser.length > 0) {
        await connection.execute(
          'UPDATE users SET name = ?, password = ?, role = ?, active = ? WHERE username = ?',
          [user.name, userPassword, user.role, user.active, user.username]
        );
        console.log(`${user.username} (${user.name}) atualizado`);
      } else {
        await connection.execute(
          'INSERT INTO users (name, username, password, active, role) VALUES (?, ?, ?, ?, ?)',
          [user.name, user.username, userPassword, user.active, user.role]
        );
        console.log(`${user.username} (${user.name}) criado`);
      }
    }

    console.log('\nA criar tarefas de teste...');

    // Criar tarefas de exemplo
    const sampleTasks = [
      {
        name: 'Implementar API REST',
        description: 'Desenvolvimento da API para gestão de tarefas com autenticação e validação',
        end_date: '2025-08-15',
        completed: false,
        user_id: 2, // jsilva
        type_id: 1, // Desenvolvimento
        created_by: 1 // admin
      },
      {
        name: 'Revisar documentação técnica',
        description: 'Análise e revisão completa da documentação do sistema',
        end_date: '2025-07-25',
        completed: false,
        user_id: 3, // acosta
        type_id: 2, // Análise
        created_by: 1 // admin
      },
      {
        name: 'Testes de integração',
        description: 'Execução de testes completos entre frontend e backend',
        end_date: '2025-08-10',
        completed: false,
        user_id: 4, // psantos
        type_id: 3, // Teste
        created_by: 3 // acosta
      },
      {
        name: 'Design da interface',
        description: 'Criação de mockups e protótipos para nova funcionalidade',
        end_date: '2025-07-30',
        completed: true,
        user_id: 5, // moliveira
        type_id: 6, // Design
        created_by: 3 // acosta
      },
      {
        name: 'Reunião de planeamento',
        description: 'Reunião semanal para definir prioridades do sprint',
        end_date: '2025-07-02',
        completed: false,
        user_id: 2, // jsilva
        type_id: 5, // Reunião
        created_by: 1 // admin
      },
      {
        name: 'Suporte ao cliente',
        description: 'Resolver tickets pendentes do sistema de suporte',
        end_date: '2025-07-05',
        completed: false,
        user_id: 7, // prodrigues
        type_id: 8, // Suporte
        created_by: 8 // rmendes
      },
      {
        name: 'Campanha de marketing',
        description: 'Criar conteúdo para redes sociais e newsletter',
        end_date: '2025-08-20',
        completed: false,
        user_id: 3, // acosta
        type_id: 7, // Marketing
        created_by: 8 // rmendes
      },
      {
        name: 'Backup da base de dados',
        description: 'Configurar sistema de backup automático',
        end_date: '2025-07-15',
        completed: true,
        user_id: 7, // prodrigues
        type_id: 1, // Desenvolvimento
        created_by: 1 // admin
      }
    ];

    // Apagar tarefas existentes
    await connection.execute('DELETE FROM tasks');

    for (const task of sampleTasks) {
      await connection.execute(`
        INSERT INTO tasks (name, description, end_date, completed, user_id, type_id, created_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        task.name,
        task.description,
        task.end_date,
        task.completed,
        task.user_id,
        task.type_id,
        task.created_by
      ]);
      console.log(`Tarefa "${task.name}" criada`);
    }

    console.log('\nA testar credenciais...');

    // Testar password do admin
    const [adminTest] = await connection.execute(
      'SELECT password FROM users WHERE username = ?',
      ['admin']
    );

    if (adminTest.length > 0) {
      const adminValid = await bcrypt.compare('admin123', adminTest[0].password);
      console.log(`admin/admin123: ${adminValid ? 'OK' : 'FALHOU'}`);
    }

    // Testar passwords dos utilizadores (exemplo)
    const testSamples = ['jsilva', 'acosta', 'psantos'];
    for (const username of testSamples) {
      const [userTest] = await connection.execute(
        'SELECT password FROM users WHERE username = ?',
        [username]
      );

      if (userTest.length > 0) {
        const userValid = await bcrypt.compare('123456', userTest[0].password);
        console.log(`${username}/123456: ${userValid ? 'OK' : 'FALHOU'}`);
      }
    }

    console.log('\nResumo do sistema:');

    // Mostrar resumo
    const [userCount] = await connection.execute('SELECT COUNT(*) as total FROM users');
    const [activeUserCount] = await connection.execute('SELECT COUNT(*) as total FROM users WHERE active = true');
    const [taskCount] = await connection.execute('SELECT COUNT(*) as total FROM tasks');
    const [completedTaskCount] = await connection.execute('SELECT COUNT(*) as total FROM tasks WHERE completed = true');
    const [typeCount] = await connection.execute('SELECT COUNT(*) as total FROM task_types');

    console.log(`   Utilizadores: ${userCount[0].total} (${activeUserCount[0].total} ativos)`);
    console.log(`   Tarefas: ${taskCount[0].total} (${completedTaskCount[0].total} concluídas)`);
    console.log(`   Tipos de tarefa: ${typeCount[0].total}`);

    console.log('\nDADOS DE TESTE CRIADOS COM SUCESSO!');
    console.log('\nCredenciais para login:');
    console.log('   admin / admin123 (Administrador)');
    console.log('   jsilva / 123456 (Utilizador)');
    console.log('   acosta / 123456 (Gestor)');
    console.log('   psantos / 123456 (Utilizador)');
    console.log('   moliveira / 123456 (Utilizador)');
    console.log('   rmendes / 123456 (Gestor)');
    console.log('   prodrigues / 123456 (Utilizador)');
    console.log('   cferreira / 123456 (Inativo)');
    console.log('   salmeida / 123456 (Inativo)');

  } catch (error) {
    console.error('Erro ao criar dados de teste:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nConexão fechada');
    }
  }
}

// Executar a configuração
setupTestData();