import db from '../database.js'
import bcrypt from 'bcrypt'


let pendingRequestOnUsers:{[key: string]: string} = {};

export const getLogged = (req, res) => {
    if(req.session.logged) {
        res.status(200).send({logged: true, username: req.session.username});
        return
    }
    res.status(401).send({logged: false});
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
if(!req.session.logged) {
        return
    }

    const username = req.session.username;
    const friendName = req.body.friendName;

    if(friendName == username) {
        res.status(400).send({status: 400, message: 'Incorrect Username'});
        return
    }

    if( (friendName.length > 19) || (!friendName.length) ) {
        res.status(400).send({status: 400, message: 'Incorrect Username'});
        return
    }
    
    if(pendingRequestOnUsers[friendName] == username || pendingRequestOnUsers[username] == friendName) {
        res.status(500).send({status: 500, message: 'Race Condition - Try Again'});
        return
    }

    pendingRequestOnUsers[friendName] = username;
    pendingRequestOnUsers[username] = friendName;

    const friendExists = await db.promise().execute(`SELECT * FROM users WHERE username = ?;`, [friendName])
    .catch(err => {
        console.error(err);
        pendingRequestOnUsers[friendName] = null;
        pendingRequestOnUsers[username] = null;
        res.status(500).send({status: 500, message: 'Unknown Server Error'});
        return null
    });
    if(friendExists === null) {
        return
    }

    if(!friendExists[0][0]) {
        pendingRequestOnUsers[friendName] = null;
        pendingRequestOnUsers[username] = null;
        res.status(400).send({status: 400, message: 'User Does Not Exist'});
        return
    }

    const userStatus = await db.promise().execute(`select * from friends where username = ? and friendName = ?;`, [username, friendName])
    .catch(err => {
        console.error(err);
        pendingRequestOnUsers[friendName] = null;
        pendingRequestOnUsers[username] = null;
        res.status(500).send({status: 500, message: 'Unknown Server Error'});
        return null
    });
    if(userStatus === null) {
        return
    }

    const friendStatus = await db.promise().execute(`select * from friends where username = ? and friendName = ?;`, [friendName, username])
    .catch(err => {
        console.error(err);
        pendingRequestOnUsers[friendName] = null;
        pendingRequestOnUsers[username] = null;
        res.status(500).send({status: 500, message: 'Unknown Server Error'});
        return null
    });
    if(friendStatus === null) {
        return
    }

    if(!userStatus[0][0] && !friendStatus[0][0]) {
        const request = await db.promise().execute(`INSERT INTO friends(username, friendName, status, notification) VALUES(?, ?, ?, ?);`, [friendName, username, 'pending', 1])
        .catch(err => {
            console.error(err);
            pendingRequestOnUsers[friendName] = null;
            pendingRequestOnUsers[username] = null;
            res.status(500).send({status: 500, message: 'Unknown Server Error'});
            return null
        });
        if(request === null) {
            return
        }
        
        const usersForFriend = await db.promise().execute(`select friends.friendName, friends.status, users.id from friends inner join users on friends.friendName = users.username
        where friends.username = ?;`, [friendName])
        .catch(err => {
            console.error(err);
            res.status(500).send({status: 500, message: 'Unknown Server Error'});
            return null
        });
        if(usersForFriend === null) {
            return
        }

        global.sockets.filter(socket => socket.username == friendName).forEach(socket => socket.send(JSON.stringify(['users', usersForFriend[0]]), {binary: false}));

        pendingRequestOnUsers[friendName] = null;
        pendingRequestOnUsers[username] = null;
        res.status(200).send({status: 200, message: 'Friend Request Sent'});
        return
    }

    if(userStatus[0][0]) {
        if(userStatus[0][0].status == 'friend' || userStatus[0][0].status == 'blocked') {
            pendingRequestOnUsers[friendName] = null;
            pendingRequestOnUsers[username] = null;
            res.status(400).send({status: 400, message: 'User Already In Friend/Blocked List'});
            return
        }

        if(userStatus[0][0].status == 'pending') {
            const usersFriend = await db.promise().execute(`INSERT INTO friends(username, friendName, status, notification) VALUES(?, ?, ?, ?);`, [friendName, username, 'friend', 0])
            .catch(err => {
                console.error(err);
                pendingRequestOnUsers[friendName] = null;
                pendingRequestOnUsers[username] = null;
                res.status(500).send({status: 500, message: 'Unknown Server Error'});
                return null
            });
            if(usersFriend === null) {
                return
            }

            const userUpdate = await db.promise().execute(`update friends set status = 'friend' where username = ? and friendName = ?;`, [username, friendName])
            .catch(err => {
                console.error(err);
                pendingRequestOnUsers[friendName] = null;
                pendingRequestOnUsers[username] = null;
                res.status(500).send({status: 500, message: 'Unknown Server Error'});
                return null
            });
            if(userUpdate === null) {
                return
            }


            const usersForUser = await db.promise().execute(`select friends.friendName, friends.status, users.id from friends inner join users on friends.friendName = users.username
            where friends.username = ?;`, [username])
            .catch(err => {
                console.error(err);
                res.status(500).send({status: 500, message: 'Unknown Server Error'});
                return null
            });
            if(usersForUser === null) {
                return
            }

            const usersForFriend = await db.promise().execute(`select friends.friendName, friends.status, users.id from friends inner join users on friends.friendName = users.username
            where friends.username = ?;`, [friendName])
            .catch(err => {
                console.error(err);
                res.status(500).send({status: 500, message: 'Unknown Server Error'});
                return null
            });
            if(usersForFriend === null) {
                return
            }

            global.sockets.filter(socket => socket.username == username).forEach(socket => socket.send(JSON.stringify(['users', usersForUser[0]]), {binary: false}));
            global.sockets.filter(socket => socket.username == friendName).forEach(socket => socket.send(JSON.stringify(['users', usersForFriend[0]]), {binary: false}));

            if(global.onlineUsers.includes(username) && global.onlineUsers.includes(friendName)) {
                global.sockets.filter(socket => socket.username == username).forEach(socket => socket.send(JSON.stringify(['friendOnline', friendName]), {binary: false}));
                global.sockets.filter(socket => socket.username == friendName).forEach(socket => socket.send(JSON.stringify(['friendOnline', username]), {binary: false}));
            }

            pendingRequestOnUsers[friendName] = null;
            pendingRequestOnUsers[username] = null;
            res.status(200).send({status: 200, message: 'Friend Request Accepted'});
            return
        }
    }

    if(friendStatus[0][0]) {
        if(friendStatus[0][0].status == 'pending') {
            pendingRequestOnUsers[friendName] = null;
            pendingRequestOnUsers[username] = null;
            res.status(400).send({status: 400, message: 'Friend Request Already Sent'});
            return
        }
        if(friendStatus[0][0].status == 'blocked') {
            pendingRequestOnUsers[friendName] = null;
            pendingRequestOnUsers[username] = null;
            res.status(400).send({status: 400, message: 'User Has Blocked You'});
            return
        }
    }
    pendingRequestOnUsers[friendName] = null;
    pendingRequestOnUsers[username] = null;
    res.status(400).send({status: 400, message: 'Bad Request'});
}

