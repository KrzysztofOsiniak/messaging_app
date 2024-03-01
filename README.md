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
## How To Install/Run
### Prerequisites
- Have [node.js](https://nodejs.org/en/download) with npm installed
- Have [mysql server](https://www.apachefriends.org/) installed
- Create a database called `users`
- Create the tables by copying the entirety of this file: [createTables.sql](https://github.com/KrzysztofOsiniak/messaging_app/blob/react/createTables.sql) and running it as a single query in `users`
- Make sure you have mysql configured with these options or change them to your own in [database.ts](https://github.com/KrzysztofOsiniak/messaging_app/blob/react/backend/database.ts) and [.env](https://github.com/KrzysztofOsiniak/messaging_app/blob/react/backend/.env):
```
    user: 'root',
    password: '',
```
### How to run
Using bash terminal:
- Go to messaging_app folder
- Install app dependencies with npm:
```
(cd frontend; npm install; cd ../backend; npm install)
```
- Build and run the app:
```
(cd frontend; npm run build; cd ../backend; npm run build; node index.js)
```
- After successful build the app should be running on http://localhost:8080
