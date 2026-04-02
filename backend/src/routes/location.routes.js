import express from 'express';
import { getAll, create, remove } from '../controllers/location.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.get('/',       getAll);
router.post('/',      create);
router.delete('/:id', remove);

export default router;
