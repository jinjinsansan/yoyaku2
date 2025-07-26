import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { Schedule } from '../../types';
import { Clock, Plus, Trash2, Save, X } from 'lucide-react';

interface ScheduleManagerProps {
  counselorId: string;
}

interface TimeSlot {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: '日曜日' },
  { value: 1, label: '月曜日' },
  { value: 2, label: '火曜日' },
  { value: 3, label: '水曜日' },
  { value: 4, label: '木曜日' },
  { value: 5, label: '金曜日' },
  { value: 6, label: '土曜日' },
];

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({ counselorId }) => {
  const [schedules, setSchedules] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSchedules();
  }, [counselorId]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('counselor_id', counselorId)
        .order('day_of_week');

      if (error) throw error;

      const formattedSchedules: TimeSlot[] = data.map(schedule => ({
        id: schedule.id,
        dayOfWeek: schedule.day_of_week,
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        isAvailable: schedule.is_available,
      }));

      setSchedules(formattedSchedules);
    } catch (error: any) {
      setMessage('エラー: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addTimeSlot = (dayOfWeek: number) => {
    const newSlot: TimeSlot = {
      dayOfWeek,
      startTime: '09:00',
      endTime: '10:00',
      isAvailable: true,
    };
    setSchedules(prev => [...prev, newSlot]);
  };

  const updateTimeSlot = (index: number, field: keyof TimeSlot, value: any) => {
    setSchedules(prev => prev.map((slot, i) => 
      i === index ? { ...slot, [field]: value } : slot
    ));
  };

  const removeTimeSlot = (index: number) => {
    setSchedules(prev => prev.filter((_, i) => i !== index));
  };

  const saveSchedules = async () => {
    try {
      setSaving(true);
      setMessage('');

          // デバッグログを削除

      // 既存のスケジュールを削除
      const { error: deleteError } = await supabase
        .from('schedules')
        .delete()
        .eq('counselor_id', counselorId);

      if (deleteError) throw deleteError;

      // 新しいスケジュールを追加
      if (schedules.length > 0) {
        const insertData = schedules.map(schedule => ({
          counselor_id: counselorId,
          day_of_week: schedule.dayOfWeek,
          start_time: schedule.startTime,
          end_time: schedule.endTime,
          is_available: schedule.isAvailable,
        }));
        
        // デバッグログを削除

        const { error: insertError } = await supabase
          .from('schedules')
          .insert(insertData);

        if (insertError) throw insertError;
      }

      setMessage('スケジュールを保存しました');
      await fetchSchedules(); // 最新データを再取得
    } catch (error: any) {
      setMessage('エラー: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const getSchedulesForDay = (dayOfWeek: number) => {
    return schedules.filter(schedule => schedule.dayOfWeek === dayOfWeek);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center">読み込み中...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">スケジュール管理</h2>
        <Button onClick={saveSchedules} loading={saving} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          保存
        </Button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.includes('エラー') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-6">
        {DAYS_OF_WEEK.map(day => {
          const daySchedules = getSchedulesForDay(day.value);
          
          return (
            <div key={day.value} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-slate-800">{day.label}</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addTimeSlot(day.value)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  時間枠を追加
                </Button>
              </div>

              {daySchedules.length === 0 ? (
                <div className="text-slate-500 text-sm py-2">
                  時間枠が設定されていません
                </div>
              ) : (
                <div className="space-y-3">
                  {daySchedules.map((schedule, index) => {
                    const globalIndex = schedules.findIndex(s => 
                      s.dayOfWeek === day.value && 
                      s.startTime === schedule.startTime && 
                      s.endTime === schedule.endTime
                    );
                    
                    return (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-slate-50 rounded">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <Input
                            type="time"
                            value={schedule.startTime}
                            onChange={(e) => updateTimeSlot(globalIndex, 'startTime', e.target.value)}
                            className="w-32"
                          />
                          <span className="text-slate-500">〜</span>
                          <Input
                            type="time"
                            value={schedule.endTime}
                            onChange={(e) => updateTimeSlot(globalIndex, 'endTime', e.target.value)}
                            className="w-32"
                          />
                        </div>
                        
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={schedule.isAvailable}
                            onChange={(e) => updateTimeSlot(globalIndex, 'isAvailable', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm text-slate-600">利用可能</span>
                        </label>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeTimeSlot(globalIndex)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">スケジュール設定の説明</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 各曜日ごとに複数の時間枠を設定できます</li>
          <li>• 「利用可能」のチェックを外すと、その時間枠は予約できなくなります</li>
          <li>• 時間は30分単位で設定することをお勧めします</li>
          <li>• 変更後は必ず「保存」ボタンを押してください</li>
        </ul>
      </div>
    </Card>
  );
}; 