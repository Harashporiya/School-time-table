import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Check if a teacher has a scheduling conflict at a given time period
 * @param teacherId - Teacher to check
 * @param day - Day of the week
 * @param startTime - Not used anymore (kept for backward compatibility)
 * @param endTime - Not used anymore (kept for backward compatibility)
 * @param timePeriodId - The time period ID to check against
 * @param excludeTimetableId - Optional timetable ID to exclude (for edits)
 * @returns Conflict object if teacher is busy, null if available
 */
export async function checkTeacherConflict(
  teacherId: string,
  day: string,
  startTime: string, // kept for compatibility
  endTime: string,   // kept for compatibility
  timePeriodId: string,
  excludeTimetableId?: string
) {
  // Find if teacher is already assigned in this time period on this day
  const existingEntry = await prisma.timetable.findFirst({
    where: {
      teacherId,
      day,
      timePeriodId,
      ...(excludeTimetableId && {
        id: { not: excludeTimetableId }
      })
    },
    include: {
      section: {
        include: {
          class: true
        }
      },
      timePeriod: true,
      teacher: true
    }
  });

  if (existingEntry) {
    return {
      conflictWith: {
        class: existingEntry.section.class.name,
        section: existingEntry.section.name,
        day: existingEntry.day,
        period: existingEntry.timePeriod.periodName,
        time: `${existingEntry.timePeriod.startTime} - ${existingEntry.timePeriod.endTime}`,
        room: existingEntry.room
      }
    };
  }

  return null;
}
