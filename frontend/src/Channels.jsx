/* eslint-disable react-refresh/only-export-components */
import { Outlet, redirect } from "react-router-dom";
import styles from './styles/Channels.module.scss'

export async function loader() {
    const { logged, username} = await fetch('http://localhost:8080/home/data', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json());
    if(!logged) {
        return redirect('/login')
    }
    return {username: username}
}

export default function Channels() {

    return(
        <div>
            <nav className={styles.channels}>
                <h2>text</h2>
            </nav>
            <Outlet />
        </div>
    )

}