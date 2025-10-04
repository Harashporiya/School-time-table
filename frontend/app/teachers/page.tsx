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
import { Checkbox } from '@/components/ui/checkbox';
import { User, Plus, Trash2, Edit, BookOpen, Search, X } from 'lucide-react';
import { toast } from 'sonner';

interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  assignedClasses: Array<{
    id: string;
    class: {
      id: string;
      name: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    subjects: [''],
    classIds: [] as string[],
  });

  useEffect(() => {
    loadTeachers();
    loadClasses();
  }, []);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const data = await api.getTeachers();
      setTeachers(data);
    } catch (error) {
      console.error('Error loading teachers:', error);
      toast.error('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const data = await api.getClasses();
      setClasses(data);
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Failed to load classes');
    }
  };

  const handleOpenDialog = (teacher?: Teacher) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setFormData({
        name: teacher.name,
        subjects: teacher.subjects.length > 0 ? teacher.subjects : [''],
        classIds: teacher.assignedClasses.map(ac => ac.class.id),
      });
    } else {
      setEditingTeacher(null);
      setFormData({
        name: '',
        subjects: [''],
        classIds: [],
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTeacher(null);
    setFormData({
      name: '',
      subjects: [''],
      classIds: [],
    });
  };

  const handleAddSubject = () => {
    setFormData({
      ...formData,
      subjects: [...formData.subjects, ''],
    });
  };

  const handleRemoveSubject = (index: number) => {
    const newSubjects = formData.subjects.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      subjects: newSubjects.length > 0 ? newSubjects : [''],
    });
  };

  const handleSubjectChange = (index: number, value: string) => {
    const newSubjects = [...formData.subjects];
    newSubjects[index] = value;
    setFormData({
      ...formData,
      subjects: newSubjects,
    });
  };

  const handleClassToggle = (classId: string) => {
    setFormData({
      ...formData,
      classIds: formData.classIds.includes(classId)
        ? formData.classIds.filter(id => id !== classId)
        : [...formData.classIds, classId],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Please enter teacher name');
      return;
    }

    const validSubjects = formData.subjects.filter(s => s.trim());
    if (validSubjects.length === 0) {
      toast.error('Please add at least one subject');
      return;
    }

    try {
      if (editingTeacher) {
        await api.updateTeacher(editingTeacher.id, {
          ...formData,
          subjects: validSubjects,
        });
        toast.success('Teacher updated successfully!');
      } else {
        await api.createTeacher({
          ...formData,
          subjects: validSubjects,
        });
        toast.success('Teacher created successfully!');
      }

      handleCloseDialog();
      loadTeachers();
    } catch (error: any) {
      console.error('Error saving teacher:', error);
      toast.error(error.message || 'Failed to save teacher');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = confirm(
      `Are you sure you want to delete teacher "${name}"?\n\nThis will also remove all their timetable assignments.`
    );
    
    if (confirmed) {
      try {
        await api.deleteTeacher(id);
        toast.success('Teacher deleted successfully!');
        loadTeachers();
      } catch (error) {
        console.error('Error deleting teacher:', error);
        toast.error('Failed to delete teacher');
      }
    }
  };

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.subjects.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <User className="h-8 w-8 text-blue-600" />
          Teachers Management
        </h1>
        <Button onClick={() => handleOpenDialog()} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Teacher
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search teachers by name or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-4">
              <div className="text-center px-4 py-2 bg-blue-50 rounded">
                <p className="text-2xl font-bold text-blue-600">{teachers.length}</p>
                <p className="text-xs text-blue-700">Total Teachers</p>
              </div>
              <div className="text-center px-4 py-2 bg-green-50 rounded">
                <p className="text-2xl font-bold text-green-600">
                  {new Set(teachers.flatMap(t => t.subjects)).size}
                </p>
                <p className="text-xs text-green-700">Unique Subjects</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            All Teachers ({filteredTeachers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p>Loading teachers...</p>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="mb-2">
                {searchQuery ? 'No teachers found matching your search' : 'No teachers added yet'}
              </p>
              {!searchQuery && (
                <Button onClick={() => handleOpenDialog()} variant="outline" className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Teacher
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTeachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="border rounded-lg p-4 hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-blue-50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{teacher.name}</h3>
                      </div>
                    </div>
                  </div>

                  {/* Subjects */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Subjects:</p>
                    <div className="flex flex-wrap gap-1">
                      {teacher.subjects.map((subject, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Assigned Classes */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Assigned Classes:</p>
                    {teacher.assignedClasses.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {teacher.assignedClasses.map((ac) => (
                          <span
                            key={ac.id}
                            className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded"
                          >
                            {ac.class.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No classes assigned</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(teacher)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(teacher.id, teacher.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Teacher Name */}
              <div>
                <Label htmlFor="name">Teacher Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              {/* Subjects */}
              <div>
                <Label>Subjects *</Label>
                <div className="space-y-2">
                  {formData.subjects.map((subject, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Subject ${index + 1} (e.g., Mathematics)`}
                        value={subject}
                        onChange={(e) => handleSubjectChange(index, e.target.value)}
                        required
                      />
                      {formData.subjects.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSubject(index)}
                          className="text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddSubject}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Another Subject
                  </Button>
                </div>
              </div>

              {/* Class Assignment */}
              <div>
                <Label>Assign to Classes (Optional)</Label>
                <div className="border rounded p-3 max-h-48 overflow-y-auto">
                  {classes.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No classes available</p>
                  ) : (
                    <div className="space-y-2">
                      {classes.map((cls) => (
                        <div key={cls.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`class-${cls.id}`}
                            checked={formData.classIds.includes(cls.id)}
                            onCheckedChange={() => handleClassToggle(cls.id)}
                          />
                          <label
                            htmlFor={`class-${cls.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {cls.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                <p className="font-medium mb-1">ℹ️ Note:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Add multiple subjects for multi-subject teachers</li>
                  <li>Assign classes to filter this teacher in timetable creation</li>
                  <li>You can edit these details anytime</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {editingTeacher ? 'Update Teacher' : 'Add Teacher'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
