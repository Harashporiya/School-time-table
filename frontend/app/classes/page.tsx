'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { GraduationCap, Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

export default function ClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [className, setClassName] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [editClassName, setEditClassName] = useState('');

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const data = await api.getClasses();
      setClasses(data);
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Failed to load classes');
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) {
      toast.error('Please enter a class name');
      return;
    }

    try {
      await api.createClass({ name: className });
      setClassName('');
      loadClasses();
      toast.success(`Class "${className}" created successfully!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create class');
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionName.trim()) {
      toast.error('Please enter a section name');
      return;
    }
    
    if (!selectedClass) {
      toast.error('Please select a class first');
      return;
    }

    // Check for duplicate section
    const isDuplicate = selectedClass.sections?.some(
      (s: any) => s.name.toLowerCase() === sectionName.trim().toLowerCase()
    );

    if (isDuplicate) {
      toast.error(`Section "${sectionName}" already exists in ${selectedClass.name}`);
      return;
    }

    try {
      await api.createSection({
        name: sectionName,
        classId: selectedClass.id,
      });
      setSectionName('');
      loadClasses();
      toast.success(`Section "${sectionName}" created successfully!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create section');
    }
  };

  const handleEditClass = (cls: any) => {
    setEditingClass(cls);
    setEditClassName(cls.name);
    setEditDialogOpen(true);
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClassName.trim() || !editingClass) return;

    try {
      await api.updateClass(editingClass.id, { name: editClassName });
      setEditDialogOpen(false);
      setEditingClass(null);
      setEditClassName('');
      loadClasses();
      toast.success('Class updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update class');
    }
  };

  const handleDeleteClass = async (id: string, name: string) => {
    const confirmed = confirm(
      `⚠️ Warning!\n\nDeleting "${name}" will also delete:\n- All sections in this class\n- All timetable entries for these sections\n\nAre you sure you want to continue?`
    );
    
    if (confirmed) {
      try {
        await api.deleteClass(id);
        loadClasses();
        toast.success(`Class "${name}" deleted successfully!`);
      } catch (error) {
        toast.error('Failed to delete class');
      }
    }
  };

  const handleDeleteSection = async (id: string, name: string, className: string) => {
    const confirmed = confirm(
      `⚠️ Warning!\n\nDeleting section "${name}" from "${className}" will also delete all its timetable entries.\n\nAre you sure?`
    );
    
    if (confirmed) {
      try {
        await api.deleteSection(id);
        loadClasses();
        toast.success(`Section "${name}" deleted successfully!`);
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete section');
      }
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <GraduationCap className="h-8 w-8 text-green-600" />
        Classes & Sections Management
      </h1>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Create Class Card */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Class</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateClass} className="flex gap-3">
              <Input
                placeholder="Class Name (e.g., Class 10)"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                required
              />
              <Button type="submit">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Create Section Card */}
        <Card>
          <CardHeader>
            <CardTitle>Add Section to Class</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSection} className="space-y-3">
              <select
                className="w-full p-2 border rounded"
                value={selectedClass?.id || ''}
                onChange={(e) => {
                  const cls = classes.find((c) => c.id === e.target.value);
                  setSelectedClass(cls);
                }}
                required
              >
                <option value="">Select a class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-3">
                <Input
                  placeholder="Section Name (e.g., A, B, Science)"
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                  required
                />
                <Button type="submit" disabled={!selectedClass}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Classes List */}
      <Card>
        <CardHeader>
          <CardTitle>All Classes ({classes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="mb-2">No classes created yet</p>
              <Button onClick={() => document.getElementById('className')?.focus()} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create First Class
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {classes.map((cls) => (
                <div key={cls.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-green-900">{cls.name}</h3>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {cls.sections?.length || 0} sections
                      </span>
                      {cls.assignedTeachers && cls.assignedTeachers.length > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {cls.assignedTeachers.length} teachers
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClass(cls)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClass(cls.id, cls.name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {cls.sections && cls.sections.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {cls.sections.map((section: any) => (
                        <div
                          key={section.id}
                          className="flex items-center justify-between bg-green-50 border border-green-200 rounded p-2"
                        >
                          <span className="text-sm font-medium">Section {section.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSection(section.id, section.name, cls.name)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No sections yet</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Class Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateClass}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-class-name">Class Name</Label>
                <Input
                  id="edit-class-name"
                  value={editClassName}
                  onChange={(e) => setEditClassName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update Class</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
