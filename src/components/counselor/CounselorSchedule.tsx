import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { Calendar, Clock, Check, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface CounselorScheduleProps {
  counselorId: string;
  onTimeSlotSelect?: (date: string, startTime: string, endTime: string) => void;
  selectedDate?: Date;
  selectedTime?: string;
  schedules?: TimeSlot[]; // 外部からスケジュールを受け取る場合
}

interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export const CounselorSchedule: React.FC<CounselorScheduleProps> = ({
  counselorId,
  onTimeSlotSelect,
  selectedDate,
  selectedTime,
  schedules: externalSchedules,
}) => {
  const { isAuthenticated } = useAuth();
  const [schedules, setSchedules] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      console.log('スケジュール取得開始:', counselorId);
      
      // 今日から1週間後のスケジュールを取得
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 7);
      
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('counselor_id', counselorId)
        .eq('is_available', true)
        .gte('date', today.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date, start_time');

      console.log('スケジュール取得レスポンス:', { data, error });

      if (error) throw error;

      const formattedSchedules: TimeSlot[] = data.map(schedule => ({
        date: schedule.date,
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        isAvailable: schedule.is_available,
      }));

      console.log('フォーマット後のスケジュール:', formattedSchedules);
      setSchedules(formattedSchedules);
    } catch (error: unknown) {
      console.error('スケジュール取得エラー:', error);
    } finally {
      setLoading(false);
    }
  }, [counselorId]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    if (externalSchedules) {
      // 外部からスケジュールが渡された場合
      const formattedSchedules: TimeSlot[] = externalSchedules.map(schedule => ({
        date: schedule.date,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isAvailable: schedule.isAvailable,
      }));
      setSchedules(formattedSchedules);
      setLoading(false);
    } else {
      // 内部でスケジュールを取得
      fetchSchedules();
    }
  }, [counselorId, externalSchedules, fetchSchedules, isAuthenticated]);

  const getSchedulesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const daySchedules = schedules.filter(schedule => schedule.date === dateStr);
    return daySchedules;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

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

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelectedDate = (date: Date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const handleTimeSlotClick = (date: string, startTime: string, endTime: string) => {
    if (onTimeSlotSelect) {
      onTimeSlotSelect(date, startTime, endTime);
    }
  };

  const isTimeSlotSelected = (date: string, startTime: string) => {
    if (!selectedDate || !selectedTime) return false;
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    return selectedDateStr === date && selectedTime === startTime;
  };

  if (!isAuthenticated) {
    return (
      <Card className="p-6">
        <div className="text-center text-slate-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p>スケジュールを表示するにはログインが必要です</p>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center">スケジュールを読み込み中...</div>
      </Card>
    );
  }

  const weekDates = getWeekDates();

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          スケジュール
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
        </div>
      </div>

      {/* 週の日付ヘッダー */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {weekDates.map((date, index) => (
          <div
            key={index}
            className={`text-center p-2 rounded ${
              isToday(date)
                ? 'bg-blue-100 text-blue-800 font-medium'
                : isSelectedDate(date)
                ? 'bg-indigo-100 text-indigo-800 font-medium'
                : 'bg-slate-50 text-slate-600'
            }`}
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
          
          return (
            <div key={dayIndex} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-slate-800">
                  {date.getMonth() + 1}月{date.getDate()}日（{['日', '月', '火', '水', '木', '金', '土'][date.getDay()]}）
                </h3>
                {daySchedules.length > 0 && (
                  <span className="text-sm text-slate-500">
                    {daySchedules.length}個の時間枠
                  </span>
                )}
              </div>

              {daySchedules.length === 0 ? (
                <div className="text-slate-500 text-sm py-4 text-center">
                  この日は予約可能な時間枠がありません
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {daySchedules.map((schedule, index) => {
                    const isSelected = isTimeSlotSelected(schedule.date, schedule.startTime);
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleTimeSlotClick(schedule.date, schedule.startTime, schedule.endTime)}
                        className={`p-3 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-indigo-100 border-indigo-300 text-indigo-800'
                            : schedule.isAvailable
                            ? 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100'
                            : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                        }`}
                        disabled={!schedule.isAvailable}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">
                              {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                            </span>
                          </div>
                          {isSelected ? (
                            <Check className="w-4 h-4 text-indigo-600" />
                          ) : schedule.isAvailable ? (
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          ) : (
                            <X className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="text-xs mt-1">
                          {schedule.isAvailable ? '予約可能' : '予約不可'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {schedules.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p>このカウンセラーのスケジュールはまだ設定されていません</p>
        </div>
      )}
    </Card>
  );
}; 