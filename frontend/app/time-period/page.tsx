'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Clock, 
  Plus, 
  Trash2, 
  Coffee, 
  AlertCircle, 
  Zap, 
  Settings,
  CalendarClock,
  Edit2,
  Save,
  X,
  Hand,
  Sparkles
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface PreviewPeriod {
  periodName: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  duration: number;
}

export default function TimePeriodManagementPage() {
  const [schoolSettings, setSchoolSettings] = useState({ 
    startTime: '08:00', 
    endTime: '16:00' 
  });
  const [timePeriods, setTimePeriods] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [choiceDialogOpen, setChoiceDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');
  const [methodSelected, setMethodSelected] = useState(false);

  const [formData, setFormData] = useState({
    periodName: '',
    startTime: '',
    endTime: '',
    isBreak: false,
  });

  const [generateForm, setGenerateForm] = useState({
    totalPeriods: 8,
    periodDuration: 0,
    includeBreak: true,
    breakStartTime: '12:00',
    breakEndTime: '12:30',
  });

  const [previewPeriods, setPreviewPeriods] = useState<PreviewPeriod[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [editingPreviewIndex, setEditingPreviewIndex] = useState<number | null>(null);
  const [previewEditData, setPreviewEditData] = useState<PreviewPeriod | null>(null);

  useEffect(() => {
    loadSchoolSettings();
    loadTimePeriods();
  }, []);

  const loadSchoolSettings = async () => {
    try {
      const data = await api.getSchoolSettings();
      setSchoolSettings({ startTime: data.startTime, endTime: data.endTime });
    } catch (error) {
      console.error('Error loading school settings:', error);
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

  const handleSaveSchoolSettings = async () => {
    if (schoolSettings.startTime >= schoolSettings.endTime) {
      toast.error('Start time must be before end time');
      return;
    }

    try {
      await api.updateSchoolSettings(schoolSettings);
      toast.success('School settings updated successfully!');
    } catch (error) {
      toast.error('Failed to save school settings');
    }
  };

  const handleOpenChoiceDialog = () => {
    setChoiceDialogOpen(true);
  };

  const handleChooseMethod = (method: 'manual' | 'auto') => {
    setActiveTab(method);
    setMethodSelected(true);
    setChoiceDialogOpen(false);
    
    if (method === 'manual') {
      handleAddPeriod();
    }
  };

  const handleAddPeriod = () => {
    const lastPeriod = timePeriods[timePeriods.length - 1];
    let suggestedStart = schoolSettings.startTime;
    let suggestedEnd = '09:00';

    if (lastPeriod) {
      suggestedStart = lastPeriod.endTime;
      const [hours, minutes] = suggestedStart.split(':').map(Number);
      const endMinutes = hours * 60 + minutes + 45;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      suggestedEnd = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
    }

    setFormData({
      periodName: `Period ${timePeriods.filter(p => !p.isBreak).length + 1}`,
      startTime: suggestedStart,
      endTime: suggestedEnd,
      isBreak: false,
    });
    setEditingPeriod(null);
    setDialogOpen(true);
  };

  const handleEditPeriod = (period: any) => {
    setFormData({
      periodName: period.periodName,
      startTime: period.startTime,
      endTime: period.endTime,
      isBreak: period.isBreak,
    });
    setEditingPeriod(period);
    setDialogOpen(true);
  };

  const handleSavePeriod = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.startTime >= formData.endTime) {
      toast.error('End time must be after start time');
      return;
    }

    if (formData.startTime < schoolSettings.startTime || formData.endTime > schoolSettings.endTime) {
      toast.error('Period must be within school hours');
      return;
    }

    setLoading(true);
    try {
      if (editingPeriod) {
        await api.updateTimePeriod(editingPeriod.id, formData);
        toast.success('Period updated successfully!');
      } else {
        await api.createTimePeriod(formData);
        toast.success('Period created successfully!');
      }
      setDialogOpen(false);
      loadTimePeriods();
    } catch (error) {
      toast.error('Failed to save time period');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePeriod = async (id: string) => {
    const confirmed = confirm('Are you sure? This will delete all timetable entries for this period across all sections.');
    
    if (confirmed) {
      try {
        await api.deleteTimePeriod(id);
        toast.success('Period deleted successfully!');
        loadTimePeriods();
      } catch (error) {
        toast.error('Failed to delete time period');
      }
    }
  };

  const handleGeneratePreview = () => {
    const { totalPeriods, periodDuration, includeBreak, breakStartTime, breakEndTime } = generateForm;
    const { startTime, endTime } = schoolSettings;

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const totalSchoolMinutes = endMinutes - startMinutes;

    const breakStartMinutes = includeBreak ? timeToMinutes(breakStartTime) : 0;
    const breakEndMinutes = includeBreak ? timeToMinutes(breakEndTime) : 0;
    const breakDurationMinutes = includeBreak ? (breakEndMinutes - breakStartMinutes) : 0;

    if (includeBreak) {
      if (breakStartTime >= breakEndTime) {
        toast.error('Break end time must be after start time');
        return;
      }
      if (breakStartTime < startTime || breakEndTime > endTime) {
        toast.error('Break must be within school hours');
        return;
      }
    }

    const availableForPeriods = totalSchoolMinutes - breakDurationMinutes;

    let calculatedPeriodDuration = periodDuration;
    if (!calculatedPeriodDuration || calculatedPeriodDuration === 0) {
      calculatedPeriodDuration = Math.floor(availableForPeriods / totalPeriods);
    }

    if (calculatedPeriodDuration < 15) {
      toast.error('Period duration too short. Reduce periods or increase school hours.');
      return;
    }

    const periods: PreviewPeriod[] = [];
    let currentTime = startMinutes;
    let periodsBeforeBreak = 0;

    if (includeBreak) {
      let tempTime = startMinutes;
      while (tempTime + calculatedPeriodDuration <= breakStartMinutes) {
        periodsBeforeBreak++;
        tempTime += calculatedPeriodDuration;
      }
    }

    for (let i = 1; i <= periodsBeforeBreak; i++) {
      const periodStart = minutesToTime(currentTime);
      const periodEnd = minutesToTime(currentTime + calculatedPeriodDuration);

      periods.push({
        periodName: `Period ${i}`,
        startTime: periodStart,
        endTime: periodEnd,
        isBreak: false,
        duration: calculatedPeriodDuration,
      });

      currentTime += calculatedPeriodDuration;
    }

    if (includeBreak) {
      periods.push({
        periodName: 'Lunch Break',
        startTime: breakStartTime,
        endTime: breakEndTime,
        isBreak: true,
        duration: breakDurationMinutes,
      });

      currentTime = breakEndMinutes;
    }

    const remainingPeriods = totalPeriods - periodsBeforeBreak;
    for (let i = 1; i <= remainingPeriods; i++) {
      const periodNumber = periodsBeforeBreak + i;
      const periodStart = minutesToTime(currentTime);
      const periodEnd = minutesToTime(currentTime + calculatedPeriodDuration);

      if (currentTime + calculatedPeriodDuration > endMinutes) {
        toast.error('Cannot fit all periods. Reduce periods or adjust break timing.');
        return;
      }

      periods.push({
        periodName: `Period ${periodNumber}`,
        startTime: periodStart,
        endTime: periodEnd,
        isBreak: false,
        duration: calculatedPeriodDuration,
      });

      currentTime += calculatedPeriodDuration;
    }

    setPreviewPeriods(periods);
    setShowPreview(true);
    setEditingPreviewIndex(null);
    toast.success(`Preview generated! ${periods.length} periods`);
  };

  const handleEditPreviewPeriod = (index: number) => {
    setEditingPreviewIndex(index);
    setPreviewEditData({ ...previewPeriods[index] });
  };

  const handleSavePreviewEdit = () => {
    if (!previewEditData || editingPreviewIndex === null) return;

    if (previewEditData.startTime >= previewEditData.endTime) {
      toast.error('End time must be after start time');
      return;
    }

    if (previewEditData.startTime < schoolSettings.startTime || 
        previewEditData.endTime > schoolSettings.endTime) {
      toast.error('Period must be within school hours');
      return;
    }

    const duration = calculateDuration(previewEditData.startTime, previewEditData.endTime);
    previewEditData.duration = duration;

    const updatedPeriods = [...previewPeriods];
    updatedPeriods[editingPreviewIndex] = previewEditData;
    setPreviewPeriods(updatedPeriods);
    
    setEditingPreviewIndex(null);
    setPreviewEditData(null);
    toast.success('Preview period updated!');
  };

  const handleCancelPreviewEdit = () => {
    setEditingPreviewIndex(null);
    setPreviewEditData(null);
  };

  const handleDeletePreviewPeriod = (index: number) => {
    const confirmed = confirm('Remove this period from preview?');
    if (confirmed) {
      const updatedPeriods = previewPeriods.filter((_, i) => i !== index);
      setPreviewPeriods(updatedPeriods);
      toast.success('Period removed from preview');
    }
  };

  const handleApplyGenerated = async () => {
    if (previewPeriods.length === 0) {
      toast.error('No periods to apply');
      return;
    }

    try {
      setLoading(true);
      const response = await api.bulkCreateTimePeriods(previewPeriods);
      
      toast.success(`Successfully applied ${response.periods.length} time periods!`);
      setShowPreview(false);
      setPreviewPeriods([]);
      setEditingPreviewIndex(null);
      setPreviewEditData(null);
      loadTimePeriods();
    } catch (error: any) {
      toast.error(error.message || 'Failed to apply time periods');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    const confirmed = confirm(
      '⚠️ WARNING!\n\nThis will delete ALL time periods and ALL timetable entries.\n\nAre you absolutely sure?'
    );
    
    if (confirmed) {
      try {
        await api.clearAllPeriods();
        toast.success('All periods cleared successfully!');
        setShowPreview(false);
        setPreviewPeriods([]);
        setMethodSelected(false);
        loadTimePeriods();
      } catch (error) {
        toast.error('Failed to clear periods');
      }
    }
  };

  const totalDuration = timePeriods.reduce((acc, period) => {
    return acc + calculateDuration(period.startTime, period.endTime);
  }, 0);

  const classPeriods = timePeriods.filter(p => !p.isBreak).length;
  const breakPeriods = timePeriods.filter(p => p.isBreak).length;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <CalendarClock className="h-8 w-8 text-blue-600" />
        Time Period Management
      </h1>

      {/* School Settings */}
      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          School Operating Hours
        </h2>
        <div className="flex gap-4 items-end">
          <div>
            <Label>Start Time</Label>
            <Input
              type="time"
              value={schoolSettings.startTime}
              onChange={(e) => setSchoolSettings({ ...schoolSettings, startTime: e.target.value })}
              className="w-32"
            />
          </div>
          <div>
            <Label>End Time</Label>
            <Input
              type="time"
              value={schoolSettings.endTime}
              onChange={(e) => setSchoolSettings({ ...schoolSettings, endTime: e.target.value })}
              className="w-32"
            />
          </div>
          <Button onClick={handleSaveSchoolSettings}>Save School Hours</Button>
        </div>
      </div>

      {/* Setup Button */}
      {timePeriods.length === 0 && !methodSelected && (
        <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-dashed border-blue-300 rounded-xl mb-6">
          <CalendarClock className="h-16 w-16 mx-auto mb-4 text-blue-600" />
          <h2 className="text-2xl font-bold mb-2">No Time Periods Yet</h2>
          <p className="text-gray-600 mb-6">Create your school's time periods to get started</p>
          <Button onClick={handleOpenChoiceDialog} size="lg" className="px-8">
            <Plus className="h-5 w-5 mr-2" />
            Setup Time Periods
          </Button>
        </div>
      )}

      {/* Tabs - Show when periods exist OR method selected */}
      {(timePeriods.length > 0 || methodSelected) && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Manual Setup
            </TabsTrigger>
            <TabsTrigger value="auto" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Auto Generate
            </TabsTrigger>
          </TabsList>

          {/* Manual Tab */}
          <TabsContent value="manual">
            <div className="bg-white border rounded p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Time Periods</h2>
                  <p className="text-sm text-gray-600">
                    Total: {timePeriods.length} periods ({classPeriods} class, {breakPeriods} break) | Duration: {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
                  </p>
                </div>
                <div className="flex gap-2">
                  {timePeriods.length > 0 && (
                    <Button onClick={handleClearAll} variant="outline" className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear All
                    </Button>
                  )}
                  <Button onClick={handleAddPeriod}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Period
                  </Button>
                </div>
              </div>

              {timePeriods.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 mb-4">No time periods created yet</p>
                  <Button onClick={handleAddPeriod}>Create First Period</Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {timePeriods.map((period, index) => (
                    <div
                      key={period.id}
                      className={`flex items-center justify-between p-3 rounded border ${
                        period.isBreak ? 'bg-orange-50 border-orange-300' : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-mono text-gray-500">#{index + 1}</div>
                        {period.isBreak && <Coffee className="h-5 w-5 text-orange-600" />}
                        <div>
                          <div className={`font-semibold ${period.isBreak ? 'text-orange-900' : 'text-green-900'}`}>
                            {period.periodName}
                          </div>
                          <div className="text-sm text-gray-600">
                            {period.startTime} - {period.endTime}
                            <span className="ml-2 text-xs">
                              ({calculateDuration(period.startTime, period.endTime)} min)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPeriod(period)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePeriod(period.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Auto Generate Tab */}
          <TabsContent value="auto">
            <div className="bg-white border rounded p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Auto-Generate Time Periods
                </h2>
                <p className="text-sm text-gray-600">
                  Generate periods, preview and edit them, then apply when ready
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <Label htmlFor="totalPeriods">Total Number of Periods *</Label>
                  <Input
                    id="totalPeriods"
                    type="number"
                    min="1"
                    max="20"
                    value={generateForm.totalPeriods}
                    onChange={(e) => setGenerateForm({ ...generateForm, totalPeriods: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Between 1 and 20 periods</p>
                </div>

                <div>
                  <Label htmlFor="periodDuration">Period Duration (minutes)</Label>
                  <Input
                    id="periodDuration"
                    type="number"
                    min="0"
                    max="120"
                    value={generateForm.periodDuration}
                    onChange={(e) => setGenerateForm({ ...generateForm, periodDuration: parseInt(e.target.value) || 0 })}
                    placeholder="Leave 0 for auto-calculate"
                  />
                  <p className="text-xs text-gray-500 mt-1">0 = Auto-calculate evenly</p>
                </div>

                <div className="col-span-2 flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded">
                  <Label htmlFor="includeBreak" className="cursor-pointer font-medium">
                    Include Lunch Break
                  </Label>
                  <Switch
                    id="includeBreak"
                    checked={generateForm.includeBreak}
                    onCheckedChange={(checked) => setGenerateForm({ ...generateForm, includeBreak: checked })}
                  />
                </div>

                {generateForm.includeBreak && (
                  <>
                    <div>
                      <Label htmlFor="breakStartTime">Break Start Time *</Label>
                      <Input
                        id="breakStartTime"
                        type="time"
                        value={generateForm.breakStartTime}
                        onChange={(e) => setGenerateForm({ ...generateForm, breakStartTime: e.target.value })}
                      />
                      <p className="text-xs text-gray-500 mt-1">e.g., 12:00</p>
                    </div>

                    <div>
                      <Label htmlFor="breakEndTime">Break End Time *</Label>
                      <Input
                        id="breakEndTime"
                        type="time"
                        value={generateForm.breakEndTime}
                        onChange={(e) => setGenerateForm({ ...generateForm, breakEndTime: e.target.value })}
                      />
                      <p className="text-xs text-gray-500 mt-1">e.g., 12:30</p>
                    </div>

                    {generateForm.breakStartTime && generateForm.breakEndTime && (
                      <div className="col-span-2 p-3 bg-orange-100 rounded text-sm flex items-center gap-2">
                        <Coffee className="h-5 w-5 text-orange-600" />
                        <strong>Break Duration:</strong> {calculateDuration(generateForm.breakStartTime, generateForm.breakEndTime)} minutes
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex gap-3">
                <Button onClick={handleGeneratePreview} className="flex-1">
                  <Zap className="h-4 w-4 mr-2" />
                  Generate Preview
                </Button>
                {showPreview && (
                  <Button onClick={handleApplyGenerated} disabled={loading} variant="default">
                    {loading ? 'Applying...' : 'Apply & Save All'}
                  </Button>
                )}
              </div>

              {/* Preview Section */}
              {showPreview && previewPeriods.length > 0 && (
                <div className="mt-6 border rounded p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Preview - {previewPeriods.length} Total Periods (Editable)
                    </h3>
                    <div className="text-sm text-gray-600">
                      {previewPeriods.filter(p => !p.isBreak).length} class, {previewPeriods.filter(p => p.isBreak).length} break
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {previewPeriods.map((period, index) => (
                      <div key={index}>
                        {editingPreviewIndex === index && previewEditData ? (
                          <div className="p-3 bg-blue-50 border border-blue-300 rounded">
                            <div className="grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-4">
                                <Label className="text-xs">Period Name</Label>
                                <Input
                                  value={previewEditData.periodName}
                                  onChange={(e) => setPreviewEditData({ ...previewEditData, periodName: e.target.value })}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="col-span-3">
                                <Label className="text-xs">Start Time</Label>
                                <Input
                                  type="time"
                                  value={previewEditData.startTime}
                                  onChange={(e) => setPreviewEditData({ ...previewEditData, startTime: e.target.value })}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="col-span-3">
                                <Label className="text-xs">End Time</Label>
                                <Input
                                  type="time"
                                  value={previewEditData.endTime}
                                  onChange={(e) => setPreviewEditData({ ...previewEditData, endTime: e.target.value })}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="col-span-2 flex gap-1">
                                <Button size="sm" onClick={handleSavePreviewEdit} className="h-8 w-8 p-0">
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={handleCancelPreviewEdit} className="h-8 w-8 p-0">
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className={`flex items-center justify-between p-3 rounded border ${
                            period.isBreak ? 'bg-orange-100 border-orange-300' : 'bg-green-100 border-green-300'
                          }`}>
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-sm text-gray-600 w-8">#{index + 1}</span>
                              {period.isBreak && <Coffee className="h-5 w-5 text-orange-600" />}
                              <div>
                                <div className={`font-semibold text-sm ${period.isBreak ? 'text-orange-900' : 'text-green-900'}`}>
                                  {period.periodName}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {period.startTime} - {period.endTime}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium px-3 py-1 rounded ${
                                period.isBreak ? 'bg-orange-200 text-orange-800' : 'bg-green-200 text-green-800'
                              }`}>
                                {period.duration} min
                              </span>
                              <Button size="sm" variant="outline" onClick={() => handleEditPreviewPeriod(index)} className="h-8">
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDeletePreviewPeriod(index)} className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                    <p className="text-blue-900">
                      💡 <strong>Tip:</strong> Click Edit to modify any period before applying.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Choice Dialog */}
      <Dialog open={choiceDialogOpen} onOpenChange={setChoiceDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Choose Setup Method</DialogTitle>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-4 py-4">
            {/* Manual Option */}
            <button
              onClick={() => handleChooseMethod('manual')}
              className="group bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6 hover:border-green-400 hover:shadow-lg transition-all text-left"
            >
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Hand className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-green-900 mb-2">Manual Setup</h3>
              <p className="text-sm text-green-700 mb-3">
                Create periods one by one with full control
              </p>
              <div className="space-y-1 text-xs text-green-800">
                <div className="flex items-start gap-1">
                  <span className="text-green-600">✓</span>
                  <span>Full control over timing</span>
                </div>
                <div className="flex items-start gap-1">
                  <span className="text-green-600">✓</span>
                  <span>Custom period names</span>
                </div>
                <div className="flex items-start gap-1">
                  <span className="text-green-600">✓</span>
                  <span>Flexible break placement</span>
                </div>
              </div>
            </button>

            {/* Auto Generate Option */}
            <button
              onClick={() => handleChooseMethod('auto')}
              className="group bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg p-6 hover:border-purple-400 hover:shadow-lg transition-all text-left"
            >
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-purple-900 mb-2">Auto Generate</h3>
              <p className="text-sm text-purple-700 mb-3">
                Quick setup with even distribution
              </p>
              <div className="space-y-1 text-xs text-purple-800">
                <div className="flex items-start gap-1">
                  <span className="text-purple-600">✓</span>
                  <span>Quick setup in seconds</span>
                </div>
                <div className="flex items-start gap-1">
                  <span className="text-purple-600">✓</span>
                  <span>Preview before applying</span>
                </div>
                <div className="flex items-start gap-1">
                  <span className="text-purple-600">✓</span>
                  <span>Edit generated periods</span>
                </div>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Period Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPeriod ? 'Edit Time Period' : 'Add Time Period'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSavePeriod} className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded">
              <Label htmlFor="isBreak" className="cursor-pointer">
                Is this a Break/Lunch period?
              </Label>
              <Switch
                id="isBreak"
                checked={formData.isBreak}
                onCheckedChange={(checked) =>
                  setFormData({ 
                    ...formData, 
                    isBreak: checked,
                    periodName: checked ? 'Lunch Break' : formData.periodName
                  })
                }
              />
            </div>

            <div>
              <Label>Period Name</Label>
              <Input
                value={formData.periodName}
                onChange={(e) => setFormData({ ...formData, periodName: e.target.value })}
                placeholder="e.g., Period 1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>
            </div>

            {formData.startTime && formData.endTime && (
              <div className="text-sm text-gray-600">
                Duration: {calculateDuration(formData.startTime, formData.endTime)} minutes
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : editingPeriod ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function calculateDuration(start: string, end: string): number {
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  return h2 * 60 + m2 - (h1 * 60 + m1);
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}
