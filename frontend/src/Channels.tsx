import { Outlet, redirect, useLoaderData } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import styles from './styles/Channels.module.scss'

export async function loader() {
    const { logged, username } = await fetch('http://localhost:8080/users/logged', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json());
    if(!logged) {
        return redirect('/login')
    }
    const { friends, onlineFriends } = await fetch('http://localhost:8080/users/friends', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json());
    const { allDirect } = await fetch('http://localhost:8080/direct/alldirect', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json());
    return { username: username, friends: friends, onlineUsersFriends: onlineFriends, allDirectChats: allDirect}
}

export default function Channels() {
    const { username, friends, onlineUsersFriends, allDirectChats } = useLoaderData() as { username: string, friends: {friendName: string, status: string, id: number}[],
    onlineUsersFriends: string[], allDirectChats: {friendName: string, order: number}[] };

    const [users, setUsers] = useState(friends);

    const [onlineFriends, setOnlineFriends] = useState(onlineUsersFriends);

    const [directMessagesUpdate, setDirectMessagesUpdate] = useState();

    const [allDirect, setAllDirect] = useState(allDirectChats);

    const ws: any = useRef(null);


    useEffect(() => {
        /*
            on fetch fail
        */
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
                ws.current.send(JSON.stringify(['client ws opened', '']));
                if(reconnecting) {
                    updateData();
                    reconnecting = 0;
                }
            }

            ws.current.onclose = () => {
                console.log("ws closed");
                ws.current = null;
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
                        setDirectMessagesUpdate(parsedData);
                        if(parsedData.username == username) {
                            setAllDirect(allDirect => allDirect.filter(user => user.friendName != parsedData.friendName));
                            setAllDirect(allDirect => [...allDirect, {friendName: parsedData.friendName, order: parsedData.order}]);
                        }
                        else {
                            setAllDirect(allDirect => allDirect.filter(user => user.friendName != parsedData.username));
                            setAllDirect(allDirect => [...allDirect, {friendName: parsedData.username, order: parsedData.order}]);
                        }
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
            const { friends, onlineFriends } = await fetch('http://localhost:8080/users/friends', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json());
            setUsers(friends);
            setOnlineFriends(onlineFriends);
        }
        
        function reconnect() {
            setTimeout(() => {
                if(ws.current === null) {
                    console.log('reconnecting...');
                    ws.current = new WebSocket("ws://localhost:8080");
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

            ws.current.send(JSON.stringify(['ping', '']));
            
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

        ws.current = new WebSocket("ws://localhost:8080");
        initiate();
        checkIfConneted();

        return () => {
            ws.current.close();
        };
    }, []);

    return(
        <div className={styles.flexWrapper}>
            <nav className={styles.channels}>
                <h2>text</h2>
            </nav>
            <Outlet context={ {username: username, users: users, onlineFriends: onlineFriends, directMessagesUpdate: directMessagesUpdate, allDirect: allDirect} } />
        </div>
    )
}