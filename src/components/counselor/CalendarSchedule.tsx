import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

import { Input } from '../ui/Input';

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
  const [currentMonth, setCurrentMonth] = useState(new Date()); // 現在の日付から開始
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
  const fetchSchedules = useCallback(async (year: number, month: number) => {
    setIsLoading(true);
    try {
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      console.log('CalendarSchedule: スケジュール取得開始');
      console.log('counselorId:', counselorId);
      console.log('startDate:', startDate);
      console.log('endDate:', endDate);

      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('counselor_id', counselorId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date, start_time');

      console.log('CalendarSchedule: スケジュール取得レスポンス:', { data, error });

      if (error) {
        console.error('スケジュール取得エラー:', error);
        return;
      }

      setSchedules(data || []);
      console.log('CalendarSchedule: 設定されたスケジュール:', data || []);
    } catch (error) {
      console.error('スケジュール取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  }, [counselorId]);

  // 指定日のスケジュールを取得
  const getSchedulesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules.filter(schedule => schedule.date === dateStr);
  };

  // 月が変更された時の処理
  useEffect(() => {
    fetchSchedules(currentMonth.getFullYear(), currentMonth.getMonth());
  }, [currentMonth, fetchSchedules]);

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
    console.log('保存ボタンがクリックされました');
    console.log('selectedDate:', selectedDate);
    console.log('timeSlots:', timeSlots);
    console.log('counselorId:', counselorId);
    
    if (!selectedDate) {
      console.log('日付が選択されていません');
      alert('日付を選択してください');
      return;
    }

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
    <div className="space-y-8">
      {/* 美しいヘッダー */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl shadow-2xl p-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              カレンダースケジュール管理
            </h2>
            <p className="text-blue-100 text-lg">スケジュールを美しく管理しましょう</p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={goToPreviousMonth} 
              className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 transform hover:scale-110 backdrop-blur-sm"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 text-center">
              <span className="text-2xl font-bold">
                {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
              </span>
            </div>
            <button 
              onClick={goToNextMonth} 
              className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 transform hover:scale-110 backdrop-blur-sm"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* 美しいカレンダー */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-8">
              {/* 美しい曜日ヘッダー */}
              <div className="grid grid-cols-7 gap-3 mb-6">
                {weekDays.map(day => (
                  <div key={day} className="text-center text-sm font-bold text-gray-600 py-4 bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    {day}
                  </div>
                ))}
              </div>

              {/* 美しいカレンダーグリッド */}
              <div className="grid grid-cols-7 gap-3">
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
                        min-h-28 p-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg
                        ${isCurrentMonth ? 'bg-white' : 'bg-gray-50/50'}
                        ${isSelected ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 ring-4 ring-purple-200 shadow-xl scale-105' : 'border-gray-200 hover:border-purple-300'}
                        ${hasSchedules ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50' : ''}
                      `}
                    >
                      <div className="text-xl font-bold text-gray-900 mb-3">
                        {date.getDate()}
                      </div>
                      {hasSchedules && (
                        <div className="mt-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-sm">
                            {dateSchedules.length}枠
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 美しい時間枠設定 */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-8">
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {selectedDate ? (
                    `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日`
                  ) : (
                    '日付を選択してください'
                  )}
                </h3>
                {selectedDate && (
                  <p className="text-gray-600">スケジュールを設定しましょう</p>
                )}
              </div>

              {selectedDate && (
                <div className="space-y-6">
                  {timeSlots.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-lg font-medium">時間枠が設定されていません</p>
                      <p className="text-gray-400 text-sm mt-2">下のボタンから追加してください</p>
                    </div>
                  )}
                  
                  {timeSlots.map((slot, index) => (
                    <div key={index} className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 shadow-lg">
                      <div className="space-y-6">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">開始時間</label>
                            <Input
                              type="time"
                              value={slot.start}
                              onChange={(e) => updateTimeSlot(index, 'start', e.target.value)}
                              className="w-full text-xl py-4 px-4 rounded-xl border-2 border-blue-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 bg-white shadow-sm"
                            />
                          </div>
                          <div className="flex items-center justify-center w-12 h-12">
                            <span className="text-2xl font-bold text-purple-600">〜</span>
                          </div>
                          <div className="flex-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">終了時間</label>
                            <Input
                              type="time"
                              value={slot.end}
                              onChange={(e) => updateTimeSlot(index, 'end', e.target.value)}
                              className="w-full text-xl py-4 px-4 rounded-xl border-2 border-blue-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 bg-white shadow-sm"
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <input
                              type="checkbox"
                              id={`available-${index}`}
                              checked={slot.is_available}
                              onChange={(e) => updateTimeSlot(index, 'is_available', e.target.checked)}
                              className="w-6 h-6 rounded-lg border-2 border-purple-300 text-purple-600 focus:ring-4 focus:ring-purple-200"
                            />
                            <label 
                              htmlFor={`available-${index}`}
                              className="text-lg text-gray-700 cursor-pointer font-semibold"
                            >
                              利用可能
                            </label>
                          </div>
                          <button
                            onClick={() => removeTimeSlot(index)}
                            className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-semibold hover:from-red-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button 
                    onClick={addTimeSlot} 
                    className="w-full py-6 text-xl font-bold rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl border-2 border-transparent hover:border-blue-400"
                  >
                    <svg className="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    時間枠を追加
                  </button>

                  <button
                    onClick={saveSchedules}
                    disabled={isLoading}
                    className="w-full py-6 text-xl font-bold rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                        保存中...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        保存
                      </div>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 