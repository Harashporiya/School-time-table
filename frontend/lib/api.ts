const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = {
  // Teachers
  getTeachers: async () => {
    const res = await fetch(`${API_URL}/teacher`);
    if (!res.ok) throw new Error('Failed to fetch teachers');
    return res.json();
  },

  getTeachersByClass: async (classId: string) => {
    const res = await fetch(`${API_URL}/teacher/class/${classId}`);
    if (!res.ok) throw new Error('Failed to fetch teachers by class');
    return res.json();
  },

  createTeacher: async (data: { name: string; subjects: string[]; classIds: string[] }) => {
    const res = await fetch(`${API_URL}/teacher`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create teacher');
    return res.json();
  },

  updateTeacher: async (id: string, data: { name: string; subjects: string[]; classIds: string[] }) => {
    const res = await fetch(`${API_URL}/teacher/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update teacher');
    return res.json();
  },

  deleteTeacher: async (id: string) => {
    const res = await fetch(`${API_URL}/teacher/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete teacher');
    return res.json();
  },

  // Classes
  getClasses: async () => {
    const res = await fetch(`${API_URL}/class`);
    if (!res.ok) throw new Error('Failed to fetch classes');
    return res.json();
  },

  createClass: async (data: { name: string }) => {
    const res = await fetch(`${API_URL}/class`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to create class');
    }
    
    return res.json();
  },

  updateClass: async (id: string, data: { name: string }) => {
    const res = await fetch(`${API_URL}/class/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to update class');
    }
    return res.json();
  },

  deleteClass: async (id: string) => {
    const res = await fetch(`${API_URL}/class/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete class');
    return res.json();
  },

  // Sections
  getSectionsByClass: async (classId: string) => {
    const res = await fetch(`${API_URL}/section/class/${classId}`);
    if (!res.ok) throw new Error('Failed to fetch sections');
    return res.json();
  },

  createSection: async (data: { name: string; classId: string }) => {
    const res = await fetch(`${API_URL}/section`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to create section');
    }
    
    return res.json();
  },

  deleteSection: async (id: string) => {
    const res = await fetch(`${API_URL}/section/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete section');
    return res.json();
  },

  // School Settings
  getSchoolSettings: async () => {
    const res = await fetch(`${API_URL}/school-settings`);
    if (!res.ok) throw new Error('Failed to fetch school settings');
    return res.json();
  },

  updateSchoolSettings: async (data: { startTime: string; endTime: string }) => {
    const res = await fetch(`${API_URL}/school-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update school settings');
    return res.json();
  },

  // Time Periods
  getTimePeriods: async () => {
    const res = await fetch(`${API_URL}/time-period`);
    if (!res.ok) throw new Error('Failed to fetch time periods');
    return res.json();
  },

  createTimePeriod: async (data: {
    periodName: string;
    startTime: string;
    endTime: string;
    isBreak: boolean;
  }) => {
    const res = await fetch(`${API_URL}/time-period`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create time period');
    return res.json();
  },

  updateTimePeriod: async (id: string, data: any) => {
    const res = await fetch(`${API_URL}/time-period/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update time period');
    return res.json();
  },

  deleteTimePeriod: async (id: string) => {
    const res = await fetch(`${API_URL}/time-period/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete time period');
    return res.json();
  },

  // Timetable
  getTimetableBySection: async (sectionId: string) => {
    const res = await fetch(`${API_URL}/timetable/section/${sectionId}`);
    if (!res.ok) throw new Error('Failed to fetch timetable');
    return res.json();
  },

  getTimetableByTeacher: async (teacherId: string) => {
    const res = await fetch(`${API_URL}/timetable/teacher/${teacherId}`);
    if (!res.ok) throw new Error('Failed to fetch teacher timetable');
    return res.json();
  },

  upsertTimetable: async (data: {
    day: string;
    room?: string;
    teacherId?: string;
    sectionId: string;
    timePeriodId: string;
    subject?: string;
  }) => {
    const res = await fetch(`${API_URL}/timetable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to save timetable');
    }
    
    return res.json();
  },

  deleteTimetable: async (id: string) => {
    const res = await fetch(`${API_URL}/timetable/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete timetable entry');
    return res.json();
  },

  getAvailableTeachers: async (
    day: string,
    timePeriodId: string,
    excludeTimetableId?: string
  ) => {
    const params = new URLSearchParams({ 
      day, 
      timePeriodId,
      ...(excludeTimetableId && { excludeTimetableId })
    });
    
    const res = await fetch(`${API_URL}/timetable/available-teachers?${params}`);
    if (!res.ok) throw new Error('Failed to fetch available teachers');
    return res.json();
  },
  updateSection: async (id: string, data: { name: string }) => {
    const res = await fetch(`${API_URL}/section/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to update section');
    }
    return res.json();
  },
  generateTimePeriods: async (data: {
    totalPeriods: number;
    periodDuration?: number;
    schoolStartTime: string;
    schoolEndTime: string;
    includeBreak?: boolean;
    breakStartTime?: string;
    breakEndTime?: string;
  }) => {
    const res = await fetch(`${API_URL}/time-period/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to generate time periods');
    }
    return res.json();
  },
  
  clearAllPeriods: async () => {
    const res = await fetch(`${API_URL}/time-period/clear`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to clear time periods');
    return res.json();
  },  
  // Add this method in the Time Periods section:

bulkCreateTimePeriods: async (periods: Array<{
  periodName: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
}>) => {
  const res = await fetch(`${API_URL}/time-period/bulk-create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ periods }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create time periods');
  }
  return res.json();
},

};
