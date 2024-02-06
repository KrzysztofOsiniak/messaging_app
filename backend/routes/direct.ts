import express from 'express'

import { getDirect, postDirect } from '../controllers/direct.js';

const router = express.Router();

router.get('/:id', getDirect);

router.post('/:id', postDirect)

export default router