import { Router } from 'express';
import { getSchoolSettings, updateSchoolSettings } from '../controllers/schoolSettingsController.js';
const router = Router();

router.get('/', getSchoolSettings);
router.put('/', updateSchoolSettings);

export default router;
