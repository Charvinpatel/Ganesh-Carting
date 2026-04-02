import express from 'express';
import { getVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle } from '../controllers/vehicle.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.route('/')
  .get(getVehicles)
  .post(createVehicle);

router.route('/:id')
  .get(getVehicle)
  .put(updateVehicle)
  .delete(deleteVehicle);

export default router;
