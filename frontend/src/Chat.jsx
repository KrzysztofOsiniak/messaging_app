/* eslint-disable react/prop-types */
/* eslint-disable react-refresh/only-export-components */
import { redirect, useLoaderData, useNavigate } from "react-router-dom"
import './Chat.scss'

export async function loader() {
    const { logged, username } = await fetch('http://localhost:8080/home/data', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json());
    if(!logged) {
        return redirect('/login')
    }
    return {logged: logged, username: username};
}

export default function Chat() {
    const navigate = useNavigate();
    const { username } = useLoaderData();
    
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
            navigate('/login');
        }
        /* else error */
    }
    
    return(
        <div className='chatNest'>
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
    )
}