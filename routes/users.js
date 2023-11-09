import express from 'express'

import {postlogin, postsignup} from '../controllers/users.js'

const router = express.Router();


router.use('/login', express.static('routes/login'));

router.post('/login', postlogin);


router.use('/signup', express.static('routes/signup'));

router.post('/signup', postsignup);


export default router