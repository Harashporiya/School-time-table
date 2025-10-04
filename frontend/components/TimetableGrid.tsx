'use client';

import { useState, useEffect } from 'react';
import TimetableCell from './TimetableCell';
import TimetableForm from './TimetableForm';
import { Button } from '@/components/ui/button';
import { AlertCircle, Coffee, Clipboard, GripVertical, GripHorizontal, Sparkles, CalendarDays, Upload, Save, Cloud, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface TimetableGridProps {
  sectionId: string;
  classId: string;
  timetable: any[];
  timePeriods: any[];
  teachers: any[];
  onUpdate: () => void;
  clipboard?: any;
  onCopy?: (entry: any) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type DragDirection = 'horizontal' | 'vertical' | null;

interface DraftEntry {
  day: string;
  timePeriodId: string;
  teacherId: string;
  subject: string;
  room: string;
  sectionId: string;
  isDraft: boolean;
}

export default function TimetableGrid({
  sectionId,
  classId,
  timetable,
  timePeriods,
  teachers,
  onUpdate,
  clipboard,
  onCopy,
}: TimetableGridProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [editEntry, setEditEntry] = useState<any>(null);
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false);
  const [pasteTarget, setPasteTarget] = useState<any>(null);
  const [teacherAvailable, setTeacherAvailable] = useState<boolean>(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [pasting, setPasting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draftEntries, setDraftEntries] = useState<DraftEntry[]>([]);

  // Drag state
  const [dragDirection, setDragDirection] = useState<DragDirection>(null);
  const [draggingEntry, setDraggingEntry] = useState<any>(null);
  const [extending, setExtending] = useState(false);
  const [dragDay, setDragDay] = useState<string>('');
  const [dragStartPeriodIndex, setDragStartPeriodIndex] = useState<number | null>(null);
  const [dragEndPeriodIndex, setDragEndPeriodIndex] = useState<number | null>(null);
  const [dragPeriodId, setDragPeriodId] = useState<string>('');
  const [dragStartDayIndex, setDragStartDayIndex] = useState<number | null>(null);
  const [dragEndDayIndex, setDragEndDayIndex] = useState<number | null>(null);

  useEffect(() => {
    loadDraftEntries();
  }, [sectionId]);

  const loadDraftEntries = () => {
    try {
      const stored = localStorage.getItem(`timetable_draft_${sectionId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setDraftEntries(parsed);
      } else {
        setDraftEntries([]);
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      setDraftEntries([]);
    }
  };

  const saveDraftEntries = (entries: DraftEntry[]) => {
    try {
      localStorage.setItem(`timetable_draft_${sectionId}`, JSON.stringify(entries));
      setDraftEntries(entries);
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  // ✅ FIX: Add single entry to draft
  const addToDraft = (entry: Omit<DraftEntry, 'isDraft'>) => {
    const newEntry: DraftEntry = { ...entry, isDraft: true };
    
    // Get current entries from localStorage directly
    const stored = localStorage.getItem(`timetable_draft_${sectionId}`);
    const currentEntries = stored ? JSON.parse(stored) : [];
    
    // Remove existing entry for same slot
    const updated = currentEntries.filter(
      (d: DraftEntry) => !(d.day === entry.day && d.timePeriodId === entry.timePeriodId)
    );
    
    // Add new entry
    updated.push(newEntry);
    
    // Save to localStorage and state
    saveDraftEntries(updated);
    toast.success('Saved to draft', { description: 'Click "Upload All" to save to server' });
  };

  // ✅ NEW: Add multiple entries at once
  const addMultipleToDraft = (entries: Omit<DraftEntry, 'isDraft'>[]) => {
    if (entries.length === 0) return;

    // Get current entries from localStorage directly
    const stored = localStorage.getItem(`timetable_draft_${sectionId}`);
    const currentEntries = stored ? JSON.parse(stored) : [];
    
    // Remove existing entries for same slots
    let updated = [...currentEntries];
    
    entries.forEach(entry => {
      // Remove if exists
      updated = updated.filter(
        (d: DraftEntry) => !(d.day === entry.day && d.timePeriodId === entry.timePeriodId)
      );
      
      // Add new entry
      const newEntry: DraftEntry = { ...entry, isDraft: true };
      updated.push(newEntry);
    });
    
    // Save to localStorage and state
    saveDraftEntries(updated);
    toast.success(`Saved ${entries.length} entries to draft`, { 
      description: 'Click "Upload All" to save to server' 
    });
  };

  const removeFromDraft = (day: string, timePeriodId: string) => {
    const updated = draftEntries.filter(
      d => !(d.day === day && d.timePeriodId === timePeriodId)
    );
    saveDraftEntries(updated);
  };

  const clearAllDrafts = () => {
    const confirmed = confirm('Clear all draft entries? This cannot be undone.');
    if (confirmed) {
      localStorage.removeItem(`timetable_draft_${sectionId}`);
      setDraftEntries([]);
      toast.info('All drafts cleared');
    }
  };

  const handleUploadDrafts = async () => {
    if (draftEntries.length === 0) {
      toast.error('No draft entries to upload');
      return;
    }

    const confirmed = confirm(
      `Upload ${draftEntries.length} draft entries to server?\n\nThis will check teacher availability and save all changes permanently.`
    );

    if (!confirmed) return;

    try {
      setUploading(true);
      let successCount = 0;
      let errorCount = 0;
      const conflicts: string[] = [];

      for (const entry of draftEntries) {
        try {
          const availableTeachers = await api.getAvailableTeachers(entry.day, entry.timePeriodId);
          const isFree = availableTeachers.some((t: any) => t.id === entry.teacherId);

          if (!isFree) {
            const teacher = teachers.find(t => t.id === entry.teacherId);
            conflicts.push(`${entry.day} - ${teacher?.name || 'Teacher'} (busy)`);
            errorCount++;
            continue;
          }

          await api.upsertTimetable({
            day: entry.day,
            sectionId: entry.sectionId,
            timePeriodId: entry.timePeriodId,
            teacherId: entry.teacherId,
            subject: entry.subject,
            room: entry.room,
          });
          successCount++;
        } catch (error: any) {
          errorCount++;
          conflicts.push(`${entry.day} - ${error.message}`);
        }
      }

      if (successCount > 0) {
        localStorage.removeItem(`timetable_draft_${sectionId}`);
        setDraftEntries([]);
        onUpdate();
        
        if (errorCount === 0) {
          toast.success(`Successfully uploaded ${successCount} entries!`, {
            duration: 4000
          });
        } else {
          toast.warning(`Uploaded ${successCount} entries. ${errorCount} failed.`, {
            description: conflicts.slice(0, 2).join(', '),
            duration: 5000
          });
        }
      } else {
        toast.error('Failed to upload entries', {
          description: conflicts.slice(0, 2).join(', '),
          duration: 5000
        });
      }
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleAddClick = (day: string, timePeriod: any) => {
    if (timePeriod.isBreak) return;
    setSelectedSlot({ day, sectionId, timePeriodId: timePeriod.id, timePeriod });
    setEditEntry(null);
    setDialogOpen(true);
  };

  const handleEditClick = (entry: any) => {
    setEditEntry(entry);
    setSelectedSlot(null);
    setDialogOpen(true);
  };

  const handlePasteClick = async (day: string, timePeriod: any) => {
    if (!clipboard) {
      toast.error('Nothing to paste. Copy a cell first.');
      return;
    }

    setPasteTarget({ day, timePeriod, sectionId, timePeriodId: timePeriod.id });
    setPasteDialogOpen(true);
    
    setCheckingAvailability(true);
    try {
      const availableTeachers = await api.getAvailableTeachers(day, timePeriod.id);
      const isAvailable = availableTeachers.some((t: any) => t.id === clipboard.teacherId);
      setTeacherAvailable(isAvailable);
    } catch (error) {
      setTeacherAvailable(false);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleConfirmPaste = async () => {
    if (!clipboard || !pasteTarget) return;

    try {
      setPasting(true);
      addToDraft({
        day: pasteTarget.day,
        sectionId: pasteTarget.sectionId,
        timePeriodId: pasteTarget.timePeriodId,
        teacherId: clipboard.teacherId,
        subject: clipboard.subject,
        room: clipboard.room,
      });
      setPasteDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to paste');
    } finally {
      setPasting(false);
    }
  };

  const handleHorizontalDragStart = (entry: any, day: string, periodIndex: number, e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    setDragDirection('horizontal');
    setDraggingEntry(entry);
    setDragDay(day);
    setDragStartPeriodIndex(periodIndex);
    setDragEndPeriodIndex(periodIndex);
  };

  const handleHorizontalDragOver = (periodIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    if (dragDirection === 'horizontal' && draggingEntry && dragStartPeriodIndex !== null) {
      setDragEndPeriodIndex(periodIndex);
    }
  };

  const handleVerticalDragStart = (entry: any, dayIndex: number, periodId: string, e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    setDragDirection('vertical');
    setDraggingEntry(entry);
    setDragPeriodId(periodId);
    setDragStartDayIndex(dayIndex);
    setDragEndDayIndex(dayIndex);
  };

  const handleVerticalDragOver = (dayIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    if (dragDirection === 'vertical' && draggingEntry && dragStartDayIndex !== null) {
      setDragEndDayIndex(dayIndex);
    }
  };

  const handleDragEnd = async () => {
    if (!draggingEntry || !dragDirection) {
      resetDragState();
      return;
    }

    if (dragDirection === 'horizontal') {
      await handleHorizontalExtend();
    } else if (dragDirection === 'vertical') {
      await handleVerticalExtend();
    }
  };

  // ✅ FIXED: Horizontal extend - collect all entries first, then save together
  const handleHorizontalExtend = async () => {
    if (dragStartPeriodIndex === null || dragEndPeriodIndex === null || !dragDay) {
      resetDragState();
      return;
    }

    const start = Math.min(dragStartPeriodIndex, dragEndPeriodIndex);
    const end = Math.max(dragStartPeriodIndex, dragEndPeriodIndex);

    if (start === end) {
      resetDragState();
      return;
    }

    try {
      setExtending(true);
      let successCount = 0;
      let skipCount = 0;
      const skippedPeriods: string[] = [];
      const entriesToAdd: Omit<DraftEntry, 'isDraft'>[] = []; // ✅ Collect entries

      for (let i = start + 1; i <= end; i++) {
        const period = timePeriods[i];
        if (period.isBreak) continue;

        const existingEntry = getEntryForSlot(dragDay, period.id);
        if (existingEntry) {
          skipCount++;
          skippedPeriods.push(period.periodName);
          continue;
        }

        try {
          const available = await api.getAvailableTeachers(dragDay, period.id);
          const isFree = available.some((t: any) => t.id === draggingEntry.teacherId);

          if (isFree) {
            // ✅ Add to collection instead of saving immediately
            entriesToAdd.push({
              day: dragDay,
              sectionId,
              timePeriodId: period.id,
              teacherId: draggingEntry.teacherId,
              subject: draggingEntry.subject,
              room: draggingEntry.room,
            });
            successCount++;
          } else {
            skipCount++;
            skippedPeriods.push(period.periodName);
          }
        } catch (error) {
          skipCount++;
          skippedPeriods.push(period.periodName);
        }
      }

      // ✅ Save all entries at once
      if (entriesToAdd.length > 0) {
        addMultipleToDraft(entriesToAdd);
      }

      if (successCount > 0 && skipCount === 0) {
        toast.success(`Extended to ${successCount} period(s)!`);
      } else if (successCount > 0 && skipCount > 0) {
        toast.warning(`Extended to ${successCount} period(s). Skipped: ${skippedPeriods.join(', ')}`);
      } else {
        toast.error('Could not extend. All periods occupied or teacher busy.');
      }
    } catch (error) {
      toast.error('Failed to extend assignment');
    } finally {
      setExtending(false);
      resetDragState();
    }
  };

  // ✅ FIXED: Vertical extend - collect all entries first, then save together
  const handleVerticalExtend = async () => {
    if (dragStartDayIndex === null || dragEndDayIndex === null || !dragPeriodId) {
      resetDragState();
      return;
    }

    const start = Math.min(dragStartDayIndex, dragEndDayIndex);
    const end = Math.max(dragStartDayIndex, dragEndDayIndex);

    if (start === end) {
      resetDragState();
      return;
    }

    try {
      setExtending(true);
      let successCount = 0;
      let skipCount = 0;
      const skippedDays: string[] = [];
      const entriesToAdd: Omit<DraftEntry, 'isDraft'>[] = []; // ✅ Collect entries

      for (let i = start + 1; i <= end; i++) {
        const day = DAYS[i];

        const existingEntry = getEntryForSlot(day, dragPeriodId);
        if (existingEntry) {
          skipCount++;
          skippedDays.push(day);
          continue;
        }

        try {
          const available = await api.getAvailableTeachers(day, dragPeriodId);
          const isFree = available.some((t: any) => t.id === draggingEntry.teacherId);

          if (isFree) {
            // ✅ Add to collection instead of saving immediately
            entriesToAdd.push({
              day,
              sectionId,
              timePeriodId: dragPeriodId,
              teacherId: draggingEntry.teacherId,
              subject: draggingEntry.subject,
              room: draggingEntry.room,
            });
            successCount++;
          } else {
            skipCount++;
            skippedDays.push(day);
          }
        } catch (error) {
          skipCount++;
          skippedDays.push(day);
        }
      }

      // ✅ Save all entries at once
      if (entriesToAdd.length > 0) {
        addMultipleToDraft(entriesToAdd);
      }

      if (successCount > 0 && skipCount === 0) {
        toast.success(`Extended to ${successCount} day(s)!`);
      } else if (successCount > 0 && skipCount > 0) {
        toast.warning(`Extended to ${successCount} day(s). Skipped: ${skippedDays.join(', ')}`);
      } else {
        toast.error('Could not extend. All days occupied or teacher busy.');
      }
    } catch (error) {
      toast.error('Failed to extend assignment');
    } finally {
      setExtending(false);
      resetDragState();
    }
  };

  const resetDragState = () => {
    setDragDirection(null);
    setDraggingEntry(null);
    setDragDay('');
    setDragPeriodId('');
    setDragStartPeriodIndex(null);
    setDragEndPeriodIndex(null);
    setDragStartDayIndex(null);
    setDragEndDayIndex(null);
  };

  const getEntryForSlot = (day: string, timePeriodId: string) => {
    const backendEntry = timetable.find(
      (entry) => entry.day === day && entry.timePeriodId === timePeriodId
    );
    
    if (backendEntry) return backendEntry;

    const draftEntry = draftEntries.find(
      (entry) => entry.day === day && entry.timePeriodId === timePeriodId
    );

    if (draftEntry) {
      const teacher = teachers.find(t => t.id === draftEntry.teacherId);
      return {
        ...draftEntry,
        teacher,
        isDraft: true,
        id: `draft_${day}_${timePeriodId}`,
      };
    }

    return null;
  };

  const shouldHighlightHorizontal = (periodIndex: number, day: string): boolean => {
    if (dragDirection !== 'horizontal' || !draggingEntry || dragStartPeriodIndex === null || dragEndPeriodIndex === null || day !== dragDay) {
      return false;
    }
    const start = Math.min(dragStartPeriodIndex, dragEndPeriodIndex);
    const end = Math.max(dragStartPeriodIndex, dragEndPeriodIndex);
    return periodIndex > start && periodIndex <= end;
  };

  const shouldHighlightVertical = (dayIndex: number, periodId: string): boolean => {
    if (dragDirection !== 'vertical' || !draggingEntry || dragStartDayIndex === null || dragEndDayIndex === null || periodId !== dragPeriodId) {
      return false;
    }
    const start = Math.min(dragStartDayIndex, dragEndDayIndex);
    const end = Math.max(dragStartDayIndex, dragEndDayIndex);
    return dayIndex > start && dayIndex <= end;
  };

  if (timePeriods.length === 0) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-2xl">
        <CalendarDays className="h-16 w-16 mx-auto mb-4 text-blue-500" />
        <p className="text-xl font-semibold text-blue-900 mb-2">No Time Periods Configured</p>
        <p className="text-sm text-blue-700">
          Please configure time periods in the Time Period Management page first
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {draftEntries.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-400 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Save className="h-6 w-6 text-amber-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-ping"></div>
              </div>
              <div>
                <p className="text-amber-900 font-bold text-lg">
                  {draftEntries.length} Draft {draftEntries.length === 1 ? 'Entry' : 'Entries'} Pending
                </p>
                <p className="text-sm text-amber-700">
                  Changes saved locally. Click "Upload All" below to save to server.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={clearAllDrafts}
              disabled={uploading}
              className="border-2 border-amber-400 hover:bg-amber-100 font-semibold"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-emerald-900 font-semibold mb-2">
              📅 {timePeriods.length} Total Periods ({timePeriods.filter(p => !p.isBreak).length} class, {timePeriods.filter(p => p.isBreak).length} break)
            </p>
            <div className="text-sm text-emerald-700 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-purple-500 rounded"></div>
                <span><strong>Horizontal:</strong> Drag right edge → Extend to next periods</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-500 rounded"></div>
                <span><strong>Vertical:</strong> Drag bottom edge → Extend to next days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {extending && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-300 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-sm font-medium text-blue-900">
              Extending {dragDirection === 'horizontal' ? 'horizontally' : 'vertically'} and checking availability...
            </span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="min-w-[900px]">
          <div className="flex border-b-2 border-gray-300">
            <div className="w-36 p-4 font-bold border-r-2 border-gray-300 bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center">
              <CalendarDays className="h-5 w-5 mr-2" />
              Day / Time
            </div>
            {timePeriods.map((period, idx) => (
              <div
                key={period.id}
                className={`flex-1 p-3 text-center font-semibold border-r ${
                  period.isBreak 
                    ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white' 
                    : idx % 2 === 0 
                      ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white'
                      : 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white'
                }`}
              >
                <div className="text-xs font-medium opacity-90">{period.periodName}</div>
                <div className="text-sm font-bold mt-1">
                  {period.startTime} - {period.endTime}
                </div>
                {period.isBreak && (
                  <div className="text-xs mt-1.5 flex items-center justify-center gap-1">
                    <Coffee className="h-3 w-3" />
                    Break
                  </div>
                )}
              </div>
            ))}
          </div>

          {DAYS.map((day, dayIndex) => (
            <div key={day} className="flex border-b last:border-b-0 hover:bg-slate-50 transition-colors">
              <div className="w-36 p-4 font-semibold border-r-2 border-gray-200 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 flex items-center">
                {day}
              </div>
              
              {timePeriods.map((period, periodIndex) => {
                const entry = getEntryForSlot(day, period.id);
                const isHighlightedH = shouldHighlightHorizontal(periodIndex, day);
                const isHighlightedV = shouldHighlightVertical(dayIndex, period.id);
                
                if (period.isBreak) {
                  return (
                    <div key={period.id} className="flex-1 border-r border-gray-200 p-2.5">
                      <div className="h-full p-4 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300 rounded-xl flex flex-col items-center justify-center shadow-sm">
                        <Coffee className="h-6 w-6 text-orange-600 mb-2" />
                        <span className="text-sm font-bold text-orange-900">
                          {period.periodName}
                        </span>
                        <span className="text-xs text-orange-700 mt-1">
                          {period.startTime} - {period.endTime}
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div 
                    key={period.id} 
                    className={`flex-1 border-r border-gray-200 p-2.5 min-h-[100px] transition-all duration-200 ${
                      (isHighlightedH || isHighlightedV) 
                        ? 'bg-gradient-to-br from-emerald-100 to-teal-100 border-2 border-emerald-400 shadow-lg' 
                        : ''
                    }`}
                    onDragOver={(e) => {
                      handleHorizontalDragOver(periodIndex, e);
                      handleVerticalDragOver(dayIndex, e);
                    }}
                  >
                    {entry ? (
                      <div className="relative h-full group">
                        <TimetableCell
                          entry={entry}
                          onEdit={() => handleEditClick(entry)}
                          onUpdate={() => {
                            if (entry.isDraft) {
                              loadDraftEntries();
                            } else {
                              onUpdate();
                            }
                          }}
                          // onCopy={onCopy ? () => onCopy(entry) : undefined}
                         // isDraft={entry.isDraft}
                          //onDeleteDraft={() => removeFromDraft(day, period.id)}
                        />
                        
                        <div
                          draggable
                          onDragStart={(e) => handleHorizontalDragStart(entry, day, periodIndex, e)}
                          onDragEnd={handleDragEnd}
                          className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-r from-purple-400 to-fuchsia-500 hover:w-3 cursor-col-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 rounded-r-lg"
                          title="Drag right to extend →"
                        >
                          <GripVertical className="h-4 w-4 text-white drop-shadow" />
                        </div>

                        <div
                          draggable
                          onDragStart={(e) => handleVerticalDragStart(entry, dayIndex, period.id, e)}
                          onDragEnd={handleDragEnd}
                          className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-b from-blue-400 to-cyan-500 hover:h-3 cursor-row-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 rounded-b-lg"
                          title="Drag down to extend ↓"
                        >
                          <GripHorizontal className="h-3 w-4 text-white drop-shadow" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 h-full">
                        <Button
                          variant="outline"
                          className="flex-1 h-full border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200 text-slate-600 hover:text-indigo-700 rounded-xl"
                          onClick={() => handleAddClick(day, period)}
                        >
                          <span className="text-2xl mr-2">+</span>
                          Assign
                        </Button>
                        {clipboard && (
                          <Button
                            variant="outline"
                            className="px-3 h-full border-2 border-dashed border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-200 rounded-xl"
                            onClick={() => handlePasteClick(day, period)}
                            title="Paste from clipboard"
                          >
                            <Clipboard className="h-5 w-5 text-emerald-600" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {draftEntries.length > 0 && (
        <div className="sticky bottom-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-2xl shadow-2xl border-2 border-green-500 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Save className="h-7 w-7 animate-pulse" />
              </div>
              <div>
                <p className="font-bold text-xl mb-1">
                  {draftEntries.length} {draftEntries.length === 1 ? 'Entry' : 'Entries'} Ready to Upload
                </p>
                <p className="text-sm opacity-90">
                  Click to check teacher availability and save all changes to server
                </p>
              </div>
            </div>
            <Button
              onClick={handleUploadDrafts}
              disabled={uploading}
              size="lg"
              className="bg-white text-green-600 hover:bg-green-50 font-bold px-10 py-6 text-lg shadow-xl hover:shadow-2xl transition-all"
            >
              {uploading ? (
                <>
                  <Cloud className="h-6 w-6 mr-2 animate-bounce" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-6 w-6 mr-2" />
                  Upload All to Server
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <Dialog open={pasteDialogOpen} onOpenChange={setPasteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Paste Assignment</DialogTitle>
            <DialogDescription>
              Pasting to <strong className="text-indigo-600">{pasteTarget?.day}</strong> - <strong className="text-indigo-600">{pasteTarget?.timePeriod?.periodName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {checkingAvailability ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-3 border-indigo-600 border-t-transparent mx-auto"></div>
                <p className="text-sm text-gray-600 mt-4 font-medium">Checking availability...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`p-5 rounded-xl border-2 ${
                  teacherAvailable 
                    ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300' 
                    : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300'
                }`}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className={`h-6 w-6 mt-0.5 flex-shrink-0 ${teacherAvailable ? 'text-emerald-600' : 'text-red-600'}`} />
                    <div className="flex-1">
                      <p className={`font-bold text-lg ${teacherAvailable ? 'text-emerald-900' : 'text-red-900'}`}>
                        {teacherAvailable ? '✓ Teacher Available!' : '✗ Teacher Busy!'}
                      </p>
                      <p className={`text-sm mt-1 ${teacherAvailable ? 'text-emerald-700' : 'text-red-700'}`}>
                        {teacherAvailable 
                          ? 'You can safely paste this assignment.' 
                          : 'This teacher is assigned to another class.'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <p className="font-semibold text-slate-900 mb-3">Assignment Details:</p>
                  <div className="space-y-2 text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Teacher:</span>
                      <span className="text-indigo-600 font-semibold">{clipboard?.teacherName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Subject:</span>
                      <span className="text-blue-600 font-semibold">{clipboard?.subject}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Room:</span>
                      <span className="text-cyan-600 font-semibold">{clipboard?.room}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setPasteDialogOpen(false)} 
              disabled={pasting || checkingAvailability}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmPaste} 
              disabled={!teacherAvailable || pasting || checkingAvailability}
              className="bg-gradient-to-r from-indigo-600 to-blue-600"
            >
              {pasting ? 'Saving...' : 'Add to Draft'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TimetableForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        teachers={teachers}
        timePeriods={timePeriods}
        classId={classId}
        initialData={editEntry || selectedSlot}
        isEdit={!!editEntry}
        saveToDraft={true}
        onSuccess={(data) => {
          setDialogOpen(false);
          if (data) {
            addToDraft(data);
          } else {
            onUpdate();
          }
        }}
      />
    </div>
  );
}
