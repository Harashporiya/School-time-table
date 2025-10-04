'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, RefreshCw, Calendar, Coffee } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TeacherTimetablePage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [timetable, setTimetable] = useState<any[]>([]);
  const [timePeriods, setTimePeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTeachers();
    loadTimePeriods();
  }, []);

  useEffect(() => {
    if (selectedTeacher) {
      loadTimetable();
    } else {
      setTimetable([]);
    }
  }, [selectedTeacher]);

  const loadTeachers = async () => {
    try {
      const data = await api.getTeachers();
      setTeachers(data);
    } catch (error) {
      console.error('Error loading teachers:', error);
    }
  };

  const loadTimePeriods = async () => {
    try {
      const data = await api.getTimePeriods();
      setTimePeriods(data);
    } catch (error) {
      console.error('Error loading time periods:', error);
    }
  };

  const loadTimetable = async () => {
    if (!selectedTeacher) return;

    try {
      setLoading(true);
      const data = await api.getTimetableByTeacher(selectedTeacher);
      setTimetable(data);
    } catch (error) {
      console.error('Error loading timetable:', error);
      alert('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const getEntryForSlot = (day: string, timePeriodId: string) => {
    return timetable.find(
      (entry) =>
        entry.day === day &&
        entry.timePeriodId === timePeriodId
    );
  };

  const selectedTeacherData = teachers.find((t) => t.id === selectedTeacher);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <User className="h-8 w-8 text-purple-600" />
        Teacher Timetable View
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Select Teacher
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Teacher</label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{teacher.name}</span>
                        <span className="text-xs text-gray-500">
                          {teacher.subjects?.join(', ') || 'No subjects'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={loadTimetable}
                disabled={!selectedTeacher || loading}
                className="w-full"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>

          {selectedTeacherData && (
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <p className="font-bold text-lg text-purple-900">
                  {selectedTeacherData.name}
                </p>
                <p className="text-sm text-purple-700">
                  Subjects: {selectedTeacherData.subjects?.join(', ') || 'No subjects'}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Assigned Classes: {timetable.length} | Total Periods: {timePeriods.length}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!selectedTeacher ? (
        <Card>
          <CardContent className="text-center py-12 text-gray-500">
            <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Please select a teacher to view their timetable</p>
          </CardContent>
        </Card>
      ) : loading ? (
        <Card>
          <CardContent className="text-center py-12">
            <RefreshCw className="h-12 w-12 mx-auto mb-3 animate-spin text-purple-600" />
            <p className="text-gray-600">Loading timetable...</p>
          </CardContent>
        </Card>
      ) : timePeriods.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No time periods configured. Please add periods first.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedTeacherData?.name}'s Weekly Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th className="border border-gray-300 bg-purple-600 text-white p-3 font-semibold text-center min-w-[120px]">
                      Day / Time
                    </th>
                    {timePeriods.map((period) => (
                      <th
                        key={period.id}
                        className={`border border-gray-300 text-white p-3 font-semibold text-center min-w-[150px] ${
                          period.isBreak ? 'bg-orange-500' : 'bg-purple-500'
                        }`}
                      >
                        <div className="text-xs font-normal mb-1">{period.periodName}</div>
                        <div className="text-sm font-bold">{period.startTime}</div>
                        <div className="text-xs">to</div>
                        <div className="text-sm font-bold">{period.endTime}</div>
                        {period.isBreak && (
                          <div className="text-xs mt-1">
                            <Coffee className="h-3 w-3 inline mr-1" />
                            Break
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {DAYS.map((day) => (
                    <tr key={day}>
                      <td className="border border-gray-300 bg-gray-100 p-3 font-bold text-center">
                        {day}
                      </td>

                      {timePeriods.map((period) => {
                        const entry = getEntryForSlot(day, period.id);

                        return (
                          <td
                            key={period.id}
                            className="border border-gray-300 p-3 text-center align-middle"
                          >
                            {period.isBreak ? (
                              // BREAK CELL - Always shown
                              <div className="bg-orange-50 p-3 rounded border-2 border-orange-300">
                                <div className="text-2xl mb-1">☕</div>
                                <div className="font-semibold text-orange-700 text-sm">
                                  {period.periodName}
                                </div>
                                <div className="text-xs text-orange-600 mt-1">
                                  {period.startTime} - {period.endTime}
                                </div>
                              </div>
                            ) : entry ? (
                              // CLASS CELL - Teacher has assignment
                              <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                                <div className="font-bold text-blue-900 mb-1">
                                  {entry.section?.class?.name || 'N/A'}
                                </div>
                                <div className="text-sm text-blue-700">
                                  Section {entry.section?.name || 'N/A'}
                                </div>
                                <div className="text-xs text-blue-600 mt-1 font-semibold bg-blue-100 px-2 py-1 rounded inline-block">
                                  📚 {entry.subject || entry.teacher?.subjects?.[0] || 'Subject'}
                                </div>
                                <div className="text-xs text-blue-600 mt-1">
                                  📍 {entry.room || 'No Room'}
                                </div>
                              </div>
                            ) : (
                              // EMPTY CELL - Teacher free
                              <div className="text-gray-300 text-sm italic bg-gray-50 p-3 rounded">
                                Free
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Stats */}
            <div className="mt-6 grid grid-cols-4 gap-4">
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-700">
                  {DAYS.filter(day => 
                    timePeriods.some(period => getEntryForSlot(day, period.id) && !period.isBreak)
                  ).length}
                </p>
                <p className="text-sm text-purple-600">Working Days</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-700">
                  {timetable.length}
                </p>
                <p className="text-sm text-blue-600">Total Classes</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-700">
                  {new Set(timetable.map(e => e.section?.class?.name)).size}
                </p>
                <p className="text-sm text-green-600">Classes Teaching</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-orange-700">
                  {(DAYS.length * timePeriods.filter(p => !p.isBreak).length) - timetable.length}
                </p>
                <p className="text-sm text-orange-600">Free Periods</p>
              </div>
            </div>

            {/* Classes Breakdown */}
            {timetable.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-lg mb-3">Teaching Schedule Details</h3>
                <div className="grid grid-cols-3 gap-3">
                  {Array.from(
                    new Set(timetable.map(e => `${e.section?.class?.name}-${e.section?.name}-${e.subject}`))
                  ).map((classSection, index) => {
                    const [className, sectionName, subject] = classSection.split('-');
                    const count = timetable.filter(
                      e => e.section?.class?.name === className && 
                           e.section?.name === sectionName &&
                           e.subject === subject
                    ).length;
                    
                    return (
                      <div key={index} className="p-3 bg-gray-50 rounded border border-gray-200 hover:border-purple-300 transition-colors">
                        <p className="font-medium text-gray-900">
                          {className} - Section {sectionName}
                        </p>
                        <p className="text-sm text-purple-600 font-semibold">
                          {subject || 'Subject'}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {count} {count === 1 ? 'period' : 'periods'} per week
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Subject-wise Summary */}
            {timetable.length > 0 && selectedTeacherData?.subjects && (
              <div className="mt-6">
                <h3 className="font-semibold text-lg mb-3">Subject-wise Distribution</h3>
                <div className="grid grid-cols-2 gap-3">
                  {selectedTeacherData.subjects.map((subject: string, idx: number) => {
                    const subjectCount = timetable.filter(e => e.subject === subject).length;
                    return (
                      <div key={idx} className="p-3 bg-purple-50 rounded border border-purple-200">
                        <p className="font-medium text-purple-900">{subject}</p>
                        <p className="text-sm text-purple-600">
                          {subjectCount} {subjectCount === 1 ? 'period' : 'periods'} assigned
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
