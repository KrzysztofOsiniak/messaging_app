import express from 'express'

import {getFriends, getLogged, postAddFriend, postBlock, postDeclineFriend, postFriendsNotificationOff, postLogin, postLogout, postRemoveFriend, postSignup, postUnBlock} from '../controllers/users.js'

const router = express.Router();

router.get('/logged', getLogged);

router.post('/logout', postLogout);

router.post('/login', postLogin);

router.post('/signup', postSignup);

router.post('/addfriend', postAddFriend);

router.post('/declinefriend', postDeclineFriend);

router.post('/removefriend', postRemoveFriend);

router.post('/block', postBlock);

router.post('/unblock', postUnBlock);

router.get('/friends', getFriends);

router.post('/notification', postFriendsNotificationOff);

export default router