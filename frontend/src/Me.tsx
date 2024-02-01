import { Outlet, useOutletContext } from "react-router-dom";
import styles from './styles/Me.module.scss'


export default function Me() {
    const [users, onlineFriends] = useOutletContext() as [{friendName: string, status: string}[], string[]];

    return(
        <div className={styles.flexWrapper}>
            <nav className={styles.me}>
                <h2>text</h2>
            </nav>
            <Outlet context={[users, onlineFriends]} />
        </div>
    )
}