import React, { useState, useMemo } from 'react';
import { Calendar, Check, Clock, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { TimeSlot } from '../../hooks/useSchedule';

interface MultiDateSelectorProps {
  timeSlots: TimeSlot[];
  onDatesSelect?: (dates: Date[]) => void;
  onTimeSlotSelect?: (timeSlot: TimeSlot) => void;
  selectedTimeSlot?: TimeSlot;
  maxSelections?: number;
  loading?: boolean;
}

export const MultiDateSelector: React.FC<MultiDateSelectorProps> = ({
  timeSlots,
  onDatesSelect,
  onTimeSlotSelect,
  selectedTimeSlot,
  maxSelections = 5,
  loading = false
}) => {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 月の日付配列を生成
  const monthDates = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const dates = [];
    const current = new Date(startDate);
    
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
      !slot.isBooked
    );
  };

  // 選択された日付のタイムスロットを取得
  const getTimeSlotsForSelectedDates = () => {
    const dateStrings = selectedDates.map(date => date.toISOString().split('T')[0]);
    return timeSlots
      .filter(slot => 
        dateStrings.includes(slot.date) &&
        slot.isAvailable &&
        !slot.isBooked
      )
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        return dateCompare !== 0 ? dateCompare : a.startTime.localeCompare(b.startTime);
      });
  };

  const handleDateClick = (date: Date) => {
    const dateStr = date.toDateString();
    const isSelected = selectedDates.some(d => d.toDateString() === dateStr);
    
    if (isSelected) {
      // 既に選択されている場合は除去
      const newSelectedDates = selectedDates.filter(d => d.toDateString() !== dateStr);
      setSelectedDates(newSelectedDates);
      onDatesSelect?.(newSelectedDates);
    } else if (selectedDates.length < maxSelections) {
      // 選択上限に達していない場合は追加
      const newSelectedDates = [...selectedDates, date].sort((a, b) => a.getTime() - b.getTime());
      setSelectedDates(newSelectedDates);
      onDatesSelect?.(newSelectedDates);
    }
  };

  const clearSelection = () => {
    setSelectedDates([]);
    onDatesSelect?.([]);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelectedDate = (date: Date) => {
    return selectedDates.some(d => d.toDateString() === date.toDateString());
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
    return time.substring(0, 5);
  };

  const availableSlots = getTimeSlotsForSelectedDates();

  return (
    <div className="space-y-6">
      <Card className="p-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              複数日程から選択
            </h3>
            <p className="text-sm text-slate-600">
              最大{maxSelections}日まで選択できます（{selectedDates.length}/{maxSelections}）
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handlePrevMonth}>
              ←
            </Button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              {currentMonth.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
            </span>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              →
            </Button>
          </div>
        </div>

        {/* カレンダーヘッダー */}
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
            const hasAvailableSlots = availableSlots.length > 0;

            return (
              <button
                key={index}
                onClick={() => !isPastDateValue && hasAvailableSlots && handleDateClick(date)}
                disabled={isPastDateValue || !hasAvailableSlots}
                className={`
                  relative p-2 h-14 text-sm font-medium rounded transition-colors
                  ${isCurrentMonthDate ? 'text-slate-900' : 'text-slate-400'}
                  ${isPastDateValue || !hasAvailableSlots 
                    ? 'cursor-not-allowed opacity-50' 
                    : 'cursor-pointer hover:bg-slate-50'
                  }
                  ${isSelectedDateValue ? 'bg-indigo-100 text-indigo-900 ring-2 ring-indigo-500' : ''}
                  ${isTodayValue ? 'ring-2 ring-blue-500' : ''}
                `}
              >
                <span>{date.getDate()}</span>
                {hasAvailableSlots && isCurrentMonthDate && !isPastDateValue && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                    <div className={`w-1 h-1 rounded-full ${
                      isSelectedDateValue ? 'bg-indigo-600' : 'bg-green-500'
                    }`}></div>
                    <div className={`text-xs mt-0.5 ${
                      isSelectedDateValue ? 'text-indigo-600' : 'text-green-600'
                    }`}>
                      {availableSlots.length}
                    </div>
                  </div>
                )}
                {isSelectedDateValue && (
                  <div className="absolute top-1 right-1">
                    <Check className="w-3 h-3 text-indigo-600" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* 選択された日付の表示 */}
        {selectedDates.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-slate-700">選択した日程</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="text-red-600 hover:text-red-700"
              >
                すべてクリア
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedDates.map((date, index) => (
                <Badge key={index} variant="primary" className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {date.toLocaleDateString('ja-JP', {
                      month: 'short',
                      day: 'numeric',
                      weekday: 'short'
                    })}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDateClick(date);
                    }}
                    className="ml-1 hover:bg-white hover:bg-opacity-20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

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
            <div className="w-2 h-2 border-2 border-blue-500 rounded-full mr-1"></div>
            今日
          </div>
        </div>
      </Card>

      {/* 選択された日程の時間枠 */}
      {availableSlots.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Clock className="w-5 h-5 text-slate-600 mr-2" />
            <h4 className="text-lg font-semibold text-slate-800">
              選択日程の空き時間一覧
            </h4>
            <Badge variant="info" className="ml-2">
              {availableSlots.length}個の時間枠
            </Badge>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-slate-500 mt-4">読み込み中...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 日付別にグループ化 */}
              {selectedDates.map(date => {
                const dateStr = date.toISOString().split('T')[0];
                const daySlots = availableSlots.filter(slot => slot.date === dateStr);
                
                if (daySlots.length === 0) return null;

                return (
                  <div key={dateStr} className="border rounded-lg p-4">
                    <h5 className="font-medium text-slate-800 mb-3">
                      {date.toLocaleDateString('ja-JP', {
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long'
                      })}
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {daySlots.map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => onTimeSlotSelect?.(slot)}
                          className={`
                            px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer
                            ${selectedTimeSlot?.id === slot.id
                              ? 'bg-indigo-600 text-white'
                              : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                            }
                          `}
                        >
                          <div className="flex flex-col items-center">
                            <span>{formatTime(slot.startTime)}</span>
                            <span className="text-xs opacity-75">空き</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};