import db from '../database.js'
import {v4} from 'uuid'

let pendingRequestOnUsers:{[key: string]: string} = {};

export const getDirect = async (req, res) => {
    if(!req.session.logged) {
        return
    }

    const { id } = req.params;

    if(req.session.userId == id) {
        res.status(500).send({status: 500, message: 'Bad Request'});
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
    const friendName = friend[0][0].username;

    const messages = await db.promise().execute(`select directmessages.username, directmessages.message, directmessages.order from directmessages inner join direct
    on directmessages.id = direct.messagesId where direct.username = ? and direct.friendName = ? order by directmessages.order asc limit ?;`, [req.session.username, friendName, 20])
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

    const direct = await db.promise().execute(`select username, friendName from direct where username = ? and friendName = ?;`, [req.session.username, friendName])
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


    if(pendingRequestOnUsers[req.session.username] == friendName || pendingRequestOnUsers[friendName] == req.session.username) {
        res.status(500).send({status: 500, message: 'Race Condition - Try Again'});
        return
    }

    pendingRequestOnUsers[req.session.username] = friendName;
    pendingRequestOnUsers[friendName] = req.session.username;

    const randomId = v4() as string;
    const createDirect = await db.promise().execute(`insert into direct values(?, ?, 'closed', ?), (?, ?, 'closed', ?);`, [req.session.username, friendName, randomId, friendName, req.session.username, randomId])
    .catch(err => {
        console.error(err);
        res.status(500).send({status: 500, message: 'Unknown Server Error'});
        return null
    });
    if(createDirect === null) {
        pendingRequestOnUsers[req.session.username] = null;
        pendingRequestOnUsers[friendName] = null;
        return
    }

    pendingRequestOnUsers[req.session.username] = null;
    pendingRequestOnUsers[friendName] = null;
    res.status(200).send({status: 200, friendName: friendName, messages: []});
}


export const postDirect = async (req, res) => {
    if(!req.session.logged) {
        return
    }

    const { id } = req.params;

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
        res.status(500).send({status: 500, message: 'Bad Request'});
        return
    }
    const messagesId = directId[0][0].messagesId;

    const message = req.body.message;

    const createDirectMessage = await db.promise().execute(`insert into directmessages(id, username, message) values(?, ?, ?);`, [messagesId, username, message])
    .catch(err => {
        console.error(err);
        res.status(500).send({status: 500, message: 'Bad Request'});
        return null
    });
    if(createDirectMessage === null) {
        return
    }
    const order = createDirectMessage[0].insertId;

    global.sockets.filter(socket => socket.username == username)
    .forEach(socket => socket.send(JSON.stringify(['directMessagesUpdate', {message: message, username: username, order: order}]), {binary: false}));

    global.sockets.filter(socket => socket.username == friendName)
    .forEach(socket => socket.send(JSON.stringify(['directMessagesUpdate', {message: message, username: username, order: order}]), {binary: false}));

    res.status(200).send({status: 200, message: 'Message Sent'});
}