import React, { useState } from 'react';
import { MessageSquare, Calendar, Clock, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { ServiceType } from '../../types';
import { TimeSlot } from '../../hooks/useSchedule';
import { SERVICES } from '../../constants/services';
import { formatCurrency, formatDate, formatTime } from '../../lib/utils';

interface SimpleBookingFormProps {
  counselorName: string;
  counselorId: string;
  timeSlots: TimeSlot[];
  onSubmit: (bookingData: {
    serviceType: ServiceType;
    scheduledAt: Date;
    amount: number;
    notes?: string;
  }) => void;
  loading?: boolean;
}

type BookingStep = 'service' | 'datetime' | 'confirm';

export const SimpleBookingForm: React.FC<SimpleBookingFormProps> = ({
  counselorName,
  counselorId,
  timeSlots,
  onSubmit,
  loading = false
}) => {
  const [currentStep, setCurrentStep] = useState<BookingStep>('service');
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState('');

  const selectedServiceData = selectedService 
    ? SERVICES.find(s => s.type === selectedService)
    : null;

  const getScheduledDateTime = (): Date | null => {
    if (!selectedTimeSlot) return null;
    
    const [year, month, day] = selectedTimeSlot.date.split('-').map(Number);
    const [hours, minutes] = selectedTimeSlot.startTime.split(':').map(Number);
    
    return new Date(year, month - 1, day, hours, minutes);
  };

  const handleNext = () => {
    if (currentStep === 'service' && selectedService) {
      setCurrentStep('datetime');
    } else if (currentStep === 'datetime' && selectedTimeSlot) {
      setCurrentStep('confirm');
    }
  };

  const handleBack = () => {
    if (currentStep === 'datetime') {
      setCurrentStep('service');
    } else if (currentStep === 'confirm') {
      setCurrentStep('datetime');
    }
  };

  const handleSubmit = () => {
    if (!selectedService || !selectedTimeSlot || !selectedServiceData) return;

    const scheduledAt = getScheduledDateTime();
    if (!scheduledAt) return;

    onSubmit({
      serviceType: selectedService,
      scheduledAt,
      amount: selectedServiceData.price,
      notes: notes.trim() || undefined
    });
  };

  const renderProgressBar = () => {
    const steps = [
      { key: 'service', label: 'サービス選択', icon: MessageSquare },
      { key: 'datetime', label: '日時選択', icon: Calendar },
      { key: 'confirm', label: '確認', icon: Check }
    ];

    const currentIndex = steps.findIndex(step => step.key === currentStep);

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.key === currentStep;
            const isCompleted = index < currentIndex;
            
            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                  ${isActive 
                    ? 'bg-indigo-600 border-indigo-600 text-white' 
                    : isCompleted
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'bg-slate-100 border-slate-300 text-slate-400'
                  }
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="ml-3 flex-1">
                  <div className={`text-sm font-medium ${
                    isActive ? 'text-indigo-600' : isCompleted ? 'text-green-600' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-full h-0.5 mx-4 ${
                    isCompleted ? 'bg-green-600' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderServiceSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">サービスを選択してください</h2>
        <p className="text-slate-600">{counselorName}さんが提供するサービスから選択してください</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SERVICES.map((service) => (
          <Card
            key={service.type}
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
              selectedService === service.type
                ? 'border-indigo-500 bg-indigo-50 shadow-md'
                : 'border-slate-200 hover:border-indigo-300'
            }`}
            onClick={() => setSelectedService(service.type)}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-slate-800 mb-2">
                    {service.name}
                  </h3>
                  <p className="text-slate-600 text-sm mb-3">
                    {service.description}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-slate-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{service.duration}分</span>
                    </div>
                    <div className="font-semibold text-indigo-600">
                      {formatCurrency(service.price)}
                    </div>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedService === service.type
                    ? 'border-indigo-500 bg-indigo-500'
                    : 'border-slate-300'
                }`}>
                  {selectedService === service.type && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderDateTimeSelection = () => {
    // 日付別にタイムスロットをグループ化
    const slotsByDate = timeSlots.reduce((acc, slot) => {
      if (!acc[slot.date]) {
        acc[slot.date] = [];
      }
      acc[slot.date].push(slot);
      return acc;
    }, {} as Record<string, TimeSlot[]>);

    const dates = Object.keys(slotsByDate).sort();

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">日時を選択してください</h2>
          <p className="text-slate-600">ご希望の日程と時間を選択してください</p>
        </div>

        <div className="space-y-4">
          {dates.slice(0, 7).map((date) => {
            const dateSlots = slotsByDate[date];
            const dateObj = new Date(date);
            
            return (
              <Card key={date} className="p-4">
                <div className="mb-3">
                  <h3 className="font-semibold text-lg text-slate-800">
                    {formatDate(dateObj)} ({dateObj.toLocaleDateString('ja-JP', { weekday: 'short' })})
                  </h3>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {dateSlots.map((slot, index) => (
                    <button
                      key={`${slot.date}-${slot.startTime}-${index}`}
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        selectedTimeSlot === slot
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-indigo-100 hover:text-indigo-700'
                      }`}
                    >
                      {formatTime(slot.startTime)}
                    </button>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        {dates.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">利用可能な時間枠がありません</p>
            <p className="text-slate-400 text-sm">別の日程をお試しください</p>
          </div>
        )}
      </div>
    );
  };

  const renderConfirmation = () => {
    const scheduledAt = getScheduledDateTime();
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">予約内容を確認してください</h2>
          <p className="text-slate-600">以下の内容で予約を確定します</p>
        </div>

        <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">カウンセラー:</span>
              <span className="font-semibold text-slate-800">{counselorName}さん</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-slate-600">サービス:</span>
              <span className="font-semibold text-slate-800">{selectedServiceData?.name}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-slate-600">日時:</span>
              <span className="font-semibold text-slate-800">
                {scheduledAt && `${formatDate(scheduledAt)} ${formatTime(scheduledAt.toTimeString().slice(0, 5))}`}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-slate-600">所要時間:</span>
              <span className="font-semibold text-slate-800">{selectedServiceData?.duration}分</span>
            </div>
            
            <div className="flex items-center justify-between border-t border-indigo-200 pt-4">
              <span className="text-lg font-semibold text-slate-800">料金:</span>
              <span className="text-2xl font-bold text-indigo-600">
                {selectedServiceData && formatCurrency(selectedServiceData.price)}
              </span>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            メッセージ・ご要望（任意）
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="カウンセラーへのメッセージやご要望がございましたらご記入ください"
            rows={3}
            className="w-full"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* カウンセラー情報ヘッダー */}
      <Card className="mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{counselorName}さんとの予約</h1>
            <p className="text-indigo-100">
              ステップに従って予約を完了してください
            </p>
          </div>
        </div>
      </Card>

      {/* プログレスバー */}
      {renderProgressBar()}

      {/* コンテンツエリア */}
      <Card className="p-8">
        {currentStep === 'service' && renderServiceSelection()}
        {currentStep === 'datetime' && renderDateTimeSelection()}
        {currentStep === 'confirm' && renderConfirmation()}
      </Card>

      {/* ナビゲーションボタン */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 'service'}
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>戻る</span>
        </Button>

        <div className="flex space-x-3">
          {currentStep !== 'confirm' ? (
            <Button
              onClick={handleNext}
              disabled={
                (currentStep === 'service' && !selectedService) ||
                (currentStep === 'datetime' && !selectedTimeSlot)
              }
              className="flex items-center space-x-2"
            >
              <span>次へ</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              loading={loading}
              className="bg-green-600 hover:bg-green-700 flex items-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>予約を確定する</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};