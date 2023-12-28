import express from 'express'

import {getFriends, getLogged, postAddFriend, postBlock, postDeclineFriend, postLogin, postRemoveFriend, postSignup, postUnBlock} from '../controllers/users.js'

const router = express.Router();

router.get('/logged', getLogged)

router.post('/login', postLogin);

router.post('/signup', postSignup);

router.post('/addfriend', postAddFriend);

router.post('/declinefriend', postDeclineFriend)

router.post('/removefriend', postRemoveFriend)

router.post('/block', postBlock);

router.post('/unblock', postUnBlock)

router.get('/friends', getFriends);

export default router