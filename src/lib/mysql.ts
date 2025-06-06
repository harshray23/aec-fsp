import mysql from 'mysql2/promise';

// Check if environment variables are loaded
if (!process.env.MYSQL_HOST || !process.env.MYSQL_USER || !process.env.MYSQL_DATABASE) {
  console.error("Missing MySQL environment variables. Please check your .env.local file.");
  // You might want to throw an error here or handle it as per your application's needs
  // For now, we'll let it proceed, but connection will likely fail.
}

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10, // Adjust as needed
  queueLimit: 0
});

// Test the connection
pool.getConnection()
  .then(connection => {
    console.log('Successfully connected to MySQL database.');
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to MySQL database:');
    console.error(`  Host: ${process.env.MYSQL_HOST}`);
    console.error(`  User: ${process.env.MYSQL_USER}`);
    console.error(`  Database: ${process.env.MYSQL_DATABASE}`);
    console.error(`  Error: ${err.message}`);
    // Potentially exit or throw if critical
  });

export default pool;
