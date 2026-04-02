import express from 'express';
import { getDrivers, getDriver, createDriver, updateDriver, deleteDriver } from '../controllers/driver.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.route('/')
  .get(getDrivers)
  .post(createDriver);

router.route('/:id')
  .get(getDriver)
  .put(updateDriver)
  .delete(deleteDriver);

export default router;
