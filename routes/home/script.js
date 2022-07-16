const text = document.querySelector('.text');
const logout = document.querySelector('.logout');
const login = document.querySelector('.login2');
const signup = document.querySelector('.signup2');
const chattext = document.querySelector('.chattext');
const chatinput = document.querySelector('.chatinput');

fetch('http://localhost:8080/home/data', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(user => {
        if((user.status == 200)) {
            text.textContent = user.username;
            logout.classList.toggle('logout');
            login.classList.toggle('login');
            signup.classList.toggle('signup');
            chattext.textContent = user.text;
        }
    }).catch(err => {
        console.error(err);
});

login.addEventListener('click', () => {
    window.location.href = "http://localhost:8080/users/login";
});

signup.addEventListener('click', () => {
    window.location.href = "http://localhost:8080/users/signup";
});

logout.addEventListener('click', () => {
    fetch('http://localhost:8080/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(() => {
        text.textContent = 'Not logged in';
        logout.classList.toggle('logout');
        login.classList.toggle('login');
        signup.classList.toggle('signup');
        chattext.textContent = "";
    })
    .catch(err => {
        console.error(err);
    });
});

chatinput.addEventListener("keypress", (e) => {
    if(e.key === 'Enter') {
        e.preventDefault();
        const data = new FormData();
        fetch('http://localhost:8080/home/chattext', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text: document.querySelector('.chatinput').value
        })
        })
        .then(response => response.json())
        .then(result => {
            if(result.status == 200) {
                chattext.textContent = result.text;
                chatinput.value = "";
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