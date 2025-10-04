import { Router } from 'express';
import {
  getAllTimePeriods,
  createTimePeriod,
  updateTimePeriod,
  deleteTimePeriod,
  reorderTimePeriods,
  generateTimePeriods,
  bulkCreateTimePeriods, // NEW
  clearAllPeriods,
} from '../controllers/timePeriodController.js';

const router = Router();

router.get('/', getAllTimePeriods);
router.post('/', createTimePeriod);
router.post('/generate', generateTimePeriods);
router.post('/bulk-create', bulkCreateTimePeriods); // NEW ENDPOINT
router.post('/reorder', reorderTimePeriods);
router.post('/clear', clearAllPeriods);
router.put('/:id', updateTimePeriod);
router.delete('/:id', deleteTimePeriod);

export default router;
