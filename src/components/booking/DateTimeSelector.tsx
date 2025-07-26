import React, { useState, useMemo } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CounselorSchedule } from '../counselor/CounselorSchedule';
import { Schedule } from '../../types';

interface DateTimeSelectorProps {
  schedules: Schedule[];
  selectedDateTime: Date | null;
  onDateTimeSelect: (dateTime: Date) => void;
  counselorId: string;
}

export const DateTimeSelector: React.FC<DateTimeSelectorProps> = ({
  schedules,
  selectedDateTime,
  onDateTimeSelect,
  counselorId
}) => {
  const handleTimeSlotSelect = (dayOfWeek: number, startTime: string, endTime: string) => {
    // 次の該当する曜日の日付を計算
    const today = new Date();
    const targetDate = new Date(today);
    const daysUntilTarget = (dayOfWeek - today.getDay() + 7) % 7;
    
    // 今日がその曜日でない場合は、次の該当曜日を設定
    if (daysUntilTarget === 0 && today.getDay() === dayOfWeek) {
      targetDate.setDate(today.getDate() + 7);
    } else {
      targetDate.setDate(today.getDate() + daysUntilTarget);
    }
    
    // 時間を設定
    const [hours, minutes] = startTime.split(':').map(Number);
    targetDate.setHours(hours, minutes, 0, 0);
    
    onDateTimeSelect(targetDate);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-800">日時を選択</h3>
      
      {/* スケジュール表示 */}
      <CounselorSchedule
        counselorId={counselorId}
        onTimeSlotSelect={handleTimeSlotSelect}
        selectedDate={selectedDateTime}
        selectedTime={selectedDateTime ? selectedDateTime.toTimeString().slice(0, 5) : undefined}
      />

      {/* 選択された日時の確認 */}
      {selectedDateTime && (
        <Card className="bg-indigo-50 border border-indigo-200">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <span className="font-medium text-indigo-800">
              選択された日時: {selectedDateTime.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </Card>
      )}
    </div>
  );
};