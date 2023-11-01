import express from 'express'
import path from 'path'

const __dirname = path.resolve();
const router = express.Router();
let chatmessages = [];

router.use('/', express.static('frontend/dist'));

router.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend/dist/index.html'));
});

/* fix abundant {status: x} */

router.get('/data', (req, res) => {
    /*setTimeout(() => {
        res.status(200).send({logged: req.session.logged});
    }, 3000);*/
    if(req.session.logged) {
        res.send({username: req.session.username, status: 200, text: chatmessages, logged: req.session.logged});
    } else {
        res.send({status: 401, logged: 0});
    }
});

router.post('/chattext', (req, res) => {
    const message = req.body.text.trim();
    if( (message.length < 50) && (req.session.logged) && message ) {
        chatmessages.push(req.body.nickname + ": " + message);
        res.status(200).send({status: 200, text: req.body.nickname + ": " + message});
    } else {
        if(req.session.logged) {
            if(!message) {
                res.send({status: 400, text: "can't send empty message"});
                return
            }
            res.send({status: 400, text: "text is too long"});
        } else if(req.session.logged != 1) {
            res.send({status: 401, text: "log in to see and type in chat"});
        } else {
            res.status(500).send({status: 500});
        }
    }
});

router.post('/logout', (req, res) => {
    if(req.session.logged) {
        req.session.destroy();
        res.status(200).redirect('back');
    } else {
        res.sendStatus(401);
    }
});

export default router