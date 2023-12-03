/* eslint-disable react-refresh/only-export-components */
import { Outlet, redirect } from "react-router-dom";
import styles from './styles/Me.module.scss'

export async function loader() {
    const { logged } = await fetch('http://localhost:8080/home/data', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json());
    if(!logged) {
        return redirect('/login')
    }
    return 0
}

export default function Me() {

    return(
        <div className={styles.me}>
            <nav id={styles.contacts}>
                <h2>text</h2>
            </nav>
            <Outlet />
        </div>
    )

}