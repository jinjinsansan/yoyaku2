import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { Clock, Plus, Trash2, Save, Calendar } from 'lucide-react';

interface ScheduleManagerProps {
  counselorId: string;
}

interface TimeSlot {
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({ counselorId }) => {
  const [schedules, setSchedules] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [currentWeek, setCurrentWeek] = useState(new Date());

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      console.log('スケジュール取得開始:', counselorId);
      
      // 現在の週のスケジュールを取得
      const startOfWeek = new Date(currentWeek);
      startOfWeek.setDate(currentWeek.getDate() - currentWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('counselor_id', counselorId)
        .gte('date', startOfWeek.toISOString().split('T')[0])
        .lte('date', endOfWeek.toISOString().split('T')[0])
        .order('date, start_time');

      console.log('スケジュール取得レスポンス:', { data, error });

      if (error) throw error;

      const formattedSchedules: TimeSlot[] = data.map(schedule => ({
        id: schedule.id,
        date: schedule.date,
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        isAvailable: schedule.is_available,
      }));

      console.log('フォーマット後のスケジュール:', formattedSchedules);
      setSchedules(formattedSchedules);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
      console.error('スケジュール取得エラー:', error);
      setMessage('エラー: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  }, [counselorId, currentWeek]);

  const getWeekDates = () => {
    const dates = [];
    const startOfWeek = new Date(currentWeek);
    startOfWeek.setDate(currentWeek.getDate() - currentWeek.getDay());

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const addTimeSlot = (date: string) => {
    const newSlot: TimeSlot = {
      date,
      startTime: '09:00',
      endTime: '10:00',
      isAvailable: true,
    };
    setSchedules(prev => [...prev, newSlot]);
  };

  const updateTimeSlot = (index: number, field: keyof TimeSlot, value: string | boolean) => {
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
      console.log('スケジュール保存開始:', schedules);

      // 既存のスケジュールを削除
      const startOfWeek = new Date(currentWeek);
      startOfWeek.setDate(currentWeek.getDate() - currentWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const { error: deleteError } = await supabase
        .from('schedules')
        .delete()
        .eq('counselor_id', counselorId)
        .gte('date', startOfWeek.toISOString().split('T')[0])
        .lte('date', endOfWeek.toISOString().split('T')[0]);

      if (deleteError) throw deleteError;

      // 新しいスケジュールを追加
      if (schedules.length > 0) {
        const insertData = schedules.map(schedule => ({
          counselor_id: counselorId,
          date: schedule.date,
          start_time: schedule.startTime,
          end_time: schedule.endTime,
          is_available: schedule.isAvailable,
        }));
        
        console.log('保存するデータ:', insertData);

        const { error: insertError } = await supabase
          .from('schedules')
          .insert(insertData);

        if (insertError) throw insertError;
      }

      setMessage('スケジュールを保存しました');
      await fetchSchedules(); // 最新データを再取得
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
      console.error('スケジュール保存エラー:', error);
      setMessage('エラー: ' + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const getSchedulesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules.filter(schedule => schedule.date === dateStr);
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() - 7);
    setCurrentWeek(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(newDate);
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };



  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center">読み込み中...</div>
      </Card>
    );
  }

  const weekDates = getWeekDates();

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          スケジュール管理
        </h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            ←
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            今日
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            →
          </Button>
          <Button onClick={saveSchedules} loading={saving} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            保存
          </Button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.includes('エラー') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}

      {/* 週の日付ヘッダー */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {weekDates.map((date, index) => (
          <div
            key={index}
            className="text-center p-2 rounded bg-slate-50 text-slate-600"
          >
            <div className="text-sm font-medium">
              {['日', '月', '火', '水', '木', '金', '土'][date.getDay()]}
            </div>
            <div className="text-lg">{date.getDate()}</div>
          </div>
        ))}
      </div>

      {/* スケジュール表示 */}
      <div className="space-y-4">
        {weekDates.map((date, dayIndex) => {
          const daySchedules = getSchedulesForDate(date);
          const dateStr = date.toISOString().split('T')[0];
          
          return (
            <div key={dayIndex} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-slate-800">
                  {date.getMonth() + 1}月{date.getDate()}日（{['日', '月', '火', '水', '木', '金', '土'][date.getDay()]}）
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addTimeSlot(dateStr)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  時間枠を追加
                </Button>
              </div>

              {daySchedules.length === 0 ? (
                <div className="text-slate-500 text-sm py-4 text-center">
                  この日は時間枠が設定されていません
                </div>
              ) : (
                <div className="space-y-3">
                  {daySchedules.map((schedule, index) => {
                    const scheduleIndex = schedules.findIndex(s => 
                      s.date === schedule.date && 
                      s.startTime === schedule.startTime && 
                      s.endTime === schedule.endTime
                    );
                    
                    return (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <Input
                            type="time"
                            value={schedule.startTime}
                            onChange={(e) => updateTimeSlot(scheduleIndex, 'startTime', e.target.value)}
                            className="w-24"
                          />
                          <span className="text-slate-500">-</span>
                          <Input
                            type="time"
                            value={schedule.endTime}
                            onChange={(e) => updateTimeSlot(scheduleIndex, 'endTime', e.target.value)}
                            className="w-24"
                          />
                        </div>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={schedule.isAvailable}
                            onChange={(e) => updateTimeSlot(scheduleIndex, 'isAvailable', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm text-slate-600">利用可能</span>
                        </label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeTimeSlot(scheduleIndex)}
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
    </Card>
  );
}; 