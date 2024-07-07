import db from '../database.js'
import bcrypt from 'bcrypt'
import * as wsFunctions from '../ws.js'

import type { Request, Response } from 'express'
import type { Session } from 'express-session'
import type { QueryResult, FieldPacket, ResultSetHeader } from 'mysql2';

type UserSession = Session & {
    logged?: boolean
    pending?: boolean
    userId?: number
    username?: string
}
type UserRequest = Request & {
    session: UserSession
}

type UserQueryResult = QueryResult & {
    username: string
    friendName: string
    id: number
    messagesId: number
    password: string
    status: string
}

interface User {
    friendName: string
    status: string
    id: number
}

let pendingRequestOnUsers:{[key: string]: string | null} = {};

export const getLogged = (req: UserRequest, res: Response) => {
    if(req.session.logged) {
        res.status(200).send({logged: true, username: req.session.username});
        return
    }
    res.status(401).send({logged: false});
}

export const postLogin = (req: UserRequest, res: Response) => {
    if(req.session.pending) {
        return
    }
    if(req.session.logged) {
        return
    }
    req.session.pending = true;
    setTimeout(async () => {
        if(!req.body.username || !req.body.password) {
            req.session.destroy(() => {});
            return
        }
        if(typeof req.body.username !== 'string' || typeof req.body.password !== 'string') {
            req.session.destroy(() => {});
            return
        }
        const username = req.body.username.trim();
        const password = req.body.password;

        if( ((password.length > 29) || (username.length > 19)) || (!password.length || !username.length) ) {
            req.session.destroy(() => {});
            res.status(400).send({status: 400, message: 'not sent'});
            return
        }

        const user = await db.promise().execute(`SELECT * FROM users WHERE username = ?;`, [username])
        .catch(err => {
            console.error(err);
            req.session.destroy(() => {});
            res.status(500).send({status: 500, message: 'not sent'});
            return null
        }) as [UserQueryResult[], FieldPacket[]] | null;
        if(user === null) {
            return
        }

        if(!user[0][0]) {
            req.session.destroy(() => {});
            res.status(400).send({status: 400, message: 'wrong username or password'});
            return
        }

        const hash = user[0][0].password;
        const result = await bcrypt.compare(`${password}`, `${hash}`)
        .then(result => result)
        .catch(err => {
            console.error(err);
            req.session.destroy(() => {});
            res.status(500).send({status: 500, message: 'not sent'});
            return null
        });
        if(result === null) {
            return
        }
        
        if(!result) {
            req.session.destroy(() => {});
            res.status(400).send({status: 400, message: 'wrong username or password'});
            return
        }

        req.session.userId = user[0][0].id;
        req.session.logged = true;
        req.session.username = username;
        req.session.pending = false;
        res.status(200).send({username: req.session.username, status: 200, message: 'sent'})
    }, 200)
};


export const postSignup = (req: UserRequest, res: Response) => {
    if(req.session.pending) {
        return
    }
    if(req.session.logged) {
        return
    }
    req.session.pending = true;
    setTimeout(async () => {
        if(!req.body.username || !req.body.password) {
            req.session.destroy(() => {});
            return
        }
        if(typeof req.body.username !== 'string' || typeof req.body.password !== 'string') {
            req.session.destroy(() => {});
            return
        }
        const username = req.body.username.trim();
        const password = req.body.password;
        const regtest = new RegExp(/[^ -~]/g);

        if( ((password.length > 29) || (username.length > 19)) || (!password.length || !username.length) || (regtest.test(username)) ) {
            req.session.destroy(() => {});
            res.status(400).send({status: 400, message: 'not sent'});
            return
        }

        const user = await db.promise().execute(`SELECT * FROM users WHERE USERNAME = ?;`, [username])
        .catch(err => {
            console.error(err);
            req.session.destroy(() => {});
            res.status(500).send({status: 500, message: 'not sent'});
            return null
        }) as [UserQueryResult[], FieldPacket[]] | null;
        if(user === null) {
            return
        }

        if(user[0][0]) {
            req.session.destroy(() => {});
            res.status(400).send({status: 400, message: 'user already exists'});
            return
        }

        const hash = await bcrypt.hash(password, 10)
        .then(hash => hash)
        .catch(err => {
            console.error(err);
            req.session.destroy(() => {});
            res.status(500).send({status: 500, message: 'not sent'});
            return null
        });
        if(hash === null) {
            return
        }

        const result = await db.promise().execute(`INSERT INTO users(username, password) VALUES(?, ?);`, [username, hash])
        .catch(err => {
            console.error(err);
            req.session.destroy(() => {});
            res.status(500).send({status: 500, message: 'not sent'});
            return null
        }) as [ResultSetHeader, FieldPacket[]] | null;
        if(result === null) {
            return
        }

        req.session.userId = result[0].insertId;
        req.session.logged = true;
        req.session.username = username;
        req.session.pending = false;
        res.status(200).send({username: req.session.username, status: 200, message: 'sent'});
    }, 200);
};


