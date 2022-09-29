const nickname = document.querySelector('.name');
const logout = document.querySelector('.logout');
const chat = document.querySelector('.chat');
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
        chat.scrollTop = chat.scrollHeight;
    });
}

fetch('http://localhost:8080/home/data', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(user => {
        if((user.status == 200)) {
            username = user.username;
            nickname.textContent = user.username;
            user.text.forEach(element => {
                let first = document.createElement("div");
                let second = document.createElement("h2");
                second.classList.add('chattext');
                let third = document.createTextNode(element);
                second.appendChild(third);
                first.appendChild(second);
                chattext.appendChild(first);
                chat.scrollTop = chat.scrollHeight;
            });
            socket = io();
            listen();
        }
    }).catch(err => {
        console.error(err);
});

logout.addEventListener('click', () => {
    fetch('http://localhost:8080/home/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(() => {
        socket.emit('logout');
        location.reload()
    })
    .catch(err => {
        console.error(err);
    });
});

chatinput.addEventListener("keypress", (e) => {
    if(e.key === 'Enter') {
        e.preventDefault();
        fetch('http://localhost:8080/home/chattext', {
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
                chat.scrollTop = chat.scrollHeight;
                chatinput.value = "";
                if(chatinput.placeholder != "...") {
                    chatinput.placeholder = "...";
                }
                socket.emit('message_in', result.text)
            } else if(result.status == 500) {
                alert("unknown server error occurred");
            } else {
                chatinput.value = "";
                chatinput.placeholder = result.text;
            }
        })
        .catch(error => {
            console.error(error);
        });
      }
});