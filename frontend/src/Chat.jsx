/* eslint-disable react/prop-types */
/* eslint-disable react-refresh/only-export-components */
import {useLoaderData} from "react-router-dom"
import {Link} from "react-router-dom"
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
    const { logged } = useLoaderData();
    if(!logged) {
        return(
        <div className='not_logged'>
        <header>
            <h1 id="header">Chatting app</h1>
            <button className="login">
                <h1 className="optiontext">
                <Link style={{ color: 'inherit', textDecoration: 'inherit'}} to={`signup`}>Log in</Link>
                </h1></button> 
            <button className="signup">
                <h1 className="optiontext">
                    <Link style={{ color: 'inherit', textDecoration: 'inherit'}} to={`signup`}>Sign up</Link>
                </h1></button>
        </header>
        <h1 className="name">Not logged in</h1>
        <div className="chatbox">
            <div className="chat"></div>
            <input className="chatinput" placeholder="Log in to see and type in chat"></input>
        </div>
        </div>
    )}
    else {
        return(
        <div className='logged'>
        <header>
            <h1 id="header">Chatting app</h1>
            <button className="select"><h1 className="optiontext">Select chat</h1></button>
            <button className="logout"><h1 className="optiontext">Log out</h1></button>
        </header>
        <h1 className="name"></h1>
        <div className="chatbox">
            <div className="chat"><div><div className="chatcontent"></div></div></div>
            <input className="chatinput" placeholder="..."></input>
        </div>
        </div>
    )}
}