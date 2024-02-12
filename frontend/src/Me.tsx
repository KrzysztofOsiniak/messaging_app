import { Outlet, useNavigate, useOutletContext } from "react-router-dom";
import styles from './styles/Me.module.scss'
import { useState } from "react";


export default function Me() {
    const { username, users, onlineFriends, directMessagesUpdate, allDirect } = useOutletContext() as { username: string, users: { friendName: string, status: string, id: number}[],
    onlineFriends: string[], directMessagesUpdate: {username: string, message: string, order: number}, allDirect: {friendName: string, order: number}[] };

    const [active, setActive] = useState('Friends');

    const navigate = useNavigate();

    async function handleClick(friendName: string) {
        const { status, id } = await fetch(`http://localhost:8080/direct/users/${friendName}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json());
        if(status == 200) {
            setActive(friendName);
            navigate(`/channels/me/${id}`);
        }
    }

    function handleClickFriends() {
        setActive('Friends');
        navigate('/channels/me');
    }

    return(
        <div className={styles.flexWrapper}>
            <nav className={styles.me}>
                <div className={`${styles.friends} ${active == 'Friends' ? styles.active : ''}`} onClick={handleClickFriends}>
                    Friends
                </div>
                <div className={styles.directMessagesTextBox}>
                    <span className={styles.directMessagesText}> Direct Messages </span>
                </div>
                <Chats allDirect={allDirect} active={active} handleClick={handleClick} onlineFriends={onlineFriends} />
            </nav>
            <Outlet context={ {username: username, users: users, onlineFriends: onlineFriends, directMessagesUpdate: directMessagesUpdate, setActive: setActive} } />
        </div>
    )
}

function Chats({ allDirect, active, handleClick, onlineFriends }: { allDirect: {friendName: string, order: number}[], active: string,
    handleClick(friendName: string): void, onlineFriends: string[]},  ) {
    if(!allDirect) {
        return <></>
    }
    const directList = allDirect.sort((a, b) => b.order - a.order)
    .map(user => 
        <div className={`${styles.user} ${active == user.friendName ? styles.active : ''} ${onlineFriends.includes(user.friendName) ? styles.push : ''}`} onClick={() => handleClick(user.friendName)}>
            <span className={onlineFriends.includes(user.friendName) ? styles.online : ''}> </span>
            <span className={styles.text}> {user.friendName} </span>
        </div>
    )
    return directList
}