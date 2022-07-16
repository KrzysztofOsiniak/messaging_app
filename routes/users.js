import express from 'express'

import {postlogin, postsignup, getlogin, getsignup} from '../controllers/users.js'

const router = express.Router();


router.use('/login', express.static('routes/login'));

router.get('/login', getlogin);

router.post('/login', postlogin);


router.use('/signup', express.static('routes/signup'));

router.get('/signup', getsignup);

router.post('/signup', postsignup);


export default router