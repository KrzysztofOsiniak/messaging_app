import { useRef } from "react";
import { redirect, useNavigate } from "react-router-dom"
import styles from './styles/Signup.module.scss'

export async function loader() {
    const { logged } = await fetch('http://localhost:8080/users/logged', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json());
    if(logged) {
        return redirect('/')
    }
    return null;
}

export default function Signup() {
    const navigate = useNavigate();
    const usernameRef = useRef() as any;
    const passwordRef = useRef() as any;
    
    function handleOnClick(e: any) {
        e.preventDefault();
        fetch('http://localhost:8080/users/signup', {
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
                        <h1>Sign Up</h1>
                    </button>				
                </form>
            </div>
    )
}