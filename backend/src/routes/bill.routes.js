import express from 'express';
import { getBills, createBill, updateBillStatus, deleteBill } from '../controllers/bill.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect); // All bill routes protected

router.get('/',    getBills);
router.post('/',   createBill);
router.patch('/:id/status', updateBillStatus);
router.delete('/:id', deleteBill);

export default router;
