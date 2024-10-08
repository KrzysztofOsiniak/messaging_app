import styles from './styles/Friends.module.scss'
import { useEffect, useRef, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import blockImg from "./img/block.svg";
import acceptImg from "./img/accept.svg";
import chatImg from "./img/chat.svg";
import closeImg from "./img/close.svg";
import personRemoveImg from "./img/personRemove.svg";
import menuImg from "./img/menu.svg";


export default function Friends() {
    const {users, onlineFriends, setActive: setActiveChat, menuActive, setMenuActive} = useOutletContext() as { users: {friendName: string, status: string, id: number, notification: 1 | 0}[],
    onlineFriends: string[], setActive: any, menuActive: number, setMenuActive: any };

    const whichActive = onlineFriends[0] ? 'Online' : 'Add';

    const [active, setActive] = useState(whichActive);

    const [notificationText, setNotificationText] = useState('');

    const [notificationColor, setNotificationColor] = useState('');

    const [refreshCounter, setRefreshCounter] = useState(0);

    const [pendingNotification, setPendingNotification] = useState(() => !users.every(user => user.notification == 0));

    const isMounted = useRef(0);

    const navigate = useNavigate();


    function handleMessage(id: number) {
        navigate(`/channels/me/${id}`);
    }

    async function handleAccept(e: any, user: string) {
        e.stopPropagation();
        const { message, status } = await fetch('/api/users/addfriend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                friendName: user
            })
        })
        .then(response => response.json());
        if(status == 200) {
            notification(message, 'green');
            return
        }
        if(message) {
            notification(message, 'red');
        }
    }

    async function handleDecline(e: any, user: string) {
        e.stopPropagation();
        const { message, status } = await fetch('/api/users/declinefriend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                friendName: user
            })
        })
        .then(response => response.json());
        if(status == 200) {
            notification(message, 'green');
            return
        }
        if(message) {
            notification(message, 'red');
        }
    }

    async function handleRemove(e: any, user: string) {
        e.stopPropagation();
        const { message, status } = await fetch('/api/users/removefriend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                friendName: user
            })
        })
        .then(response => response.json());
        if(status == 200) {
            notification(message, 'green');
            return
        }
        if(message) {
            notification(message, 'red');
        }
    }

    async function handleBlock(e: any, user: string) {
        e.stopPropagation();
        const { message, status } = await fetch('/api/users/block', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                friendName: user
            })
        })
        .then(response => response.json());
        if(status == 200) {
            notification(message, 'green');
            return
        }
        if(message) {
            notification(message, 'red');
        }
    }

    async function handleUnBlock(e: any, user: string) {
        e.stopPropagation();
        const { message, status } = await fetch('/api/users/unblock', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                friendName: user
            })
        })
        .then(response => response.json());
        if(status == 200) {
            notification(message, 'green');
            return
        }
        if(message) {
            notification(message, 'red');
        }
    }
    
    async function handleAdd(e: any, text: any) {
        e.preventDefault();
        const { message, status } = await fetch('/api/users/addfriend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                friendName: text.current.value
            })
        })
        .then(response => response.json());
        if(status == 200) {
            notification(message, 'green');
            return
        }
        if(message) {
            notification(message, 'red');
        }
    }

    function notification(message: string, color: string) {
        setNotificationText(message);
        setNotificationColor(color);
        setRefreshCounter(counter => counter + 1);
    }

    function handleClick(option: string) {
        setActive(option)
    }

    function handleMenu() {
        return setMenuActive((menuActive: any) => menuActive ? 0 : 1);
    }

    useEffect(() => {
        if(active != 'Pending') {
            return
        }
        if(!users.filter(user => user.status == 'pending')[0]) {
            return
        }
        fetch('/api/users/notification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }, [active]);

    useEffect(() => {
        setPendingNotification(() => !users.every(user => user.notification == 0));
        if(users.every(user => user.notification == 0)) {
            return
        }
        if(active == 'Pending') {
            fetch('/api/users/notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
    }, [users]);

    useEffect(() => {
        if(!isMounted.current) {
            setActiveChat('Friends');
            isMounted.current = 1;
        }
    }, [])

    return(
        <div className={styles.friends} onClick={() => {if(menuActive) setMenuActive(0)}}>

            <header className={styles.optionsContainer}>
                <span className={styles.menu} onClick={handleMenu} > <img src={menuImg} alt="show menu"/> </span>
                <span className={styles.friendsText}>Friends</span>

                <button className={ `${styles.option} ${ active == 'Online' && styles.active }` } onClick={() => handleClick('Online')}>
                <span className={styles.optionText}>Online</span>
                </button>

                <button className={ `${styles.option} ${ active == 'All' && styles.active }` } onClick={() => handleClick('All')}>
                <span className={styles.optionText}>All</span>
                </button>

                <button className={ `${styles.option} ${ active == 'Pending' && styles.active }` } onClick={() => handleClick('Pending')}>
                <span className={`${styles.optionText} ${pendingNotification ? styles.pendingNotification : ''}`}>Pending</span>
                </button>

                <button className={ `${styles.option} ${ active == 'Blocked' && styles.active }` } onClick={() => handleClick('Blocked')}>
                <span className={styles.optionText}>Blocked</span>
                </button>

                <button className={ `${styles.option} ${ active == 'Add' && styles.active }` } onClick={() => handleClick('Add')}>
                <span className={styles.optionText}>Add Friend</span>
                </button>
            </header>

            <div className={styles.friendsContainer}>
                <Online active={active} users={users} onlineFriends={onlineFriends} handleRemove={handleRemove} handleBlock={handleBlock} handleMessage={handleMessage} />
                <All active={active} users={users} handleRemove={handleRemove} handleBlock={handleBlock} handleMessage={handleMessage} />
                <Pending active={active} users={users} handleAccept={handleAccept} handleDecline={handleDecline} handleBlock={handleBlock} handleMessage={handleMessage} />
                <Blocked active={active} users={users} handleUnBlock={handleUnBlock} handleMessage={handleMessage} />
                <Add active={active} handleAdd={handleAdd} />
            </div>

            <div key={refreshCounter} className={`${ notificationColor == 'green' ? styles.notificationWrapperGreen : ''} ${!refreshCounter ? styles.hide : ''}
            ${notificationColor == 'red' ? styles.notificationWrapperRed : ''}`}>
                <div className={styles.notification}>{notificationText}</div>
            </div>

        </div>
    )
}


// eslint-disable-next-line react/prop-types
function Online({ active, users, onlineFriends, handleRemove, handleBlock, handleMessage }: {active: string, users: {friendName: string, status: string, id: number}[],
    onlineFriends: string[], handleRemove(e: any, user: string): Promise<void>, handleBlock(e: any, user: string): Promise<void>, handleMessage(id: number): void}) {
    if(active != "Online") {
        return <></>
    }            
    // eslint-disable-next-line react/prop-types
    const listOnlineFriends = users.filter(user => onlineFriends.includes(user.friendName))
    .map(user =>
        <div key={user.friendName} className={styles.userContainer} onClick={() => handleMessage(user.id)}>
            <span className={styles.onlineActive}> </span>
            <span className={styles.friendName}> {user.friendName} </span>
            <button className={`${styles.push} ${styles.friendOption}`} title='Open Chat'> <img src={chatImg} alt="chat" /> </button>
            <button className={styles.friendOption} onClick={(e) => handleRemove(e, user.friendName)} title='Remove Friend'> <img src={personRemoveImg} alt="remove friend" /> </button>
            <button className={styles.friendOption} onClick={(e) => handleBlock(e, user.friendName)} title='Remove And Block Friend'> <img src={blockImg} alt="block" /> </button>
        </div>
    );
    return <>{listOnlineFriends}</>
}

// eslint-disable-next-line react/prop-types
function All({ active, users, handleRemove, handleBlock, handleMessage }: {active: string, users: {friendName: string, status: string, id: number}[],
    handleRemove(e: any, user: string): Promise<void>, handleBlock(e: any, user: string): Promise<void>, handleMessage(id: number): void}) {
    if(active != "All") {
        return <></>
    }
    
    // eslint-disable-next-line react/prop-types
    const listFriends = users.filter(user => user.status == 'friend')
    .map(user =>
        <div key={user.friendName} className={styles.userContainer} onClick={() => handleMessage(user.id)}>
            <span className={styles.friendName}> {user.friendName} </span>
            <button className={`${styles.push} ${styles.friendOption}`} title='Open Chat'> <img src={chatImg} alt="chat" /> </button>
            <button className={styles.friendOption} onClick={(e) => handleRemove(e, user.friendName)} title='Remove Friend'> <img src={personRemoveImg} alt="remove friend" /> </button>
            <button className={styles.friendOption} onClick={(e) => handleBlock(e, user.friendName)} title='Remove And Block Friend'> <img src={blockImg} alt="block" /> </button>
        </div>
    );
    return <>{listFriends}</>
}

// eslint-disable-next-line react/prop-types
function Pending({ active, users, handleAccept, handleDecline, handleBlock, handleMessage }: {active: string, users: {friendName: string, status: string, id: number, notification: 1 | 0}[],
    handleAccept(e: any, user: string): Promise<void>, handleDecline(e: any, user: string): Promise<void>, handleBlock(e: any, user: string): Promise<void>,
    handleMessage(id: number): void}) {
    if(active != "Pending") {
        return <></>
    }
    // eslint-disable-next-line react/prop-types
    const listPending = users.filter(user => user.status == 'pending')
    .map(user =>
        <div key={user.friendName} className={styles.userContainer} onClick={() => handleMessage(user.id)}>
            <span className={styles.friendName}> {user.friendName} </span>
            <button className={`${styles.friendOption} ${styles.push}`} onClick={(e) => handleAccept(e, user.friendName)} title='Accept Friend Request'> <img src={acceptImg} alt="accept" /> </button>
            <button className={styles.friendOption} onClick={(e) => handleDecline(e, user.friendName)} title='Decline Friend Request'> <img src={closeImg} alt="decline" /> </button>
            <button className={styles.friendOption} onClick={(e) => handleBlock(e, user.friendName)} title='Block User'> <img src={blockImg} alt="block" /> </button>
        </div>
    );
    return <>{listPending}</>
}

// eslint-disable-next-line react/prop-types
function Blocked({ active, users, handleUnBlock, handleMessage }: {active: string, users: {friendName: string, status: string, id: number}[],
    handleUnBlock(e: any, user: string): Promise<void>, handleMessage(id: number): void}) {
    if(active != "Blocked") {
        return <></>
    }
    // eslint-disable-next-line react/prop-types
    const listBlocked = users.filter(user => user.status == 'blocked')
    .map(user =>
        <div key={user.friendName} className={styles.userContainer} onClick={() => handleMessage(user.id)}>
            <span className={styles.friendName}> {user.friendName} </span>
            <button className={`${styles.friendOption} ${styles.push}`} onClick={(e) => handleUnBlock(e, user.friendName)} title='Unblock User'> <img src={personRemoveImg} alt="unblock" /> </button>
        </div>
    );
    return <>{listBlocked}</>
}
function Add({ active, handleAdd }: {active: string, handleAdd(e: any, user: string): Promise<void>}) {
    if(active != "Add") {
        return <></>
    }
    const text = useRef('') as any;
    return (
        <form onSubmit={(e) => handleAdd(e, text)} className={styles.addFriendForm}>
            <input className={styles.addFriendInput} type="text" ref={text} autoComplete="off"/>
            <button className={styles.addFriendButton}>
                <span className={styles.addFriendText}>Send friend request</span>
            </button>
        </form>
    )
}