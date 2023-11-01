/* eslint-disable react/prop-types */
/* eslint-disable react-refresh/only-export-components */
import { useLoaderData, useNavigate } from "react-router-dom"
import { useState } from 'react';
import './Chat.scss'
import './Chat_logged.scss'

export async function loader() {
    return fetch('http://localhost:8080/home/data', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json());
}

export default function Chat() {
    const navigate = useNavigate();
    const { logged, username } = useLoaderData();
    const [input, setInput] = useState('');
    const [logOut, setLogOut] = useState(0);

    function handleKeyUp(e) {
        if(e.key === 'Enter') {
            setInput('');
        }
    }
    
    async function handleLogOut() {
        const { status } = await fetch('http://localhost:8080/home/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({

            })
        });
        if(status == 200) {
            setLogOut(1);
        }
        /* else error */
    }
    
    if(!logged || logOut) {
        return(
        <div className='not_logged'>
        <header>
            <h1 id="header">Chatting app</h1>
            <button className="login" onClick={() => navigate('/login')}>
                <h1 className="optiontext">Log in</h1>
            </button> 
            <button className="signup" onClick={() => navigate('/signup')}>
                <h1 className="optiontext">Sign up</h1>
            </button>
        </header>
        <h1 className="name">Not logged in</h1>
        <div className="chatbox">
            <div className="chat"></div>
            <input value={input} onKeyUp={(e) => {handleKeyUp(e)}} onChange={(e) => setInput(e.target.value)} className="chatinput" placeholder="Log in to see and type in chat"></input>
        </div>
        </div>
    )}

    else {
        return(
        <div className='logged'>
        <header>
            <h1 id="header">Chatting app</h1>
            <button className="select"><h1 className="optiontext">Select chat</h1></button>
            <button onClick={handleLogOut} className="logout">
                <h1 className="optiontext">Log out</h1>
            </button>
        </header>
        <h1 className="name">{username}</h1>
        <div className="chatbox">
            <div className="chat"><div><div className="chatcontent"></div></div></div>
            <input className="chatinput" placeholder="..."></input>
        </div>
        </div>
    )}
}