import { Router } from 'express';
import { createClass, getAllClasses, updateClass, deleteClass } from '../controllers/classController.js';
const router = Router();
router.post('/', createClass);
router.get('/', getAllClasses);
router.put('/:id', updateClass);
router.delete('/:id', deleteClass);
export default router;
