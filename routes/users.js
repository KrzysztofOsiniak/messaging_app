import express from 'express'

import {postAddFriend, postLogin, postSignup} from '../controllers/users.js'

const router = express.Router();


router.post('/login', postLogin);

router.post('/signup', postSignup);

router.post('/addfriend', postAddFriend);

export default router