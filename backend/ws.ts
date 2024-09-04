import db from './database.js'
import {v4} from 'uuid'
import { sessionStore } from './index.js'

import type { WebSocket } from 'ws';
import type { IncomingMessage } from "http";
import type { QueryResult, FieldPacket } from 'mysql2';

interface UserWebSocket extends WebSocket {
    id?: string
    username?: string
}

type UserQueryResult = QueryResult & { friendName: string }

let onlineUsers: string[] = [];

let sockets: UserWebSocket[] = [];

export default function userWs(ws: UserWebSocket, req: IncomingMessage) {
    ws.on('error', console.error);
    console.log('started');
    
    let index: number;
    if(req.rawHeaders.indexOf('Cookie') != -1) {
        index = req.rawHeaders.indexOf('Cookie');
    }
    else {
        index = req.rawHeaders.indexOf('cookie');
    }
    if(index == -1) {
        console.log("Cookie header not found");
        ws.close();
        return
    }
    const keyIndex: number = req.rawHeaders[index + 1].indexOf('connect.sid=');
    const cookie: string = req.rawHeaders[index + 1].substr(keyIndex + 16, 36);

    let connectionAlive: boolean = false;
    async function checkIfConneted() {
        if(!ws) {
            return
        }
        connectionAlive = false;
        ws.ping();
        await new Promise<void>(resolve => {
            setTimeout(() => {
                if(!connectionAlive) {
                    console.log('connection lost');
                    ws.close();
                }
                resolve();
            }, 6 * 1000);
        })
        if(!connectionAlive) {
            return
        }
        connectionAlive = false;
        setTimeout(checkIfConneted, 60 * 1000);
    }

    sessionStore.get(cookie, async (err, session) => {
        if(err || !session) {
            if(err) {
                console.log('ws user session error:', err);
            }
            if(!session) {
                console.log('ws no user session found');
            }
            ws.close();
            return
        }
        
        ws.username = session.username as string;
        ws.id = v4() as string;
        sockets.push(ws);
        const online: boolean = onlineUsers.includes(session.username);
        onlineUsers.push(session.username);

        checkIfConneted();

        if(online) {
            return
        }

        const friends = await db.promise().execute(`select friendName, status from friends where username = ? and status = 'friend';`, [ws.username])
        .catch(err => {
            console.error(err);
            return null
        }) as [UserQueryResult[], FieldPacket[]] | null;
        if(friends === null) {
            return
        }

        const friendList = friends[0].map(friend => friend.friendName);
        sockets.filter(socket => friendList.includes(socket.username!)).forEach(socket => socket.send(JSON.stringify(['friendOnline', ws.username]), {binary: false}));
    });

    ws.on('message', (data: string) => {
        if(!ws.id) {
            return
        }

        let parsedData;
        
        try {
            parsedData = JSON.parse(data);
        }
        catch (err) {
            console.error(err)
            parsedData = null;
        }
        if(parsedData === null || typeof parsedData !== "string") {
            return
        }


        if(parsedData == 'ping') {
            ws.send(JSON.stringify(['pong', '']));
        }
    });

    ws.on('pong', () => {
        if(!ws.id) {
            return
        }
        connectionAlive = true;
    });

    ws.on('close', async () => {
        if(!ws.id) {
            return
        }
        console.log('closed');

        sockets = sockets.filter(user => user.id != ws.id);

        let deletedOnce = false;
        onlineUsers = onlineUsers.filter(username => {
            if(deletedOnce) {
                return true
            }
            if(username == ws.username) {
                deletedOnce = true
                return false
            }
            return true
        });
        const online = onlineUsers.includes(ws.username!);

        if(online) {
            return
        }

        const friends = await db.promise().execute(`select friendName, status from friends where username = ? and status = 'friend';`, [ws.username])
        .catch(err => {
            console.error(err);
            return null
        }) as [UserQueryResult[], FieldPacket[]] | null;
        if(friends === null) {
            return
        }

        const friendList = friends[0].map(friend => friend.friendName);
        sockets.filter(socket => friendList.includes(socket.username!)).forEach(socket => socket.send(JSON.stringify(['friendOffline', ws.username]), {binary: false}));

        console.log('disconnected');
    });
};

function sendTo(username: string, message: {message: string, username: string, friendName: string, order: number, date: number}) {
    sockets.filter(socket => socket.username == username).forEach(socket => socket.send(JSON.stringify(['directMessagesUpdate', message]), {binary: false}));
}

function updateUsers(username: string, users: {friendName: string, status: string, id: number, notification: 1 | 0}[]) {
    sockets.filter(socket => socket.username == username).forEach(socket => socket.send(JSON.stringify(['users', users]), {binary: false}));
}

function updateOnline(username: string, friendName: string, status: 'friendOnline' | 'friendOffline') {
    if(!onlineUsers.includes(username) || !onlineUsers.includes(friendName)) {
        return
    }

    sockets.filter(socket => socket.username == username).forEach(socket => socket.send(JSON.stringify([status, friendName]), {binary: false}));
    sockets.filter(socket => socket.username == friendName).forEach(socket => socket.send(JSON.stringify([status, username]), {binary: false}));
}

function getOnlineFriends(users: {friendName: string, status: string, id: number}[]) {
    return users.filter(user => user.status == 'friend').map(user => user.friendName).filter(friendName => onlineUsers.includes(friendName));
}

function setDirectNotificationOff(username: string, friendName: string) {
    sockets.filter(socket => socket.username == username).forEach(socket => socket.send(JSON.stringify(['directNotificationOff', {username: username, friendName: friendName}]), {binary: false}));
}

export { sendTo, updateUsers, updateOnline, getOnlineFriends, setDirectNotificationOff }