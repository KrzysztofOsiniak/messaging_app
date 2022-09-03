import express from 'express'
import session from 'express-session'
import MySQLSession from 'express-mysql-session'
import {v4} from 'uuid'
import path from 'path'
import helmet from'helmet'
import rateLimit from 'express-rate-limit'
const MySQLStore = MySQLSession(session);

import usersRoutes from './routes/users.js'
import homeRoutes from './routes/home.js'
const app = express()
const port = process.env.PORT || 3000;

app.use(helmet())

const __dirname = path.resolve();

const options = {
    host: 'localhost',
    user: 'root',
    password: 'Admin',
    database: 'users',
    clearExpired: true,
    checkExpirationInterval: 1000 * 60, /* 1 minute */
};
var sessionStore = new MySQLStore(options);

app.use(session({
    genid: function(req) {
        return v4()
      },
    store: sessionStore,
    secret: 'strt,46,8x/.65xhgfcjhgsrgsdfvcvbhj435345tset45esrts5tm',
    saveUninitialized: false,
    resave: true,
    cookie: { 
        maxAge: 1000 * 60 * 60 * 24 * 14, /* 14 days */
        HttpOnly: true,
        secure: true,
        sameSite: true
    }
}));
    
app.use(express.json({limit: '200b'}));

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 150, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

// Apply the rate limiting middleware to all requests
app.use(limiter)

app.use('/users', usersRoutes);

app.use('/home', homeRoutes);


app.post('/logout', (req, res) => {
    if(req.session.logged) {
        req.session.destroy();
        res.status(200).redirect('back');
    } else {
        res.sendStatus(401);
    }
});

app.get('/*', (req, res) => {
    res.redirect('/home');
});

app.listen(port, () => console.log(`running on ${port}`));