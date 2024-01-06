import { Outlet, useOutletContext } from "react-router-dom";
import styles from './styles/Me.module.scss'


export default function Me() {
    const [users, setUsers] = useOutletContext();

    return(
        <div className={styles.flexWrapper}>
            <nav className={styles.me}>
                <h2>text</h2>
            </nav>
            <Outlet context={[users, setUsers]} />
        </div>
    )
}