export const postDeclineFriend = async (req, res) => {
if(!req.session.logged) {
        return
    }

    const username = req.session.username
    const friendName = req.body.friendName;

    if(friendName == username) {
        res.status(400).send({status: 400, message: 'Incorrect Username'});
        return
    }

    if( (friendName.length > 19) || (!friendName.length) ) {
        res.status(400).send({status: 400, message: 'Incorrect Username'});
        return
    }
    
    if(pendingRequestOnUsers[friendName] == username || pendingRequestOnUsers[username] == friendName) {
        res.status(500).send({status: 500, message: 'Race Condition - Try Again'});
        return
    }

    pendingRequestOnUsers[friendName] = username;
    pendingRequestOnUsers[username] = friendName;

    const friendExists = await db.promise().execute(`SELECT * FROM users WHERE username = ?;`, [friendName])
    .catch(err => {
        console.error(err);
        pendingRequestOnUsers[friendName] = null;
        pendingRequestOnUsers[username] = null;
        res.status(500).send({status: 500, message: 'Unknown Server Error'});
        return null
    });
    if(friendExists === null) {
        return
    }

    if(!friendExists[0][0]) {
        pendingRequestOnUsers[friendName] = null;
        pendingRequestOnUsers[username] = null;
        res.status(400).send({status: 400, message: 'User Does Not Exist'});
        return
    }

    const userStatus = await db.promise().execute(`select * from friends where username = ? and friendName = ?;`, [username, friendName])
    .catch(err => {
        console.error(err);
        pendingRequestOnUsers[friendName] = null;
        pendingRequestOnUsers[username] = null;
        res.status(500).send({status: 500, message: 'Unknown Server Error'});
        return null
    });
    if(userStatus === null) {
        return
    }

    if(!userStatus[0][0]) {
        pendingRequestOnUsers[friendName] = null;
        pendingRequestOnUsers[username] = null;
        res.status(400).send({status: 400, message: 'No Friend Request From User'});
        return
    }
    
    if(userStatus[0][0].status == 'pending') {
        const removeRequest = await db.promise().execute(`delete from friends where username = ? and friendName = ?;`, [username, friendName])
        .catch(err => {
            console.error(err);
            pendingRequestOnUsers[friendName] = null;
            pendingRequestOnUsers[username] = null;
            res.status(500).send({status: 500, message: 'Unknown Server Error'});
            return null
        });
        if(removeRequest === null) {
            return
        }

        const usersForUser = await db.promise().execute(`select friends.friendName, friends.status, users.id from friends inner join users on friends.friendName = users.username
        where friends.username = ?;`, [username])
        .catch(err => {
            console.error(err);
            res.status(500).send({status: 500, message: 'Unknown Server Error'});
            return null
        });
        if(usersForUser === null) {
            return
        }

        global.sockets.filter(socket => socket.username == username).forEach(socket => socket.send(JSON.stringify(['users', usersForUser[0]]), {binary: false}));

        pendingRequestOnUsers[friendName] = null;
        pendingRequestOnUsers[username] = null;
        res.status(200).send({status: 200, message: 'Friend Request Removed'});
        return
    }
    pendingRequestOnUsers[friendName] = null;
    pendingRequestOnUsers[username] = null;
    res.status(400).send({status: 400, message: 'Bad Request'});
}

