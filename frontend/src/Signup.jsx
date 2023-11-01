/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect } from "react";
import { redirect, useNavigate } from "react-router-dom"
import './Signup.scss'

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
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [logged, setLogged] = useState(0);
    
    function handleOnClick(e) {
        e.preventDefault();
        fetch('http://localhost:8080/users/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
        username: username, password: password
        })
        })
        .then(response => response.json())
        .then(result => {
            if(result.status == 200) {
                setLogged(1)
            } else if(result.status == 500) {
                alert("unknown server error occurred");
            }
        })
        .catch(error => {
            console.error(error);
        });
        }

    useEffect(() => {
        if(logged) {
            navigate('/');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [logged]);

    return(
        <div className="signupNest">
            <div className="container">
                <form className="login">
                    <input value={username} onChange={(e) => setUsername(e.target.value)} id="name" type="text" placeholder="Username"/>
                    <input value={password} onChange={(e) => setPassword(e.target.value)} id="password" type="password" placeholder="Password"/>
                    <button className="send" onClick={(e) => handleOnClick(e)}>
                        <h1>Sign Up</h1>
                    </button>				
                </form>
            </div>
        </div>
    )
}