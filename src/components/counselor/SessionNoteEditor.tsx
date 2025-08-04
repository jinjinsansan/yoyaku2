import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Target,
  TrendingUp,
  Book,
  ArrowRight,
  Star,
  Flag
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SessionNote, useClientManagement } from '../../hooks/useClientManagement';

interface SessionNoteEditorProps {
  counselorId: string;
  bookingId?: string;
  clientId: string;
  clientName: string;
  sessionNote?: SessionNote;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (noteData: SessionNote) => void;
}

const SESSION_TYPES = [
  { value: 'initial', label: '初回セッション', color: 'text-blue-700 bg-blue-100' },
  { value: 'regular', label: '通常セッション', color: 'text-green-700 bg-green-100' },
  { value: 'followup', label: 'フォローアップ', color: 'text-purple-700 bg-purple-100' },
  { value: 'emergency', label: '緊急セッション', color: 'text-red-700 bg-red-100' },
  { value: 'group', label: 'グループセッション', color: 'text-orange-700 bg-orange-100' }
];

const EFFECTIVENESS_LABELS = [
  '効果なし',
  '最小限の効果',
  '一部効果あり',
  '良い効果',
  '非常に効果的'
];

export const SessionNoteEditor: React.FC<SessionNoteEditorProps> = ({
  counselorId,
  bookingId,
  clientId,
  clientName,
  sessionNote,
  isOpen,
  onClose,
  onSave
}) => {
  const { createSessionNote, updateSessionNote } = useClientManagement(counselorId);
  
  const [formData, setFormData] = useState({
    sessionDate: new Date().toISOString().slice(0, 16),
    sessionDurationMinutes: 60,
    sessionType: 'regular' as const,
    moodBefore: 5,
    moodAfter: 5,
    sessionSummary: '',
    keyTopics: [] as string[],
    clientGoals: [] as string[],
    progressNotes: '',
    homeworkAssigned: '',
    nextSessionFocus: '',
    sessionEffectiveness: 3,
    requiresFollowup: false,
    crisisFlag: false,
    confidentialNotes: ''
  });

  const [newTopic, setNewTopic] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (sessionNote) {
      setFormData({
        sessionDate: sessionNote.sessionDate.toISOString().slice(0, 16),
        sessionDurationMinutes: sessionNote.sessionDurationMinutes,
        sessionType: sessionNote.sessionType,
        moodBefore: sessionNote.moodBefore || 5,
        moodAfter: sessionNote.moodAfter || 5,
        sessionSummary: sessionNote.sessionSummary,
        keyTopics: [...sessionNote.keyTopics],
        clientGoals: [...sessionNote.clientGoals],
        progressNotes: sessionNote.progressNotes || '',
        homeworkAssigned: sessionNote.homeworkAssigned || '',
        nextSessionFocus: sessionNote.nextSessionFocus || '',
        sessionEffectiveness: sessionNote.sessionEffectiveness || 3,
        requiresFollowup: sessionNote.requiresFollowup,
        crisisFlag: sessionNote.crisisFlag,
        confidentialNotes: sessionNote.confidentialNotes || ''
      });
    }
  }, [sessionNote]);

  const handleSave = async () => {
    if (!formData.sessionSummary.trim()) {
      setMessage('セッション概要は必須です');
      return;
    }

    setIsSaving(true);
    setMessage('');

    try {
      const noteData = {
        ...formData,
        bookingId: bookingId || '',
        counselorId,
        clientId,
        sessionDate: new Date(formData.sessionDate),
        requiresFollowup: formData.requiresFollowup,
        crisisFlag: formData.crisisFlag
      };

      const success = sessionNote
        ? await updateSessionNote(sessionNote.id, noteData)
        : await createSessionNote(noteData);

      if (success) {
        setMessage('セッションノートを保存しました');
        onSave?.(noteData as SessionNote);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      setMessage('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const addTopic = () => {
    if (newTopic.trim() && !formData.keyTopics.includes(newTopic.trim())) {
      setFormData(prev => ({
        ...prev,
        keyTopics: [...prev.keyTopics, newTopic.trim()]
      }));
      setNewTopic('');
    }
  };

  const removeTopic = (index: number) => {
    setFormData(prev => ({
      ...prev,
      keyTopics: prev.keyTopics.filter((_, i) => i !== index)
    }));
  };

  const addGoal = () => {
    if (newGoal.trim() && !formData.clientGoals.includes(newGoal.trim())) {
      setFormData(prev => ({
        ...prev,
        clientGoals: [...prev.clientGoals, newGoal.trim()]
      }));
      setNewGoal('');
    }
  };

  const removeGoal = (index: number) => {
    setFormData(prev => ({
      ...prev,
      clientGoals: prev.clientGoals.filter((_, i) => i !== index)
    }));
  };

  const renderMoodSlider = (label: string, value: number, onChange: (value: number) => void) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-slate-500">低い</span>
        <div className="flex-1">
          <input
            type="range"
            min="1"
            max="10"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
        <span className="text-sm text-slate-500">高い</span>
        <div className="w-8 text-center">
          <span className="text-lg font-semibold text-indigo-600">{value}</span>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-indigo-600" />
            <div>
              <h2 className="text-xl font-semibold text-slate-800">
                {sessionNote ? 'セッションノート編集' : 'セッションノート作成'}
              </h2>
              <p className="text-sm text-slate-600">{clientName}さん</p>
            </div>
          </div>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.includes('失敗') || message.includes('必須')
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message.includes('失敗') ? (
              <AlertTriangle className="w-4 h-4 inline mr-2" />
            ) : (
              <CheckCircle className="w-4 h-4 inline mr-2" />
            )}
            {message}
          </div>
        )}

        <div className="space-y-6">
          {/* 基本情報 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                セッション日時 *
              </label>
              <input
                type="datetime-local"
                value={formData.sessionDate}
                onChange={(e) => setFormData(prev => ({ ...prev, sessionDate: e.target.value }))}
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
                セッション種別
              </label>
              <select
                value={formData.sessionType}
                onChange={(e) => setFormData(prev => ({ ...prev, sessionType: e.target.value as any }))}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {SESSION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ムード評価 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {renderMoodSlider(
                'セッション前のムード',
                formData.moodBefore,
                (value) => setFormData(prev => ({ ...prev, moodBefore: value }))
              )}
            </div>
            <div>
              {renderMoodSlider(
                'セッション後のムード',
                formData.moodAfter,
                (value) => setFormData(prev => ({ ...prev, moodAfter: value }))
              )}
            </div>
          </div>

          {/* セッション概要 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              セッション概要 *
            </label>
            <textarea
              value={formData.sessionSummary}
              onChange={(e) => setFormData(prev => ({ ...prev, sessionSummary: e.target.value }))}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={4}
              placeholder="今回のセッションの概要を記録してください..."
              required
            />
          </div>

          {/* 主要トピック */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              主要トピック
            </label>
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTopic()}
                className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="トピックを追加..."
              />
              <Button onClick={addTopic} size="sm">
                追加
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.keyTopics.map((topic, index) => (
                <Badge
                  key={index}
                  className="text-indigo-700 bg-indigo-100 cursor-pointer"
                  onClick={() => removeTopic(index)}
                >
                  {topic}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>

          {/* クライアント目標 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              クライアント目標
            </label>
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="目標を追加..."
              />
              <Button onClick={addGoal} size="sm">
                追加
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.clientGoals.map((goal, index) => (
                <Badge
                  key={index}
                  className="text-green-700 bg-green-100 cursor-pointer"
                  onClick={() => removeGoal(index)}
                >
                  <Target className="w-3 h-3 mr-1" />
                  {goal}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>

          {/* 進捗メモ */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              進捗メモ
            </label>
            <textarea
              value={formData.progressNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, progressNotes: e.target.value }))}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
              placeholder="クライアントの進捗や変化について記録..."
            />
          </div>

          {/* 宿題・課題 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              宿題・課題
            </label>
            <textarea
              value={formData.homeworkAssigned}
              onChange={(e) => setFormData(prev => ({ ...prev, homeworkAssigned: e.target.value }))}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={2}
              placeholder="次回までの宿題や課題があれば記録..."
            />
          </div>

          {/* 次回セッションの焦点 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              次回セッションの焦点
            </label>
            <textarea
              value={formData.nextSessionFocus}
              onChange={(e) => setFormData(prev => ({ ...prev, nextSessionFocus: e.target.value }))}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={2}
              placeholder="次回のセッションで重点的に取り組む内容..."
            />
          </div>

          {/* セッション効果と特記事項 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                セッション効果
              </label>
              <div className="space-y-2">
                {EFFECTIVENESS_LABELS.map((label, index) => (
                  <label key={index} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="effectiveness"
                      value={index + 1}
                      checked={formData.sessionEffectiveness === index + 1}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        sessionEffectiveness: parseInt(e.target.value) 
                      }))}
                      className="text-indigo-600"
                    />
                    <div className="flex items-center space-x-2">
                      <div className="flex">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < index + 1 ? 'text-yellow-400 fill-current' : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-slate-600">{label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="requiresFollowup"
                  checked={formData.requiresFollowup}
                  onChange={(e) => setFormData(prev => ({ ...prev, requiresFollowup: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="requiresFollowup" className="text-sm font-medium text-slate-700">
                  フォローアップが必要
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="crisisFlag"
                  checked={formData.crisisFlag}
                  onChange={(e) => setFormData(prev => ({ ...prev, crisisFlag: e.target.checked }))}
                  className="w-4 h-4 text-red-600 rounded"
                />
                <label htmlFor="crisisFlag" className="text-sm font-medium text-slate-700 flex items-center">
                  <Flag className="w-4 h-4 text-red-500 mr-1" />
                  クライシスフラグ（緊急対応が必要）
                </label>
              </div>
            </div>
          </div>

          {/* 機密メモ */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              機密メモ（カウンセラーのみ表示）
            </label>
            <textarea
              value={formData.confidentialNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, confidentialNotes: e.target.value }))}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={2}
              placeholder="機密性の高いメモや内部的な記録..."
            />
          </div>

          {/* 保存ボタン */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {sessionNote ? '更新' : '保存'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};