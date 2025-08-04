import React, { useState } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Repeat
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { TimeOff, useAdvancedSchedule } from '../../hooks/useAdvancedSchedule';
import { formatDate } from '../../lib/utils';

interface TimeOffManagerProps {
  counselorId: string;
}

interface TimeOffFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  timeOffType: 'vacation' | 'sick_leave' | 'personal' | 'training' | 'other';
  recurringType: 'none' | 'weekly' | 'monthly' | 'yearly';
  recurringEndDate: string;
}

const TIME_OFF_TYPES = [
  { value: 'vacation', label: '休暇', color: 'text-blue-700 bg-blue-100' },
  { value: 'sick_leave', label: '病気休暇', color: 'text-red-700 bg-red-100' },
  { value: 'personal', label: '個人的な用事', color: 'text-purple-700 bg-purple-100' },
  { value: 'training', label: '研修・トレーニング', color: 'text-green-700 bg-green-100' },
  { value: 'other', label: 'その他', color: 'text-gray-700 bg-gray-100' }
];

const RECURRING_TYPES = [
  { value: 'none', label: '単発' },
  { value: 'weekly', label: '毎週' },
  { value: 'monthly', label: '毎月' },
  { value: 'yearly', label: '毎年' }
];

const STATUS_CONFIG = {
  pending: { label: '承認待ち', color: 'text-yellow-700 bg-yellow-100', icon: AlertTriangle },
  approved: { label: '承認済み', color: 'text-green-700 bg-green-100', icon: CheckCircle },
  rejected: { label: '却下', color: 'text-red-700 bg-red-100', icon: XCircle }
};

export const TimeOffManager: React.FC<TimeOffManagerProps> = ({ counselorId }) => {
  const {
    timeOffs,
    loading,
    error,
    createTimeOff,
    updateTimeOff,
    deleteTimeOff
  } = useAdvancedSchedule(counselorId);

  const [showForm, setShowForm] = useState(false);
  const [editingTimeOff, setEditingTimeOff] = useState<TimeOff | null>(null);

  const [formData, setFormData] = useState<TimeOffFormData>({
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    isAllDay: true,
    timeOffType: 'vacation',
    recurringType: 'none',
    recurringEndDate: ''
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '17:00',
      isAllDay: true,
      timeOffType: 'vacation',
      recurringType: 'none',
      recurringEndDate: ''
    });
    setEditingTimeOff(null);
  };

  const handleEdit = (timeOff: TimeOff) => {
    setFormData({
      title: timeOff.title,
      description: timeOff.description || '',
      startDate: timeOff.startDate,
      endDate: timeOff.endDate,
      startTime: timeOff.startTime || '09:00',
      endTime: timeOff.endTime || '17:00',
      isAllDay: timeOff.isAllDay,
      timeOffType: timeOff.timeOffType,
      recurringType: timeOff.recurringType || 'none',
      recurringEndDate: timeOff.recurringEndDate || ''
    });
    setEditingTimeOff(timeOff);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      alert('終了日は開始日以降を選択してください');
      return;
    }

    const timeOffData = {
      ...formData,
      status: 'pending' as const,
      startTime: formData.isAllDay ? undefined : formData.startTime,
      endTime: formData.isAllDay ? undefined : formData.endTime,
      recurringType: formData.recurringType === 'none' ? undefined : formData.recurringType,
      recurringEndDate: formData.recurringType === 'none' || !formData.recurringEndDate 
        ? undefined 
        : formData.recurringEndDate
    };

    const success = editingTimeOff
      ? await updateTimeOff(editingTimeOff.id, timeOffData)
      : await createTimeOff(timeOffData);

    if (success) {
      setShowForm(false);
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('この不在期間を削除しますか？')) {
      await deleteTimeOff(id);
    }
  };

  const getTypeConfig = (type: string) => {
    return TIME_OFF_TYPES.find(t => t.value === type) || TIME_OFF_TYPES[0];
  };

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-slate-800">休暇・不在期間管理</h2>
          </div>
          <Button onClick={() => setShowForm(true)} disabled={showForm}>
            <Plus className="w-4 h-4 mr-2" />
            不在期間を追加
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            {error}
          </div>
        )}

        {/* 不在期間作成・編集フォーム */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-50 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  タイトル *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="例: 夏季休暇"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  種類 *
                </label>
                <select
                  value={formData.timeOffType}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeOffType: e.target.value as any }))}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  {TIME_OFF_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                説明
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
                placeholder="詳細な説明（オプション）"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  開始日 *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  終了日 *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            {/* 終日設定 */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isAllDay"
                checked={formData.isAllDay}
                onChange={(e) => setFormData(prev => ({ ...prev, isAllDay: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="isAllDay" className="text-sm font-medium text-slate-700">
                終日
              </label>
            </div>

            {/* 時間設定（終日でない場合） */}
            {!formData.isAllDay && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    開始時間
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    終了時間
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* 繰り返し設定 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  繰り返し
                </label>
                <select
                  value={formData.recurringType}
                  onChange={(e) => setFormData(prev => ({ ...prev, recurringType: e.target.value as any }))}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {RECURRING_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              {formData.recurringType !== 'none' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    繰り返し終了日
                  </label>
                  <input
                    type="date"
                    value={formData.recurringEndDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, recurringEndDate: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <Button type="submit">
                {editingTimeOff ? '更新' : '作成'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                キャンセル
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* 不在期間一覧 */}
      <div className="space-y-4">
        {timeOffs.length === 0 ? (
          <Card className="text-center py-12">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              不在期間がありません
            </h3>
            <p className="text-slate-500 mb-4">
              休暇や不在期間を登録して、自動的にスケジュールから除外しましょう
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              不在期間を追加
            </Button>
          </Card>
        ) : (
          timeOffs.map((timeOff) => {
            const typeConfig = getTypeConfig(timeOff.timeOffType);
            const statusConfig = getStatusConfig(timeOff.status);
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={timeOff.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-800">{timeOff.title}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge className={typeConfig.color}>
                          {typeConfig.label}
                        </Badge>
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        {timeOff.recurringType && timeOff.recurringType !== 'none' && (
                          <Badge className="text-indigo-700 bg-indigo-100">
                            <Repeat className="w-3 h-3 mr-1" />
                            {RECURRING_TYPES.find(t => t.value === timeOff.recurringType)?.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {timeOff.description && (
                      <p className="text-slate-600 mb-3">{timeOff.description}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">
                          {formatDate(new Date(timeOff.startDate))} - {formatDate(new Date(timeOff.endDate))}
                        </span>
                      </div>
                      {!timeOff.isAllDay && timeOff.startTime && timeOff.endTime && (
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">
                            {timeOff.startTime} - {timeOff.endTime}
                          </span>
                        </div>
                      )}
                      {timeOff.isAllDay && (
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">終日</span>
                        </div>
                      )}
                    </div>

                    {timeOff.recurringEndDate && (
                      <div className="mt-2 text-sm text-slate-600">
                        繰り返し終了: {formatDate(new Date(timeOff.recurringEndDate))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(timeOff)}
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      編集
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(timeOff.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      削除
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};