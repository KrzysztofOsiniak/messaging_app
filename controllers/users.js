import db from '../database.js'
import bcrypt from 'bcrypt'


export const postLogin = (req, res) => {
    if(req.session.pending) {
        return
    }
    if(req.session.logged) {
        return
    }
    req.session.pending = true;
    setTimeout(async () => {
        const username = req.body.username;
        const password = req.body.password;
        if( ((password.length > 29) || (username.length > 19)) || (!password.length || !username.length) ) {
            req.session.destroy();
            res.sendStatus(400);
            return
        }
        const user = await db.promise().execute(`SELECT * FROM users WHERE username = ?;`, [username])
        .catch(err => {
            console.error(err);
            req.session.destroy();
            res.sendStatus(500);
            return null
        });
        if(user === null) {
            return
        }
        if(!user[0][0]) {
            req.session.destroy();
            res.sendStatus(400);
            return
        }
        const hash = user[0][0].password;
        const result = await bcrypt.compare(`${password}`, `${hash}`)
        .then(result => {
            return result
        })
        .catch(err => {
            console.error(err);
            req.session.destroy();
            res.sendStatus(500);
            return null
        });
        if(result === null) {
            return
        }
        if(!result) {
            req.session.destroy();
            res.sendStatus(400);
            return
        }
        req.session.userId = user[0][0].id;
        req.session.logged = true;
        req.session.username = username;
        req.session.pending = false;
        res.status(200).send({username: req.session.username, status: 200})
    }, 200)
};


export const postSignup = (req, res) => {
    if(req.session.pending) {
        return
    }
    if(req.session.logged) {
        return
    }
    req.session.pending = true;
    setTimeout(async () => {
        const username = req.body.username;
        const password = req.body.password;
        const regtest = new RegExp(/[^!-~]/g);
        if( ((password.length > 29) || (username.length > 19)) || (!password.length || !username.length) || (regtest.test(username)) ) {
            req.session.destroy();
            res.sendStatus(400);
            return
        }
        const user = await db.promise().execute(`SELECT * FROM users WHERE USERNAME = ?;`, [username])
        .catch(err => {
            console.error(err);
            req.session.destroy();
            res.sendStatus(500);
            return null
        });
        if(user === null) {
            return
        }
        if(user[0][0]) {
            req.session.destroy();
            res.sendStatus(400);
            return
        }
        const hash = await bcrypt.hash(password, 10)
        .then((hash) => {
            return hash
        })
        .catch(err => {
            console.error(err);
            req.session.destroy();
            res.sendStatus(500);
            return null
        });
        if(hash === null) {
            return
        }
        const result = await db.promise().execute(`INSERT INTO users(username, password) VALUES(?, ?);`, [username, hash])
        .catch(err => {
            console.error(err);
            req.session.destroy();
            res.sendStatus(500);
            return null
        });
        if(result === null) {
            return
        }
        req.session.userId = result[0].insertId;
        req.session.logged = true;
        req.session.username = username;
        req.session.pending = false;
        res.status(200).send({username: req.session.username, status: 200})
    }, 200);
};


export const postAddFriend = async (req, res) => {
    if(req.session.pending) {
        return
    }
    if(req.session.logged) {
        return
    }
    req.session.pending = true;
    const username = req.body.username;
    const user = await db.promise().execute(`SELECT * FROM users WHERE username = ?;`, [username])
    .catch(err => {
        console.error(err);
        req.session.pending = false;
        res.sendStatus(500);
        return null
    });
    if(user === null) {
        return
    }
    if(!user[0][0]) {
        req.session.pending = false;
        res.sendStatus(400);
        return
    }
    const friend = await db.promise().execute('select * from friends where username = ?', [username])
    .catch(err => {
        console.error(err);
        req.session.pending = false;
        res.sendStatus(500);
        return null
    });
    if(friend === null) {
        return
    }
}