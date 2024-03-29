import db from '../database.js'
import {v4} from 'uuid'

let pendingRequestOnUsers:{[key: string]: string} = {};

export const getDirect = async (req, res) => {
    if(!req.session.logged) {
        return
    }

    const { id } = req.params;

    if(req.session.userId == id) {
        res.status(400).send({status: 400, message: 'Bad Request'});
        return
    }

    const friend = await db.promise().execute(`select username from users where id = ?;`, [id])
    .catch(err => {
        console.error(err);
        res.status(500).send({status: 500, message: 'Unknown Server Error'});
        return null
    });
    if(friend === null) {
        return
    }
    if(!friend[0][0]) {
        res.status(400).send({status: 400, message: 'Bad Request'});
        return
    }

    const username = req.session.username;
    const friendName = friend[0][0].username;

    const messages = await db.promise().execute(`select directmessages.username, directmessages.message, directmessages.order from directmessages inner join direct
    on directmessages.id = direct.messagesId where direct.username = ? and direct.friendName = ? order by directmessages.order desc;`, [username, friendName])
    .catch(err => {
        console.error(err);
        res.status(500).send({status: 500, message: 'Unknown Server Error'});
        return null
    });
    if(messages === null) {
        return
    }
    if(messages[0][0]) {
        res.status(200).send({status: 200, friendName: friendName, messages: messages[0]});
        return
    }

    const direct = await db.promise().execute(`select username, friendName from direct where username = ? and friendName = ?;`, [username, friendName])
    .catch(err => {
        console.error(err);
        res.status(500).send({status: 500, message: 'Unknown Server Error'});
        return null
    });
    if(direct === null) {
        return
    }
    if(direct[0][0]) {
        res.status(200).send({status: 200, friendName: friendName, messages: []});
        return
    }


    if(pendingRequestOnUsers[username] == friendName || pendingRequestOnUsers[friendName] == username) {
        res.status(500).send({status: 500, message: 'Race Condition - Try Again'});
        return
    }

    pendingRequestOnUsers[username] = friendName;
    pendingRequestOnUsers[friendName] = username;

    const randomId = v4() as string;
    const createDirect = await db.promise().execute(`insert into direct(username, friendName, status, messagesId, notification) values(?, ?, 'open', ?, ?), (?, ?, 'closed', ?, ?);`,
    [username, friendName, randomId, 0, friendName, username, randomId, 0])
    .catch(err => {
        console.error(err);
        res.status(500).send({status: 500, message: 'Unknown Server Error'});
        return null
    });
    if(createDirect === null) {
        pendingRequestOnUsers[username] = null;
        pendingRequestOnUsers[friendName] = null;
        return
    }

    pendingRequestOnUsers[username] = null;
    pendingRequestOnUsers[friendName] = null;
    res.status(200).send({status: 200, friendName: friendName, messages: []});
}


export const getUserId = async (req, res) => {
    if(!req.session.logged) {
        return
    }

    const { username } = req.params;

    if(req.session.username == username) {
        res.status(400).send({status: 400, message: 'Bad Request'});
        return
    }

    const friend = await db.promise().execute(`select id from users where username = ?;`, [username])
    .catch(err => {
        console.error(err);
        res.status(500).send({status: 500, message: 'Unknown Server Error'});
        return null
    });
    if(friend === null) {
        return
    }
    if(!friend[0][0]) {
        res.status(400).send({status: 400, message: 'Bad Request'});
        return
    }

    res.status(200).send({status: 200, id: friend[0][0].id});
}


export const postDirect = async (req, res) => {
    if(!req.session.logged) {
        return
    }

    const { id } = req.params;

    if(req.session.userId == id || !req.body.message) {
        res.status(400).send({status: 400, message: 'Bad Request'});
        return
    }
    if(!req.body.message.trim()) {
        res.status(400).send({status: 400, message: 'Bad Request'});
        return
    }

    const friend = await db.promise().execute(`select username from users where id = ?;`, [id])
    .catch(err => {
        console.error(err);
        res.status(500).send({status: 500, message: 'Unknown Server Error'});
        return null
    });
    if(friend === null) {
        return
    }
    if(!friend[0][0]) {
        res.status(500).send({status: 500, message: 'Bad Request'});
        return
    }

    const username = req.session.username;
    const friendName = friend[0][0].username;

    const blockedUser = await db.promise().execute(`select username, friendName from friends where username = ? and friendName = ? and status = 'blocked' or
    username = ? and friendName = ? and status = 'blocked';`, [username, friendName, friendName, username])
    .catch(err => {
        console.error(err);
        res.status(500).send({status: 500, message: 'Unknown Server Error'});
        return null
    });
    if(blockedUser === null) {
        return
    }
    if(blockedUser[0][0]) {
        res.status(403).send({status: 403, message: 'Blocked By User'});
        return
    }
    
    const directId = await db.promise().execute(`select messagesId from direct where username = ? and friendName = ?;`, [username, friendName])
    .catch(err => {
        console.error(err);
        res.status(500).send({status: 500, message: 'Unknown Server Error'});
        return null
    });
    if(directId === null) {
        return
    }
    if(!directId[0][0]) {
        res.status(500).send({status: 400, message: 'Bad Request'});
        return
    }
    const messagesId = directId[0][0].messagesId;

    const message = req.body.message;

    const createDirectMessage = await db.promise().execute(`insert into directmessages(id, username, message) values(?, ?, ?);`, [messagesId, username, message])
    .catch(err => {
        console.error(err);
        res.status(500).send({status: 500, message: 'Unknown Server Error'});
        return null
    });
    if(createDirectMessage === null) {
        return
    }
    const order = createDirectMessage[0].insertId;

    global.sockets.filter(socket => socket.username == username)
    .forEach(socket => socket.send(JSON.stringify(['directMessagesUpdate', {message: message, username: username, friendName: friendName, order: order}]), {binary: false}));

    global.sockets.filter(socket => socket.username == friendName)
    .forEach(socket => socket.send(JSON.stringify(['directMessagesUpdate', {message: message, username: username, order: order}]), {binary: false}));

    res.status(200).send({status: 200, message: 'Message Sent'});
}


export const getAllDirect = async (req, res) => {
    if(!req.session.logged) {
        return
    }

    const username = req.session.username;
    const allDirect = await db.promise().execute(`SELECT direct.friendName, max(directmessages.order) as 'order' FROM directmessages inner join
    direct on directmessages.id = direct.messagesId WHERE direct.username = ? group by directmessages.id, direct.friendName;`, [username])
    .catch(err => {
        console.error(err);
        res.status(500).send({status: 500, message: 'Unknown Server Error'});
        return null
    });
    if(allDirect === null) {
        return
    }

    res.status(200).send({status: 200, allDirect: allDirect[0], message: 'Success'});
}