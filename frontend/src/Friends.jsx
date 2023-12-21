/* eslint-disable react-refresh/only-export-components */
import { redirect } from 'react-router-dom';
import styles from './styles/Friends.module.scss'
import { useRef, useState } from 'react';

export async function loader() {
    const { logged } = await fetch('http://localhost:8080/home/data', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    if(!logged) {
        return redirect('/login')
    }
    return 0
}

export default function Friends() {
    const [active, setActive] = useState('Add');
    
    const text = useRef('');

    function handleAdd(e) {
        e.preventDefault();
        text.value = '';
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

    function handleClick(option) {
        setActive(option)
    }
    
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
                <Add />
            </div>

        </div>
    )
}