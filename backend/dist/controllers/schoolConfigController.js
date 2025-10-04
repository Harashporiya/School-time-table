import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
// Get school configuration
export const getSchoolConfig = async (req, res) => {
    try {
        const config = await prisma.schoolConfig.findFirst({
            where: { isActive: true },
        });
        if (!config) {
            return res.json({
                schoolStartTime: '08:00',
                schoolEndTime: '15:00',
                periodDuration: 45,
            });
        }
        res.json(config);
    }
    catch (error) {
        console.error('Error fetching school config:', error);
        res.status(500).json({ error: 'Failed to fetch school config' });
    }
};
// Create or update school configuration
export const upsertSchoolConfig = async (req, res) => {
    try {
        const { schoolStartTime, schoolEndTime, periodDuration } = req.body;
        if (!schoolStartTime || !schoolEndTime || !periodDuration) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        // Deactivate all existing configs
        await prisma.schoolConfig.updateMany({
            data: { isActive: false },
        });
        // Create new config
        const config = await prisma.schoolConfig.create({
            data: {
                schoolStartTime,
                schoolEndTime,
                periodDuration,
            },
        });
        res.json(config);
    }
    catch (error) {
        console.error('Error upserting school config:', error);
        res.status(500).json({ error: 'Failed to update school config' });
    }
};
// Get all breaks
export const getBreaks = async (req, res) => {
    try {
        const breaks = await prisma.breakConfig.findMany({
            where: { isActive: true },
            orderBy: { orderIndex: 'asc' },
        });
        res.json(breaks);
    }
    catch (error) {
        console.error('Error fetching breaks:', error);
        res.status(500).json({ error: 'Failed to fetch breaks' });
    }
};
// Create break
export const createBreak = async (req, res) => {
    try {
        const { name, startTime, endTime, orderIndex } = req.body;
        const breakConfig = await prisma.breakConfig.create({
            data: { name, startTime, endTime, orderIndex },
        });
        res.status(201).json(breakConfig);
    }
    catch (error) {
        console.error('Error creating break:', error);
        res.status(500).json({ error: 'Failed to create break' });
    }
};
// Delete break
export const deleteBreak = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.breakConfig.update({
            where: { id },
            data: { isActive: false },
        });
        res.json({ message: 'Break deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting break:', error);
        res.status(500).json({ error: 'Failed to delete break' });
    }
};
// Generate period templates
export const generatePeriodTemplates = async (req, res) => {
    try {
        const { schoolStartTime, schoolEndTime, periodDuration, breaks } = req.body;
        // Deactivate existing templates
        await prisma.periodTemplate.updateMany({
            data: { isActive: false },
        });
        const templates = [];
        let currentTime = schoolStartTime;
        let periodNumber = 1;
        // Helper to convert time to minutes
        const timeToMinutes = (time) => {
            const [h, m] = time.split(':').map(Number);
            return h * 60 + m;
        };
        // Helper to convert minutes to time
        const minutesToTime = (minutes) => {
            const h = Math.floor(minutes / 60);
            const m = minutes % 60;
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        };
        const schoolEndMinutes = timeToMinutes(schoolEndTime);
        let currentMinutes = timeToMinutes(currentTime);
        while (currentMinutes + periodDuration <= schoolEndMinutes) {
            const endMinutes = currentMinutes + periodDuration;
            const endTime = minutesToTime(endMinutes);
            // Check if there's a break at this time
            const breakAtThisTime = breaks?.find((b) => timeToMinutes(b.startTime) === endMinutes);
            // Create period template
            const template = await prisma.periodTemplate.create({
                data: {
                    name: `Period ${periodNumber}`,
                    startTime: minutesToTime(currentMinutes),
                    endTime: endTime,
                    orderIndex: periodNumber,
                },
            });
            templates.push(template);
            periodNumber++;
            // Add break if exists
            if (breakAtThisTime) {
                currentMinutes = timeToMinutes(breakAtThisTime.endTime);
            }
            else {
                currentMinutes = endMinutes;
            }
            // Safety check
            if (periodNumber > 20)
                break;
        }
        res.json(templates);
    }
    catch (error) {
        console.error('Error generating period templates:', error);
        res.status(500).json({ error: 'Failed to generate period templates' });
    }
};
// Get period templates
export const getPeriodTemplates = async (req, res) => {
    try {
        const templates = await prisma.periodTemplate.findMany({
            where: { isActive: true },
            orderBy: { orderIndex: 'asc' },
        });
        res.json(templates);
    }
    catch (error) {
        console.error('Error fetching period templates:', error);
        res.status(500).json({ error: 'Failed to fetch period templates' });
    }
};
// Apply period template to all sections
export const applyTemplateToAllSections = async (req, res) => {
    try {
        const { days } = req.body; // Array of days to apply
        if (!days || !Array.isArray(days)) {
            return res.status(400).json({ error: 'Days array is required' });
        }
        const templates = await prisma.periodTemplate.findMany({
            where: { isActive: true },
            orderBy: { orderIndex: 'asc' },
        });
        const sections = await prisma.section.findMany();
        const breaks = await prisma.breakConfig.findMany({
            where: { isActive: true },
            orderBy: { orderIndex: 'asc' },
        });
        let createdCount = 0;
        for (const section of sections) {
            for (const day of days) {
                // Delete existing entries for this section and day
                await prisma.timetable.deleteMany({
                    where: {
                        sectionId: section.id,
                        day: day,
                    },
                });
                // Add periods
                for (const template of templates) {
                    await prisma.timetable.create({
                        data: {
                            sectionId: section.id,
                            day: day,
                            startTime: template.startTime,
                            endTime: template.endTime,
                            isBreak: false,
                            teacherId: null,
                            room: null,
                        },
                    });
                    createdCount++;
                }
                // Add breaks
                for (const breakConfig of breaks) {
                    await prisma.timetable.create({
                        data: {
                            sectionId: section.id,
                            day: day,
                            startTime: breakConfig.startTime,
                            endTime: breakConfig.endTime,
                            isBreak: true,
                            breakType: breakConfig.name,
                            teacherId: null,
                            room: null,
                        },
                    });
                    createdCount++;
                }
            }
        }
        res.json({
            message: 'Templates applied successfully',
            sectionsAffected: sections.length,
            daysAffected: days.length,
            entriesCreated: createdCount,
        });
    }
    catch (error) {
        console.error('Error applying templates:', error);
        res.status(500).json({ error: 'Failed to apply templates' });
    }
};
