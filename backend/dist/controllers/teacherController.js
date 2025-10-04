import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export const createTeacher = async (req, res) => {
    try {
        const { name, subjects, classIds } = req.body;
        if (!name || !subjects || !Array.isArray(subjects) || subjects.length === 0) {
            return res.status(400).json({ error: 'Name and at least one subject are required' });
        }
        const teacher = await prisma.teacher.create({
            data: {
                name,
                subjects,
                assignedClasses: classIds && classIds.length > 0 ? {
                    create: classIds.map((classId) => ({ classId }))
                } : undefined
            },
            include: {
                assignedClasses: {
                    include: {
                        class: true
                    }
                }
            }
        });
        res.status(201).json(teacher);
    }
    catch (error) {
        console.error('Error creating teacher:', error);
        res.status(500).json({ error: 'Failed to create teacher' });
    }
};
export const getAllTeachers = async (req, res) => {
    try {
        const teachers = await prisma.teacher.findMany({
            include: {
                assignedClasses: {
                    include: {
                        class: true
                    }
                }
            },
            orderBy: { name: 'asc' },
        });
        res.json(teachers);
    }
    catch (error) {
        console.error('Error fetching teachers:', error);
        res.status(500).json({ error: 'Failed to fetch teachers' });
    }
};
export const updateTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, subjects, classIds } = req.body;
        // Delete existing class assignments
        await prisma.teacherClass.deleteMany({
            where: { teacherId: id }
        });
        // Update teacher with new data
        const teacher = await prisma.teacher.update({
            where: { id },
            data: {
                name,
                subjects,
                assignedClasses: classIds && classIds.length > 0 ? {
                    create: classIds.map((classId) => ({ classId }))
                } : undefined
            },
            include: {
                assignedClasses: {
                    include: {
                        class: true
                    }
                }
            }
        });
        res.json(teacher);
    }
    catch (error) {
        console.error('Error updating teacher:', error);
        res.status(500).json({ error: 'Failed to update teacher' });
    }
};
export const deleteTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.teacher.delete({
            where: { id },
        });
        res.json({ message: 'Teacher deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting teacher:', error);
        res.status(500).json({ error: 'Failed to delete teacher' });
    }
};
// Get teachers assigned to a specific class
export const getTeachersByClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const teachers = await prisma.teacher.findMany({
            where: {
                assignedClasses: {
                    some: {
                        classId
                    }
                }
            },
            include: {
                assignedClasses: {
                    include: {
                        class: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
        res.json(teachers);
    }
    catch (error) {
        console.error('Error fetching teachers by class:', error);
        res.status(500).json({ error: 'Failed to fetch teachers' });
    }
};
