import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  AlertCircle,
  CheckCircle,
  Calendar,
  BarChart3,
  Plus,
  Save
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ClientProgress, useClientManagement } from '../../hooks/useClientManagement';
import { formatDate } from '../../lib/utils';

interface ClientProgressTrackerProps {
  counselorId: string;
  clientId: string;
  clientName: string;
}

const ASSESSMENT_AREAS = [
  { key: 'anxietyLevel', label: '不安レベル', color: 'text-red-600' },
  { key: 'depressionLevel', label: 'うつレベル', color: 'text-blue-600' },
  { key: 'stressLevel', label: 'ストレスレベル', color: 'text-orange-600' },
  { key: 'sleepQuality', label: '睡眠の質', color: 'text-purple-600' },
  { key: 'socialFunctioning', label: '社会機能', color: 'text-green-600' },
  { key: 'workPerformance', label: '仕事のパフォーマンス', color: 'text-indigo-600' }
];

export const ClientProgressTracker: React.FC<ClientProgressTrackerProps> = ({
  counselorId,
  clientId,
  clientName
}) => {
  const { clientProgress, recordClientProgress } = useClientManagement(counselorId);
  
  const [showNewProgressForm, setShowNewProgressForm] = useState(false);
  const [formData, setFormData] = useState({
    assessmentDate: new Date().toISOString().split('T')[0],
    overallProgress: 5,
    goalAchievement: [] as string[],
    currentChallenges: [] as string[],
    strengthsIdentified: [] as string[],
    anxietyLevel: 5,
    depressionLevel: 5,
    stressLevel: 5,
    sleepQuality: 5,
    socialFunctioning: 5,
    workPerformance: 5,
    progressSummary: '',
    recommendations: ''
  });

  const [newGoal, setNewGoal] = useState('');
  const [newChallenge, setNewChallenge] = useState('');
  const [newStrength, setNewStrength] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const clientProgressRecords = clientProgress.filter(p => p.clientId === clientId);
  const latestProgress = clientProgressRecords[0];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await recordClientProgress({
        clientId,
        counselorId,
        assessmentDate: new Date(formData.assessmentDate),
        overallProgress: formData.overallProgress,
        goalAchievement: formData.goalAchievement,
        currentChallenges: formData.currentChallenges,
        strengthsIdentified: formData.strengthsIdentified,
        anxietyLevel: formData.anxietyLevel,
        depressionLevel: formData.depressionLevel,
        stressLevel: formData.stressLevel,
        sleepQuality: formData.sleepQuality,
        socialFunctioning: formData.socialFunctioning,
        workPerformance: formData.workPerformance,
        progressSummary: formData.progressSummary,
        recommendations: formData.recommendations
      });

      if (success) {
        setShowNewProgressForm(false);
        // フォームをリセット
        setFormData({
          assessmentDate: new Date().toISOString().split('T')[0],
          overallProgress: 5,
          goalAchievement: [],
          currentChallenges: [],
          strengthsIdentified: [],
          anxietyLevel: 5,
          depressionLevel: 5,
          stressLevel: 5,
          sleepQuality: 5,
          socialFunctioning: 5,
          workPerformance: 5,
          progressSummary: '',
          recommendations: ''
        });
      }
    } catch (error) {
      console.error('Progress save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addItem = (type: 'goal' | 'challenge' | 'strength', value: string) => {
    if (!value.trim()) return;

    const fieldMap = {
      goal: 'goalAchievement',
      challenge: 'currentChallenges',
      strength: 'strengthsIdentified'
    };

    const field = fieldMap[type] as keyof typeof formData;
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), value.trim()]
    }));

    // 入力フィールドをクリア
    if (type === 'goal') setNewGoal('');
    if (type === 'challenge') setNewChallenge('');
    if (type === 'strength') setNewStrength('');
  };

  const removeItem = (type: 'goal' | 'challenge' | 'strength', index: number) => {
    const fieldMap = {
      goal: 'goalAchievement',
      challenge: 'currentChallenges',
      strength: 'strengthsIdentified'
    };

    const field = fieldMap[type] as keyof typeof formData;
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const renderProgressChart = (records: ClientProgress[]) => {
    if (records.length < 2) return null;

    const sortedRecords = [...records].sort((a, b) => 
      new Date(a.assessmentDate).getTime() - new Date(b.assessmentDate).getTime()
    );

    return (
      <Card>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">進捗グラフ</h3>
        <div className="space-y-4">
          {ASSESSMENT_AREAS.map(area => {
            const latestValue = latestProgress?.[area.key as keyof ClientProgress] as number;
            const previousValue = sortedRecords[sortedRecords.length - 2]?.[area.key as keyof ClientProgress] as number;
            const trend = latestValue && previousValue ? latestValue - previousValue : 0;

            return (
              <div key={area.key} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-slate-700 w-32">{area.label}</span>
                  <div className="flex items-center space-x-2">
                    {trend > 0 && <TrendingUp className="w-4 h-4 text-green-500" />}
                    {trend < 0 && <TrendingDown className="w-4 h-4 text-red-500" />}
                    {trend === 0 && <div className="w-4 h-4" />}
                    <span className={`text-sm ${area.color}`}>
                      {latestValue || 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-slate-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        latestValue <= 3 ? 'bg-green-500' :
                        latestValue <= 6 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(latestValue || 0) * 10}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  const renderSlider = (label: string, value: number, onChange: (value: number) => void) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-slate-500">低</span>
        <div className="flex-1">
          <input
            type="range"
            min="1"
            max="10"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <span className="text-sm text-slate-500">高</span>
        <div className="w-8 text-center">
          <span className="text-lg font-semibold text-indigo-600">{value}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-slate-800">
            {clientName}さんの進捗追跡
          </h2>
        </div>
        <Button onClick={() => setShowNewProgressForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新しい評価を記録
        </Button>
      </div>

      {/* 最新の進捗概要 */}
      {latestProgress && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">最新の評価</h3>
            <Badge className="text-indigo-700 bg-indigo-100">
              {formatDate(latestProgress.assessmentDate)}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-1">
                {latestProgress.overallProgress}/10
              </div>
              <div className="text-sm text-slate-600">全体的な進捗</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {latestProgress.goalAchievement.length}
              </div>
              <div className="text-sm text-slate-600">達成した目標</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {latestProgress.currentChallenges.length}
              </div>
              <div className="text-sm text-slate-600">現在の課題</div>
            </div>
          </div>

          {latestProgress.progressSummary && (
            <div className="mb-4">
              <h4 className="font-medium text-slate-700 mb-2">進捗概要</h4>
              <p className="text-slate-600">{latestProgress.progressSummary}</p>
            </div>
          )}

          {latestProgress.recommendations && (
            <div>
              <h4 className="font-medium text-slate-700 mb-2">推奨事項</h4>
              <p className="text-slate-600">{latestProgress.recommendations}</p>
            </div>
          )}
        </Card>
      )}

      {/* 進捗グラフ */}
      {renderProgressChart(clientProgressRecords)}

      {/* 進捗履歴 */}
      <Card>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">評価履歴</h3>
        {clientProgressRecords.length === 0 ? (
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">まだ進捗記録がありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {clientProgressRecords.map((progress) => (
              <div key={progress.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{formatDate(progress.assessmentDate)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-600">全体進捗:</span>
                    <Badge className="text-indigo-700 bg-indigo-100">
                      {progress.overallProgress}/10
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-green-700 mb-1">達成した目標</h5>
                    <ul className="text-slate-600 space-y-1">
                      {progress.goalAchievement.map((goal, index) => (
                        <li key={index} className="flex items-start space-x-1">
                          <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-medium text-orange-700 mb-1">現在の課題</h5>
                    <ul className="text-slate-600 space-y-1">
                      {progress.currentChallenges.map((challenge, index) => (
                        <li key={index} className="flex items-start space-x-1">
                          <AlertCircle className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span>{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-medium text-blue-700 mb-1">発見された強み</h5>
                    <ul className="text-slate-600 space-y-1">
                      {progress.strengthsIdentified.map((strength, index) => (
                        <li key={index} className="flex items-start space-x-1">
                          <Award className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 新しい進捗記録フォーム */}
      {showNewProgressForm && (
        <Card>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">新しい進捗評価</h3>
          
          <div className="space-y-6">
            {/* 評価日 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">評価日</label>
              <input
                type="date"
                value={formData.assessmentDate}
                onChange={(e) => setFormData(prev => ({ ...prev, assessmentDate: e.target.value }))}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* 全体的な進捗 */}
            <div>
              {renderSlider(
                '全体的な進捗',
                formData.overallProgress,
                (value) => setFormData(prev => ({ ...prev, overallProgress: value }))
              )}
            </div>

            {/* 各評価項目 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ASSESSMENT_AREAS.map(area => (
                <div key={area.key}>
                  {renderSlider(
                    area.label,
                    formData[area.key as keyof typeof formData] as number,
                    (value) => setFormData(prev => ({ ...prev, [area.key]: value }))
                  )}
                </div>
              ))}
            </div>

            {/* 目標達成、課題、強み */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">達成した目標</label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addItem('goal', newGoal)}
                    className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="達成した目標..."
                  />
                  <Button size="sm" onClick={() => addItem('goal', newGoal)}>
                    追加
                  </Button>
                </div>
                <div className="space-y-1">
                  {formData.goalAchievement.map((goal, index) => (
                    <Badge
                      key={index}
                      className="text-green-700 bg-green-100 cursor-pointer"
                      onClick={() => removeItem('goal', index)}
                    >
                      {goal}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">現在の課題</label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={newChallenge}
                    onChange={(e) => setNewChallenge(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addItem('challenge', newChallenge)}
                    className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="現在の課題..."
                  />
                  <Button size="sm" onClick={() => addItem('challenge', newChallenge)}>
                    追加
                  </Button>
                </div>
                <div className="space-y-1">
                  {formData.currentChallenges.map((challenge, index) => (
                    <Badge
                      key={index}
                      className="text-orange-700 bg-orange-100 cursor-pointer"
                      onClick={() => removeItem('challenge', index)}
                    >
                      {challenge}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">発見された強み</label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={newStrength}
                    onChange={(e) => setNewStrength(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addItem('strength', newStrength)}
                    className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="発見された強み..."
                  />
                  <Button size="sm" onClick={() => addItem('strength', newStrength)}>
                    追加
                  </Button>
                </div>
                <div className="space-y-1">
                  {formData.strengthsIdentified.map((strength, index) => (
                    <Badge
                      key={index}
                      className="text-blue-700 bg-blue-100 cursor-pointer"
                      onClick={() => removeItem('strength', index)}
                    >
                      {strength}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* 進捗概要と推奨事項 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">進捗概要</label>
                <textarea
                  value={formData.progressSummary}
                  onChange={(e) => setFormData(prev => ({ ...prev, progressSummary: e.target.value }))}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                  placeholder="進捗の概要を記録..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">推奨事項</label>
                <textarea
                  value={formData.recommendations}
                  onChange={(e) => setFormData(prev => ({ ...prev, recommendations: e.target.value }))}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                  placeholder="今後の推奨事項..."
                />
              </div>
            </div>

            {/* 保存ボタン */}
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowNewProgressForm(false)}>
                キャンセル
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                保存
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};