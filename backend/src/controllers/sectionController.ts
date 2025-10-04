import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createSection = async (req: Request, res: Response) => {
  try {
    const { name, classId } = req.body;

    if (!name || !classId) {
      return res.status(400).json({ error: 'Section name and classId are required' });
    }

    // Check if section already exists
    const existingSection = await prisma.section.findUnique({
      where: {
        classId_name: {
          classId,
          name,
        },
      },
    });

    if (existingSection) {
      return res.status(400).json({ 
        error: `Section "${name}" already exists in this class` 
      });
    }

    const section = await prisma.section.create({
      data: { name, classId },
      include: { class: true },
    });

    res.status(201).json(section);
  } catch (error: any) {
    console.error('Error creating section:', error);
    
    // Handle Prisma unique constraint error
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Section already exists for this class' 
      });
    }
    
    res.status(500).json({ error: 'Failed to create section' });
  }
};

export const getSectionsByClass = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;

    const sections = await prisma.section.findMany({
      where: { classId },
      include: { class: true },
      orderBy: { name: 'asc' },
    });

    res.json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
};

export const updateSection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Section name is required' });
    }

    const section = await prisma.section.update({
      where: { id },
      data: { name },
      include: { class: true },
    });

    res.json(section);
  } catch (error: any) {
    console.error('Error updating section:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Section name already exists in this class' 
      });
    }
    
    res.status(500).json({ error: 'Failed to update section' });
  }
};

export const deleteSection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if section has timetable entries
    const timetableCount = await prisma.timetable.count({
      where: { sectionId: id },
    });

    if (timetableCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete section with ${timetableCount} timetable entries. Delete timetable entries first.` 
      });
    }

    await prisma.section.delete({
      where: { id },
    });

    res.json({ message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({ error: 'Failed to delete section' });
  }
};
