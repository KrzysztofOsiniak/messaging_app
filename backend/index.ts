import * as dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import session from 'express-session'
import MySQLSession from 'express-mysql-session'
import {v4} from 'uuid'
import helmet from 'helmet'
import { createServer } from "http";
import { WebSocketServer } from 'ws';
import { dbInit } from './database.js'
// @ts-ignore: lack of type documentation
const MySQLStore = MySQLSession(session);
import path from 'path'

const __dirname = path.resolve();

await dbInit();

import usersRoutes from './routes/users.js'
import directRoutes from './routes/direct.js'
import userWs from './ws.js'

const app = express()
const port = process.env.PORT || 8080;
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws, req) => {
    userWs(ws, req);
});

const options = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    clearExpired: true,
    checkExpirationInterval: 1000 * 60 * 30, /* 30 minutes */
};
var sessionStore = new MySQLStore(options);
export { sessionStore }

app.use(session({
    genid: function(_req) {
        return v4()
      },
    store: sessionStore,
    secret: process.env.SESSION_SECRET as string,
    saveUninitialized: false,
    resave: true,
    cookie: { 
        maxAge: 1000 * 60 * 60 * 24 * 14, /* 14 days */
        httpOnly: true,
        secure: false,
        sameSite: true
    }
}));

app.use(express.json({limit: '20kb'}));
app.use(helmet())
app.disable('x-powered-by');


app.use('/api/users', usersRoutes);

app.use('/api/direct', directRoutes);

app.use(express.static('../frontend/dist'));

app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/dist/index.html'));
});

httpServer.listen(port, () => console.log(`running on http://localhost:${port}`));