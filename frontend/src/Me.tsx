import { Outlet, useNavigate, useOutletContext } from "react-router-dom";
import styles from './styles/Me.module.scss'
import { useEffect, useRef, useState } from "react";
import menuImg from "./img/menu.svg";


export default function Me() {
    const { username, users, onlineFriends, directMessagesUpdate, allDirect, shouldUpdate, setShouldUpdate } = useOutletContext() as { username: string, users: { friendName: string, status: string, id: number}[],
    onlineFriends: string[], directMessagesUpdate: {username: string, message: string, order: number}, allDirect: {friendName: string, order: number}[], shouldUpdate: boolean, setShouldUpdate: any };

    const [active, setActive] = useState('Friends');
    const [menuActive, setMenuActive] = useState(0);
    const isMounted = useRef(0) as any;
    const [hideActive, setHideActive] = useState(1);

    const navigate = useNavigate();

    async function handleClick(friendName: string) {
        const { status, id } = await fetch(`http://localhost:8080/direct/users/${friendName}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json());
        if(status == 200) {
            setActive(friendName);
            setMenuActive(0);
            navigate(`/channels/me/${id}`);
        }
    }

    function handleClickFriends() {
        setActive('Friends');
        setMenuActive(0);
        navigate('/channels/me');
    }

    function handleMenu() {
        return setMenuActive((menuActive: any) => menuActive ? 0 : 1);
    }

    useEffect(() => {
        if(!isMounted.current) {
            isMounted.current = 1;
            return
        }
        if(hideActive) {
            setHideActive(0);
        }
    }, [menuActive]);

    return(
        <>
        <div className={styles.flexWrapper}>
            <nav className={styles.me}>
                <div className={`${styles.friends} ${active == 'Friends' ? styles.active : ''}`} onClick={handleClickFriends}>
                    Friends
                </div>
                <div className={styles.directMessagesTextBox}>
                    <span className={styles.directMessagesText}> Direct Messages </span>
                </div>
                <Chats allDirect={allDirect} active={active} handleClick={handleClick} onlineFriends={onlineFriends} />
            </nav>
            <Outlet context={ {username: username, users: users, onlineFriends: onlineFriends, directMessagesUpdate: directMessagesUpdate, setActive: setActive,
                shouldUpdate: shouldUpdate, setShouldUpdate: setShouldUpdate } } />
        </div>

        <div className={styles.flexWrapperMobile}>
            <nav className={`${hideActive ? 'hide' : ''} ${menuActive ? styles.meMobileShow : styles.meMobileHide} ${menuActive ? '' : styles.hide}`}>
                <div className={`${styles.friends} ${active == 'Friends' ? styles.active : ''}`} onClick={handleClickFriends}>
                    Friends
                </div>
                <span className={styles.menu} onClick={handleMenu} > <img src={menuImg} alt="show menu"/> </span>
                <div className={styles.directMessagesTextBox}>
                    <span className={styles.directMessagesText}> Direct Messages </span>
                </div>
                <Chats allDirect={allDirect} active={active} handleClick={handleClick} onlineFriends={onlineFriends} />
            </nav>
            <Outlet context={ {username: username, users: users, onlineFriends: onlineFriends, directMessagesUpdate: directMessagesUpdate, setActive: setActive,
                shouldUpdate: shouldUpdate, setShouldUpdate: setShouldUpdate, menuActive: menuActive, setMenuActive: setMenuActive } } />
        </div>
        </>
    )
}

function Chats({ allDirect, active, handleClick, onlineFriends }: { allDirect: {friendName: string, order: number}[], active: string,
    handleClick(friendName: string): void, onlineFriends: string[]},  ) {
    if(!allDirect) {
        return <></>
    }
    const directList = allDirect.sort((a, b) => b.order - a.order)
    .map(user => 
        <div className={`${styles.user} ${active == user.friendName ? styles.active : ''} ${onlineFriends.includes(user.friendName) ? styles.push : ''}`} onClick={() => handleClick(user.friendName)}>
            <span className={onlineFriends.includes(user.friendName) ? styles.online : ''}> </span>
            <span className={styles.text}> {user.friendName} </span>
        </div>
    )
    return directList
}