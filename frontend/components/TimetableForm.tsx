'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface TimetableFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teachers: any[];
  timePeriods: any[];
  classId?: string;
  initialData?: any;
  isEdit?: boolean;
  onSuccess: (data?: any) => void; 
  saveToDraft?: boolean;
}

export default function TimetableForm({
  open,
  onOpenChange,
  teachers,
  timePeriods,
  classId,
  initialData,
  isEdit = false,
  onSuccess,
  saveToDraft = false,
}: TimetableFormProps) {
  const [formData, setFormData] = useState({
    teacherId: '',
    subject: '',
    room: '',
    day: '',
    sectionId: '',
    timePeriodId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<any[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [teacherCheckMessage, setTeacherCheckMessage] = useState('');
  const [hasCheckedAvailability, setHasCheckedAvailability] = useState(false);

  useEffect(() => {
    if (initialData && open) {
      setFormData({
        teacherId: initialData.teacherId || '',
        subject: initialData.subject || '',
        room: initialData.room || '',
        day: initialData.day || 'Monday',
        sectionId: initialData.sectionId || '',
        timePeriodId: initialData.timePeriodId || '',
      });
      setError('');
      setHasCheckedAvailability(false);
    }
  }, [initialData, open]);

  useEffect(() => {
    if (!open) {
      setHasCheckedAvailability(false);
      setTeacherCheckMessage('');
      setAvailableTeachers([]);
    }
  }, [open]);

  useEffect(() => {
    if (classId && teachers && teachers.length > 0) {
      const filtered = teachers.filter(teacher => {
        if (!teacher.assignedClasses) return false;
        if (!Array.isArray(teacher.assignedClasses)) return false;
        return teacher.assignedClasses.some((ac: any) => ac?.class?.id === classId);
      });
      setFilteredTeachers(filtered);
    } else {
      setFilteredTeachers(teachers);
    }
  }, [teachers, classId]);

  useEffect(() => {
    const fetchAvailableTeachers = async () => {
      if (formData.day && formData.timePeriodId) {
        setLoadingTeachers(true);
        setTeacherCheckMessage('');
        setHasCheckedAvailability(true);
        
        try {
          const available = await api.getAvailableTeachers(
            formData.day,
            formData.timePeriodId,
            isEdit && initialData?.id ? initialData.id : undefined
          );

          const classFiltered = classId
            ? available.filter((t: any) => {
                if (!t.assignedClasses) return false;
                if (!Array.isArray(t.assignedClasses)) return false;
                return t.assignedClasses.some((ac: any) => ac?.class?.id === classId);
              })
            : available;

          setAvailableTeachers(classFiltered);

          if (classFiltered.length === 0) {
            if (classId && filteredTeachers.length === 0) {
              setTeacherCheckMessage('⚠️ No teachers assigned to this class.');
            } else if (classId && filteredTeachers.length > 0) {
              setTeacherCheckMessage(`⚠️ All ${filteredTeachers.length} assigned teachers are busy`);
            } else {
              setTeacherCheckMessage('⚠️ No teachers available (all busy)');
            }
          } else if (classFiltered.length < filteredTeachers.length) {
            const busyCount = filteredTeachers.length - classFiltered.length;
            setTeacherCheckMessage(`✓ ${classFiltered.length} available (${busyCount} busy)`);
          } else {
            setTeacherCheckMessage(`✓ All ${classFiltered.length} teachers available`);
          }

          if (formData.teacherId && !classFiltered.find((t: any) => t.id === formData.teacherId)) {
            setFormData((prev) => ({ ...prev, teacherId: '', subject: '' }));
            toast.info('Selected teacher is busy. Please select another.');
          }
        } catch (err) {
          console.error('Error fetching available teachers:', err);
          setAvailableTeachers(filteredTeachers);
          setTeacherCheckMessage('⚠️ Could not check teacher availability');
        } finally {
          setLoadingTeachers(false);
        }
      } else {
        setAvailableTeachers(filteredTeachers);
        setTeacherCheckMessage('');
        setHasCheckedAvailability(false);
      }
    };

    fetchAvailableTeachers();
  }, [formData.day, formData.timePeriodId, filteredTeachers, isEdit, initialData, classId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.teacherId) {
      setError('Teacher is required');
      toast.error('Please select a teacher');
      return;
    }

    if (!formData.subject) {
      setError('Subject is required');
      toast.error('Please select a subject');
      return;
    }

    // ✅ Room is now optional - no validation needed

    // ✅ If saving to draft, return data immediately
    if (saveToDraft) {
      onSuccess(formData);
      setFormData({
        teacherId: '',
        subject: '',
        room: '',
        day: '',
        sectionId: '',
        timePeriodId: '',
      });
      onOpenChange(false);
      return;
    }

    // Normal backend save
    setLoading(true);
    try {
      await api.upsertTimetable(formData);
      toast.success(isEdit ? 'Timetable updated successfully!' : 'Teacher assigned successfully!');
      
      onSuccess();
      
      setFormData({
        teacherId: '',
        subject: '',
        room: '',
        day: '',
        sectionId: '',
        timePeriodId: '',
      });
      
      onOpenChange(false);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to save timetable entry';
      setError(errorMessage);
      
      if (errorMessage.includes('already assigned')) {
        toast.error('Teacher Conflict!', {
          description: errorMessage,
          duration: 5000,
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setError('');
    setFormData({
      teacherId: '',
      subject: '',
      room: '',
      day: '',
      sectionId: '',
      timePeriodId: '',
    });
    onOpenChange(false);
  };

  const handleTeacherChange = (value: string) => {
    const teacher = availableTeachers.find(t => t.id === value);
    const subjects = teacher?.subjects || [];
    
    setFormData({ 
      ...formData, 
      teacherId: value,
      subject: subjects.length === 1 ? subjects[0] : formData.subject
    });
  };

  const selectedTeacher = availableTeachers?.find((t) => t.id === formData.teacherId);
  const selectedPeriod = timePeriods?.find(p => p.id === formData.timePeriodId);
  const teacherSubjects = selectedTeacher?.subjects || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEdit ? 'Edit Timetable Entry' : 'Assign Teacher'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Time Period Info */}
          {selectedPeriod && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-semibold text-blue-900">
                {selectedPeriod.periodName}
              </div>
              <div className="text-xs text-blue-700 mt-1">
                {selectedPeriod.startTime} - {selectedPeriod.endTime} • {formData.day || 'Select day'}
              </div>
            </div>
          )}

          {/* Day Selection */}
          {!isEdit && (
            <div>
              <Label htmlFor="day" className="text-sm font-medium">
                Day <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.day} 
                onValueChange={(value) => setFormData({ ...formData, day: value })}
              >
                <SelectTrigger id="day" className="mt-1.5">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Teacher Availability Message */}
          {hasCheckedAvailability && teacherCheckMessage && (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 text-sm border ${
                availableTeachers.length === 0
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-green-50 border-green-200 text-green-700'
              }`}
            >
              {availableTeachers.length === 0 ? (
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
              ) : (
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
              )}
              <span>{teacherCheckMessage}</span>
            </div>
          )}

          {/* Teacher Selection */}
          <div>
            <Label htmlFor="teacher" className="text-sm font-medium">
              Teacher <span className="text-red-500">*</span>
              {loadingTeachers && <span className="text-gray-500 text-xs ml-2">(Checking...)</span>}
            </Label>
            <Select
              value={formData.teacherId}
              onValueChange={handleTeacherChange}
              disabled={loadingTeachers || (hasCheckedAvailability && availableTeachers.length === 0)}
            >
              <SelectTrigger id="teacher" className="mt-1.5">
                <SelectValue
                  placeholder={
                    loadingTeachers
                      ? 'Checking availability...'
                      : !formData.day || !formData.timePeriodId
                      ? 'Select day first'
                      : (hasCheckedAvailability && availableTeachers.length === 0)
                      ? 'No teachers available'
                      : 'Select an available teacher'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableTeachers.length > 0 ? (
                  availableTeachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{teacher.name}</span>
                        <span className="text-xs text-gray-500">
                          {teacher.subjects?.join(', ') || 'No subjects'}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-gray-500 text-center italic">
                    {!formData.day || !formData.timePeriodId 
                      ? 'Please select a day first'
                      : 'No teachers available'
                    }
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Subject Selection */}
          {selectedTeacher && teacherSubjects.length > 0 && (
            <div>
              <Label htmlFor="subject" className="text-sm font-medium">
                Subject <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.subject}
                onValueChange={(value) => setFormData({ ...formData, subject: value })}
              >
                <SelectTrigger id="subject" className="mt-1.5">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {teacherSubjects.map((subject: string, idx: number) => (
                    <SelectItem key={idx} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Room - Optional */}
          <div>
            <Label htmlFor="room" className="text-sm font-medium">
              Room <span className="text-gray-400 text-xs">(Optional)</span>
            </Label>
            <Input
              id="room"
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              placeholder="e.g., Room 101, Lab A, Auditorium"
              className="mt-1.5"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={loading}
              className="border-2"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={
                loading || 
                (hasCheckedAvailability && availableTeachers.length === 0) || 
                !formData.teacherId || 
                !formData.subject
              }
              className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
            >
              {loading ? 'Saving...' : saveToDraft ? 'Save to Draft' : isEdit ? 'Update Entry' : 'Assign Teacher'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
