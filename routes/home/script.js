const login = document.querySelector('.login');
const signup = document.querySelector('.signup');
const chatinput = document.querySelector('.chatinput');


login.addEventListener('click', () => {
    window.location.href = "http://localhost:8080/users/login";
});

signup.addEventListener('click', () => {
    window.location.href = "http://localhost:8080/users/signup";
});

chatinput.addEventListener("keypress", (e) => {
    if(e.key === 'Enter') {
        e.preventDefault();
        chatinput.value = "";
      }
});