export const postRemoveFriend = async (req, res) => {
if(!req.session.logged) {
        return
    }

    const username = req.session.username
    const friendName = req.body.friendName;

    if(friendName == username) {
        res.status(400).send({status: 400, message: 'Incorrect Username'});
        return
    }

    if( (friendName.length > 19) || (!friendName.length) ) {
        res.status(400).send({status: 400, message: 'Incorrect Username'});
        return
    }
    
    if(pendingRequestOnUsers[friendName] == username || pendingRequestOnUsers[username] == friendName) {
        res.status(500).send({status: 500, message: 'Race Condition - Try Again'});
        return
    }

    pendingRequestOnUsers[friendName] = username;
    pendingRequestOnUsers[username] = friendName;

    const friendExists = await db.promise().execute(`SELECT * FROM users WHERE username = ?;`, [friendName])
    .catch(err => {
        console.error(err);
        pendingRequestOnUsers[friendName] = null;
        pendingRequestOnUsers[username] = null;
        res.status(500).send({status: 500, message: 'Unknown Server Error'});
        return null
    });
    if(friendExists === null) {
        return
    }

    if(!friendExists[0][0]) {
        pendingRequestOnUsers[friendName] = null;
        pendingRequestOnUsers[username] = null;
        res.status(400).send({status: 400, message: 'User Does Not Exist'});
        return
    }

    const userStatus = await db.promise().execute(`select * from friends where username = ? and friendName = ?;`, [username, friendName])
    .catch(err => {
        console.error(err);
        pendingRequestOnUsers[friendName] = null;
        pendingRequestOnUsers[username] = null;
        res.status(500).send({status: 500, message: 'Unknown Server Error'});
        return null
    });
    if(userStatus === null) {
        return
    }

    if(!userStatus[0][0]) {
        pendingRequestOnUsers[friendName] = null;
        pendingRequestOnUsers[username] = null;
        res.status(400).send({status: 400, message: 'User Not In Friend List'});
        return
    }
    
    if(userStatus[0][0].status == 'friend') {
        const removeFriendsUser = await db.promise().execute(`delete from friends where username = ? and friendName = ?;`, [friendName, username])
        .catch(err => {
            console.error(err);
            pendingRequestOnUsers[friendName] = null;
            pendingRequestOnUsers[username] = null;
            res.status(500).send({status: 500, message: 'Unknown Server Error'});
            return null
        });
        if(removeFriendsUser === null) {
            return
        }

        const removeUsersFriend = await db.promise().execute(`delete from friends where username = ? and friendName = ?;`, [username, friendName])
        .catch(err => {
            console.error(err);
            pendingRequestOnUsers[friendName] = null;
            pendingRequestOnUsers[username] = null;
            res.status(500).send({status: 500, message: 'Unknown Server Error'});
            return null
        });
        if(removeUsersFriend === null) {
            return
        }

        const usersForUser = await db.promise().execute(`select friends.friendName, friends.status, users.id from friends inner join users on friends.friendName = users.username
        where friends.username = ?;`, [username])
        .catch(err => {
            console.error(err);
            res.status(500).send({status: 500, message: 'Unknown Server Error'});
            return null
        });
        if(usersForUser === null) {
            return
        }

        const usersForFriend = await db.promise().execute(`select friends.friendName, friends.status, users.id from friends inner join users on friends.friendName = users.username
        where friends.username = ?;`, [friendName])
        .catch(err => {
            console.error(err);
            res.status(500).send({status: 500, message: 'Unknown Server Error'});
            return null
        });
        if(usersForFriend === null) {
            return
        }

        global.sockets.filter(socket => socket.username == username).forEach(socket => socket.send(JSON.stringify(['users', usersForUser[0]]), {binary: false}));
        global.sockets.filter(socket => socket.username == friendName).forEach(socket => socket.send(JSON.stringify(['users', usersForFriend[0]]), {binary: false}));

        if(global.onlineUsers.includes(username) && global.onlineUsers.includes(friendName)) {
            global.sockets.filter(socket => socket.username == username).forEach(socket => socket.send(JSON.stringify(['friendOffline', friendName]), {binary: false}));
            global.sockets.filter(socket => socket.username == friendName).forEach(socket => socket.send(JSON.stringify(['friendOffline', username]), {binary: false}));
        }

        pendingRequestOnUsers[friendName] = null;
        pendingRequestOnUsers[username] = null;
        res.status(200).send({status: 200, message: 'Removed From Friend List'});
        return
    }
    pendingRequestOnUsers[friendName] = null;
    pendingRequestOnUsers[username] = null;
    res.status(400).send({status: 400, message: 'Bad Request'});
}

