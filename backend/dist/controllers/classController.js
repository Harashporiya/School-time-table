import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export const createClass = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Class name is required' });
        }
        const classData = await prisma.class.create({
            data: { name },
        });
        res.status(201).json(classData);
    }
    catch (error) {
        console.error('Error creating class:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Class name already exists' });
        }
        res.status(500).json({ error: 'Failed to create class' });
    }
};
export const getAllClasses = async (req, res) => {
    try {
        const classes = await prisma.class.findMany({
            include: {
                sections: true,
                assignedTeachers: {
                    include: {
                        teacher: true
                    }
                }
            },
            orderBy: { name: 'asc' },
        });
        res.json(classes);
    }
    catch (error) {
        console.error('Error fetching classes:', error);
        res.status(500).json({ error: 'Failed to fetch classes' });
    }
};
export const updateClass = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const classData = await prisma.class.update({
            where: { id },
            data: { name },
            include: {
                sections: true
            }
        });
        res.json(classData);
    }
    catch (error) {
        console.error('Error updating class:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Class name already exists' });
        }
        res.status(500).json({ error: 'Failed to update class' });
    }
};
export const deleteClass = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.class.delete({
            where: { id },
        });
        res.json({ message: 'Class deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting class:', error);
        res.status(500).json({ error: 'Failed to delete class' });
    }
};
