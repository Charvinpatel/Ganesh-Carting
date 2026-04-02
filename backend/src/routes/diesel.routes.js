import express from 'express';
import { getDiesel, getDieselEntry, createDiesel, updateDiesel, deleteDiesel } from '../controllers/diesel.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.route('/')
  .get(getDiesel)
  .post(createDiesel);

router.route('/:id')
  .get(getDieselEntry)
  .put(updateDiesel)
  .delete(deleteDiesel);

export default router;
