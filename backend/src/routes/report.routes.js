import express from 'express';
import { getDailyReport, getDriverReport, getVehicleReport, getSummaryReport } from '../controllers/report.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.get('/daily',   getDailyReport);
router.get('/driver',  getDriverReport);
router.get('/vehicle', getVehicleReport);
router.get('/summary', getSummaryReport);

export default router;