export const postBlock = async (req, res) => {
if(!req.session.logged) {
        return
    }

    const username = req.session.username
    const friendName = req.body.friendName;

    if(friendName == username) {
        res.status(400).send({status: 400, message: 'Incorrect Username'});
        return
    }

    if( (friendName.length > 19) || (!friendName.length) ) {
        res.status(400).send({status: 400, message: 'Incorrect Username'});
        return
    }
    
    if(pendingRequestOnUsers[friendName] == username || pendingRequestOnUsers[username] == friendName) {
        res.status(500).send({status: 500, message: 'Race Condition - Try Again'});
        return
    }

    pendingRequestOnUsers[friendName] = username;
    pendingRequestOnUsers[username] = friendName;

    const friendExists = await db.promise().execute(`SELECT * FROM users WHERE username = ?;`, [friendName])
    .catch(err => {
        console.error(err);
        pendingRequestOnUsers[friendName] = null;
        pendingRequestOnUsers[username] = null;
        res.status(500).send({status: 500, message: 'Unknown Server Error'});
        return null
    });
    if(friendExists === null) {
        return
    }

    if(!friendExists[0][0]) {
        pendingRequestOnUsers[friendName] = null;
        pendingRequestOnUsers[username] = null;
        res.status(400).send({status: 400, message: 'User Does Not Exist'});
        return
    }

    const userStatus = await db.promise().execute(`select * from friends where username = ? and friendName = ?;`, [username, friendName])
    .catch(err => {
        console.error(err);
        pendingRequestOnUsers[friendName] = null;
        pendingRequestOnUsers[username] = null;
        res.status(500).send({status: 500, message: 'Unknown Server Error'});
        return null
    });
    if(userStatus === null) {
        return
    }

    const friendStatus = await db.promise().execute(`select * from friends where username = ? and friendName = ?;`, [friendName, username])
    .catch(err => {
        console.error(err);
        pendingRequestOnUsers[friendName] = null;
        pendingRequestOnUsers[username] = null;
        res.status(500).send({status: 500, message: 'Unknown Server Error'});
        return null
    });
    if(friendStatus === null) {
        return
    }

    if(!userStatus[0][0] && !friendStatus[0][0]) {
        const request = await db.promise().execute(`INSERT INTO friends(username, friendName, status, notification) VALUES(?, ?, ?, ?);`, [username, friendName, 'blocked', 0])
        .catch(err => {
            console.error(err);
            pendingRequestOnUsers[friendName] = null;
            pendingRequestOnUsers[username] = null;
            res.status(500).send({status: 500, message: 'Unknown Server Error'});
            return null
        });
        if(request === null) {
            return
        }

        const usersForUser = await db.promise().execute(`select friends.friendName, friends.status, users.id from friends inner join users on friends.friendName = users.username
        where friends.username = ?;`, [username])
        .catch(err => {
            console.error(err);
            res.status(500).send({status: 500, message: 'Unknown Server Error'});
            return null
        });
        if(usersForUser === null) {
            return
        }

        global.sockets.filter(socket => socket.username == username).forEach(socket => socket.send(JSON.stringify(['users', usersForUser[0]]), {binary: false}));

        pendingRequestOnUsers[friendName] = null;
        pendingRequestOnUsers[username] = null;
        res.status(200).send({status: 200, message: 'User Blocked'});
        return
    }

    if(userStatus[0][0]) {
        if(userStatus[0][0].status == 'blocked') {
            pendingRequestOnUsers[friendName] = null;
            pendingRequestOnUsers[username] = null;
            res.status(400).send({status: 400, message: 'User Already Blocked'});
            return
        }

        if(userStatus[0][0].status == 'pending') {
            const userUpdate = await db.promise().execute(`update friends set status = 'blocked' where username = ? and friendName = ?;`, [username, friendName])
            .catch(err => {
                console.error(err);
                pendingRequestOnUsers[friendName] = null;
                pendingRequestOnUsers[username] = null;
                res.status(500).send({status: 500, message: 'Unknown Server Error'});
                return null
            });
            if(userUpdate === null) {
                return
            }

            const usersForUser = await db.promise().execute(`select friends.friendName, friends.status, users.id from friends inner join users on friends.friendName = users.username
            where friends.username = ?;`, [username])
            .catch(err => {
                console.error(err);
                res.status(500).send({status: 500, message: 'Unknown Server Error'});
                return null
            });
            if(usersForUser === null) {
                return
            }

            global.sockets.filter(socket => socket.username == username).forEach(socket => socket.send(JSON.stringify(['users', usersForUser[0]]), {binary: false}));

            pendingRequestOnUsers[friendName] = null;
            pendingRequestOnUsers[username] = null;
            res.status(200).send({status: 200, message: 'User Blocked'});
            return
        }

        if(userStatus[0][0].status == 'friend') {
            const usersFriend = await db.promise().execute(`delete from friends where username = ? and friendName = ?;`, [friendName, username])
            .catch(err => {
                console.error(err);
                pendingRequestOnUsers[friendName] = null;
                pendingRequestOnUsers[username] = null;
                res.status(500).send({status: 500, message: 'Unknown Server Error'});
                return null
            });
            if(usersFriend === null) {
                return
            }

            const userUpdate = await db.promise().execute(`update friends set status = 'blocked' where username = ? and friendName = ?;`, [username, friendName])
            .catch(err => {
                console.error(err);
                pendingRequestOnUsers[friendName] = null;
                pendingRequestOnUsers[username] = null;
                res.status(500).send({status: 500, message: 'Unknown Server Error'});
                return null
            });
            if(userUpdate === null) {
                return
            }

            const usersForUser = await db.promise().execute(`select friends.friendName, friends.status, users.id from friends inner join users on friends.friendName = users.username
            where friends.username = ?;`, [username])
            .catch(err => {
                console.error(err);
                res.status(500).send({status: 500, message: 'Unknown Server Error'});
                return null
            });
            if(usersForUser === null) {
                return
            }

            const usersForFriend = await db.promise().execute(`select friends.friendName, friends.status, users.id from friends inner join users on friends.friendName = users.username
            where friends.username = ?;`, [friendName])
            .catch(err => {
                console.error(err);
                res.status(500).send({status: 500, message: 'Unknown Server Error'});
                return null
            });
            if(usersForFriend === null) {
                return
            }

            global.sockets.filter(socket => socket.username == username).forEach(socket => socket.send(JSON.stringify(['users', usersForUser[0]]), {binary: false}));
            global.sockets.filter(socket => socket.username == friendName).forEach(socket => socket.send(JSON.stringify(['users', usersForFriend[0]]), {binary: false}));

            if(global.onlineUsers.includes(username) && global.onlineUsers.includes(friendName)) {
                global.sockets.filter(socket => socket.username == username).forEach(socket => socket.send(JSON.stringify(['friendOffline', friendName]), {binary: false}));
                global.sockets.filter(socket => socket.username == friendName).forEach(socket => socket.send(JSON.stringify(['friendOffline', username]), {binary: false}));
            }

            pendingRequestOnUsers[friendName] = null;
            pendingRequestOnUsers[username] = null;
            res.status(200).send({status: 200, message: 'User Blocked'});
            return
        }
    }
    
    if(friendStatus[0][0]) {
        if(friendStatus[0][0].status == 'blocked') {
            const request = await db.promise().execute(`INSERT INTO friends(username, friendName, status, notification) VALUES(?, ?, ?, ?);`, [username, friendName, 'blocked', 0])
            .catch(err => {
                console.error(err);
                pendingRequestOnUsers[friendName] = null;
                pendingRequestOnUsers[username] = null;
                res.status(500).send({status: 500, message: 'Unknown Server Error'});
                return null
            });
            if(request === null) {
                return
            }

            const usersForUser = await db.promise().execute(`select friends.friendName, friends.status, users.id from friends inner join users on friends.friendName = users.username
            where friends.username = ?;`, [username])
            .catch(err => {
                console.error(err);
                res.status(500).send({status: 500, message: 'Unknown Server Error'});
                return null
            });
            if(usersForUser === null) {
                return
            }

            global.sockets.filter(socket => socket.username == username).forEach(socket => socket.send(JSON.stringify(['users', usersForUser[0]]), {binary: false}));

            pendingRequestOnUsers[friendName] = null;
            pendingRequestOnUsers[username] = null;
            res.status(200).send({status: 200, message: 'User Blocked'});
            return
        }

        if(friendStatus[0][0].status == 'pending') {
            const usersFriend = await db.promise().execute(`delete from friends where username = ? and friendName = ?;`, [friendName, username])
            .catch(err => {
                console.error(err);
                pendingRequestOnUsers[friendName] = null;
                pendingRequestOnUsers[username] = null;
                res.status(500).send({status: 500, message: 'Unknown Server Error'});
                return null
            });
            if(usersFriend === null) {
                return
            }

            const request = await db.promise().execute(`INSERT INTO friends(username, friendName, status, notification) VALUES(?, ?, ?, ?);`, [username, friendName, 'blocked', 0])
            .catch(err => {
                console.error(err);
                pendingRequestOnUsers[friendName] = null;
                pendingRequestOnUsers[username] = null;
                res.status(500).send({status: 500, message: 'Unknown Server Error'});
                return null
            });
            if(request === null) {
                return
            }

            const usersForUser = await db.promise().execute(`select friends.friendName, friends.status, users.id from friends inner join users on friends.friendName = users.username
            where friends.username = ?;`, [username])
            .catch(err => {
                console.error(err);
                res.status(500).send({status: 500, message: 'Unknown Server Error'});
                return null
            });
            if(usersForUser === null) {
                return
            }

            global.sockets.filter(socket => socket.username == username).forEach(socket => socket.send(JSON.stringify(['users', usersForUser[0]]), {binary: false}));

            pendingRequestOnUsers[friendName] = null;
            pendingRequestOnUsers[username] = null;
            res.status(200).send({status: 200, message: 'User Blocked'});
            return
        }
    }
    pendingRequestOnUsers[friendName] = null;
    pendingRequestOnUsers[username] = null;
    res.status(400).send({status: 400, message: 'Bad Request'});
}

