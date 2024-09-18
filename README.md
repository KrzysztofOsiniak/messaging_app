## About The App/How To Use
### About The App
A full-stack app written in javascript for communication through message chats.

Currently hosted on [digital ocean](https://www.digitalocean.com/) vps running linux.

User requests go through [cloudflare](https://www.cloudflare.com) servers, then get forwarded to the app through [nginx](https://nginx.org/en/).
### Usage
In this app you can:
- Text with other people in real time
- Send friend requests to other users
- See when your friends are online
- Block users to prevent them from texting you
- Check recent chats
## Libraries/Frameworks Used
### Frontend
- [react](https://github.com/facebook/react) - component based UI library
- [react-router](https://github.com/remix-run/react-router) - router for single page like navigation
- [typescript](https://github.com/microsoft/TypeScript) - type checking
- [sass](https://github.com/sass/sass) - extension of css
- [vite](https://github.com/vitejs/vite) - quick build tool and more
### Backend
- [node.js](https://github.com/nodejs/node) - javascript runtime enviorement
- [express](https://github.com/expressjs/express) - lightweight web framework for [node.js](https://github.com/nodejs/node)
- [ws](https://github.com/websockets/ws) - lightweight websockets library
- [bcrypt](https://github.com/dcodeIO/bcrypt.js/) - passwords hashing library
- [mysql2](https://github.com/sidorares/node-mysql2) - mysql client for [node.js](https://github.com/nodejs/node) with [prepared statements](https://sidorares.github.io/node-mysql2/docs/documentation/prepared-statements) and [pooling](https://sidorares.github.io/node-mysql2/docs#using-connection-pools)
- [express-session](https://github.com/expressjs/session) and [express-mysql-session](https://github.com/chill117/express-mysql-session) - libraries for handling users sessions and storing them in mysql
- [uuid](https://github.com/uuidjs/uuid) - library for generating unique id (used for sessions)
- [helmet](https://github.com/helmetjs/helmet) - library for securing http response headers
- [typescript](https://github.com/microsoft/TypeScript) - type checking
## How To Install/Run (With Docker - Tested On Windows/Linux)
### Prerequisites
- Have [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) installed
- Have [docker](https://www.docker.com/) installed
### How to run
- Clone the repository
```
    git clone https://github.com/KrzysztofOsiniak/messaging_app
```
- Go to messaging_app folder
- Switch to docker branch
```
    git switch docker
```
- Start the docker app
- Build and run with docker compose
```
    docker compose up --build
```
If on linux you may need to additionally install docker-compose and run it like this
```
    docker-compose up --build
```
- After successful build the app should be running on http://localhost:5173
## How To Install/Run (Without Docker)
### Prerequisites
- Have git installed
- Have [node.js](https://nodejs.org/en/download) with npm installed (confirmed working version of node:20.9.0)
- Have [mysql server](https://www.apachefriends.org/) installed (confirmed working version of mysql:10.4.24-MariaDB)
- Make sure you have mysql configured with these options or change them to your own in [.env](https://github.com/KrzysztofOsiniak/messaging_app/blob/react/backend/.env):
```
    user: 'root',
    password: '',
```
### How to run
Using bash terminal:
- Clone the repository
```
    git clone https://github.com/KrzysztofOsiniak/messaging_app
```
- Go to messaging_app folder
- Install app dependencies and run with npm
```
(cd frontend; npm i; npm run dev & cd ../backend; npm i; tsc; node index.js)
```
- After successful build the app should be running on http://localhost:5173
