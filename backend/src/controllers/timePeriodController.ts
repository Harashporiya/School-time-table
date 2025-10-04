import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper functions
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// Get all time periods
export const getAllTimePeriods = async (req: Request, res: Response) => {
  try {
    const periods = await prisma.timePeriod.findMany({
      orderBy: { orderIndex: 'asc' },
    });
    res.json(periods);
  } catch (error) {
    console.error('Error fetching time periods:', error);
    res.status(500).json({ error: 'Failed to fetch time periods' });
  }
};

// Create a new time period
export const createTimePeriod = async (req: Request, res: Response) => {
  try {
    const { periodName, startTime, endTime, isBreak } = req.body;

    if (!periodName || !startTime || !endTime) {
      return res.status(400).json({ 
        error: 'Period name, start time, and end time are required' 
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const lastPeriod = await prisma.timePeriod.findFirst({
      orderBy: { orderIndex: 'desc' },
    });
    const nextOrderIndex = (lastPeriod?.orderIndex ?? -1) + 1;

    const period = await prisma.timePeriod.create({
      data: {
        periodName,
        startTime,
        endTime,
        isBreak: isBreak || false,
        orderIndex: nextOrderIndex,
      },
    });

    res.status(201).json(period);
  } catch (error) {
    console.error('Error creating time period:', error);
    res.status(500).json({ error: 'Failed to create time period' });
  }
};

// Update a time period
export const updateTimePeriod = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { periodName, startTime, endTime, isBreak } = req.body;

    if (startTime && endTime && startTime >= endTime) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const period = await prisma.timePeriod.update({
      where: { id },
      data: {
        periodName,
        startTime,
        endTime,
        isBreak,
      },
    });

    res.json(period);
  } catch (error) {
    console.error('Error updating time period:', error);
    res.status(500).json({ error: 'Failed to update time period' });
  }
};

// Delete a time period
export const deleteTimePeriod = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.timePeriod.delete({
      where: { id },
    });

    const remainingPeriods = await prisma.timePeriod.findMany({
      orderBy: { orderIndex: 'asc' },
    });

    for (let i = 0; i < remainingPeriods.length; i++) {
      await prisma.timePeriod.update({
        where: { id: remainingPeriods[i].id },
        data: { orderIndex: i },
      });
    }

    res.json({ message: 'Time period deleted successfully' });
  } catch (error) {
    console.error('Error deleting time period:', error);
    res.status(500).json({ error: 'Failed to delete time period' });
  }
};

// AUTO-GENERATE TIME PERIODS (FIXED)
export const generateTimePeriods = async (req: Request, res: Response) => {
  try {
    const {
      totalPeriods,
      periodDuration,
      schoolStartTime,
      schoolEndTime,
      includeBreak,
      breakStartTime,
      breakEndTime,
    } = req.body;

    // console.log('Generate request:', {
    //   totalPeriods,
    //   periodDuration,
    //   schoolStartTime,
    //   schoolEndTime,
    //   includeBreak,
    //   breakStartTime,
    //   breakEndTime,
    // });

    // Validation
    if (!totalPeriods || !schoolStartTime || !schoolEndTime) {
      return res.status(400).json({ 
        error: 'Total periods, school start time, and end time are required' 
      });
    }

    if (totalPeriods < 1 || totalPeriods > 20) {
      return res.status(400).json({ error: 'Total periods must be between 1 and 20' });
    }

    if (schoolStartTime >= schoolEndTime) {
      return res.status(400).json({ error: 'School end time must be after start time' });
    }

    // Validate break timing if included
    if (includeBreak) {
      if (!breakStartTime || !breakEndTime) {
        return res.status(400).json({ error: 'Break start and end time are required when including break' });
      }
      if (breakStartTime >= breakEndTime) {
        return res.status(400).json({ error: 'Break end time must be after start time' });
      }
      if (breakStartTime < schoolStartTime || breakEndTime > schoolEndTime) {
        return res.status(400).json({ error: 'Break must be within school hours' });
      }
    }

    const startMinutes = timeToMinutes(schoolStartTime);
    const endMinutes = timeToMinutes(schoolEndTime);
    const breakStartMinutes = includeBreak ? timeToMinutes(breakStartTime) : 0;
    const breakEndMinutes = includeBreak ? timeToMinutes(breakEndTime) : 0;
    const breakDurationMinutes = includeBreak ? (breakEndMinutes - breakStartMinutes) : 0;

    // Calculate available time for periods (excluding break)
    const totalSchoolMinutes = endMinutes - startMinutes;
    const availableForPeriods = totalSchoolMinutes - breakDurationMinutes;

    // Calculate period duration
    let calculatedPeriodDuration = periodDuration;
    if (!calculatedPeriodDuration || calculatedPeriodDuration === 0) {
      calculatedPeriodDuration = Math.floor(availableForPeriods / totalPeriods);
    }

    if (calculatedPeriodDuration < 15) {
      return res.status(400).json({ 
        error: 'Period duration too short. Please reduce number of periods or increase school hours.' 
      });
    }

    // Delete existing periods
    await prisma.timePeriod.deleteMany({});

    const periods = [];
    let currentTime = startMinutes;
    let orderIndex = 0;
    let periodsBeforeBreak = 0;

    // Calculate how many periods fit before break
    if (includeBreak) {
      let tempTime = startMinutes;
      while (tempTime + calculatedPeriodDuration <= breakStartMinutes) {
        periodsBeforeBreak++;
        tempTime += calculatedPeriodDuration;
      }
    }

    // console.log(`Generating ${periodsBeforeBreak} periods before break`);

    // Generate periods before break
    for (let i = 1; i <= periodsBeforeBreak; i++) {
      const periodStart = minutesToTime(currentTime);
      const periodEnd = minutesToTime(currentTime + calculatedPeriodDuration);

      periods.push({
        periodName: `Period ${i}`,
        startTime: periodStart,
        endTime: periodEnd,
        isBreak: false,
        orderIndex: orderIndex++,
      });

      currentTime += calculatedPeriodDuration;
    }

    // Add break - IMPORTANT: isBreak must be true
    if (includeBreak) {
      // console.log('Adding break period with isBreak: true');
      periods.push({
        periodName: 'Lunch Break',
        startTime: breakStartTime,
        endTime: breakEndTime,
        isBreak: true, // ✅ EXPLICITLY SET TO TRUE
        orderIndex: orderIndex++,
      });

      currentTime = breakEndMinutes;
    }

    // Generate periods after break
    const remainingPeriods = totalPeriods - periodsBeforeBreak;
    // console.log(`Generating ${remainingPeriods} periods after break`);

    for (let i = 1; i <= remainingPeriods; i++) {
      const periodNumber = periodsBeforeBreak + i;
      const periodStart = minutesToTime(currentTime);
      const periodEnd = minutesToTime(currentTime + calculatedPeriodDuration);

      // Check if period fits before school end time
      if (currentTime + calculatedPeriodDuration > endMinutes) {
        return res.status(400).json({ 
          error: `Cannot fit all ${totalPeriods} periods. Please reduce periods or adjust break timing.` 
        });
      }

      periods.push({
        periodName: `Period ${periodNumber}`,
        startTime: periodStart,
        endTime: periodEnd,
        isBreak: false,
        orderIndex: orderIndex++,
      });

      currentTime += calculatedPeriodDuration;
    }

    console.log('Periods to create:', periods);

    // Create all periods in database
    const createdPeriods = await prisma.$transaction(
      periods.map((period) => {
        // console.log(`Creating period: ${period.periodName}, isBreak: ${period.isBreak}`);
        return prisma.timePeriod.create({ data: period });
      })
    );

    // console.log('Created periods:', createdPeriods);

    res.status(201).json({
      message: 'Time periods generated successfully',
      periods: createdPeriods,
      summary: {
        totalPeriods: totalPeriods,
        periodsBeforeBreak: periodsBeforeBreak,
        periodsAfterBreak: remainingPeriods,
        periodDuration: calculatedPeriodDuration,
        breakIncluded: includeBreak,
        breakDuration: breakDurationMinutes,
      }
    });
  } catch (error) {
    console.error('Error generating time periods:', error);
    res.status(500).json({ error: 'Failed to generate time periods' });
  }
};

