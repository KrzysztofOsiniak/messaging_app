import { Outlet, redirect, useLoaderData } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import styles from './styles/Channels.module.scss'

export async function loader() {
    // const { username, logged }
    const a = fetch('/api/users/logged', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json());
    // const { friends, onlineFriends }
    const b = fetch('/api/users/friends', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json());
    // const { allDirect }
    const c = fetch('/api/direct/alldirect', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json());
    const [result1, result2, result3] = await Promise.all([a, b, c]);
    if(!result1.logged) {
        return redirect('/');
    }

    return { username: result1.username, friends: result2.friends, onlineUsersFriends: result2.onlineFriends, allDirectChats: result3.allDirect}
}

export default function Channels() {
    const { username, friends, onlineUsersFriends, allDirectChats } = useLoaderData() as { username: string, friends: {friendName: string, status: string, id: number, notification: 1 | 0}[],
    onlineUsersFriends: string[], allDirectChats: {friendName: string, order: number, notification: 1 | 0}[] };

    const [users, setUsers] = useState(friends);

    const [onlineFriends, setOnlineFriends] = useState(onlineUsersFriends);

    const [directMessagesUpdate, setDirectMessagesUpdate] = useState();

    const [allDirect, setAllDirect] = useState(allDirectChats);

    const [shouldUpdate, setShouldUpdate] = useState(false);

    const ws: any = useRef(null);


    useEffect(() => {
        if(ws.current != null) {
            return
        }
        const CONNECTING = 0;
        /*
            const OPEN = 1;
            const CLOSING = 2;
            const CLOSED = 3;
        */

        let reconnecting = 0;
        let connectionAlive = 0;

        function initiate() {
            ws.current.onopen = () => {
                console.log("ws opened");
                if(reconnecting) {
                    updateData();
                    setShouldUpdate(true)
                    reconnecting = 0;
                }
            }

            ws.current.onclose = () => {
                console.log("ws closed");
                ws.current = null;
                setOnlineFriends([]);
                reconnect();
            }

            ws.current.onmessage = ( { data }: {data: string} ) => {
                const parsed = JSON.parse(data);
                const event = parsed[0];
                const parsedData = parsed[1];
                
                switch(event) {
                    case 'users':
                        setUsers(parsedData);
                        break
                    case 'friendOnline':
                        setOnlineFriends(friends => [...friends, parsedData]);
                        break
                    case 'friendOffline':
                        setOnlineFriends(friends => friends.filter(friend => friend != parsedData));
                        break
                    case 'directMessagesUpdate':
                        setDirectMessagesUpdate({username: parsedData.username, message: parsedData.message, order: parsedData.order, date: parsedData.date} as any);
                        setAllDirect(allDirect => {
                            if(parsedData.username == username) {
                                return [...allDirect.filter(user => user.friendName != parsedData.friendName), {friendName: parsedData.friendName, order: parsedData.order, notification: 0}]
                            }
                            return [...allDirect.filter(user => user.friendName != parsedData.friendName), {friendName: parsedData.friendName, order: parsedData.order, notification: 1}]
                        });
                        break
                    case 'directNotificationOff':
                        setAllDirect(allDirect => {
                            const userToUpdate = allDirect.filter(user => user.friendName == parsedData.friendName)[0];
                            if(userToUpdate) {
                                return [...allDirect.filter(user => user.friendName != parsedData.friendName), {friendName: userToUpdate.friendName, order: userToUpdate.order, notification: 0}]
                            }
                            return allDirect
                        });
                        break
                    case 'pong':
                        connectionAlive = 1;
                        break
                }
            }

            ws.current.onerror = (err: {message: string}) => {
                console.error("Socket encountered error: ", err.message);
            };
        }

        async function updateData() {
            const { friends, onlineFriends } = await fetch('/api/users/friends', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json());
            setUsers(friends);
            setOnlineFriends(onlineFriends);

            const { allDirect } = await fetch('/api/direct/alldirect', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json());
            setAllDirect(allDirect);
        }
        
        function reconnect() {
            setTimeout(() => {
                if(ws.current === null) {
                    console.log('reconnecting...');
                    ws.current = new WebSocket("ws://localhost:5173/ws");
                    reconnecting = 1;
                    initiate();
                }
            }, 1000);
        }

        async function checkIfConneted() {
            if(!ws.current) {
                return setTimeout(checkIfConneted, 4 * 1000);
            }
            if(ws.current.readyState == CONNECTING) {
                return setTimeout(checkIfConneted, 4 * 1000);
            }

            ws.current.send(JSON.stringify('ping'));
            
            await new Promise<void>(resolve => {
                setTimeout(() => {
                    if(!connectionAlive && ws.current) {
                        console.log('detected dead websocket');
                        ws.current.close();
                    }
                    resolve();
                }, 2 * 1000);
            })

            connectionAlive = 0;
            setTimeout(checkIfConneted, 4 * 1000);
        }

        ws.current = new WebSocket("ws://localhost:5173/ws");
        initiate();
        checkIfConneted();

        return () => {
            if(ws.current.readyState != CONNECTING) {
                ws.current.close();
            }
        };
    }, []);

    return(
        <div className={styles.flexWrapper}>
            <nav className={styles.channels}>
                <h2>text</h2>
            </nav>
            <Outlet context={ {username: username, users: users, onlineFriends: onlineFriends, directMessagesUpdate: directMessagesUpdate,
                allDirect: allDirect, shouldUpdate: shouldUpdate, setShouldUpdate: setShouldUpdate } } />
        </div>
    )
}