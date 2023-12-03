/* eslint-disable react-refresh/only-export-components */
import { useRef } from "react";
import { redirect, useNavigate } from "react-router-dom"
import styles from './styles/Signup.module.scss'

export async function loader() {
    const { logged } = await fetch('http://localhost:8080/home/data', {
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
    const usernameRef = useRef();
    const passwordRef = useRef();
    
    function handleOnClick(e) {
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
                navigate('/');
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
                    <input ref={usernameRef} id={styles.name} type="text" placeholder="Username"/>
                    <input ref={passwordRef} id={styles.password} type="password" placeholder="Password"/>
                    <button className={styles.send} onClick={(e) => handleOnClick(e)}>
                        <h1>Sign Up</h1>
                    </button>				
                </form>
            </div>
    )
}