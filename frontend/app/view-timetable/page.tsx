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
import { Calendar, RefreshCw, BookOpen } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ViewTimetablePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [timetable, setTimetable] = useState<any[]>([]);
  const [timePeriods, setTimePeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClasses();
    loadTimePeriods();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadSections(selectedClass);
      setSelectedSection('');
      setTimetable([]);
    } else {
      setSections([]);
      setSelectedSection('');
      setTimetable([]);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedSection) {
      loadTimetable();
    } else {
      setTimetable([]);
    }
  }, [selectedSection]);

  const loadClasses = async () => {
    try {
      const data = await api.getClasses();
      setClasses(data);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadSections = async (classId: string) => {
    try {
      const data = await api.getSectionsByClass(classId);
      setSections(data);
    } catch (error) {
      console.error('Error loading sections:', error);
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
    if (!selectedSection) return;

    try {
      setLoading(true);
      const data = await api.getTimetableBySection(selectedSection);
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

  const selectedClassData = classes.find((c) => c.id === selectedClass);
  const selectedSectionData = sections.find((s) => s.id === selectedSection);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Calendar className="h-8 w-8 text-blue-600" />
        View Timetable
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Select Class & Section
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Select Section</label>
              <Select
                value={selectedSection}
                onValueChange={setSelectedSection}
                disabled={!selectedClass || sections.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={loadTimetable}
                disabled={!selectedSection || loading}
                className="w-full"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>

          {selectedClassData && selectedSectionData && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-900">
                <strong>Viewing:</strong> {selectedClassData.name} - Section{' '}
                {selectedSectionData.name}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Total Entries: {timetable.length} | Time Periods: {timePeriods.length}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {!selectedSection ? (
        <Card>
          <CardContent className="text-center py-12 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Please select a class and section to view the timetable</p>
          </CardContent>
        </Card>
      ) : loading ? (
        <Card>
          <CardContent className="text-center py-12">
            <RefreshCw className="h-12 w-12 mx-auto mb-3 animate-spin text-blue-600" />
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
              {selectedClassData?.name} - Section {selectedSectionData?.name} Timetable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th className="border border-gray-300 bg-blue-600 text-white p-3 font-semibold text-center min-w-[120px]">
                      Day / Time
                    </th>
                    {timePeriods.map((period) => (
                      <th
                        key={period.id}
                        className={`border border-gray-300 text-white p-3 font-semibold text-center min-w-[150px] ${
                          period.isBreak ? 'bg-orange-500' : 'bg-blue-500'
                        }`}
                      >
                        <div className="text-xs font-normal mb-1">{period.periodName}</div>
                        <div className="text-sm font-bold">{period.startTime}</div>
                        <div className="text-xs">to</div>
                        <div className="text-sm font-bold">{period.endTime}</div>
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
                              <div className="bg-orange-50 p-3 rounded border-2 border-orange-300">
                                <div className="text-lg mb-1">☕</div>
                                <div className="font-semibold text-orange-700 text-sm">
                                  {period.periodName}
                                </div>
                              </div>
                            ) : entry ? (
                              <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
                                {/* FIXED: Show entry.subject first, then fallback */}
                                <div className="font-bold text-green-900 mb-1">
                                  {entry.subject || entry.teacher?.subjects?.[0] || 'Subject'}
                                </div>
                                <div className="text-xs text-green-700">
                                  {entry.teacher?.name || 'No Teacher'}
                                </div>
                                <div className="text-xs text-green-600 mt-1">
                                  📍 {entry.room || 'No Room'}
                                </div>
                              </div>
                            ) : (
                              <div className="text-gray-300 text-sm italic bg-gray-50 p-3 rounded">
                                Free Period
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

            <div className="mt-6 grid grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-700">
                  {DAYS.filter(day => 
                    timePeriods.some(period => getEntryForSlot(day, period.id) && !period.isBreak)
                  ).length}
                </p>
                <p className="text-sm text-blue-600">Active Days</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-700">
                  {timetable.filter(e => !e.timePeriod?.isBreak).length}
                </p>
                <p className="text-sm text-green-600">Total Classes</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-orange-700">
                  {timePeriods.filter(p => p.isBreak).length}
                </p>
                <p className="text-sm text-orange-600">Break Periods</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-700">
                  {timePeriods.length}
                </p>
                <p className="text-sm text-purple-600">Total Periods</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
