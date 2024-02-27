import db from './database.js'
import {v4} from 'uuid'



let onlineUsers: string[] = [];

let sockets = [];


global.onlineUsers = onlineUsers;

global.sockets = sockets;


export default function userWs(ws, req) {
    ws.on('error', console.error);
    console.log('started');
    const index: number = req.rawHeaders.indexOf('Cookie');
    if(index == -1) {
        ws.close();
        return
    }
    const keyIndex: number = req.rawHeaders[index + 1].indexOf('connect.sid=');
    const cookie: string = req.rawHeaders[index + 1].substr(keyIndex + 16, keyIndex + 36);

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

    global.sessionStore.get(cookie, async (err, session) => {
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
        global.sockets.push(ws);
        const online: boolean = global.onlineUsers.includes(session.username);
        global.onlineUsers.push(session.username);

        checkIfConneted();

        if(online) {
            return
        }

        const friends = await db.promise().execute(`select friendName, status from friends where username = ? and status = 'friend';`, [ws.username])
        .catch(err => {
            console.error(err);
            return null
        });
        if(friends === null) {
            return
        }

        const friendList = friends[0].map(friend => friend.friendName);
        global.sockets.filter(socket => friendList.includes(socket.username)).forEach(socket => socket.send(JSON.stringify(['friendOnline', ws.username]), {binary: false}));
    });

    ws.on('message', (data: string) => {
        if(!ws.id) {
            return
        }

        interface parsedData {
            data: Array<string>;
        }

        let parsedData: parsedData;
        
        try {
            parsedData = JSON.parse(data);
        }
        catch (err) {
            console.error(err)
            parsedData = null;
        }
        if(parsedData === null) {
            return
        }


        if(parsedData[0] == 'client ws opened') {  
            console.log('received: %s', parsedData[0]);
        }
        if(parsedData[0] == 'ping') {
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

        global.sockets = global.sockets.filter(user => user.id != ws.id);

        let deletedOnce = false;
        global.onlineUsers = global.onlineUsers.filter(username => {
            if(deletedOnce) {
                return true
            }
            if(username == ws.username) {
                deletedOnce = true
                return false
            }
            return true
        });
        const online = global.onlineUsers.includes(ws.username);

        if(online) {
            return
        }

        const friends = await db.promise().execute(`select friendName, status from friends where username = ? and status = 'friend';`, [ws.username])
        .catch(err => {
            console.error(err);
            return null
        });
        if(friends === null) {
            return
        }

        const friendList = friends[0].map(friend => friend.friendName);
        global.sockets.filter(socket => friendList.includes(socket.username)).forEach(socket => socket.send(JSON.stringify(['friendOffline', ws.username]), {binary: false}));

        console.log('disconnected');
    });
};
