'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import TimetableGrid from '@/components/TimetableGrid';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw, Calendar, ClipboardX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function TimetablePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [timetable, setTimetable] = useState<any[]>([]);
  const [timePeriods, setTimePeriods] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Clipboard for copy-paste
  const [clipboard, setClipboard] = useState<any>(null);

  useEffect(() => {
    loadClasses();
    loadTeachers();
    loadTimePeriods();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadSections(selectedClass);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedSection) {
      loadTimetable(selectedSection);
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
      setSelectedSection('');
      setTimetable([]);
    } catch (error) {
      console.error('Error loading sections:', error);
    }
  };

  const loadTimetable = async (sectionId: string) => {
    try {
      setLoading(true);
      const data = await api.getTimetableBySection(sectionId);
      setTimetable(data);
    } catch (error) {
      console.error('Error loading timetable:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleRefresh = () => {
    if (selectedSection) {
      loadTimetable(selectedSection);
    }
  };

  const handleCopy = (entry: any) => {
    const copyData = {
      teacherId: entry.teacherId,
      teacherName: entry.teacher?.name,
      subject: entry.subject,
      room: entry.room,
    };
    setClipboard(copyData);
    toast.success(`Copied: ${entry.teacher?.name} - ${entry.subject}`);
    console.log('Copied to clipboard:', copyData);
  };

  const handleClearClipboard = () => {
    setClipboard(null);
    toast.info('Clipboard cleared');
  };

  const selectedClassData = classes.find(c => c.id === selectedClass);
  const selectedSectionData = sections.find(s => s.id === selectedSection);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Calendar className="h-8 w-8 text-blue-600" />
        Timetable Management
      </h1>

      {/* Selection Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Class & Section</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="w-64">
              <label className="block text-sm font-medium mb-2">Select Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class" />
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

            <div className="w-64">
              <label className="block text-sm font-medium mb-2">Select Section</label>
              <Select
                value={selectedSection}
                onValueChange={setSelectedSection}
                disabled={!selectedClass}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a section" />
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

            <Button 
              onClick={handleRefresh} 
              disabled={!selectedSection || loading} 
              className="mt-8"
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            {clipboard && (
              <Button
                onClick={handleClearClipboard}
                className="mt-8"
                variant="outline"
              >
                <ClipboardX className="h-4 w-4 mr-2" />
                Clear Clipboard
              </Button>
            )}
          </div>

          {/* Info Banners */}
          <div className="mt-4 space-y-2">
            {selectedClassData && selectedSectionData && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-900">
                  <strong>Editing:</strong> {selectedClassData.name} - Section {selectedSectionData.name}
                </p>
              </div>
            )}

            {clipboard && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-900">
                  📋 <strong>Clipboard:</strong> {clipboard.teacherName} - {clipboard.subject} (Room: {clipboard.room})
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timetable Grid */}
      {selectedSection ? (
        loading ? (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <TimetableGrid
            sectionId={selectedSection}
            classId={selectedClass}
            timetable={timetable}
            timePeriods={timePeriods}
            teachers={teachers}
            onUpdate={handleRefresh}
            clipboard={clipboard}
            onCopy={handleCopy}
          />
        )
      ) : (
        <Card>
          <CardContent className="text-center py-12 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Please select a class and section to view the timetable</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
