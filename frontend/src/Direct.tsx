import { useLoaderData, useOutletContext, useParams, redirect } from "react-router-dom";
import styles from './styles/Direct.module.scss'
import { useEffect, useMemo, useRef, useState } from "react";
import menuImg from "./img/menu.svg";

export async function loader(id: any) {
    const { logged } = await fetch('/api/users/logged', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json());
    if(!logged) {
        return redirect('/')
    }
    const userId = parseInt(id) as number;

    const {friendName, messages, status, message} = await fetch(`/api/direct/${userId}`, {
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
    directMessagesUpdate: {username: string, message: string, order: number, date: number}, setActive: any, shouldUpdate: boolean, setShouldUpdate: any, users: { friendName: string, status: string, id: number}[],
    menuActive: number | undefined, setMenuActive: any };

    const { friendName, messages } = useLoaderData() as { friendName: string, messages: {username: string, message: string, order: number, date: number}[] };

    const [directMessages, setDirectMessages] = useState(messages);

    const [refreshCounter, setRefreshCounter] = useState(0);

    const isOnlineFriend = onlineFriends.includes(friendName);

    const input = useRef() as any;

    const isMounted = useRef(false) as any;
    const isMounted2 = useRef(false) as any;
    const isMounted3 = useRef(false) as any;
    const isMounted4 = useRef(false) as any;
    const isMounted5 = useRef(false) as any;
    const shouldScroll = useRef(false) as any;
    const updating = useRef(false) as any;

    const { id }  = useParams() as any;
    const userId = parseInt(id) as number;
    const friendIsBlocked = useMemo(() => {
        if(users.filter(user => user.friendName == friendName && user.status == 'blocked')[0]) {
            return true
        }
        return false
    },[users]);


    setTimeout(() => {
        setRefreshCounter(counter => counter+1);
    }, 1000*60);

    async function updateMessages() {
        setShouldUpdate(false);
        if(updating.current || !shouldUpdate) {
            return
        }
        updating.current = true;
        const { messages, status, message } = await fetch(`/api/direct/${userId}`, {
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
        updating.current = false;
    }

    async function handleBlock(e: any) {
        e.stopPropagation();
        const { status } = await fetch('/api/users/block', {
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
        const { status } = await fetch(`/api/direct/${userId}`, {
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
        const messagesContainer = typeof menuActive == 'undefined' ? document.getElementById('messagesContainer') : document.getElementById('messagesContainerMobile') as any;
        if(!isMounted.current) {
            messagesContainer.scrollTop = getMaxScroll(messagesContainer);
            isMounted.current = true;
            fetch('/api/direct/notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    friendName: friendName
                })
            });
            return
        }

        if(!directMessagesUpdate) {
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
        if(directMessagesUpdate.username == friendName) {
            fetch('/api/direct/notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    friendName: friendName
                })
            });
        }
    }, [directMessagesUpdate]);

    useEffect(() => {
        if(!isMounted2.current) {
            isMounted2.current = true;
            return
        }
        if(shouldScroll.current) {
            const messagesContainer = typeof menuActive == 'undefined' ? document.getElementById('messagesContainer') : document.getElementById('messagesContainerMobile') as any;
            shouldScroll.current = false;
            messagesContainer.scrollTop = getMaxScroll(messagesContainer);
        }
    }, [directMessages]);

    useEffect(() => {
        if(!isMounted3.current) {
            isMounted3.current = true;
            return
        }
        fetch('/api/direct/notification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                friendName: friendName
            })
        });
        shouldScroll.current = true;
        setDirectMessages(messages);
    }, [friendName]);

    useEffect(() => {
        if(!isMounted4.current) {
            isMounted4.current = true;
            return
        }
        updateMessages();
    }, [shouldUpdate]);

    useEffect(() => {
        if(!isMounted5.current) {
            setActive(friendName);
            isMounted5.current = true;
        }
    }, []);

    return (
    <div className={styles.direct} onClick={() => {if(menuActive) setMenuActive(0)}}>

        <header className={styles.userContainer}>
            <span className={styles.menu} onClick={handleMenu} > <img src={menuImg} alt="show menu"/> </span>
            <span className={`${isOnlineFriend ? (styles.onlineActive + ' ' + styles.push) : ''}`}> </span>
            <span className={`${styles.usernameText} ${!isOnlineFriend ? styles.push : ''}`}> {friendName} </span>
            <button className={`${styles.blockButton} ${!friendIsBlocked ? styles.active : ''}`} onClick={handleBlock}> {friendIsBlocked ? 'User Blocked' : 'Block User'} </button>
        </header>

        <div className={styles.messagesContainer} id={typeof menuActive == 'undefined' ? 'messagesContainer' : 'messagesContainerMobile'}>
            <Messages key={refreshCounter} directMessages={directMessages} />
        </div>

        <div className={styles.inputContainer} onSubmit={handleMessage}>
                <form className={styles.inputForm}>
                    <input ref={input} className={styles.input} type="text" placeholder={`Message ${friendName}`} autoComplete="off"/>			
                </form>
        </div>

    </div>
    )
}

function Messages({ directMessages }: { directMessages: {username: string, message: string, order: number, date: number}[] }) {
    const currentDate = new Date();
    const messagesList = directMessages.sort((a, b) => a.order - b.order)
    .map(message => {
        let date;
        const messageDate = new Date(message.date * 1000);
        if(messageDate.getMonth() == currentDate.getMonth() && messageDate.getFullYear() == currentDate.getFullYear()) {
            if(currentDate.getDate() - messageDate.getDate() == 1) {
                date = `Yesterday at ${messageDate.getHours() < 10 ? '0' : ''}${messageDate.getHours()}:${messageDate.getMinutes() < 10 ? '0' : ''}${messageDate.getMinutes()}`;
            }
            else if(currentDate.getDate() - messageDate.getDate() == 0) {
                date = `Today at ${messageDate.getHours() < 10 ? '0' : ''}${messageDate.getHours()}:${messageDate.getMinutes() < 10 ? '0' : ''}${messageDate.getMinutes()}`;
            }
            else {
                date = `${messageDate.getDate() < 10 ? '0' : ''}${messageDate.getDate()}/${messageDate.getMonth()+1 < 10 ? '0' : ''}${messageDate.getMonth()+1}/${messageDate.getFullYear()} 
                ${messageDate.getHours() < 10 ? '0' : ''}${messageDate.getHours()}:${messageDate.getMinutes() < 10 ? '0' : ''}${messageDate.getMinutes()}`;
            }
        }
        else {
            date = `${messageDate.getDate() < 10 ? '0' : ''}${messageDate.getDate()}/${messageDate.getMonth()+1 < 10 ? '0' : ''}${messageDate.getMonth()+1}/${messageDate.getFullYear()} 
            ${messageDate.getHours() < 10 ? '0' : ''}${messageDate.getHours()}:${messageDate.getMinutes() < 10 ? '0' : ''}${messageDate.getMinutes()}`;
        }
        return (
        <div key={message.order} className={styles.messageContainer}>
            <div>
                <span className={styles.usernameText}> {message.username} </span>
                <span className={styles.dateText}> {date} </span>
            </div>
            
            <div className={styles.messageText} >
                {message.message}
            </div>
        </div>
        )
    })
    return <>{messagesList}</>
}