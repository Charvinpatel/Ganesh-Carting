import express from 'express';
import { getFinanceSummary } from '../controllers/finance.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.get('/summary', getFinanceSummary);

export default router;
