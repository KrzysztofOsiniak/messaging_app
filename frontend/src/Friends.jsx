/* eslint-disable react-refresh/only-export-components */
import { redirect } from 'react-router-dom';
import styles from './styles/Friends.module.scss'

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

    return(
        <div className={styles.friends}>
            <header className={styles.optionsContainer}>
                <span className={styles.friendsText}>Friends</span>
                <button className={styles.option}>
                <span className={styles.optionText}>Online</span>
                </button>
                <button className={styles.option}>
                <span className={styles.optionText}>All</span>
                </button>
                <button className={styles.option}>
                <span className={styles.optionText}>Pending</span>
                </button>
                <button className={styles.option}>
                <span className={styles.optionText}>Blocked</span>
                </button>
                <button className={styles.option}>
                <span className={styles.optionText}>Add Friend</span>
                </button>
            </header>
            <div>
            </div>
        </div>
    )
}