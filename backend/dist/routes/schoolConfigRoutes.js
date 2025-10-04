// src/routes/schoolConfigRoutes.ts
import { Router } from 'express';
import { getSchoolConfig, upsertSchoolConfig, getBreaks, createBreak, deleteBreak, generatePeriodTemplates, getPeriodTemplates, applyTemplateToAllSections, } from '../controllers/schoolConfigController.js';
const router = Router();
router.get('/config', getSchoolConfig);
router.post('/config', upsertSchoolConfig);
router.get('/breaks', getBreaks);
router.post('/breaks', createBreak);
router.delete('/breaks/:id', deleteBreak);
router.post('/generate-templates', generatePeriodTemplates);
router.get('/templates', getPeriodTemplates);
router.post('/apply-to-all', applyTemplateToAllSections);
export default router;
