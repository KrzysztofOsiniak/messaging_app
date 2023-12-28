import { useRef } from "react";
import { redirect, useNavigate } from "react-router-dom"
import styles from './styles/Login.module.scss'

export async function loader() {
    const { logged } = await fetch('http://localhost:8080/users/logged', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json());
    if(logged) {
        return redirect('/channels')
    }
    return null;
}

export default function Login() {
    const navigate = useNavigate();
    const usernameRef = useRef();
    const passwordRef = useRef();
    
    function handleOnClick(e) {
        e.preventDefault();
        fetch('http://localhost:8080/users/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: usernameRef.current.value, password: passwordRef.current.value
        })
        })
        .then(response => response.json())
        .then(result => {
            if(result.status == 200) {
                navigate('/channels/me');
            } else if(result.status == 500) {
                alert("unknown server error occurred");
            }
        })
        .catch(error => {
            console.error(error);
        });
    }

    return(
            <div className={styles.container}>
                <form className={styles.login}>
                    <input ref={usernameRef} className={styles.name} type="text" placeholder="Username" autoComplete="off"/>
                    <input ref={passwordRef} className={styles.password} type="password" placeholder="Password"/>
                    <button className={styles.send} onClick={handleOnClick}>
                        <h1>Log In</h1>
                    </button>				
                </form>
            </div>
    )
}