import { Outlet } from "react-router-dom";
import styles from './styles/Me.module.scss'

export async function loader() {
    return 0
}

export default function Me() {
    return(
        <div>
            <nav className={styles.me}>
                <h2>text</h2>
            </nav>
            <Outlet />
        </div>
    )
}