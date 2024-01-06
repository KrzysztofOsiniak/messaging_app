import { Outlet, redirect, useLoaderData } from "react-router-dom";
import styles from './styles/Channels.module.scss'
import { socket } from './socket';
import { useEffect, useState } from "react";

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
    const { friends } = await fetch('http://localhost:8080/users/friends', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json());
    return {username: username, friends:friends}
}

export default function Channels() {
    const {username} = useLoaderData();
    const {friends} = useLoaderData();

    const [users, setUsers] = useState(friends);

    useEffect(() => {
        socket.connect();

        function connect() {
            socket.emit('addOnline', username);
        }

        function getUsers(users) {
            setUsers(users);
        }
        
        socket.on("connect", connect);

        socket.on("users", getUsers);

        return () => {
            socket.off("connect", connect);
            socket.off("users", getUsers);
            socket.disconnect();
        };
    }, []);

    return(
        <div className={styles.flexWrapper}>
            <nav className={styles.channels}>
                <h2>text</h2>
            </nav>
            <Outlet context={[users, setUsers]} />
        </div>
    )

}