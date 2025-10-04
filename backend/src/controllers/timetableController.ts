// src/controllers/timetableController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { checkTeacherConflict } from '../utils/validateTime.js';

const prisma = new PrismaClient();

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Create or update timetable entry
export const upsertTimetable = async (req: Request, res: Response) => {
  try {
    const { day, room, teacherId, sectionId, timePeriodId, subject } = req.body;

    if (!day || !sectionId || !timePeriodId) {
      return res.status(400).json({ 
        error: 'Day, sectionId, and timePeriodId are required' 
      });
    }

    const timePeriod = await prisma.timePeriod.findUnique({
      where: { id: timePeriodId },
    });

    if (!timePeriod) {
      return res.status(404).json({ error: 'Time period not found' });
    }

    if (!timePeriod.isBreak && !teacherId) {
      return res.status(400).json({ error: 'Teacher is required for class periods' });
    }

    if (!timePeriod.isBreak && teacherId) {
      const existingEntry = await prisma.timetable.findUnique({
        where: {
          sectionId_day_timePeriodId: {
            sectionId,
            day,
            timePeriodId,
          },
        },
      });

      const conflict = await checkTeacherConflict(
        teacherId, 
        day, 
        timePeriod.startTime, 
        timePeriod.endTime,
        timePeriodId,
        existingEntry?.id
      );

      if (conflict) {
        return res.status(409).json({
          error: `Teacher is already assigned to ${conflict.conflictWith.class} - Section ${conflict.conflictWith.section} at this time (${conflict.conflictWith.period})`,
          conflict,
        });
      }
    }

    const timetable = await prisma.timetable.upsert({
      where: {
        sectionId_day_timePeriodId: {
          sectionId,
          day,
          timePeriodId,
        },
      },
      update: {
        room: timePeriod.isBreak ? null : room,
        teacherId: timePeriod.isBreak ? null : teacherId,
        subject: timePeriod.isBreak ? null : subject,
      },
      create: {
        day,
        room: timePeriod.isBreak ? null : room,
        teacherId: timePeriod.isBreak ? null : teacherId,
        subject: timePeriod.isBreak ? null : subject,
        sectionId,
        timePeriodId,
      },
      include: {
        teacher: true,
        section: {
          include: { class: true },
        },
        timePeriod: true,
      },
    });

    res.status(201).json(timetable);
  } catch (error) {
    console.error('Error creating/updating timetable:', error);
    res.status(500).json({ error: 'Failed to save timetable entry' });
  }
};


// Delete timetable entry (leaves empty slot)
export const deleteTimetable = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.timetable.delete({
      where: { id },
    });

    res.json({ message: 'Timetable entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting timetable:', error);
    res.status(500).json({ error: 'Failed to delete timetable entry' });
  }
};

// Get timetable by section
export const getTimetableBySection = async (req: Request, res: Response) => {
  try {
    const { sectionId } = req.params;

    const timetable = await prisma.timetable.findMany({
      where: { sectionId },
      include: {
        teacher: true,
        section: {
          include: { class: true },
        },
        timePeriod: true,
      },
      orderBy: [
        { timePeriod: { orderIndex: 'asc' } }
      ],
    });

    res.json(timetable);
  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
};

// Get timetable by teacher
export const getTimetableByTeacher = async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.params;

    const timetable = await prisma.timetable.findMany({
      where: { 
        teacherId,
      },
      include: {
        teacher: true,
        section: {
          include: { class: true },
        },
        timePeriod: true,
      },
      orderBy: [
        { timePeriod: { orderIndex: 'asc' } }
      ],
    });

    res.json(timetable);
  } catch (error) {
    console.error('Error fetching teacher timetable:', error);
    res.status(500).json({ error: 'Failed to fetch teacher timetable' });
  }
};


// Get available teachers for a specific time period
export const getAvailableTeachers = async (req: Request, res: Response) => {
  try {
    const { day, timePeriodId, excludeTimetableId } = req.query;

    if (!day || !timePeriodId) {
      return res.status(400).json({ 
        error: 'Day and timePeriodId are required' 
      });
    }

    // Get all teachers with their assigned classes
    const allTeachers = await prisma.teacher.findMany({
      include: {
        assignedClasses: {
          include: {
            class: true
          }
        }
      },
      orderBy: { name: 'asc' },
    });

    // Get teachers who are already busy at this time
    const busyTeachers = await prisma.timetable.findMany({
      where: {
        day: day as string,
        timePeriodId: timePeriodId as string,
        teacherId: { not: null },
        ...(excludeTimetableId && { 
          id: { not: excludeTimetableId as string } 
        }),
      },
      select: {
        teacherId: true,
      },
    });

    const busyTeacherIds = new Set(
      busyTeachers.map(t => t.teacherId).filter(Boolean) as string[]
    );

    // Filter out busy teachers
    const availableTeachers = allTeachers.filter(
      teacher => !busyTeacherIds.has(teacher.id)
    );

    res.json(availableTeachers);
  } catch (error) {
    console.error('Error fetching available teachers:', error);
    res.status(500).json({ error: 'Failed to fetch available teachers' });
  }
};
