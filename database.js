import mysql from 'mysql2'

export default mysql.createPool({
    host: 'eu-cdbr-west-03.cleardb.net',
    user: 'b6f5375c863810',
    password: '97d46c8e',
    database: 'heroku_5ebacd39459ed19',
    connectionLimit: 10
});