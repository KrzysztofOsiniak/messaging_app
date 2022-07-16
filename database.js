import mysql from 'mysql2'

export default mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Admin',
    database: 'users',
    connectionLimit: 10
});