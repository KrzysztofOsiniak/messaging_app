import db from '../database.js'
import bcrypt from 'bcrypt'

let pendingRequestOnUsers = {};

export const getLogged = (req, res) => {
    if(req.session.logged) {
        res.status(200).send({logged: 1});
        return
    }
    res.status(401).send({logged: 0});
}

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
        .then(result => result)
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
        .then(hash => hash)
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
        res.status(200).send({username: req.session.username, status: 200});
    }, 200);
};


export const postAddFriend = async (req, res) => {
    if(req.session.pending) {
        return
    }
    if(!req.session.logged) {
        return
    }

    const username = req.session.username
    const friendName = req.body.friendName;

    if( (friendName.length > 19) || (!friendName.length) ) {
        req.session.pending = false;
        res.sendStatus(400);
        return
    }
    
    if(pendingRequestOnUsers[friendName] == username) {
        req.session.pending = false;
        res.sendStatus(500);
        return
    }

    req.session.pending = true;
    pendingRequestOnUsers[username] = friendName;

    const friendExists = await db.promise().execute(`SELECT * FROM users WHERE username = ?;`, [friendName])
    .catch(err => {
        console.error(err);
        req.session.pending = false;
        pendingRequestOnUsers[username] = '';
        res.sendStatus(500);
        return null
    });
    if(friendExists === null) {
        return
    }

    if(!friendExists[0][0]) {
        req.session.pending = false;
        pendingRequestOnUsers[username] = '';
        res.sendStatus(400);
        return
    }

    const userStatus = await db.promise().execute(`select * from friends where username = ? and friendname = ?;`, [username, friendName])
    .catch(err => {
        console.error(err);
        req.session.pending = false;
        pendingRequestOnUsers[username] = '';
        res.sendStatus(500);
        return null
    });
    if(userStatus === null) {
        return
    }

    const friendStatus = await db.promise().execute(`select * from friends where username = ? and friendname = ?;`, [friendName, username])
    .catch(err => {
        console.error(err);
        req.session.pending = false;
        pendingRequestOnUsers[username] = '';
        res.sendStatus(500);
        return null
    });
    if(friendStatus === null) {
        return
    }

    if(!userStatus[0][0] && !friendStatus[0][0]) {
        const request = await db.promise().execute(`INSERT INTO friends(username, friendname, status) VALUES(?, ?, ?);`, [friendName, username, 'pending'])
        .catch(err => {
            console.error(err);
            req.session.pending = false;
            pendingRequestOnUsers[username] = '';
            res.sendStatus(500);
            return null
        });
        if(request === null) {
            return
        }
        req.session.pending = false;
        pendingRequestOnUsers[username] = '';
        res.sendStatus(200);
        return
    }

    if(userStatus[0][0]) {
        if(userStatus[0][0].status == 'friend' || userStatus[0][0].status == 'blocked') {
            req.session.pending = false;
            pendingRequestOnUsers[username] = '';
            res.sendStatus(400);
            return
        }

        if(userStatus[0][0].status == 'pending') {
            const usersFriend = await db.promise().execute(`INSERT INTO friends(username, friendname, status) VALUES(?, ?, ?);`, [friendName, username, 'friend'])
            .catch(err => {
                console.error(err);
                req.session.pending = false;
                pendingRequestOnUsers[username] = '';
                res.sendStatus(500);
                return null
            });
            if(usersFriend === null) {
                return
            }

            const userUpdate = await db.promise().execute(`update friends set status = 'friend' where username = ? and friendname = ?;`, [username, friendName])
            .catch(err => {
                console.error(err);
                req.session.pending = false;
                pendingRequestOnUsers[username] = '';
                res.sendStatus(500);
                return null
            });
            if(userUpdate === null) {
                return
            }

            req.session.pending = false;
            pendingRequestOnUsers[username] = '';
            res.sendStatus(200);
            return
        }
    }

    if(friendStatus[0][0]) {
        if(friendStatus[0][0].status == 'pending' || friendStatus[0][0].status == 'blocked') {
            req.session.pending = false;
            pendingRequestOnUsers[username] = '';
            res.sendStatus(400);
            return
        }
    }
}

