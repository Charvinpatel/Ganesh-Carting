import express from 'express';
import { getVendors, createVendor, updateVendor, deleteVendor } from '../controllers/vendor.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect); // All vendor routes protected

router.get('/',    getVendors);
router.post('/',   createVendor);
router.put('/:id', updateVendor);
router.delete('/:id', deleteVendor);

export default router;
