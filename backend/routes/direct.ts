import express from 'express'

import { getAllDirect, getDirect, getUserId, postDirect, postDirectNotificationOff } from '../controllers/direct.js';

const router = express.Router();

router.get('/alldirect', getAllDirect)

router.get('/:id', getDirect);

router.get('/users/:username', getUserId)

router.post('/notification', postDirectNotificationOff);

router.post('/:id', postDirect)

export default router