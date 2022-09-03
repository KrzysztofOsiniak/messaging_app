import db from '../database.js'
import bcrypt from 'bcrypt'
import path from 'path'
const __dirname = path.resolve();


export const getlogin = (req, res) => {
    if(req.session.logged) {
        res.redirect('https://loginapptesting.herokuapp.com/home')
        return
    }
    res.sendFile(path.resolve(__dirname, './routes/login/main.html'))
};

export const postlogin = async (req, res) => {
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
            req.session.destroy()
            res.status(400).send({status: 400});
            return
        }
        const user = await db.promise().execute(`SELECT * FROM USERS WHERE USERNAME = ?;`, [username])
        .catch(err => {
            console.error(err);
            req.session.destroy()
            res.status(500).send({status: 500});
            return null
        });
        if(user === null) {
            return
        }
        if(user[0][0]) {
            const hash = await db.promise().execute(`SELECT password FROM USERS WHERE USERNAME = ?;`, [username])
            .catch(err => {
                console.error(err);
                req.session.destroy()
                res.status(500).send({status: 500});
                return null
            });
            if(hash === null) {
                return
            }
            const result = await bcrypt.compare(`${password}`, `${hash[0][0].password}`)
            .then(result => {
                return result
            })
            .catch(err => {
                console.error(err);
                req.session.destroy()
                res.status(500).send({status: 500});
                return null
            });
            if(result === null) {
                return
            }
            if(!result) {
                req.session.destroy()
                res.status(400).send({status: 400});
                return
            } 
            req.session.logged = true;
            req.session.username = user[0][0].username;
            req.session.pending = false;
            res.status(200).send(JSON.stringify({'username': req.session.username, 'status': 200}))
        } else {
            req.session.destroy()
            res.status(400).send({status: 400});
        }
    }, 350);
};


export const getsignup = (req, res) => {
    if(req.session.logged) {
        res.redirect('https://loginapptesting.herokuapp.com/home/')
        return
    }
    res.sendFile(path.resolve(__dirname, './routes/signup/main.html'))
};

export const postsignup = (req, res) => {
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
            req.session.destroy()
            res.status(400).send({status: 400});
            return
        }
        let user = await db.promise().execute(`SELECT * FROM USERS WHERE USERNAME = ?;`, [username])
        .catch(err => {
            console.error(err);
            req.session.destroy()
            res.status(500).send({status: 500});
            return null
        });
        if(user === null) {
            return
        }
        if(user[0][0]) {
            req.session.destroy()
            res.status(400).send({status: 400});
        } else {
            const hash = await bcrypt.hash(password, 10)
            .then((hash) => {
                return hash
            })
            .catch(err => {
                console.error(err);
                req.session.destroy()
                res.status(500).send({status: 500});
                return null
            });
            if(hash === null) {
                return
            }
            db.execute(`INSERT INTO USERS(username, password) VALUES(?, ?);`, [username, hash], async (err) => {
                if(err) {
                    console.error(err);
                    req.session.destroy()
                    res.status(500).send({status: 500});
                    return
                }
                user = await db.promise().execute(`SELECT * FROM USERS WHERE USERNAME = ?;`, [username])
                .catch(err => {
                    console.error(err);
                    req.session.destroy()
                    res.status(500).send({status: 500});
                    return null
                });
                if(user === null) {
                    return
                }
                req.session.logged = true;
                req.session.username = user[0][0].username;
                req.session.pending = false;
                res.status(200).send(JSON.stringify({'username': req.session.username, 'status': 200}))
            });
        }
    }, 350);
};