export const postDeclineFriend = async (req, res) => {
    if(req.session.pending) {
        return
    }
    if(!req.session.logged) {
        return
    }

    const username = req.session.username
    const friendName = req.body.friendName;

    if( (friendName.length > 19) || (!friendName.length) ) {
        req.session.pending = false;
        res.sendStatus(400);
        return
    }
    
    if(pendingRequestOnUsers[friendName] == username) {
        req.session.pending = false;
        res.sendStatus(500);
        return
    }

    req.session.pending = true;
    pendingRequestOnUsers[username] = friendName;

    const friendExists = await db.promise().execute(`SELECT * FROM users WHERE username = ?;`, [friendName])
    .catch(err => {
        console.error(err);
        req.session.pending = false;
        pendingRequestOnUsers[username] = '';
        res.sendStatus(500);
        return null
    });
    if(friendExists === null) {
        return
    }

    if(!friendExists[0][0]) {
        req.session.pending = false;
        pendingRequestOnUsers[username] = '';
        res.sendStatus(400);
        return
    }

    const userStatus = await db.promise().execute(`select * from friends where username = ? and friendname = ?;`, [username, friendName])
    .catch(err => {
        console.error(err);
        req.session.pending = false;
        pendingRequestOnUsers[username] = '';
        res.sendStatus(500);
        return null
    });
    if(userStatus === null) {
        return
    }

    if(!userStatus[0][0]) {
        req.session.pending = false;
        pendingRequestOnUsers[username] = '';
        res.sendStatus(400);
        return
    }
    
    if(userStatus[0][0].status == 'pending') {
        const removeRequest = await db.promise().execute(`delete from friends where username = ? and friendname = ?;`, [username, friendName])
        .catch(err => {
            console.error(err);
            req.session.pending = false;
            pendingRequestOnUsers[username] = '';
            res.sendStatus(500);
            return null
        });
        if(removeRequest === null) {
            return
        }

        req.session.pending = false;
        pendingRequestOnUsers[username] = '';
        res.sendStatus(200);
        return
    }
}

export const postRemoveFriend = async (req, res) => {
    if(req.session.pending) {
        return
    }
    if(!req.session.logged) {
        return
    }

    const username = req.session.username
    const friendName = req.body.friendName;

    if( (friendName.length > 19) || (!friendName.length) ) {
        req.session.pending = false;
        res.sendStatus(400);
        return
    }
    
    if(pendingRequestOnUsers[friendName] == username) {
        req.session.pending = false;
        res.sendStatus(500);
        return
    }

    req.session.pending = true;
    pendingRequestOnUsers[username] = friendName;

    const friendExists = await db.promise().execute(`SELECT * FROM users WHERE username = ?;`, [friendName])
    .catch(err => {
        console.error(err);
        req.session.pending = false;
        pendingRequestOnUsers[username] = '';
        res.sendStatus(500);
        return null
    });
    if(friendExists === null) {
        return
    }

    if(!friendExists[0][0]) {
        req.session.pending = false;
        pendingRequestOnUsers[username] = '';
        res.sendStatus(400);
        return
    }

    const userStatus = await db.promise().execute(`select * from friends where username = ? and friendname = ?;`, [username, friendName])
    .catch(err => {
        console.error(err);
        req.session.pending = false;
        pendingRequestOnUsers[username] = '';
        res.sendStatus(500);
        return null
    });
    if(userStatus === null) {
        return
    }

    if(!userStatus[0][0]) {
        req.session.pending = false;
        pendingRequestOnUsers[username] = '';
        res.sendStatus(400);
        return
    }
    
    if(userStatus[0][0].status == 'friend') {
        const removeFriendsUser = await db.promise().execute(`delete from friends where username = ? and friendname = ?;`, [friendName, username])
        .catch(err => {
            console.error(err);
            req.session.pending = false;
            pendingRequestOnUsers[username] = '';
            res.sendStatus(500);
            return null
        });
        if(removeFriendsUser === null) {
            return
        }

        const removeUsersFriend = await db.promise().execute(`delete from friends where username = ? and friendname = ?;`, [username, friendName])
        .catch(err => {
            console.error(err);
            req.session.pending = false;
            pendingRequestOnUsers[username] = '';
            res.sendStatus(500);
            return null
        });
        if(removeUsersFriend === null) {
            return
        }

        req.session.pending = false;
        pendingRequestOnUsers[username] = '';
        res.sendStatus(200);
        return
    }
}

