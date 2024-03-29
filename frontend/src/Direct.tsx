import { useLoaderData, useOutletContext, useParams } from "react-router-dom";
import styles from './styles/Direct.module.scss'
import { useEffect, useMemo, useRef, useState } from "react";
import menuImg from "./img/menu.svg";

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
    const { onlineFriends, username, directMessagesUpdate, setActive, shouldUpdate, setShouldUpdate, users, menuActive, setMenuActive } = useOutletContext() as { onlineFriends: string[], username: string,
    directMessagesUpdate: {username: string, message: string, order: number}, setActive: any, shouldUpdate: boolean, setShouldUpdate: any, users: { friendName: string, status: string, id: number}[],
    menuActive: number, setMenuActive: any };

    const { friendName, messages } = useLoaderData() as { friendName: string, messages: {username: string, message: string, order: number}[] };

    const [directMessages, setDirectMessages] = useState(messages);

    const isOnlineFriend = onlineFriends.includes(friendName);

    const input = useRef() as any;

    const isMounted = useRef(false) as any;
    const shouldScroll = useRef(false) as any;

    const { id }  = useParams() as any;
    const userId = parseInt(id) as number;
    const friendIsBlocked = useMemo(() => {
        if(users.filter(user => user.friendName == friendName && user.status == 'blocked')[0]) {
            return true
        }
        return false
    },[users]);

    setActive(friendName);

    async function updateMessages() {
        setShouldUpdate(false);
        const { messages, status, message } = await fetch(`http://localhost:8080/direct/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json());
        if(status != 200) {
            throw new Error(message);
        }
        setDirectMessages(messages);
    }

    async function handleBlock(e: any) {
        e.stopPropagation();
        const { status } = await fetch('http://localhost:8080/users/block', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                friendName: friendName
            })
        })
        .then(response => response.json());
        if(status == 200) {
            return
        }
    }

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
        if(status == 403) {
            input.current.value = 'You have blocked or been blocked by this user';
        }
    }

    function handleMenu() {
        return setMenuActive((menuActive: any) => menuActive ? 0 : 1);
    }

    function getMaxScroll(element: any) {
        const scroll = element.scrollTop;
        element.scrollTop = 999999;
        const maxScroll = element.scrollTop;
        element.scrollTop = scroll;

        return maxScroll;
    }

    useEffect(() => {
        const messagesContainer = document.getElementById('messagesContainer') as any;
        if(!isMounted.current) {
            messagesContainer.scrollTop = getMaxScroll(messagesContainer);
            isMounted.current = true;
            return
        }

        if(directMessagesUpdate.username != friendName && directMessagesUpdate.username != username) {
            return
        }
        const repeatedMessage = directMessages.filter(message => message.order == directMessagesUpdate.order);
        if(repeatedMessage[0]) {
            return
        }

        if(messagesContainer.scrollTop == getMaxScroll(messagesContainer)) {
            shouldScroll.current = true;
        }
        setDirectMessages(directMessages => [...directMessages, directMessagesUpdate]);
    }, [directMessagesUpdate]);

    useEffect(() => {
        if(shouldScroll.current) {
            const messagesContainer = document.getElementById('messagesContainer') as any;
            shouldScroll.current = false;
            messagesContainer.scrollTop = getMaxScroll(messagesContainer);
        }
    }, [directMessages]);

    useEffect(() => {
        shouldScroll.current = true;
        setDirectMessages(messages);
    }, [friendName]);

    useEffect(() => {
        updateMessages();
    }, [shouldUpdate]);

    return (
    <div className={styles.direct} onClick={() => {if(menuActive) setMenuActive(0)}}>

        <header className={styles.userContainer}>
            <span className={styles.menu} onClick={handleMenu} > <img src={menuImg} alt="show menu"/> </span>
            <span className={`${isOnlineFriend ? (styles.onlineActive + ' ' + styles.push) : ''}`}> </span>
            <span className={`${styles.usernameText} ${!isOnlineFriend ? styles.push : ''}`}> {friendName} </span>
            <button className={`${styles.blockButton} ${!friendIsBlocked ? styles.active : ''}`} onClick={handleBlock}> {friendIsBlocked ? 'User Blocked' : 'Block User'} </button>
        </header>

        <div className={styles.messagesContainer} id="messagesContainer">
            <Messages directMessages={directMessages} />
        </div>

        <div className={styles.inputContainer} onSubmit={handleMessage}>
                <form className={styles.inputForm}>
                    <input ref={input} className={styles.input} type="text" placeholder={`Message ${friendName}`} autoComplete="off"/>			
                </form>
        </div>

    </div>
    )
}

function Messages({ directMessages }: { directMessages: {username: string, message: string, order: number}[] }) {
    const messagesList = directMessages.sort((a, b) => a.order - b.order)
    .map(message => 
        <div key={message.order} className={styles.messageContainer}>
            <div className={styles.usernameText}>
                {message.username}
            </div>
            <div className={styles.messageText} >
                {message.message}
            </div>
        </div>)
    return <>{messagesList}</>
}