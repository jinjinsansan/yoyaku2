import React, { useState } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Clock, 
  Calendar,
  Play,
  Pause,
  Settings,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ScheduleTemplate, useAdvancedSchedule } from '../../hooks/useAdvancedSchedule';
import { formatTime } from '../../lib/utils';

interface ScheduleTemplateManagerProps {
  counselorId: string;
}

interface TemplateFormData {
  name: string;
  description: string;
  weekdays: number[];
  startTime: string;
  endTime: string;
  sessionDurationMinutes: number;
  bufferMinutes: number;
  effectiveStartDate: string;
  effectiveEndDate: string;
}

const WEEKDAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];
const WEEKDAY_COLORS = [
  'text-red-600 bg-red-50',
  'text-blue-600 bg-blue-50',
  'text-green-600 bg-green-50',
  'text-yellow-600 bg-yellow-50',
  'text-purple-600 bg-purple-50',
  'text-indigo-600 bg-indigo-50',
  'text-pink-600 bg-pink-50'
];

export const ScheduleTemplateManager: React.FC<ScheduleTemplateManagerProps> = ({ counselorId }) => {
  const {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    generateFromTemplate
  } = useAdvancedSchedule(counselorId);

  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ScheduleTemplate | null>(null);
  const [generatingTemplate, setGeneratingTemplate] = useState<string | null>(null);
  const [showGenerateForm, setShowGenerateForm] = useState<string | null>(null);

  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    weekdays: [],
    startTime: '09:00',
    endTime: '17:00',
    sessionDurationMinutes: 60,
    bufferMinutes: 15,
    effectiveStartDate: new Date().toISOString().split('T')[0],
    effectiveEndDate: ''
  });

  const [generateData, setGenerateData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30日後
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      weekdays: [],
      startTime: '09:00',
      endTime: '17:00',
      sessionDurationMinutes: 60,
      bufferMinutes: 15,
      effectiveStartDate: new Date().toISOString().split('T')[0],
      effectiveEndDate: ''
    });
    setEditingTemplate(null);
  };

  const handleEdit = (template: ScheduleTemplate) => {
    setFormData({
      name: template.name,
      description: template.description || '',
      weekdays: template.weekdays,
      startTime: template.startTime,
      endTime: template.endTime,
      sessionDurationMinutes: template.sessionDurationMinutes,
      bufferMinutes: template.bufferMinutes,
      effectiveStartDate: template.effectiveStartDate,
      effectiveEndDate: template.effectiveEndDate || ''
    });
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.weekdays.length === 0) {
      alert('曜日を少なくとも1つ選択してください');
      return;
    }

    const templateData = {
      ...formData,
      isActive: true,
      effectiveEndDate: formData.effectiveEndDate || undefined
    };

    const success = editingTemplate
      ? await updateTemplate(editingTemplate.id, templateData)
      : await createTemplate(templateData);

    if (success) {
      setShowForm(false);
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('このテンプレートを削除しますか？')) {
      await deleteTemplate(id);
    }
  };

  const handleToggleActive = async (template: ScheduleTemplate) => {
    await updateTemplate(template.id, { isActive: !template.isActive });
  };

  const handleGenerate = async (templateId: string) => {
    setGeneratingTemplate(templateId);
    try {
      const result = await generateFromTemplate(templateId, generateData.startDate, generateData.endDate);
      alert(`スケジュール生成完了：\n作成: ${result.created}件\nスキップ: ${result.skipped}件\nエラー: ${result.errors}件`);
      setShowGenerateForm(null);
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setGeneratingTemplate(null);
    }
  };

  const toggleWeekday = (day: number) => {
    setFormData(prev => ({
      ...prev,
      weekdays: prev.weekdays.includes(day)
        ? prev.weekdays.filter(d => d !== day)
        : [...prev.weekdays, day].sort()
    }));
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
            <Settings className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-slate-800">スケジュールテンプレート管理</h2>
          </div>
          <Button onClick={() => setShowForm(true)} disabled={showForm}>
            <Plus className="w-4 h-4 mr-2" />
            新規テンプレート
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="w-4 h-4 inline mr-2" />
            {error}
          </div>
        )}

        {/* テンプレート作成・編集フォーム */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-50 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  テンプレート名 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="例: 平日午前中"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  説明
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="テンプレートの説明"
                />
              </div>
            </div>

            {/* 曜日選択 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                適用曜日 *
              </label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAY_NAMES.map((name, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleWeekday(index)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      formData.weekdays.includes(index)
                        ? WEEKDAY_COLORS[index]
                        : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  開始時間 *
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  終了時間 *
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  セッション時間（分）
                </label>
                <input
                  type="number"
                  min="15"
                  max="180"
                  step="15"
                  value={formData.sessionDurationMinutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, sessionDurationMinutes: parseInt(e.target.value) }))}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  バッファ時間（分）
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  step="5"
                  value={formData.bufferMinutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, bufferMinutes: parseInt(e.target.value) }))}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  適用開始日 *
                </label>
                <input
                  type="date"
                  value={formData.effectiveStartDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, effectiveStartDate: e.target.value }))}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  適用終了日（任意）
                </label>
                <input
                  type="date"
                  value={formData.effectiveEndDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, effectiveEndDate: e.target.value }))}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <Button type="submit">
                {editingTemplate ? '更新' : '作成'}
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

      {/* テンプレート一覧 */}
      <div className="space-y-4">
        {templates.length === 0 ? (
          <Card className="text-center py-12">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              テンプレートがありません
            </h3>
            <p className="text-slate-500 mb-4">
              最初のスケジュールテンプレートを作成しましょう
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              テンプレートを作成
            </Button>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-800">{template.name}</h3>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        className={template.isActive ? 'text-green-700 bg-green-100' : 'text-slate-600 bg-slate-100'}
                      >
                        {template.isActive ? '有効' : '無効'}
                      </Badge>
                      {template.isActive && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  </div>
                  
                  {template.description && (
                    <p className="text-slate-600 mb-3">{template.description}</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">
                        {formatTime(template.startTime)} - {formatTime(template.endTime)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">
                        {template.sessionDurationMinutes}分セッション
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-600">
                        バッファ: {template.bufferMinutes}分
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mt-3">
                    <span className="text-sm text-slate-600">適用曜日:</span>
                    <div className="flex space-x-1">
                      {template.weekdays.map(day => (
                        <Badge key={day} className={WEEKDAY_COLORS[day]}>
                          {WEEKDAY_NAMES[day]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(template)}
                  >
                    {template.isActive ? (
                      <Pause className="w-4 h-4 mr-1" />
                    ) : (
                      <Play className="w-4 h-4 mr-1" />
                    )}
                    {template.isActive ? '無効化' : '有効化'}
                  </Button>
                  
                  {template.isActive && (
                    <Button
                      size="sm"
                      onClick={() => setShowGenerateForm(template.id)}
                      disabled={generatingTemplate === template.id}
                    >
                      {generatingTemplate === template.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                      ) : (
                        <Calendar className="w-4 h-4 mr-1" />
                      )}
                      スケジュール生成
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    編集
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(template.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    削除
                  </Button>
                </div>
              </div>

              {/* スケジュール生成フォーム */}
              {showGenerateForm === template.id && (
                <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
                  <h4 className="font-medium text-slate-800 mb-3">スケジュール一括生成</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        生成開始日
                      </label>
                      <input
                        type="date"
                        value={generateData.startDate}
                        onChange={(e) => setGenerateData(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        生成終了日
                      </label>
                      <input
                        type="date"
                        value={generateData.endDate}
                        onChange={(e) => setGenerateData(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-3 mt-4">
                    <Button
                      onClick={() => handleGenerate(template.id)}
                      disabled={generatingTemplate === template.id}
                    >
                      生成実行
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowGenerateForm(null)}
                    >
                      キャンセル
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};