export const postBlock = async (req, res) => {
    if(req.session.pending) {
        return
    }
    if(!req.session.logged) {
        return
    }

    const username = req.session.username
    const friendName = req.body.friendName;

    if( (friendName.length > 19) || (!friendName.length) ) {
        req.session.pending = false;
        res.sendStatus(400);
        return
    }
    
    if(pendingRequestOnUsers[friendName] == username) {
        req.session.pending = false;
        res.sendStatus(500);
        return
    }

    req.session.pending = true;
    pendingRequestOnUsers[username] = friendName;

    const friendExists = await db.promise().execute(`SELECT * FROM users WHERE username = ?;`, [friendName])
    .catch(err => {
        console.error(err);
        req.session.pending = false;
        pendingRequestOnUsers[username] = '';
        res.sendStatus(500);
        return null
    });
    if(friendExists === null) {
        return
    }

    if(!friendExists[0][0]) {
        req.session.pending = false;
        pendingRequestOnUsers[username] = '';
        res.sendStatus(400);
        return
    }

    const userStatus = await db.promise().execute(`select * from friends where username = ? and friendname = ?;`, [username, friendName])
    .catch(err => {
        console.error(err);
        req.session.pending = false;
        pendingRequestOnUsers[username] = '';
        res.sendStatus(500);
        return null
    });
    if(userStatus === null) {
        return
    }

    const friendStatus = await db.promise().execute(`select * from friends where username = ? and friendname = ?;`, [friendName, username])
    .catch(err => {
        console.error(err);
        req.session.pending = false;
        pendingRequestOnUsers[username] = '';
        res.sendStatus(500);
        return null
    });
    if(friendStatus === null) {
        return
    }

    if(!userStatus[0][0] && !friendStatus[0][0]) {
        const request = await db.promise().execute(`INSERT INTO friends(username, friendname, status) VALUES(?, ?, ?);`, [username, friendName, 'blocked'])
        .catch(err => {
            console.error(err);
            req.session.pending = false;
            pendingRequestOnUsers[username] = '';
            res.sendStatus(500);
            return null
        });
        if(request === null) {
            return
        }
        req.session.pending = false;
        pendingRequestOnUsers[username] = '';
        res.sendStatus(200);
        return
    }

    if(userStatus[0][0]) {
        if(userStatus[0][0].status == 'blocked') {
            req.session.pending = false;
            pendingRequestOnUsers[username] = '';
            res.sendStatus(400);
            return
        }

        if(userStatus[0][0].status == 'pending') {
            const userUpdate = await db.promise().execute(`update friends set status = 'blocked' where username = ? and friendname = ?;`, [username, friendName])
            .catch(err => {
                console.error(err);
                req.session.pending = false;
                pendingRequestOnUsers[username] = '';
                res.sendStatus(500);
                return null
            });
            if(userUpdate === null) {
                return
            }
            req.session.pending = false;
            pendingRequestOnUsers[username] = '';
            res.sendStatus(200);
            return
        }

        if(userStatus[0][0].status == 'friend') {
            const usersFriend = await db.promise().execute(`delete from friends where username = ? and friendname = ?;`, [friendName, username])
            .catch(err => {
                console.error(err);
                req.session.pending = false;
                pendingRequestOnUsers[username] = '';
                res.sendStatus(500);
                return null
            });
            if(usersFriend === null) {
                return
            }

            const userUpdate = await db.promise().execute(`update friends set status = 'blocked' where username = ? and friendname = ?;`, [username, friendName])
            .catch(err => {
                console.error(err);
                req.session.pending = false;
                pendingRequestOnUsers[username] = '';
                res.sendStatus(500);
                return null
            });
            if(userUpdate === null) {
                return
            }

            req.session.pending = false;
            pendingRequestOnUsers[username] = '';
            res.sendStatus(200);
            return
        }
    }
    
    if(friendStatus[0][0]) {
        if(friendStatus[0][0].status == 'blocked') {
            const request = await db.promise().execute(`INSERT INTO friends(username, friendname, status) VALUES(?, ?, ?);`, [username, friendName, 'blocked'])
            .catch(err => {
                console.error(err);
                req.session.pending = false;
                pendingRequestOnUsers[username] = '';
                res.sendStatus(500);
                return null
            });
            if(request === null) {
                return
            }
            req.session.pending = false;
            pendingRequestOnUsers[username] = '';
            res.sendStatus(200);
            return
        }

        if(friendStatus[0][0].status == 'pending') {
            const usersFriend = await db.promise().execute(`delete from friends where username = ? and friendname = ?;`, [friendName, username])
            .catch(err => {
                console.error(err);
                req.session.pending = false;
                pendingRequestOnUsers[username] = '';
                res.sendStatus(500);
                return null
            });
            if(usersFriend === null) {
                return
            }

            const request = await db.promise().execute(`INSERT INTO friends(username, friendname, status) VALUES(?, ?, ?);`, [username, friendName, 'blocked'])
            .catch(err => {
                console.error(err);
                req.session.pending = false;
                pendingRequestOnUsers[username] = '';
                res.sendStatus(500);
                return null
            });
            if(request === null) {
                return
            }

            req.session.pending = false;
            pendingRequestOnUsers[username] = '';
            res.sendStatus(200);
            return
        }
    }
}

