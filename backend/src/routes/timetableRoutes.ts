// src/routes/timetableRoutes.ts
import { Router } from 'express';
import {
  upsertTimetable,
  deleteTimetable,
  getTimetableBySection,
  getTimetableByTeacher,
  getAvailableTeachers,
} from '../controllers/timetableController.js';

const router = Router();

router.get('/available-teachers', getAvailableTeachers);
router.get('/section/:sectionId', getTimetableBySection);
router.get('/teacher/:teacherId', getTimetableByTeacher);
router.post('/', upsertTimetable);
router.delete('/:id', deleteTimetable);

export default router;