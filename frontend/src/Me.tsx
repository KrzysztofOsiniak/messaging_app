import { Outlet, useOutletContext } from "react-router-dom";
import styles from './styles/Me.module.scss'


export default function Me() {
    const { username, users, onlineFriends, directMessagesUpdate } = useOutletContext() as { username: string,
    users: { friendName: string, status: string, id: number}[], onlineFriends: string[], directMessagesUpdate: {username: string, message: string, order: number} };

    return(
        <div className={styles.flexWrapper}>
            <nav className={styles.me}>
                <h2>text</h2>
            </nav>
            <Outlet context={ {username: username, users: users, onlineFriends: onlineFriends, directMessagesUpdate: directMessagesUpdate} } />
        </div>
    )
}