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
    
    const text = useRef('');

    const [users, setUsers] = useState([]);

    // eslint-disable-next-line react/prop-types
    function All({ users }) {
        if(active == "All") {
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
    function Pending({ users }) {
        if(active == "Pending") {
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
    function Blocked({ users }) {
        if(active == "Blocked") {
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

    function Add() {
        if(active == "Add") {
            return (
                <form onSubmit={handleAdd} className={styles.addFriendForm}>
                    <input className={styles.addFriendInput} type="text" ref={text} autoComplete="off"/>
                    <button className={styles.addFriendButton}>
                        <span className={styles.addFriendText}>Send friend request</span>
                    </button>
                </form>
            )
        }
        return <></>
    }

    async function handleAccept(user) {
        const { status } = await fetch('http://localhost:8080/users/addfriend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                friendName: user
            })
        })
        .then(response => response.json());
    }

    async function handleDecline(user) {
        const { status } = await fetch('http://localhost:8080/users/declinefriend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                friendName: user
            })
        })
        .then(response => response.json());
    }

    async function handleRemoveFriend(user) {
        const { status } = await fetch('http://localhost:8080/users/removefriend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                friendName: user
            })
        })
        .then(response => response.json());
    }

    async function handleBlock(user) {
        const { status } = await fetch('http://localhost:8080/users/block', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                friendName: user
            })
        })
        .then(response => response.json());
    }

    async function handleUnBlock(user) {
        const { status } = await fetch('http://localhost:8080/users/unblock', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                friendName: user
            })
        })
        .then(response => response.json());
    }
    
    async function handleAdd(e) {
        e.preventDefault();
        const { status } = await fetch('http://localhost:8080/users/addfriend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                friendName: text.current.value
            })
        })
        .then(response => response.json());
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

                <button className={ `${styles.option} ${ (active == 'Online') && styles.active }` } onClick={() => handleClick('Online')}>
                <span className={styles.optionText}>Online</span>
                </button>

                <button className={ `${styles.option} ${ (active == 'All') && styles.active }` } onClick={() => handleClick('All')}>
                <span className={styles.optionText}>All</span>
                </button>

                <button className={ `${styles.option} ${ (active == 'Pending') && styles.active }` } onClick={() => handleClick('Pending')}>
                <span className={styles.optionText}>Pending</span>
                </button>

                <button className={ `${styles.option} ${ (active == 'Blocked') && styles.active }` } onClick={() => handleClick('Blocked')}>
                <span className={styles.optionText}>Blocked</span>
                </button>

                <button className={ `${styles.option} ${ (active == 'Add') && styles.active }` } onClick={() => handleClick('Add')}>
                <span className={styles.optionText}>Add Friend</span>
                </button>
            </header>

            <div className={styles.friendsContainer}>
                <All users={users} />
                <Pending users={users} />
                <Blocked users={users} />
                <Add />
            </div>

        </div>
    )
}