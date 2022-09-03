const form = document.querySelector(".login");

form.addEventListener("submit", (e) =>{
    e.preventDefault();
    const data = new FormData();
    data.append("username", document.getElementById("name").value);
    data.append("password", document.getElementById("password").value);
    fetch('https://loginapptesting.herokuapp.com/users/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        username: data.get("username"), password: data.get("password")
    })
    })
    .then(response => response.json())
    .then(result => {
        if(result.status == 200) {
            window.location.replace("https://loginapptesting.herokuapp.com/home");
        } else if(result.status == 500) {
            alert("unknown server error occurred");
        }
    })
    .catch(error => {
        console.error(error);
    });
});