export const postAddFriend = async (req: UserRequest, res: Response) => {
    if(!req.session.logged) {
        return
    }

    if(!req.body.friendName) {
        return
    }
    if(typeof req.body.friendName !== 'string') {
        return
    }
    const username = req.session.username as string;
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
    }) as [UserQueryResult[], FieldPacket[]] | null;
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
    }) as [UserQueryResult[], FieldPacket[]] | null;
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
    }) as [UserQueryResult[], FieldPacket[]] | null;
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
        }) as [UserQueryResult[], FieldPacket[]] | null;
        if(request === null) {
            return
        }
        
        const usersForFriend = await db.promise().execute(`select friends.friendName, friends.status, users.id from friends inner join users on friends.friendName = users.username
        where friends.username = ?;`, [friendName])
        .catch(err => {
            console.error(err);
            res.status(500).send({status: 500, message: 'Unknown Server Error'});
            return null
        }) as [User[], FieldPacket[]] | null;
        if(usersForFriend === null) {
            return
        }

        wsFunctions.updateUsers(friendName, usersForFriend[0]);

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
            await new Promise<void>(resolve => {db.getConnection( async (err, connection) => {
                if(err) {
                    console.log(err);
                    return
                }
                let failed = false;
                connection.beginTransaction(err => {
                    if(err) {
                        console.log(err);
                        connection.release();
                        failed = true;
                    }
                });
                if(failed) {
                    return
                }

                const usersFriend = await connection.promise().execute(`INSERT INTO friends(username, friendName, status, notification) VALUES(?, ?, ?, ?);`, [friendName, username, 'friend', 0])
                .catch(err => {
                    console.error(err);
                    pendingRequestOnUsers[friendName] = null;
                    pendingRequestOnUsers[username] = null;
                    res.status(500).send({status: 500, message: 'Unknown Server Error'});
                    connection.rollback(err => {
                        if(err) {
                            console.log(err);
                            connection.release();
                        }
                    });
                    return null
                }) as [UserQueryResult[], FieldPacket[]] | null;
                if(usersFriend === null) {
                    return
                }
                const userUpdate = await connection.promise().execute(`update friends set status = 'friend' where username = ? and friendName = ?;`, [username, friendName])
                .catch(err => {
                    console.error(err);
                    pendingRequestOnUsers[friendName] = null;
                    pendingRequestOnUsers[username] = null;
                    res.status(500).send({status: 500, message: 'Unknown Server Error'});
                    connection.rollback(err => {
                        if(err) {
                            console.log(err);
                            connection.release();
                        }
                    });
                    return null
                }) as [UserQueryResult[], FieldPacket[]] | null;
                if(userUpdate === null) {
                    return
                }

                connection.commit();
                connection.release();
                resolve();
            })});

            const usersForUser = await db.promise().execute(`select friends.friendName, friends.status, users.id from friends inner join users on friends.friendName = users.username
            where friends.username = ?;`, [username])
            .catch(err => {
                console.error(err);
                res.status(500).send({status: 500, message: 'Unknown Server Error'});
                return null
            }) as [UserQueryResult[], FieldPacket[]] | null;
            if(usersForUser === null) {
                return
            }

            const usersForFriend = await db.promise().execute(`select friends.friendName, friends.status, users.id from friends inner join users on friends.friendName = users.username
            where friends.username = ?;`, [friendName])
            .catch(err => {
                console.error(err);
                res.status(500).send({status: 500, message: 'Unknown Server Error'});
                return null
            }) as [User[], FieldPacket[]] | null;
            if(usersForFriend === null) {
                return
            }

            wsFunctions.updateUsers(username, usersForUser[0]);
            wsFunctions.updateUsers(friendName, usersForFriend[0]);

            wsFunctions.updateOnline(username, friendName, 'friendOnline');

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

