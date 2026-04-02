import express from 'express';
import { getTrips, getTrip, createTrip, updateTrip, deleteTrip } from '../controllers/trip.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.route('/')
  .get(getTrips)
  .post(createTrip);

router.route('/:id')
  .get(getTrip)
  .put(updateTrip)
  .delete(deleteTrip);

export default router;
