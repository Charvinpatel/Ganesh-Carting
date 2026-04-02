import express from 'express';
import { getSoilTypes, createSoilType, updateSoilType, deleteSoilType } from '../controllers/soilType.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.route('/')
  .get(getSoilTypes)
  .post(createSoilType);

router.route('/:id')
  .put(updateSoilType)
  .delete(deleteSoilType);

export default router;
