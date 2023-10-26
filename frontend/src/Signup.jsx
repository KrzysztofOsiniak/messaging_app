/* eslint-disable react-refresh/only-export-components */
import {redirect, useLoaderData} from "react-router-dom"
import './Signup.scss'

export async function loader() {
    return fetch('http://localhost:8080/home/data', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json());
}

export default function Signup() {
    const { logged } = useLoaderData();
    if(logged) {
        redirect('')
    }
    return(
        <div className="signupNest">
            <div className="container">
                <form className="login">
                    <input id="name" type="text" placeholder="Username"/>
                    <input id="password" type="password" placeholder="Password"/>
                    <button className="send">
                        <h1>Sign Up</h1>
                    </button>				
                </form>
            </div>
        </div>
    )
}