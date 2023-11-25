import express from 'express'
import path from 'path'

const __dirname = path.resolve();
const router = express.Router();
let chatmessages = [];

router.use('/', express.static('frontend/dist'));

router.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend/dist/index.html'));
});

router.get('/data', (req, res) => {
    setTimeout(() => {
        if(req.session.logged) {
            res.status(200).send({username: req.session.username, text: chatmessages, logged: 1});
        } else {
            res.status(401).send({logged: 0});
        }
    }, 200);    
});

router.post('/chattext', (req, res) => {
    const message = req.body.text.trim();
    if( (message.length < 50) && (req.session.logged) && message ) {
        chatmessages.push(req.body.nickname + ": " + message);
        res.status(200).send({text: req.body.nickname + ": " + message});
    } else {
        if(req.session.logged) {
            if(!message) {
                res.status(400).send({text: "can't send empty message"});
                return
            }
            res.status(400).send({text: "text is too long"});
        } else if(req.session.logged != 1) {
            res.status(401).send({text: "log in to see and type in chat"});
        } else {
            res.status(500);
        }
    }
});

router.post('/logout', (req, res) => {
    if(req.session.logged) {
        req.session.destroy();
        res.status(200);
    } else {
        res.sendStatus(401);
    }
});

export default router