export const postUnBlock = async (req, res) => {
if(!req.session.logged) {
        return
    }

    const username = req.session.username
    const friendName = req.body.friendName;

    if(friendName == username) {
        res.status(400).send({status: 400, message: 'Incorrect Username'});
        return
    }

    if( (friendName.length > 19) || (!friendName.length) ) {
        res.status(400).send({status: 400, message: 'Incorrect Username'});
        return
    }
    
    if(pendingRequestOnUsers[friendName] == username || pendingRequestOnUsers[username] == friendName) {
        res.status(500).send({status: 500, message: 'Race Condition - Try Again'});
        return
    }

    pendingRequestOnUsers[friendName] = username;
    pendingRequestOnUsers[username] = friendName;

    const friendExists = await db.promise().execute(`SELECT * FROM users WHERE username = ?;`, [friendName])
    .catch(err => {
        console.error(err);
        pendingRequestOnUsers[friendName] = null;
        pendingRequestOnUsers[username] = null;
        res.status(500).send({status: 500, message: 'Unknown Server Error'});
        return null
    });
    if(friendExists === null) {
        return
    }

    if(!friendExists[0][0]) {
        pendingRequestOnUsers[friendName] = null;
        pendingRequestOnUsers[username] = null;
        res.status(400).send({status: 400, message: 'User Does Not Exist'});
        return
    }
    
    const userStatus = await db.promise().execute(`select * from friends where username = ? and friendName = ?;`, [username, friendName])
    .catch(err => {
        console.error(err);
        pendingRequestOnUsers[friendName] = null;
        pendingRequestOnUsers[username] = null;
        res.status(500).send({status: 500, message: 'Unknown Server Error'});
        return null
    });
    if(userStatus === null) {
        return
    }

    if(userStatus[0][0]) {
        if(userStatus[0][0].status == 'blocked') {
            const removeBlock = await db.promise().execute(`delete from friends where username = ? and friendName = ?;`, [username, friendName])
            .catch(err => {
                console.error(err);
                pendingRequestOnUsers[friendName] = null;
                pendingRequestOnUsers[username] = null;
                res.status(500).send({status: 500, message: 'Unknown Server Error'});
                return null
            });
            if(removeBlock === null) {
                return
            }

            const usersForUser = await db.promise().execute(`select friends.friendName, friends.status, users.id from friends inner join users on friends.friendName = users.username
            where friends.username = ?;`, [username])
            .catch(err => {
                console.error(err);
                res.status(500).send({status: 500, message: 'Unknown Server Error'});
                return null
            });
            if(usersForUser === null) {
                return
            }

            global.sockets.filter(socket => socket.username == username).forEach(socket => socket.send(JSON.stringify(['users', usersForUser[0]]), {binary: false}));

            pendingRequestOnUsers[friendName] = null;
            pendingRequestOnUsers[username] = null;
            res.status(200).send({status: 200, message: 'User Unblocked'});
            return
        }
    }

    pendingRequestOnUsers[friendName] = null;
    pendingRequestOnUsers[username] = null;
    res.status(400).send({status: 400, message: 'User Not Blocked'});
}

export const getFriends = async (req, res) => {
    if(!req.session.logged) {
        res.status(401).send({status: 401, message: 'Not Logged In'});
        return
    }

    const friends = await db.promise().execute(`select friends.friendName, friends.status, users.id from friends inner join users on friends.friendName = users.username
    where friends.username = ?;`, [req.session.username])
    .catch(err => {
        console.error(err);
        res.status(500).send({status: 500, message: 'Unknown Server Error'});
        return null
    });
    if(friends === null) {
        return
    }

    const onlineFriends = friends[0].filter(user => user.status == 'friend').map(user => user.friendName).filter(friendName => global.onlineUsers.includes(friendName));
    res.status(200).send({friends: friends[0], status: 200, onlineFriends});
}