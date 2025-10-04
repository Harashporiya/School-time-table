'use client';

import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Trash2, Coffee } from 'lucide-react';
import { toast } from 'sonner';

interface TimetableCellProps {
  entry: any;
  onEdit: () => void;
  onUpdate: () => void;
}

export default function TimetableCell({ entry, onEdit, onUpdate }: TimetableCellProps) {
  const handleDelete = async () => {
    const confirmed = confirm(
      `Are you sure you want to delete this ${entry.timePeriod?.isBreak ? 'break' : 'entry'}?`
    );
    
    if (confirmed) {
      try {
        await api.deleteTimetable(entry.id);
        toast.success('Entry deleted successfully!');
        onUpdate();
      } catch (error) {
        console.error('Error deleting entry:', error);
        toast.error('Failed to delete entry');
      }
    }
  };

  if (entry.timePeriod?.isBreak) {
    return (
      <div className="h-full p-2 bg-orange-50 border border-orange-300 rounded">
        <div className="flex items-center gap-1 text-sm font-semibold text-orange-900">
          <Coffee className="h-3 w-3" />
          {entry.timePeriod.periodName}
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full p-2 bg-green-50 border-l-4 border-green-500 rounded cursor-pointer hover:bg-green-100 transition-colors"
      onClick={onEdit}
    >
      {/* FIXED: Show entry.subject first, then fallback */}
      <div className="text-sm font-semibold text-green-900">
        {entry.subject || entry.teacher?.subjects?.[0] || 'Subject'}
      </div>
      <div className="text-xs text-green-700 mt-1">{entry.teacher?.name || 'No Teacher'}</div>
      <div className="text-xs text-green-600 mt-1">📍 {entry.room || 'No Room'}</div>
      <Button
        variant="ghost"
        size="sm"
        className="mt-1 h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete();
        }}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