export const postDeclineFriend = async (req: UserRequest, res: Response) => {
    if(!req.session.logged) {
        return
    }

    if(!req.body.friendName) {
        return
    }
    if(typeof req.body.friendName !== 'string') {
        return
    }
    const username = req.session.username as string;
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
    }) as [UserQueryResult[], FieldPacket[]] | null;
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
    }) as [UserQueryResult[], FieldPacket[]] | null;
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
        }) as [UserQueryResult[], FieldPacket[]] | null;
        if(removeRequest === null) {
            return
        }

        const usersForUser = await db.promise().execute(`select friends.friendName, friends.status, users.id from friends inner join users on friends.friendName = users.username
        where friends.username = ?;`, [username])
        .catch(err => {
            console.error(err);
            res.status(500).send({status: 500, message: 'Unknown Server Error'});
            return null
        }) as [UserQueryResult[], FieldPacket[]] | null;
        if(usersForUser === null) {
            return
        }

        wsFunctions.updateUsers(username, usersForUser[0]);

        pendingRequestOnUsers[friendName] = null;
        pendingRequestOnUsers[username] = null;
        res.status(200).send({status: 200, message: 'Friend Request Removed'});
        return
    }
    pendingRequestOnUsers[friendName] = null;
    pendingRequestOnUsers[username] = null;
    res.status(400).send({status: 400, message: 'Bad Request'});
}

export const postRemoveFriend = async (req: UserRequest, res: Response) => {
    if(!req.session.logged) {
        return
    }

    if(!req.body.friendName) {
        return
    }
    if(typeof req.body.friendName !== 'string') {
        return
    }
    const username = req.session.username as string;
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
    }) as [UserQueryResult[], FieldPacket[]] | null;
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
    }) as [UserQueryResult[], FieldPacket[]] | null;
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
        await new Promise<void>(resolve => {db.getConnection( async (err, connection) => {
            if(err) {
                console.log(err);
                return
            }
            let failed = false;
            connection.beginTransaction(err => {
                if(err) {
                    console.log(err);
                    connection.release();
                    failed = true;
                }
            });
            if(failed) {
                return
            }

            const removeFriendsUser = await db.promise().execute(`delete from friends where username = ? and friendName = ?;`, [friendName, username])
            .catch(err => {
                console.error(err);
                pendingRequestOnUsers[friendName] = null;
                pendingRequestOnUsers[username] = null;
                res.status(500).send({status: 500, message: 'Unknown Server Error'});
                connection.rollback(err => {
                    if(err) {
                        console.log(err);
                        connection.release();
                    }
                });
                return null
            }) as [UserQueryResult[], FieldPacket[]] | null;
            if(removeFriendsUser === null) {
                return
            }

            const removeUsersFriend = await db.promise().execute(`delete from friends where username = ? and friendName = ?;`, [username, friendName])
            .catch(err => {
                console.error(err);
                pendingRequestOnUsers[friendName] = null;
                pendingRequestOnUsers[username] = null;
                res.status(500).send({status: 500, message: 'Unknown Server Error'});
                connection.rollback(err => {
                    if(err) {
                        console.log(err);
                        connection.release();
                    }
                });
                return null
            }) as [UserQueryResult[], FieldPacket[]] | null;
            if(removeUsersFriend === null) {
                return
            }

            connection.commit();
            connection.release();
            resolve();
        })});

        const usersForUser = await db.promise().execute(`select friends.friendName, friends.status, users.id from friends inner join users on friends.friendName = users.username
        where friends.username = ?;`, [username])
        .catch(err => {
            console.error(err);
            res.status(500).send({status: 500, message: 'Unknown Server Error'});
            return null
        }) as [UserQueryResult[], FieldPacket[]] | null;
        if(usersForUser === null) {
            return
        }

        const usersForFriend = await db.promise().execute(`select friends.friendName, friends.status, users.id from friends inner join users on friends.friendName = users.username
        where friends.username = ?;`, [friendName])
        .catch(err => {
            console.error(err);
            res.status(500).send({status: 500, message: 'Unknown Server Error'});
            return null
        }) as [User[], FieldPacket[]] | null;
        if(usersForFriend === null) {
            return
        }

        wsFunctions.updateUsers(username, usersForUser[0]);
        wsFunctions.updateUsers(friendName, usersForFriend[0]);

        wsFunctions.updateOnline(friendName, username, 'friendOffline');

        pendingRequestOnUsers[friendName] = null;
        pendingRequestOnUsers[username] = null;
        res.status(200).send({status: 200, message: 'Removed From Friend List'});
        return
    }
    pendingRequestOnUsers[friendName] = null;
    pendingRequestOnUsers[username] = null;
    res.status(400).send({status: 400, message: 'Bad Request'});
}

