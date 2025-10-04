import { Router } from 'express';
import { createSection, getSectionsByClass, updateSection, deleteSection, } from '../controllers/sectionController.js';
const router = Router();
router.post('/', createSection);
router.get('/class/:classId', getSectionsByClass);
router.put('/:id', updateSection);
router.delete('/:id', deleteSection);
export default router;
