import mysql from 'mysql2'
import * as dotenv from 'dotenv'
dotenv.config();

const dbInitQuery = 'START TRANSACTION;CREATE TABLE IF NOT EXISTS `direct` (  `id` int NOT NULL AUTO_INCREMENT,  `username` varchar(20) COLLATE utf8mb4_bin NOT NULL,  `friendName` varchar(20) COLLATE utf8mb4_bin NOT NULL,  `status` enum("open","closed") COLLATE utf8mb4_bin NOT NULL,  `messagesId` varchar(128) COLLATE utf8mb4_bin NOT NULL,  `notification` tinyint(1) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;CREATE TABLE IF NOT EXISTS `directmessages` (  `id` varchar(128) COLLATE utf8mb4_bin NOT NULL,  `username` varchar(20) COLLATE utf8mb4_bin NOT NULL,  `message` mediumtext COLLATE utf8mb4_bin NOT NULL,  `order` int NOT NULL AUTO_INCREMENT,  `date` BIGINT NOT NULL, PRIMARY KEY (`order`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;CREATE TABLE IF NOT EXISTS `friends` (  `id` int AUTO_INCREMENT NOT NULL,  `username` varchar(20) COLLATE utf8mb4_bin NOT NULL,  `friendName` varchar(20) COLLATE utf8mb4_bin NOT NULL,  `status` enum("pending","blocked","friend") COLLATE utf8mb4_bin NOT NULL,  `notification` tinyint(1) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;CREATE TABLE IF NOT EXISTS `users` (  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,  `username` varchar(20) COLLATE utf8mb4_bin NOT NULL,  `password` varchar(62) COLLATE utf8mb4_bin NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;COMMIT;'
async function dbInit() {
    const connection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });
    await connection.promise().query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME};`);
    connection.end();
    
    const connection2 = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    });
    await connection2.promise().query(dbInitQuery);
    connection2.end();
}
export { dbInit }

export default mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10
});