import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export const getSchoolSettings = async (req, res) => {
    try {
        let settings = await prisma.schoolSettings.findFirst();
        if (!settings) {
            // set default values if not found
            settings = await prisma.schoolSettings.create({
                data: { startTime: '08:00', endTime: '14:00' },
            });
        }
        res.json(settings);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to fetch school settings" });
    }
};
export const updateSchoolSettings = async (req, res) => {
    try {
        const { startTime, endTime } = req.body;
        let settings = await prisma.schoolSettings.findFirst();
        if (!settings) {
            settings = await prisma.schoolSettings.create({
                data: { startTime, endTime }
            });
        }
        else {
            settings = await prisma.schoolSettings.update({
                where: { id: settings.id },
                data: { startTime, endTime }
            });
        }
        res.json(settings);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to update school settings" });
    }
};