export const postBlock = async (req: UserRequest, res: Response) => {
    if(!req.session.logged) {
        return
    }

    if(!req.body.friendName) {
        return
    }
    if(typeof req.body.friendName !== 'string') {
        return
    }
    const username = req.session.username as string;
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
    }) as [UserQueryResult[], FieldPacket[]] | null;
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
    }) as [UserQueryResult[], FieldPacket[]] | null;
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
    }) as [UserQueryResult[], FieldPacket[]] | null;
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
        }) as [UserQueryResult[], FieldPacket[]] | null;
        if(request === null) {
            return
        }

        const usersForUser = await db.promise().execute(`select friends.friendName, friends.status, users.id from friends inner join users on friends.friendName = users.username
        where friends.username = ?;`, [username])
        .catch(err => {
            console.error(err);
            res.status(500).send({status: 500, message: 'Unknown Server Error'});
            return null
        }) as [UserQueryResult[], FieldPacket[]] | null;
        if(usersForUser === null) {
            return
        }

        wsFunctions.updateUsers(username, usersForUser[0]);

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
            }) as [UserQueryResult[], FieldPacket[]] | null;
            if(userUpdate === null) {
                return
            }

            const usersForUser = await db.promise().execute(`select friends.friendName, friends.status, users.id from friends inner join users on friends.friendName = users.username
            where friends.username = ?;`, [username])
            .catch(err => {
                console.error(err);
                res.status(500).send({status: 500, message: 'Unknown Server Error'});
                return null
            }) as [UserQueryResult[], FieldPacket[]] | null;
            if(usersForUser === null) {
                return
            }

            wsFunctions.updateUsers(username, usersForUser[0]);

            pendingRequestOnUsers[friendName] = null;
            pendingRequestOnUsers[username] = null;
            res.status(200).send({status: 200, message: 'User Blocked'});
            return
        }

        if(userStatus[0][0].status == 'friend') {
            await new Promise<void>(resolve => {db.getConnection( async (err, connection) => {
                if(err) {
                    console.log(err);
                    return
                }
                let failed = false;
                connection.beginTransaction(err => {
                    if(err) {
                        console.log(err);
                        connection.release();
                        failed = true;
                    }
                });
                if(failed) {
                    return
                }
    
                const usersFriend = await db.promise().execute(`delete from friends where username = ? and friendName = ?;`, [friendName, username])
                .catch(err => {
                    console.error(err);
                    pendingRequestOnUsers[friendName] = null;
                    pendingRequestOnUsers[username] = null;
                    res.status(500).send({status: 500, message: 'Unknown Server Error'});
                    connection.rollback(err => {
                        if(err) {
                            console.log(err);
                            connection.release();
                        }
                    });
                    return null
                }) as [UserQueryResult[], FieldPacket[]] | null;
                if(usersFriend === null) {
                    return
                }
    
                const userUpdate = await db.promise().execute(`update friends set status = 'blocked' where username = ? and friendName = ?;`, [username, friendName])
                .catch(err => {
                    console.error(err);
                    pendingRequestOnUsers[friendName] = null;
                    pendingRequestOnUsers[username] = null;
                    res.status(500).send({status: 500, message: 'Unknown Server Error'});
                    connection.rollback(err => {
                        if(err) {
                            console.log(err);
                            connection.release();
                        }
                    });
                    return null
                }) as [UserQueryResult[], FieldPacket[]] | null;
                if(userUpdate === null) {
                    return
                }
    
                connection.commit();
                connection.release();
                resolve();
            })});

            const usersForUser = await db.promise().execute(`select friends.friendName, friends.status, users.id from friends inner join users on friends.friendName = users.username
            where friends.username = ?;`, [username])
            .catch(err => {
                console.error(err);
                res.status(500).send({status: 500, message: 'Unknown Server Error'});
                return null
            }) as [UserQueryResult[], FieldPacket[]] | null;
            if(usersForUser === null) {
                return
            }

            const usersForFriend = await db.promise().execute(`select friends.friendName, friends.status, users.id from friends inner join users on friends.friendName = users.username
            where friends.username = ?;`, [friendName])
            .catch(err => {
                console.error(err);
                res.status(500).send({status: 500, message: 'Unknown Server Error'});
                return null
            }) as [User[], FieldPacket[]] | null;
            if(usersForFriend === null) {
                return
            }

            wsFunctions.updateUsers(username, usersForUser[0]);
            wsFunctions.updateUsers(friendName, usersForFriend[0]);

            wsFunctions.updateOnline(username, friendName, 'friendOffline');

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
            }) as [UserQueryResult[], FieldPacket[]] | null;
            if(request === null) {
                return
            }

            const usersForUser = await db.promise().execute(`select friends.friendName, friends.status, users.id from friends inner join users on friends.friendName = users.username
            where friends.username = ?;`, [username])
            .catch(err => {
                console.error(err);
                res.status(500).send({status: 500, message: 'Unknown Server Error'});
                return null
            }) as [UserQueryResult[], FieldPacket[]] | null;
            if(usersForUser === null) {
                return
            }

            wsFunctions.updateUsers(username, usersForUser[0]);

            pendingRequestOnUsers[friendName] = null;
            pendingRequestOnUsers[username] = null;
            res.status(200).send({status: 200, message: 'User Blocked'});
            return
        }

        if(friendStatus[0][0].status == 'pending') {
            await new Promise<void>(resolve => {db.getConnection( async (err, connection) => {
                if(err) {
                    console.log(err);
                    return
                }
                let failed = false;
                connection.beginTransaction(err => {
                    if(err) {
                        console.log(err);
                        connection.release();
                        failed = true;
                    }
                });
                if(failed) {
                    return
                }
    
                const usersFriend = await db.promise().execute(`delete from friends where username = ? and friendName = ?;`, [friendName, username])
                .catch(err => {
                    console.error(err);
                    pendingRequestOnUsers[friendName] = null;
                    pendingRequestOnUsers[username] = null;
                    res.status(500).send({status: 500, message: 'Unknown Server Error'});
                    connection.rollback(err => {
                        if(err) {
                            console.log(err);
                            connection.release();
                        }
                    });
                    return null
                }) as [UserQueryResult[], FieldPacket[]] | null;
                if(usersFriend === null) {
                    return
                }
    
                const request = await db.promise().execute(`INSERT INTO friends(username, friendName, status, notification) VALUES(?, ?, ?, ?);`, [username, friendName, 'blocked', 0])
                .catch(err => {
                    console.error(err);
                    pendingRequestOnUsers[friendName] = null;
                    pendingRequestOnUsers[username] = null;
                    res.status(500).send({status: 500, message: 'Unknown Server Error'});
                    connection.rollback(err => {
                        if(err) {
                            console.log(err);
                            connection.release();
                        }
                    });
                    return null
                }) as [UserQueryResult[], FieldPacket[]] | null;
                if(request === null) {
                    return
                }
    
                connection.commit();
                connection.release();
                resolve();
            })});

            const usersForUser = await db.promise().execute(`select friends.friendName, friends.status, users.id from friends inner join users on friends.friendName = users.username
            where friends.username = ?;`, [username])
            .catch(err => {
                console.error(err);
                res.status(500).send({status: 500, message: 'Unknown Server Error'});
                return null
            }) as [UserQueryResult[], FieldPacket[]] | null;
            if(usersForUser === null) {
                return
            }

            wsFunctions.updateUsers(username, usersForUser[0]);

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

export const postUnBlock = async (req: UserRequest, res: Response) => {
    if(!req.session.logged) {
        return
    }

    if(!req.body.friendName) {
        return
    }
    if(typeof req.body.friendName !== 'string') {
        return
    }
    const username = req.session.username as string;
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
    }) as [UserQueryResult[], FieldPacket[]] | null;
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
    }) as [UserQueryResult[], FieldPacket[]] | null;
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
            }) as [UserQueryResult[], FieldPacket[]] | null;
            if(removeBlock === null) {
                return
            }

            const usersForUser = await db.promise().execute(`select friends.friendName, friends.status, users.id from friends inner join users on friends.friendName = users.username
            where friends.username = ?;`, [username])
            .catch(err => {
                console.error(err);
                res.status(500).send({status: 500, message: 'Unknown Server Error'});
                return null
            }) as [UserQueryResult[], FieldPacket[]] | null;
            if(usersForUser === null) {
                return
            }

            wsFunctions.updateUsers(username, usersForUser[0]);

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

export const getFriends = async (req: UserRequest, res: Response) => {
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
    }) as [User[], FieldPacket[]] | null;
    if(friends === null) {
        return
    }

    const onlineFriends = wsFunctions.getOnlineFriends(friends[0]);
    res.status(200).send({friends: friends[0], status: 200, onlineFriends});
}