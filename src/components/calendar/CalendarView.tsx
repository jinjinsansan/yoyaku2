import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface TimeSlot {
  id: string;
  counselorId: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isBooked?: boolean;
  bookingId?: string;
}

interface CalendarViewProps {
  counselorId?: string;
  timeSlots: TimeSlot[];
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onTimeSlotSelect?: (timeSlot: TimeSlot) => void;
  selectedTimeSlot?: TimeSlot;
  loading?: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  counselorId,
  timeSlots,
  selectedDate = new Date(),
  onDateSelect,
  onTimeSlotSelect,
  selectedTimeSlot,
  loading = false
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  // 月の日付配列を生成
  const monthDates = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // 週の始まりに調整

    const dates = [];
    const current = new Date(startDate);
    
    // 6週間分の日付を生成
    for (let week = 0; week < 6; week++) {
      for (let day = 0; day < 7; day++) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    }
    
    return dates;
  }, [currentMonth]);

  // 日付ごとの利用可能なタイムスロット数を計算
  const getAvailableSlotsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return timeSlots.filter(slot => 
      slot.date === dateStr && 
      slot.isAvailable && 
      !slot.isBooked &&
      (!counselorId || slot.counselorId === counselorId)
    ).length;
  };

  // 選択された日付のタイムスロットを取得
  const getTimeSlotsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return timeSlots
      .filter(slot => 
        slot.date === dateStr &&
        (!counselorId || slot.counselorId === counselorId)
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    onDateSelect?.(date);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelectedDate = (date: Date) => {
    return selectedDate.toDateString() === date.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // HH:MM format
  };

  const getTimeSlotStatus = (slot: TimeSlot) => {
    if (slot.isBooked) return 'booked';
    if (!slot.isAvailable) return 'unavailable';
    return 'available';
  };

  const getTimeSlotClassName = (slot: TimeSlot) => {
    const isSelected = selectedTimeSlot?.id === slot.id;
    const status = getTimeSlotStatus(slot);
    
    const baseClasses = 'px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer';
    
    if (isSelected) {
      return `${baseClasses} bg-indigo-600 text-white`;
    }
    
    switch (status) {
      case 'available':
        return `${baseClasses} bg-green-50 text-green-700 hover:bg-green-100 border border-green-200`;
      case 'booked':
        return `${baseClasses} bg-red-50 text-red-700 border border-red-200 cursor-not-allowed`;
      case 'unavailable':
        return `${baseClasses} bg-slate-50 text-slate-500 border border-slate-200 cursor-not-allowed`;
      default:
        return baseClasses;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        {/* カレンダーヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-800">
            {currentMonth.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
          </h3>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
            <div
              key={day}
              className={`p-2 text-sm font-medium text-center ${
                index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-slate-600'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* カレンダーグリッド */}
        <div className="grid grid-cols-7 gap-1">
          {monthDates.map((date, index) => {
            const availableSlots = getAvailableSlotsForDate(date);
            const isCurrentMonthDate = isCurrentMonth(date);
            const isSelectedDateValue = isSelectedDate(date);
            const isTodayValue = isToday(date);
            const isPastDateValue = isPastDate(date);

            return (
              <button
                key={index}
                onClick={() => !isPastDateValue && handleDateClick(date)}
                disabled={isPastDateValue}
                className={`
                  relative p-2 h-12 text-sm font-medium rounded transition-colors
                  ${isCurrentMonthDate ? 'text-slate-900' : 'text-slate-400'}
                  ${isPastDateValue ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-50'}
                  ${isSelectedDateValue ? 'bg-indigo-100 text-indigo-900' : ''}
                  ${isTodayValue ? 'ring-2 ring-indigo-500' : ''}
                `}
              >
                <span>{date.getDate()}</span>
                {availableSlots > 0 && isCurrentMonthDate && !isPastDateValue && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    <div className="text-xs text-green-600 mt-0.5">{availableSlots}</div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* 凡例 */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
            空き時間あり
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-indigo-500 rounded-full mr-1"></div>
            選択中
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 border-2 border-indigo-500 rounded-full mr-1"></div>
            今日
          </div>
        </div>
      </Card>

      {/* 選択された日付のタイムスロット */}
      {selectedDate && (
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Clock className="w-5 h-5 text-slate-600 mr-2" />
            <h4 className="text-lg font-semibold text-slate-800">
              {selectedDate.toLocaleDateString('ja-JP', {
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })} の空き時間
            </h4>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-slate-500 mt-4">読み込み中...</p>
            </div>
          ) : (
            <>
              {getTimeSlotsForDate(selectedDate).length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">この日は空き時間がありません</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {getTimeSlotsForDate(selectedDate).map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => {
                        if (slot.isAvailable && !slot.isBooked) {
                          onTimeSlotSelect?.(slot);
                        }
                      }}
                      disabled={!slot.isAvailable || slot.isBooked}
                      className={getTimeSlotClassName(slot)}
                    >
                      <div className="flex flex-col items-center">
                        <span>{formatTime(slot.startTime)}</span>
                        <span className="text-xs opacity-75">
                          {getTimeSlotStatus(slot) === 'booked' ? '予約済み' :
                           getTimeSlotStatus(slot) === 'unavailable' ? '不可' : '空き'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>
      )}
    </div>
  );
};