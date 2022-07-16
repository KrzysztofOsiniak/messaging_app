import express from 'express'
import path from 'path'

const __dirname = path.resolve();
const router = express.Router();
let sometext = "test";

router.use('/', express.static('routes/home'));

router.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'routes/home/main.html'));
});

router.get('/data', (req, res) => {
    if(req.session.logged) {
        res.send({username: req.session.username, status: 200, text: sometext});
    } else {
        res.send({status: 401});
    }
});

router.post('/chattext', (req, res) => {
    if( (req.body.text.length < 50) && (req.session.logged) ) {
        sometext = sometext + " " + req.body.text;
        res.status(200).send({status: 200, text: sometext});
    } else {
        if(req.session.logged) {
            res.send({status: 400, text: "text is too long"});
        } else if(req.session.logged != 1) {
            res.send({status: 401, text: "log in to see and type in chat"});
        } else {
            res.status(500).send({status: 500});
        }
    }
});

export default router