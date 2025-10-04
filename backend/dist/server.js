// src/index.ts
import express from 'express';
import cors from 'cors';
import teacherRoutes from './routes/teacherRoutes.js';
import classRoutes from './routes/classRoutes.js';
import sectionRoutes from './routes/sectionRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';
import timePeriodRoutes from './routes/timePeriodRoutes.js';
import schoolSettingsRoutes from './routes/schoolSettingsRoutes.js';
const app = express();
const PORT = process.env.PORT || 5000;
// Middleware
app.use(cors());
app.use(express.json());
// Routes
app.use('/api/teacher', teacherRoutes);
app.use('/api/class', classRoutes);
app.use('/api/section', sectionRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/time-period', timePeriodRoutes);
app.use('/api/school-settings', schoolSettingsRoutes);
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
export default app;