// Clear all periods
export const clearAllPeriods = async (req: Request, res: Response) => {
  try {
    await prisma.timePeriod.deleteMany({});
    res.json({ message: 'All time periods cleared successfully' });
  } catch (error) {
    console.error('Error clearing time periods:', error);
    res.status(500).json({ error: 'Failed to clear time periods' });
  }
};

// Reorder time periods
export const reorderTimePeriods = async (req: Request, res: Response) => {
  try {
    const { periodIds } = req.body;

    if (!Array.isArray(periodIds)) {
      return res.status(400).json({ error: 'periodIds must be an array' });
    }

    for (let i = 0; i < periodIds.length; i++) {
      await prisma.timePeriod.update({
        where: { id: periodIds[i] },
        data: { orderIndex: i },
      });
    }

    const periods = await prisma.timePeriod.findMany({
      orderBy: { orderIndex: 'asc' },
    });

    res.json(periods);
  } catch (error) {
    console.error('Error reordering time periods:', error);
    res.status(500).json({ error: 'Failed to reorder time periods' });
  }
};
// ... existing imports and functions ...

// BULK CREATE TIME PERIODS (for edited preview)
export const bulkCreateTimePeriods = async (req: Request, res: Response) => {
  try {
    const { periods } = req.body;

    // console.log('Bulk create request:', periods);

    // Validation
    if (!Array.isArray(periods) || periods.length === 0) {
      return res.status(400).json({ error: 'Periods array is required' });
    }

    // Validate each period
    for (const period of periods) {
      if (!period.periodName || !period.startTime || !period.endTime) {
        return res.status(400).json({ 
          error: 'Each period must have periodName, startTime, and endTime' 
        });
      }
      
      if (period.startTime >= period.endTime) {
        return res.status(400).json({ 
          error: `Invalid timing for ${period.periodName}: End time must be after start time` 
        });
      }
    }

    // Delete existing periods
    await prisma.timePeriod.deleteMany({});

    // Create all periods with proper ordering
    const createdPeriods = await prisma.$transaction(
      periods.map((period: any, index: number) => {
        // console.log(`Creating period ${index + 1}: ${period.periodName}, isBreak: ${period.isBreak}`);
        return prisma.timePeriod.create({
          data: {
            periodName: period.periodName,
            startTime: period.startTime,
            endTime: period.endTime,
            isBreak: period.isBreak || false,
            orderIndex: index,
          },
        });
      })
    );

    // console.log('Created periods:', createdPeriods);

    res.status(201).json({
      message: 'Time periods created successfully',
      periods: createdPeriods,
      summary: {
        totalPeriods: createdPeriods.length,
        classPeriods: createdPeriods.filter(p => !p.isBreak).length,
        breakPeriods: createdPeriods.filter(p => p.isBreak).length,
      }
    });
  } catch (error) {
    console.error('Error bulk creating time periods:', error);
    res.status(500).json({ error: 'Failed to create time periods' });
  }
};
