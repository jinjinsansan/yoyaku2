import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useRealtimeSchedule } from '../../hooks/useRealtimeSchedule';
import { TimeSlot } from '../../hooks/useSchedule';
import { CalendarView } from '../calendar/CalendarView';
import { Card } from '../ui/Card';

interface CounselorScheduleProps {
  counselorId: string;
  onTimeSlotSelect?: (timeSlot: TimeSlot) => void;
  selectedTimeSlot?: TimeSlot;
}

export const CounselorSchedule: React.FC<CounselorScheduleProps> = ({
  counselorId,
  onTimeSlotSelect,
  selectedTimeSlot
}) => {
  const { isAuthenticated } = useAuth();
  const { timeSlots, loading, error } = useRealtimeSchedule(counselorId);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-red-300" />
          <p>スケジュールの読み込みに失敗しました</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Calendar className="w-6 h-6 text-indigo-600" />
        <h2 className="text-xl font-semibold text-slate-800">予約可能な日時</h2>
      </div>
      
      <CalendarView
        counselorId={counselorId}
        timeSlots={timeSlots}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        onTimeSlotSelect={onTimeSlotSelect}
        selectedTimeSlot={selectedTimeSlot}
        loading={loading}
      />
    </div>
  );
}; 