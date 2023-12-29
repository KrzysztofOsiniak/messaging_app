import styles from './styles/Friends.module.scss'
import { useEffect, useRef, useState } from 'react';

import blockImg from "./img/block.svg";
import acceptImg from "./img/accept.svg";
import chatImg from "./img/chat.svg";
import closeImg from "./img/close.svg";
import personRemoveImg from "./img/personRemove.svg";

export async function loader() {
    return 0
}

export default function Friends() {
    const [active, setActive] = useState('Add');
    
    const [users, setUsers] = useState([]);

    const [notificationText, setNotificationText] = useState('Logged In');

    const [notificationColor, setNotificationColor] = useState('green');

    const [refreshCounter, setRefreshCounter] = useState(0);


    async function handleAccept(user) {
        const { message, status } = await fetch('http://localhost:8080/users/addfriend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                friendName: user
            })
        })
        .then(response => response.json());
        if(status == 200) {
            notification(message, 'green');
            return
        }
        if(message) {
            notification(message, 'red');
        }
    }

    async function handleDecline(user) {
        const { message, status } = await fetch('http://localhost:8080/users/declinefriend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                friendName: user
            })
        })
        .then(response => response.json());
        if(status == 200) {
            notification(message, 'green');
            return
        }
        if(message) {
            notification(message, 'red');
        }
    }

    async function handleRemoveFriend(user) {
        const { message, status } = await fetch('http://localhost:8080/users/removefriend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                friendName: user
            })
        })
        .then(response => response.json());
        if(status == 200) {
            notification(message, 'green');
            return
        }
        if(message) {
            notification(message, 'red');
        }
    }

    async function handleBlock(user) {
        const { message, status } = await fetch('http://localhost:8080/users/block', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                friendName: user
            })
        })
        .then(response => response.json());
        if(status == 200) {
            notification(message, 'green');
            return
        }
        if(message) {
            notification(message, 'red');
        }
    }

    async function handleUnBlock(user) {
        const { message, status } = await fetch('http://localhost:8080/users/unblock', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                friendName: user
            })
        })
        .then(response => response.json());
        if(status == 200) {
            notification(message, 'green');
            return
        }
        if(message) {
            notification(message, 'red');
        }
    }
    
    async function handleAdd(e, text) {
        e.preventDefault();
        const { message, status } = await fetch('http://localhost:8080/users/addfriend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                friendName: text.current.value
            })
        })
        .then(response => response.json());
        if(status == 200) {
            notification(message, 'green');
            return
        }
        if(message) {
            notification(message, 'red');
        }
    }

    function notification(message, color) {
        setNotificationText(message);
        setNotificationColor(color);
        setRefreshCounter(counter => counter + 1);
    }

    function handleClick(option) {
        setActive(option)
    }
    
    useEffect(() => { 
        async function get() {
            const { friends } = await fetch('http://localhost:8080/users/friends', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json());
            setUsers(friends);
        }
        get();
    }, []);

    return(
        <div className={styles.friends}>

            <header className={styles.optionsContainer}>
                <span className={styles.friendsText}>Friends</span>

                <button className={ `${styles.option} ${ active == 'Online' && styles.active }` } onClick={() => handleClick('Online')}>
                <span className={styles.optionText}>Online</span>
                </button>

                <button className={ `${styles.option} ${ active == 'All' && styles.active }` } onClick={() => handleClick('All')}>
                <span className={styles.optionText}>All</span>
                </button>

                <button className={ `${styles.option} ${ active == 'Pending' && styles.active }` } onClick={() => handleClick('Pending')}>
                <span className={styles.optionText}>Pending</span>
                </button>

                <button className={ `${styles.option} ${ active == 'Blocked' && styles.active }` } onClick={() => handleClick('Blocked')}>
                <span className={styles.optionText}>Blocked</span>
                </button>

                <button className={ `${styles.option} ${ active == 'Add' && styles.active }` } onClick={() => handleClick('Add')}>
                <span className={styles.optionText}>Add Friend</span>
                </button>
            </header>

            <div className={styles.friendsContainer}>
                <All active={active} users={users} handleRemoveFriend={handleRemoveFriend} handleBlock={handleBlock} />
                <Pending active={active} users={users} handleAccept={handleAccept} handleDecline={handleDecline} handleBlock={handleBlock} />
                <Blocked active={active} users={users} handleUnBlock={handleUnBlock} />
                <Add active={active} handleAdd={handleAdd} />
            </div>

            <div key={refreshCounter} className={`${ notificationColor == 'green' && styles.notificationWrapperGreen } ${notificationColor == 'red' && styles.notificationWrapperRed}`}>
                <div className={styles.notification}>{notificationText}</div>
            </div>

        </div>
    )
}



// eslint-disable-next-line react/prop-types
function All({ active, users, handleRemoveFriend, handleBlock }) {
    if (active == "All") {
        // eslint-disable-next-line react/prop-types
        const listFriends = users.filter(user => user.status == 'friend')
            .map(user =>
                <div key={user.friendname} className={styles.userContainer}>
                    <span className={styles.friendName}> {user.friendname} </span>
                    <button className={`${styles.push} ${styles.friendOption}`}> <img src={chatImg} alt="chat" /> </button>
                    <button className={styles.friendOption} onClick={() => handleRemoveFriend(user.friendname)}> <img src={personRemoveImg} alt="remove friend" /> </button>
                    <button className={styles.friendOption} onClick={() => handleBlock(user.friendname)}> <img src={blockImg} alt="block" /> </button>
                </div>
            );
        return <>{listFriends}</>
    }
    return <></>
}

// eslint-disable-next-line react/prop-types
function Pending({ active, users, handleAccept, handleDecline, handleBlock }) {
    if (active == "Pending") {
        // eslint-disable-next-line react/prop-types
        const listPending = users.filter(user => user.status == 'pending')
            .map(user =>
                <div key={user.friendname} className={styles.userContainer}>
                    <span className={styles.friendName}> {user.friendname} </span>
                    <button className={`${styles.friendOption} ${styles.push}`} onClick={() => handleAccept(user.friendname)}> <img src={acceptImg} alt="accept" /> </button>
                    <button className={styles.friendOption} onClick={() => handleDecline(user.friendname)}> <img src={closeImg} alt="decline" /> </button>
                    <button className={styles.friendOption} onClick={() => handleBlock(user.friendname)}> <img src={blockImg} alt="block" /> </button>
                </div>
            );
        return <>{listPending}</>
    }
    return <></>
}

// eslint-disable-next-line react/prop-types
function Blocked({ active, users, handleUnBlock }) {
    if (active == "Blocked") {
        // eslint-disable-next-line react/prop-types
        const listBlocked = users.filter(user => user.status == 'blocked')
            .map(user =>
                <div key={user.friendname} className={styles.userContainer}>
                    <span className={styles.friendName}> {user.friendname} </span>
                    <button className={`${styles.friendOption} ${styles.push}`} onClick={() => handleUnBlock(user.friendname)}> <img src={personRemoveImg} alt="unblock" /> </button>
                </div>
            );
        return <>{listBlocked}</>
    }
    return <></>
}
function Add({ active, handleAdd }) {
    const text = useRef('');

    if(active == "Add") {
        return (
            <form onSubmit={(e) => handleAdd(e, text)} className={styles.addFriendForm}>
                <input className={styles.addFriendInput} type="text" ref={text} autoComplete="off"/>
                <button className={styles.addFriendButton}>
                    <span className={styles.addFriendText}>Send friend request</span>
                </button>
            </form>
        )
    }
    return <></>
}