import { useRef, useState } from "react";
import { redirect, useNavigate } from "react-router-dom"
import styles from './styles/Signup.module.scss'

export async function loader() {
    const { logged } = await fetch('/api/users/logged', {
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
    const [usernameMessage, setUsernameMessage] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');
    
    async function handleOnClick(e: any) {
        e.preventDefault();
        const regtest = new RegExp(/[^ -~]/g);
        const username = usernameRef.current.value.trim();
        let shouldReturn = false;
        if(!passwordRef.current.value) {
            setPasswordMessage('Password Is Empty');
            shouldReturn = true;
        }
        else {
            setPasswordMessage('');
        }

        if(username.length > 19) {
            return setUsernameMessage('Username Too Long');
        }
        if(!username) {
            return setUsernameMessage('Username Is Empty');
        }
        if(regtest.test(username)) {
            return setUsernameMessage('Use Only Basic Special Characters');
        }
        else {
            setUsernameMessage('');
        }

        if(shouldReturn) return

        const { status, message } = await fetch('/api/users/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username, password: passwordRef.current.value
        })
        })
        .then(response => response.json())
        .catch(error => {
            console.error(error);
        });
        
        if(status == 200) {
            return navigate('/channels/me');
        }
        if(message == 'user already exists') {
            setUsernameMessage('User Already Exists');
        }
    }

    return(
        <div className={styles.bodyContainer}>
            <div className={styles.container}>
                <form className={styles.login}>
                    <input ref={usernameRef} className={styles.name} type="text" placeholder="Username" autoComplete="off"/>
                    <span className={styles.errorMessage}> {usernameMessage} </span>
                    <span className={!usernameMessage ? styles.push : ''}></span>
                    <input ref={passwordRef} className={styles.password} type="password" placeholder="Password"/>
                    <span className={styles.errorMessage}> {passwordMessage} </span>
                    <span className={!passwordMessage ? styles.push : ''}></span>
                    <button className={styles.send} onClick={handleOnClick}>
                        <span>Sign Up</span>
                    </button>				
                </form>
            </div>
        </div>
    )
}