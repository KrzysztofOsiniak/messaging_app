const nickname = document.querySelector('.name');
const logout = document.querySelector('.logout');
const login = document.querySelector('.login2');
const signup = document.querySelector('.signup2');
const chattext = document.querySelector('.chattext');
const chatinput = document.querySelector('.chatinput');
let username;
let socket;

function listen() {
    socket.on('message_out', (message) => {
        let first = document.createElement("div");
        let second = document.createElement("h2");
        second.classList.add('chattext');
        let third = document.createTextNode(message);
        second.appendChild(third);
        first.appendChild(second);
        chattext.appendChild(first);   
    });
}

fetch('https://loginapptesting.herokuapp.com/home/data', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(user => {
        if((user.status == 200)) {
            nickname.textContent = user.username;
            username = user.username;
            logout.classList.toggle('logout');
            login.classList.toggle('login');
            signup.classList.toggle('signup');
            chattext.textContent = "";
            user.text.forEach(element => {
                let first = document.createElement("div");
                let second = document.createElement("h2");
                second.classList.add('chattext');
                let third = document.createTextNode(element);
                second.appendChild(third);
                first.appendChild(second);
                chattext.appendChild(first);
            });
            socket = io();
            listen();
        }
    }).catch(err => {
        console.error(err);
});

login.addEventListener('click', () => {
    window.location.href = "https://loginapptesting.herokuapp.com/users/login";
});

signup.addEventListener('click', () => {
    window.location.href = "https://loginapptesting.herokuapp.com/users/signup";
});

logout.addEventListener('click', () => {
    fetch('https://loginapptesting.herokuapp.com/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(() => {
        nickname.textContent = 'Not logged in';
        logout.classList.toggle('logout');
        login.classList.toggle('login');
        signup.classList.toggle('signup');
        chattext.textContent = "";
        socket.emit('logout');
    })
    .catch(err => {
        console.error(err);
    });
});

chatinput.addEventListener("keypress", (e) => {
    if(e.key === 'Enter') {
        e.preventDefault();
        const data = new FormData();
        fetch('https://loginapptesting.herokuapp.com/home/chattext', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text: document.querySelector('.chatinput').value,
            nickname: username
        })
        })
        .then(response => response.json())
        .then(result => {
            if(result.status == 200) {
                let first = document.createElement("div");
                let second = document.createElement("h2");
                second.classList.add('chattext');
                let third = document.createTextNode(result.text);
                second.appendChild(third);
                first.appendChild(second);
                chattext.appendChild(first);
                chatinput.value = "";
                socket.emit('message_in', result.text)
            } else if(result.status == 500) {
                alert("unknown server error occurred");
            } else if(result.status == 400) {
                chatinput.value = result.text;
            } else if(result.status == 401) {
                chatinput.value = result.text;
            }
        })
        .catch(error => {
            console.error(error);
        });
      }
});