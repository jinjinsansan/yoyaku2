import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Settings,
  ChevronLeft,
  ChevronRight,
  Save,
  Trash2,
  Copy,
  RefreshCw,
  MapPin,
  Globe,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { useSchedule } from '../../hooks/useSchedule';
import { useAdvancedSchedule } from '../../hooks/useAdvancedSchedule';
import { formatDate, formatTime } from '../../lib/utils';

interface UnifiedScheduleManagerProps {
  counselorId: string;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => 
  `${i.toString().padStart(2, '0')}:00`
);

export const UnifiedScheduleManager: React.FC<UnifiedScheduleManagerProps> = ({
  counselorId
}) => {
  // 基本スケジュール機能
  const { schedule, loading: scheduleLoading, createSchedule, updateSchedule, deleteSchedule } = useSchedule(counselorId);
  
  // 高度なスケジュール機能
  const {
    scheduleTemplates,
    timeOffPeriods,
    calendarSettings,
    loading: advancedLoading,
    createScheduleTemplate,
    updateScheduleTemplate,
    deleteScheduleTemplate,
    generateBulkSchedule,
    createTimeOff,
    updateTimeOff,
    deleteTimeOff,
    updateCalendarSettings
  } = useAdvancedSchedule(counselorId);

  const [activeView, setActiveView] = useState<'calendar' | 'templates' | 'timeoff' | 'settings'>('calendar');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
    time: string;
    isAvailable?: boolean;
    id?: string;
  } | null>(null);

  // テンプレート作成フォーム
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    weekdays: [] as number[],
    startTime: '09:00',
    endTime: '18:00',
    duration: 60,
    breakBetween: 15,
    isActive: true
  });

  // 休暇フォーム
  const [timeOffForm, setTimeOffForm] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    isRecurring: false,
    recurringPattern: 'weekly' as 'weekly' | 'monthly'
  });

  const loading = scheduleLoading || advancedLoading;

  // カレンダー表示用の日付生成
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  // 特定日のスケジュール取得
  const getDaySchedule = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedule.filter(s => s.date === dateStr);
  };

  // スケジュール作成・更新
  const handleScheduleUpdate = async (date: string, time: string, isAvailable: boolean) => {
    try {
      const existingSlot = schedule.find(s => s.date === date && s.time_slot === time);
      
      if (existingSlot) {
        await updateSchedule(existingSlot.id, { is_available: isAvailable });
      } else if (isAvailable) {
        await createSchedule({
          date,
          time_slot: time,
          is_available: true
        });
      }
      setSelectedSlot(null);
    } catch (error) {
      console.error('Schedule update error:', error);
    }
  };

  // テンプレート保存
  const handleTemplateSave = async () => {
    try {
      await createScheduleTemplate({
        name: templateForm.name,
        description: templateForm.description,
        weekdays: templateForm.weekdays,
        startTime: templateForm.startTime,
        endTime: templateForm.endTime,
        slotDuration: templateForm.duration,
        breakBetween: templateForm.breakBetween,
        isActive: templateForm.isActive
      });

      setTemplateForm({
        name: '',
        description: '',
        weekdays: [],
        startTime: '09:00',
        endTime: '18:00',
        duration: 60,
        breakBetween: 15,
        isActive: true
      });
    } catch (error) {
      console.error('Template save error:', error);
    }
  };

  // 一括スケジュール生成
  const handleBulkGenerate = async (templateId: string, startDate: string, endDate: string) => {
    try {
      await generateBulkSchedule(templateId, new Date(startDate), new Date(endDate));
    } catch (error) {
      console.error('Bulk generation error:', error);
    }
  };

  // 休暇期間保存
  const handleTimeOffSave = async () => {
    try {
      await createTimeOff({
        startDate: new Date(timeOffForm.startDate),
        endDate: new Date(timeOffForm.endDate),
        reason: timeOffForm.reason,
        isRecurring: timeOffForm.isRecurring,
        recurringPattern: timeOffForm.recurringPattern
      });

      setTimeOffForm({
        startDate: '',
        endDate: '',
        reason: '',
        isRecurring: false,
        recurringPattern: 'weekly'
      });
    } catch (error) {
      console.error('Time off save error:', error);
    }
  };

  const renderCalendarView = () => {
    const calendarDays = generateCalendarDays();
    const currentMonth = currentDate.getMonth();

    return (
      <div className="space-y-4">
        {/* カレンダーヘッダー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-lg font-semibold">
              {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <Button
            onClick={() => setCurrentDate(new Date())}
            variant="outline"
            size="sm"
          >
            今月
          </Button>
        </div>

        {/* カレンダーグリッド */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 border-b border-slate-200">
            {WEEKDAYS.map((day, index) => (
              <div
                key={day}
                className={`p-2 text-center text-sm font-medium ${
                  index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-slate-700'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 日付グリッド */}
          <div className="grid grid-cols-7">
            {calendarDays.map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentMonth;
              const isToday = date.toDateString() === new Date().toDateString();
              const daySchedule = getDaySchedule(date);
              const hasSchedule = daySchedule.length > 0;
              const availableSlots = daySchedule.filter(s => s.is_available).length;

              return (
                <div
                  key={index}
                  className={`min-h-[80px] p-2 border-r border-b border-slate-100 ${
                    !isCurrentMonth ? 'bg-slate-50 text-slate-400' : 'bg-white'
                  } ${isToday ? 'bg-blue-50' : ''} hover:bg-slate-50 cursor-pointer`}
                  onClick={() => setSelectedSlot({
                    date: date.toISOString().split('T')[0],
                    time: '09:00'
                  })}
                >
                  <div className={`text-sm ${isToday ? 'font-bold text-blue-600' : ''}`}>
                    {date.getDate()}
                  </div>
                  {hasSchedule && (
                    <div className="mt-1">
                      <Badge className="text-xs bg-green-100 text-green-700">
                        {availableSlots}枠
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderTemplateManager = () => {
    return (
      <div className="space-y-6">
        {/* 新規テンプレート作成 */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">新規テンプレート作成</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="テンプレート名"
                value={templateForm.name}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="例: 平日9-18勤務"
              />
              <Input
                label="説明"
                value={templateForm.description}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="テンプレートの説明"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">対象曜日</label>
              <div className="flex space-x-2">
                {WEEKDAYS.map((day, index) => (
                  <button
                    key={day}
                    onClick={() => {
                      const newWeekdays = templateForm.weekdays.includes(index)
                        ? templateForm.weekdays.filter(w => w !== index)
                        : [...templateForm.weekdays, index];
                      setTemplateForm(prev => ({ ...prev, weekdays: newWeekdays }));
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      templateForm.weekdays.includes(index)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">開始時間</label>
                <select
                  value={templateForm.startTime}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  {TIME_SLOTS.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">終了時間</label>
                <select
                  value={templateForm.endTime}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  {TIME_SLOTS.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              <Input
                label="セッション時間（分）"
                type="number"
                value={templateForm.duration}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                min={30}
                max={180}
              />
              <Input
                label="休憩時間（分）"
                type="number"
                value={templateForm.breakBetween}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, breakBetween: parseInt(e.target.value) }))}
                min={0}
                max={60}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleTemplateSave}>
                <Save className="w-4 h-4 mr-2" />
                テンプレート保存
              </Button>
            </div>
          </div>
        </Card>

        {/* 既存テンプレート一覧 */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">保存済みテンプレート</h3>
          <div className="space-y-4">
            {scheduleTemplates.map((template) => (
              <div key={template.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-slate-800">{template.name}</h4>
                    <p className="text-sm text-slate-600">{template.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={template.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}>
                      {template.isActive ? '有効' : '無効'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkGenerate(template.id, 
                        new Date().toISOString().split('T')[0],
                        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                      )}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      適用
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-slate-500">
                  <span>曜日: {template.weekdays.map(w => WEEKDAYS[w]).join(', ')}</span>
                  <span className="mx-2">•</span>
                  <span>{template.startTime} - {template.endTime}</span>
                  <span className="mx-2">•</span>
                  <span>{template.slotDuration}分/セッション</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  const renderTimeOffManager = () => {
    return (
      <div className="space-y-6">
        {/* 新規休暇期間登録 */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">休暇・不在期間の登録</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="開始日"
                type="date"
                value={timeOffForm.startDate}
                onChange={(e) => setTimeOffForm(prev => ({ ...prev, startDate: e.target.value }))}
              />
              <Input
                label="終了日"
                type="date"
                value={timeOffForm.endDate}
                onChange={(e) => setTimeOffForm(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            <Input
              label="理由"
              value={timeOffForm.reason}
              onChange={(e) => setTimeOffForm(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="例: 夏季休暇、研修参加"
            />

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={timeOffForm.isRecurring}
                  onChange={(e) => setTimeOffForm(prev => ({ ...prev, isRecurring: e.target.checked }))}
                />
                <span className="text-sm">繰り返し設定</span>
              </label>
              
              {timeOffForm.isRecurring && (
                <select
                  value={timeOffForm.recurringPattern}
                  onChange={(e) => setTimeOffForm(prev => ({ ...prev, recurringPattern: e.target.value as 'weekly' | 'monthly' }))}
                  className="p-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="weekly">毎週</option>
                  <option value="monthly">毎月</option>
                </select>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={handleTimeOffSave}>
                <Save className="w-4 h-4 mr-2" />
                休暇期間を登録
              </Button>
            </div>
          </div>
        </Card>

        {/* 登録済み休暇期間 */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">登録済み休暇期間</h3>
          <div className="space-y-3">
            {timeOffPeriods.map((timeOff) => (
              <div key={timeOff.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                <div>
                  <div className="font-medium text-slate-800">
                    {formatDate(timeOff.startDate)} - {formatDate(timeOff.endDate)}
                  </div>
                  <div className="text-sm text-slate-600">{timeOff.reason}</div>
                  {timeOff.isRecurring && (
                    <Badge className="mt-1 bg-blue-100 text-blue-700">
                      {timeOff.recurringPattern === 'weekly' ? '毎週繰り返し' : '毎月繰り返し'}
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteTimeOff(timeOff.id)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-slate-800">スケジュール管理</h2>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setShowAdvanced(!showAdvanced)}
              variant="outline"
              size="sm"
            >
              {showAdvanced ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  基本表示
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  詳細機能
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ビュー切り替えタブ */}
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveView('calendar')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'calendar'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            カレンダー
          </button>
          
          {showAdvanced && (
            <>
              <button
                onClick={() => setActiveView('templates')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeView === 'templates'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Copy className="w-4 h-4 inline mr-2" />
                テンプレート
              </button>
              
              <button
                onClick={() => setActiveView('timeoff')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeView === 'timeoff'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <MapPin className="w-4 h-4 inline mr-2" />
                休暇管理
              </button>
              
              <button
                onClick={() => setActiveView('settings')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeView === 'settings'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                設定
              </button>
            </>
          )}
        </div>
      </Card>

      {/* コンテンツエリア */}
      {activeView === 'calendar' && renderCalendarView()}
      {activeView === 'templates' && showAdvanced && renderTemplateManager()}
      {activeView === 'timeoff' && showAdvanced && renderTimeOffManager()}
      {activeView === 'settings' && showAdvanced && (
        <Card>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">カレンダー設定</h3>
          <p className="text-slate-600">設定機能は近日実装予定です。</p>
        </Card>
      )}

      {/* スケジュール編集モーダル */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              {selectedSlot.date} のスケジュール編集
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">時間</label>
                <select
                  value={selectedSlot.time}
                  onChange={(e) => setSelectedSlot(prev => prev ? { ...prev, time: e.target.value } : null)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  {TIME_SLOTS.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={() => handleScheduleUpdate(selectedSlot.date, selectedSlot.time, true)}
                  className="flex-1"
                >
                  予約受付開始
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleScheduleUpdate(selectedSlot.date, selectedSlot.time, false)}
                  className="flex-1"
                >
                  受付停止
                </Button>
              </div>
              
              <Button
                variant="outline"
                onClick={() => setSelectedSlot(null)}
                className="w-full"
              >
                キャンセル
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};