import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

interface Schedule {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface CalendarScheduleProps {
  counselorId: string;
}

export const CalendarSchedule: React.FC<CalendarScheduleProps> = ({ counselorId }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeSlots, setTimeSlots] = useState<{ start: string; end: string; is_available: boolean }[]>([]);

  // 月の日付を生成
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // 前月の日付を追加
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    // 当月の日付を追加
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      days.push({ date: currentDate, isCurrentMonth: true });
    }

    // 翌月の日付を追加（6週分になるように）
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({ date: nextDate, isCurrentMonth: false });
    }

    return days;
  };

  // スケジュールを取得
  const fetchSchedules = async (year: number, month: number) => {
    setIsLoading(true);
    try {
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('counselor_id', counselorId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date, start_time');

      if (error) {
        console.error('スケジュール取得エラー:', error);
        return;
      }

      setSchedules(data || []);
    } catch (error) {
      console.error('スケジュール取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 指定日のスケジュールを取得
  const getSchedulesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules.filter(schedule => schedule.date === dateStr);
  };

  // 月が変更された時の処理
  useEffect(() => {
    fetchSchedules(currentMonth.getFullYear(), currentMonth.getMonth());
  }, [currentMonth, counselorId]);

  // 前月に移動
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // 翌月に移動
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // 日付を選択
  const handleDateClick = (date: Date) => {
    if (date.getMonth() === currentMonth.getMonth()) {
      setSelectedDate(date);
      const dateSchedules = getSchedulesForDate(date);
      setTimeSlots(dateSchedules.map(s => ({
        start: s.start_time,
        end: s.end_time,
        is_available: s.is_available
      })));
    }
  };

  // 時間枠を追加
  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { start: '09:00', end: '10:00', is_available: true }]);
  };

  // 時間枠を削除
  const removeTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  // 時間枠を更新
  const updateTimeSlot = (index: number, field: 'start' | 'end' | 'is_available', value: string | boolean) => {
    const updated = [...timeSlots];
    updated[index] = { ...updated[index], [field]: value };
    setTimeSlots(updated);
  };

  // スケジュールを保存
  const saveSchedules = async () => {
    if (!selectedDate) return;

    setIsLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];

      // 既存のスケジュールを削除
      await supabase
        .from('schedules')
        .delete()
        .eq('counselor_id', counselorId)
        .eq('date', dateStr);

      // 新しいスケジュールを追加
      if (timeSlots.length > 0) {
        const newSchedules = timeSlots.map(slot => ({
          counselor_id: counselorId,
          date: dateStr,
          start_time: slot.start,
          end_time: slot.end,
          is_available: slot.is_available
        }));

        const { error } = await supabase
          .from('schedules')
          .insert(newSchedules);

        if (error) {
          console.error('スケジュール保存エラー:', error);
          return;
        }
      }

      // スケジュールを再取得
      await fetchSchedules(currentMonth.getFullYear(), currentMonth.getMonth());
      
      alert('スケジュールを保存しました');
    } catch (error) {
      console.error('スケジュール保存エラー:', error);
      alert('スケジュールの保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">カレンダースケジュール管理</h2>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={goToPreviousMonth} 
            variant="outline" 
            size="sm"
            className="px-3 py-2"
          >
            ←
          </Button>
          <span className="text-lg font-semibold min-w-[120px] text-center">
            {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
          </span>
          <Button 
            onClick={goToNextMonth} 
            variant="outline" 
            size="sm"
            className="px-3 py-2"
          >
            →
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* カレンダー */}
        <div className="xl:col-span-2">
          <Card>
            <div className="p-4">
              {/* 曜日ヘッダー */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* カレンダーグリッド */}
              <div className="grid grid-cols-7 gap-1">
                {days.map(({ date, isCurrentMonth }, index) => {
                  const dateSchedules = getSchedulesForDate(date);
                  const hasSchedules = dateSchedules.length > 0;
                  const isSelected = selectedDate && 
                    date.toDateString() === selectedDate.toDateString();

                  return (
                    <div
                      key={index}
                      onClick={() => handleDateClick(date)}
                      className={`
                        min-h-[80px] p-2 border rounded cursor-pointer transition-colors
                        ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                        ${isSelected ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200'}
                        ${hasSchedules ? 'border-green-300 bg-green-50' : ''}
                        hover:border-blue-300 hover:shadow-sm
                      `}
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {date.getDate()}
                      </div>
                      {hasSchedules && (
                        <div className="mt-1">
                          <Badge variant="success" size="sm">
                            {dateSchedules.length}枠
                          </Badge>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* 時間枠設定 */}
        <div className="xl:col-span-1">
          <Card>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                {selectedDate ? (
                  `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日`
                ) : (
                  '日付を選択してください'
                )}
              </h3>

              {selectedDate && (
                <div className="space-y-4">
                  {timeSlots.length === 0 && (
                    <div className="text-gray-500 text-center py-4 text-sm">
                      時間枠が設定されていません
                    </div>
                  )}
                  
                  {timeSlots.map((slot, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center space-x-2 flex-1">
                          <Input
                            type="time"
                            value={slot.start}
                            onChange={(e) => updateTimeSlot(index, 'start', e.target.value)}
                            className="flex-1 min-w-[120px]"
                          />
                          <span className="text-gray-500 font-medium">〜</span>
                          <Input
                            type="time"
                            value={slot.end}
                            onChange={(e) => updateTimeSlot(index, 'end', e.target.value)}
                            className="flex-1 min-w-[120px]"
                          />
                        </div>
                        <Button
                          onClick={() => removeTimeSlot(index)}
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          ×
                        </Button>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`available-${index}`}
                          checked={slot.is_available}
                          onChange={(e) => updateTimeSlot(index, 'is_available', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label 
                          htmlFor={`available-${index}`}
                          className="text-sm text-gray-700 cursor-pointer"
                        >
                          利用可能
                        </label>
                      </div>
                    </div>
                  ))}

                  <Button 
                    onClick={addTimeSlot} 
                    variant="outline" 
                    size="sm" 
                    className="w-full py-3"
                  >
                    + 時間枠を追加
                  </Button>

                  <Button
                    onClick={saveSchedules}
                    disabled={isLoading}
                    className="w-full py-3"
                  >
                    {isLoading ? '保存中...' : '保存'}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}; 