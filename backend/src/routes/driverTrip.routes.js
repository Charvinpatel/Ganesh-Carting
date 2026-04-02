import express from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import * as controller from '../controllers/driverTrip.controller.js';

const router = express.Router();

router.use(protect);

router.get('/', controller.getDriverTrips);
router.post('/', controller.createDriverTrip);

// Admin only routes for verification
router.put('/:id/verify', restrictTo('admin'), controller.verifyDriverTrip);
router.delete('/:id', controller.deleteDriverTrip);

export default router;
