import { redirect, useNavigate } from "react-router-dom";
import styles from './styles/HomePage.module.scss'

export async function loader() {
    const { logged } = await fetch('/api/users/logged', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json());
    if(logged) {
        return redirect('/channels/me')
    }
    return 0
}

export default function HomePage() {
    const navigate = useNavigate();

    return (
        <div className={styles.container}>
            <div className={styles.buttonsContainer}>
                <button className={styles.optionButton} onClick={() => navigate('/login')}> Log In </button>
                <button className={`${styles.optionButton} ${styles.push}`} onClick={() => navigate('/signup')}> Sign Up </button>
            </div>
        </div>
    )
}