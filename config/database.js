const mysql = require('mysql2/promise');

// Configuração da ligação à base de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'gestao_tarefas',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Cria um pool de ligações
const pool = mysql.createPool(dbConfig);

// Função para testar a ligação à base de dados
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Ligação ao MySQL estabelecida');
    connection.release();
    return true;
  } catch (error) {
    console.error('Erro ao ligar ao MySQL:', error.message);
    return false;
  }
}

// Exporta o pool para ser usado nas queries
module.exports = pool;