/* eslint-disable react-refresh/only-export-components */
import { redirect } from 'react-router-dom';
import styles from './styles/Friends.module.scss'

export async function loader() {
    const { logged } = await fetch('http://localhost:8080/home/data', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if(!logged) {
        return redirect('/login')
    }
    return 0
}

export default function Friends() {

    return(
        <div className={styles.friends}>
            <header >
                <h2>Friends</h2>
                <button>

                </button>
                <button>

                </button>
                <button>

                </button>
                <button>

                </button>
                <button>

                </button>
            </header>
        </div>
    )
}