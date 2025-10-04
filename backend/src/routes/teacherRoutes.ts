import { Router } from 'express';
import {
  createTeacher,
  getAllTeachers,
  updateTeacher,
  deleteTeacher,
  getTeachersByClass,
} from '../controllers/teacherController.js';

const router = Router();

router.post('/', createTeacher);
router.get('/', getAllTeachers);
router.get('/class/:classId', getTeachersByClass);
router.put('/:id', updateTeacher);
router.delete('/:id', deleteTeacher);

export default router;
