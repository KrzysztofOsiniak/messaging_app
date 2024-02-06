import { useLoaderData, useOutletContext, useParams } from "react-router-dom";
import styles from './styles/Direct.module.scss'
import { useEffect, useMemo, useRef, useState } from "react";

export async function loader(id: any) {
    const userId = parseInt(id) as number;

    const {friendName, messages, status, message} = await fetch(`http://localhost:8080/direct/${userId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json());
    if(status != 200) {
        throw new Error(message);
    }

    return {friendName: friendName, messages: messages}
}

export default function Direct() {
    const { onlineFriends, username, directMessagesUpdate } = useOutletContext() as { onlineFriends: string[], username: string,
    directMessagesUpdate: {username: string, message: string, order: number} };

    const { friendName, messages } = useLoaderData() as { friendName: string, messages: {username: string, message: string, order: number}[] };

    const [directMessages, setDirectMessages] = useState(messages);

    const isOnlineFriend = onlineFriends.includes(friendName);

    const input = useRef() as any;

    const isMounted = useRef(false) as any;

    const messagesList = useMemo(() =>
        directMessages.map(message => 
        <div key={message.order} className={styles.usernameText}>
        <div className={styles.usernameText}>
            {message.username}
        </div>
        <div className={styles.usernameText}>
            {message.message}
        </div>
        </div>), [directMessages]);

    const { id }  = useParams() as any;
    const userId = parseInt(id) as number;

    async function handleMessage(e: any) {
        e.preventDefault()
        const messageSent = input.current.value;
        input.current.value = '';
        const { status } = await fetch(`http://localhost:8080/direct/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: messageSent
            })
        })
        .then(response => response.json());
        if(status != 200) {
            console.log('Message not sent');
            return
        }
    }

    useEffect(() => {
        if(!isMounted.current) {
            isMounted.current = true;
            return
        }
        setDirectMessages(directMessages => [...directMessages, directMessagesUpdate])
    }, [directMessagesUpdate]);

    return (
    <div className={styles.direct}>
        <header className={styles.userContainer}>
            <span className={`${isOnlineFriend ? (styles.onlineActive + ' ' + styles.push) : ''}`}> </span>
            <span className={`${styles.usernameText} ${!isOnlineFriend ? styles.push : ''}`}> {friendName} </span>
        </header>
        <div className={styles.messagesContainer}>
            {messagesList}
        </div>
        <div className={styles.inputContainer} onSubmit={handleMessage}>
                <form className={styles.inputForm}>
                    <input ref={input} className={styles.input} type="text" autoComplete="off"/>			
                </form>
        </div>
    </div>
    )
}