export const postUnBlock = async (req, res) => {
    if(req.session.pending) {
        return
    }
    if(!req.session.logged) {
        return
    }

    const username = req.session.username
    const friendName = req.body.friendName;

    if( (friendName.length > 19) || (!friendName.length) ) {
        req.session.pending = false;
        res.sendStatus(400);
        return
    }
    
    if(pendingRequestOnUsers[friendName] == username) {
        req.session.pending = false;
        res.sendStatus(500);
        return
    }

    req.session.pending = true;
    pendingRequestOnUsers[username] = friendName;

    const friendExists = await db.promise().execute(`SELECT * FROM users WHERE username = ?;`, [friendName])
    .catch(err => {
        console.error(err);
        req.session.pending = false;
        pendingRequestOnUsers[username] = '';
        res.sendStatus(500);
        return null
    });
    if(friendExists === null) {
        return
    }

    if(!friendExists[0][0]) {
        req.session.pending = false;
        pendingRequestOnUsers[username] = '';
        res.sendStatus(400);
        return
    }
    
    const userStatus = await db.promise().execute(`select * from friends where username = ? and friendname = ?;`, [username, friendName])
    .catch(err => {
        console.error(err);
        req.session.pending = false;
        pendingRequestOnUsers[username] = '';
        res.sendStatus(500);
        return null
    });
    if(userStatus === null) {
        return
    }

    if(userStatus[0][0]) {
        if(userStatus[0][0].status == 'blocked') {
            const removeBlock = await db.promise().execute(`delete from friends where username = ? and friendname = ?;`, [username, friendName])
            .catch(err => {
                console.error(err);
                req.session.pending = false;
                pendingRequestOnUsers[username] = '';
                res.sendStatus(500);
                return null
            });
            if(removeBlock === null) {
                return
            }
            req.session.pending = false;
            pendingRequestOnUsers[username] = '';
            res.sendStatus(200);
            return
        }
    }

    req.session.pending = false;
    pendingRequestOnUsers[username] = '';
    res.sendStatus(400);
}

export const getFriends = async (req, res) => {
    if(!req.session.logged) {
        return
    }

    const friends = await db.promise().execute(`select friendname, status from friends where username = ?;`, [req.session.username])
    .catch(err => {
        console.error(err);
        res.sendStatus(500);
        return null
    });
    if(friends === null) {
        return
    }
    
    res.status(200).send({friends: friends[0], status: 200});
}