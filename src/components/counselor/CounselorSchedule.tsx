import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { Schedule } from '../../types';
import { Calendar, Clock, Check, X } from 'lucide-react';

interface CounselorScheduleProps {
  counselorId: string;
  onTimeSlotSelect?: (dayOfWeek: number, startTime: string, endTime: string) => void;
  selectedDate?: Date;
  selectedTime?: string;
  schedules?: any[]; // 外部からスケジュールを受け取る場合
}

interface TimeSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: '日', fullLabel: '日曜日' },
  { value: 1, label: '月', fullLabel: '月曜日' },
  { value: 2, label: '火', fullLabel: '火曜日' },
  { value: 3, label: '水', fullLabel: '水曜日' },
  { value: 4, label: '木', fullLabel: '木曜日' },
  { value: 5, label: '金', fullLabel: '金曜日' },
  { value: 6, label: '土', fullLabel: '土曜日' },
];

export const CounselorSchedule: React.FC<CounselorScheduleProps> = ({
  counselorId,
  onTimeSlotSelect,
  selectedDate,
  selectedTime,
  schedules: externalSchedules,
}) => {
  const [schedules, setSchedules] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  useEffect(() => {
    if (externalSchedules) {
      // 外部からスケジュールが渡された場合
      console.log('🔍 DEBUG: externalSchedules received:', externalSchedules);
      const formattedSchedules: TimeSlot[] = externalSchedules.map(schedule => ({
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isAvailable: schedule.isAvailable,
      }));
      console.log('🔍 DEBUG: formattedSchedules:', formattedSchedules);
      setSchedules(formattedSchedules);
      setLoading(false);
    } else {
      // 内部でスケジュールを取得
      fetchSchedules();
    }
  }, [counselorId, externalSchedules]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('counselor_id', counselorId)
        .eq('is_available', true)
        .order('day_of_week');

      if (error) throw error;

      console.log('🔍 DEBUG: Supabase data:', data);

      const formattedSchedules: TimeSlot[] = data.map(schedule => ({
        dayOfWeek: schedule.day_of_week,
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        isAvailable: schedule.is_available,
      }));

      console.log('🔍 DEBUG: Internal formattedSchedules:', formattedSchedules);
      setSchedules(formattedSchedules);
    } catch (error: any) {
      console.error('スケジュール取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSchedulesForDay = (date: Date) => {
    const dayOfWeek = date.getDay();
    const daySchedules = schedules.filter(schedule => schedule.dayOfWeek === dayOfWeek);
    console.log('🔍 DEBUG: getSchedulesForDay - date:', date, 'dayOfWeek:', dayOfWeek, 'schedules:', schedules, 'daySchedules:', daySchedules);
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

  const handleTimeSlotClick = (dayOfWeek: number, startTime: string, endTime: string) => {
    if (onTimeSlotSelect) {
      onTimeSlotSelect(dayOfWeek, startTime, endTime);
    }
  };

  const isTimeSlotSelected = (dayOfWeek: number, startTime: string) => {
    if (!selectedDate || !selectedTime) return false;
    const selectedDayOfWeek = selectedDate.getDay();
    return selectedDayOfWeek === dayOfWeek && selectedTime === startTime;
  };

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
            <div className="text-sm font-medium">{DAYS_OF_WEEK[date.getDay()].label}</div>
            <div className="text-lg">{date.getDate()}</div>
          </div>
        ))}
      </div>

      {/* スケジュール表示 */}
      <div className="space-y-4">
        {weekDates.map((date, dayIndex) => {
          const dayOfWeek = date.getDay();
          const daySchedules = getSchedulesForDay(date);
          
          return (
            <div key={dayOfWeek} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-slate-800">
                  {DAYS_OF_WEEK[dayOfWeek].fullLabel} ({date.getMonth() + 1}/{date.getDate()})
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
                    const isSelected = isTimeSlotSelected(dayOfWeek, schedule.startTime);
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleTimeSlotClick(dayOfWeek, schedule.startTime, schedule.endTime)}
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