import * as dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import session from 'express-session'
import MySQLSession from 'express-mysql-session'
import {v4} from 'uuid'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { createServer } from "http";
import { Server } from "socket.io";
const MySQLStore = MySQLSession(session);
import path from 'path'

const __dirname = path.resolve();

import usersRoutes from './routes/users.js'
import homeRoutes from './routes/home.js'

const app = express()
const port = process.env.PORT || 8080;
const httpServer = createServer(app);
const io = new Server(httpServer, {});

const options = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    clearExpired: true,
    checkExpirationInterval: 1000 * 60 * 30, /* 30 minutes */
};
var sessionStore = new MySQLStore(options);

app.use(session({
    genid: function(req) {
        return v4()
      },
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: true,
    cookie: { 
        maxAge: 1000 * 60 * 60 * 24 * 14, /* 14 days */
        HttpOnly: true,
        secure: false,
        sameSite: true
    }
}));

app.use(express.json({limit: '200b'}));
app.use(helmet())
app.disable('x-powered-by');

const limiter = rateLimit({
	windowMs: 2 * 60 * 1000, // 2 minutes
	max: 500, // Limit each IP to 50 requests per `window` (here, per 2 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

// Apply the rate limiting middleware to all requests
app.use(limiter)

io.on("connection", (socket) => {
    socket.on('message_in', (message) => {
        socket.broadcast.emit('message_out', message);
    });
    socket.on('logout', () => {
        socket.disconnect();
    });
});

app.use('/users', usersRoutes);

app.use('/home', homeRoutes);

app.use(express.static('frontend/dist'));

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend/dist/index.html'));
});

app.use((err, req, res, next) => {
    console.log(err)
    res.status(500).send('Server Error');
  });

httpServer.listen(port, () => console.log(`running on http://localhost:${port}`));