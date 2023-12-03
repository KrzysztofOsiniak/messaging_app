import express from 'express'

import {postlogin, postsignup} from '../controllers/users.js'

const router = express.Router();


router.post('/login', postlogin);

router.post('/signup', postsignup);


export default router