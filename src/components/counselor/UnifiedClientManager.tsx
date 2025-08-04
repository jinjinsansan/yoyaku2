import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit3,
  Calendar,
  Clock,
  Star,
  FileText,
  TrendingUp,
  AlertCircle,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  User,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { useClientManagement } from '../../hooks/useClientManagement';
import { formatDate, formatTime } from '../../lib/utils';

interface UnifiedClientManagerProps {
  counselorId: string;
}

const MOOD_LEVELS = [
  { value: 1, label: '非常に悪い', color: 'text-red-600' },
  { value: 2, label: '悪い', color: 'text-red-500' },
  { value: 3, label: '普通', color: 'text-yellow-500' },
  { value: 4, label: '良い', color: 'text-green-500' },
  { value: 5, label: '非常に良い', color: 'text-green-600' }
];

const EFFECTIVENESS_LEVELS = [
  { value: 1, label: '効果なし', color: 'text-red-600' },
  { value: 2, label: '少し効果あり', color: 'text-orange-500' },
  { value: 3, label: '普通', color: 'text-yellow-500' },
  { value: 4, label: '効果的', color: 'text-green-500' },
  { value: 5, label: '非常に効果的', color: 'text-green-600' }
];

export const UnifiedClientManager: React.FC<UnifiedClientManagerProps> = ({
  counselorId
}) => {
  const {
    clientRelationships,
    sessionNotes,
    clientProgress,
    preparationMemos,
    loading,
    createSessionNote,
    updateSessionNote,
    deleteSessionNote,
    recordClientProgress,
    createPreparationMemo,
    updatePreparationMemo
  } = useClientManagement(counselorId);

  const [activeView, setActiveView] = useState<'clients' | 'sessions' | 'progress'>('clients');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  // セッションノートフォーム
  const [sessionForm, setSessionForm] = useState({
    bookingId: '',
    clientId: '',
    sessionDate: new Date().toISOString().split('T')[0],
    sessionSummary: '',
    clientConcerns: '',
    discussedTopics: [],
    interventionsUsed: [],
    clientMood: {
      before: 3,
      after: 3,
      notes: ''
    },
    sessionEffectiveness: 3,
    homeworkAssigned: '',
    nextSessionGoals: '',
    counselorNotes: '',
    isPrivate: false,
    requiresFollowUp: false,
    crisisFlags: [],
    tags: []
  });

  // 進捗記録フォーム
  const [progressForm, setProgressForm] = useState({
    clientId: '',
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

  const [newItem, setNewItem] = useState('');

  // フィルタリングされたクライアント一覧
  const filteredClients = clientRelationships.filter(client => 
    client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.clientEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 選択されたクライアントの情報
  const selectedClientData = selectedClient 
    ? clientRelationships.find(c => c.clientId === selectedClient)
    : null;

  // 選択されたクライアントのセッションノート
  const clientSessionNotes = selectedClient
    ? sessionNotes.filter(note => note.clientId === selectedClient)
    : [];

  // 選択されたクライアントの進捗記録
  const clientProgressRecords = selectedClient
    ? clientProgress.filter(progress => progress.clientId === selectedClient)
    : [];

  // セッションノート保存
  const handleSessionNoteSave = async () => {
    try {
      await createSessionNote({
        ...sessionForm,
        counselorId,
        sessionDate: new Date(sessionForm.sessionDate),
        clientMood: sessionForm.clientMood,
        discussedTopics: sessionForm.discussedTopics,
        interventionsUsed: sessionForm.interventionsUsed,
        crisisFlags: sessionForm.crisisFlags,
        tags: sessionForm.tags
      });

      // フォームリセット
      setSessionForm({
        bookingId: '',
        clientId: '',
        sessionDate: new Date().toISOString().split('T')[0],
        sessionSummary: '',
        clientConcerns: '',
        discussedTopics: [],
        interventionsUsed: [],
        clientMood: { before: 3, after: 3, notes: '' },
        sessionEffectiveness: 3,
        homeworkAssigned: '',
        nextSessionGoals: '',
        counselorNotes: '',
        isPrivate: false,
        requiresFollowUp: false,
        crisisFlags: [],
        tags: []
      });
      setShowSessionForm(false);
    } catch (error) {
      console.error('Session note save error:', error);
    }
  };

  // 進捗記録保存
  const handleProgressSave = async () => {
    try {
      await recordClientProgress({
        ...progressForm,
        counselorId,
        assessmentDate: new Date(progressForm.assessmentDate)
      });

      // フォームリセット
      setProgressForm({
        clientId: '',
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
      setShowProgressForm(false);
    } catch (error) {
      console.error('Progress save error:', error);
    }
  };

  // リスト項目追加
  const addListItem = (type: 'discussedTopics' | 'interventionsUsed' | 'crisisFlags' | 'tags' | 'goalAchievement' | 'currentChallenges' | 'strengthsIdentified') => {
    if (!newItem.trim()) return;

    if (type in sessionForm) {
      setSessionForm(prev => ({
        ...prev,
        [type]: [...(prev[type as keyof typeof prev] as string[]), newItem.trim()]
      }));
    } else {
      setProgressForm(prev => ({
        ...prev,
        [type]: [...(prev[type as keyof typeof prev] as string[]), newItem.trim()]
      }));
    }
    setNewItem('');
  };

  // リスト項目削除
  const removeListItem = (type: 'discussedTopics' | 'interventionsUsed' | 'crisisFlags' | 'tags' | 'goalAchievement' | 'currentChallenges' | 'strengthsIdentified', index: number) => {
    if (type in sessionForm) {
      setSessionForm(prev => ({
        ...prev,
        [type]: (prev[type as keyof typeof prev] as string[]).filter((_, i) => i !== index)
      }));
    } else {
      setProgressForm(prev => ({
        ...prev,
        [type]: (prev[type as keyof typeof prev] as string[]).filter((_, i) => i !== index)
      }));
    }
  };

  const renderSlider = (label: string, value: number, onChange: (value: number) => void, levels: typeof MOOD_LEVELS = MOOD_LEVELS) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <input
            type="range"
            min="1"
            max="5"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div className="w-24 text-center">
          <span className={`text-sm font-medium ${levels.find(l => l.value === value)?.color}`}>
            {levels.find(l => l.value === value)?.label}
          </span>
        </div>
      </div>
    </div>
  );

  const renderClientList = () => (
    <div className="space-y-4">
      {/* 検索バー */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="クライアント名またはメールアドレスで検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* クライアント一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          const latestNote = sessionNotes
            .filter(note => note.clientId === client.clientId)
            .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())[0];

          const sessionCount = sessionNotes.filter(note => note.clientId === client.clientId).length;

          return (
            <Card
              key={client.clientId}
              className={`cursor-pointer transition-all duration-200 ${
                selectedClient === client.clientId 
                  ? 'ring-2 ring-indigo-500 bg-indigo-50' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedClient(client.clientId)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-800">{client.clientName}</h3>
                    <p className="text-sm text-slate-600">{client.clientEmail}</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700">
                    {sessionCount}回
                  </Badge>
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>開始: {formatDate(client.relationshipStarted)}</span>
                  </div>
                  
                  {latestNote && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>最終: {formatDate(latestNote.sessionDate)}</span>
                    </div>
                  )}

                  {client.primaryConcerns && client.primaryConcerns.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {client.primaryConcerns.slice(0, 2).map((concern, index) => (
                        <Badge key={index} className="text-xs bg-slate-100 text-slate-600">
                          {concern}
                        </Badge>
                      ))}
                      {client.primaryConcerns.length > 2 && (
                        <Badge className="text-xs bg-slate-100 text-slate-600">
                          +{client.primaryConcerns.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderSessionNotes = () => {
    if (!selectedClient) {
      return (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">クライアントを選択してセッションノートを表示</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* セッションノート作成ボタン */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">
            {selectedClientData?.clientName}さんのセッションノート
          </h3>
          <Button
            onClick={() => {
              setSessionForm(prev => ({ ...prev, clientId: selectedClient }));
              setShowSessionForm(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            新規セッションノート
          </Button>
        </div>

        {/* セッションノート一覧 */}
        <div className="space-y-4">
          {clientSessionNotes.map((note) => (
            <Card key={note.id}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div>
                      <div className="font-medium text-slate-800">
                        {formatDate(note.sessionDate)}
                      </div>
                      <div className="text-sm text-slate-600">
                        効果: {EFFECTIVENESS_LEVELS.find(l => l.value === note.sessionEffectiveness)?.label}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {note.requiresFollowUp && (
                      <Badge className="bg-orange-100 text-orange-700">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        要フォローアップ
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setExpandedNote(expandedNote === note.id ? null : note.id)}
                    >
                      {expandedNote === note.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="text-sm text-slate-600 mb-3">
                  {note.sessionSummary}
                </div>

                {expandedNote === note.id && (
                  <div className="space-y-4 border-t border-slate-200 pt-4">
                    {note.clientConcerns && (
                      <div>
                        <h4 className="font-medium text-slate-700 mb-1">クライアントの懸念</h4>
                        <p className="text-sm text-slate-600">{note.clientConcerns}</p>
                      </div>
                    )}

                    {note.discussedTopics && note.discussedTopics.length > 0 && (
                      <div>
                        <h4 className="font-medium text-slate-700 mb-1">議論したトピック</h4>
                        <div className="flex flex-wrap gap-1">
                          {note.discussedTopics.map((topic, index) => (
                            <Badge key={index} className="bg-blue-100 text-blue-700">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-slate-700 mb-1">気分変化</h4>
                        <div className="text-sm text-slate-600">
                          <div>セッション前: {MOOD_LEVELS.find(l => l.value === note.clientMood.before)?.label}</div>
                          <div>セッション後: {MOOD_LEVELS.find(l => l.value === note.clientMood.after)?.label}</div>
                        </div>
                      </div>
                    </div>

                    {note.homeworkAssigned && (
                      <div>
                        <h4 className="font-medium text-slate-700 mb-1">課題</h4>
                        <p className="text-sm text-slate-600">{note.homeworkAssigned}</p>
                      </div>
                    )}

                    {note.nextSessionGoals && (
                      <div>
                        <h4 className="font-medium text-slate-700 mb-1">次回セッションの目標</h4>
                        <p className="text-sm text-slate-600">{note.nextSessionGoals}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderProgressTracking = () => {
    if (!selectedClient) {
      return (
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">クライアントを選択して進捗を表示</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">
            {selectedClientData?.clientName}さんの進捗追跡
          </h3>
          <Button
            onClick={() => {
              setProgressForm(prev => ({ ...prev, clientId: selectedClient }));
              setShowProgressForm(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            進捗記録
          </Button>
        </div>

        <div className="space-y-4">
          {clientProgressRecords.map((progress) => (
            <Card key={progress.id}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium text-slate-800">
                      {formatDate(progress.assessmentDate)}
                    </div>
                    <div className="text-sm text-slate-600">
                      全体進捗: {progress.overallProgress}/10
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-green-700 mb-1">達成した目標</h5>
                    <div className="space-y-1">
                      {progress.goalAchievement.map((goal, index) => (
                        <div key={index} className="text-slate-600">{goal}</div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-orange-700 mb-1">現在の課題</h5>
                    <div className="space-y-1">
                      {progress.currentChallenges.map((challenge, index) => (
                        <div key={index} className="text-slate-600">{challenge}</div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-blue-700 mb-1">発見された強み</h5>
                    <div className="space-y-1">
                      {progress.strengthsIdentified.map((strength, index) => (
                        <div key={index} className="text-slate-600">{strength}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
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
            <Users className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-slate-800">クライアント管理</h2>
          </div>
        </div>

        {/* ビュー切り替えタブ */}
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveView('clients')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'clients'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            クライアント一覧
          </button>
          
          <button
            onClick={() => setActiveView('sessions')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'sessions'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            セッションノート
          </button>
          
          <button
            onClick={() => setActiveView('progress')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'progress'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            進捗追跡
          </button>
        </div>
      </Card>

      {/* コンテンツエリア */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* サイドバー: クライアント一覧 */}
        <div className="lg:col-span-1">
          <Card>
            <div className="p-4">
              <h3 className="font-medium text-slate-800 mb-3">クライアント</h3>
              <div className="space-y-2">
                {clientRelationships.slice(0, 5).map((client) => (
                  <div
                    key={client.clientId}
                    onClick={() => setSelectedClient(client.clientId)}
                    className={`p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedClient === client.clientId
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-medium text-sm">{client.clientName}</div>
                    <div className="text-xs text-slate-500">
                      {sessionNotes.filter(n => n.clientId === client.clientId).length}回
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* メインコンテンツ */}
        <div className="lg:col-span-3">
          {activeView === 'clients' && renderClientList()}
          {activeView === 'sessions' && renderSessionNotes()}
          {activeView === 'progress' && renderProgressTracking()}
        </div>
      </div>

      {/* セッションノート作成モーダル */}
      {showSessionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-800">新規セッションノート</h3>
                <button
                  onClick={() => setShowSessionForm(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* 基本情報 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="セッション日"
                    type="date"
                    value={sessionForm.sessionDate}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, sessionDate: e.target.value }))}
                  />
                </div>

                {/* セッション概要 */}
                <Textarea
                  label="セッション概要"
                  value={sessionForm.sessionSummary}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, sessionSummary: e.target.value }))}
                  rows={3}
                  placeholder="セッションの全体的な概要を記録してください"
                />

                {/* 気分評価 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    {renderSlider(
                      'セッション前の気分',
                      sessionForm.clientMood.before,
                      (value) => setSessionForm(prev => ({
                        ...prev,
                        clientMood: { ...prev.clientMood, before: value }
                      }))
                    )}
                  </div>
                  <div>
                    {renderSlider(
                      'セッション後の気分',
                      sessionForm.clientMood.after,
                      (value) => setSessionForm(prev => ({
                        ...prev,
                        clientMood: { ...prev.clientMood, after: value }
                      }))
                    )}
                  </div>
                </div>

                {/* セッション効果 */}
                <div>
                  {renderSlider(
                    'セッション効果',
                    sessionForm.sessionEffectiveness,
                    (value) => setSessionForm(prev => ({ ...prev, sessionEffectiveness: value })),
                    EFFECTIVENESS_LEVELS
                  )}
                </div>

                {/* 次回目標 */}
                <Textarea
                  label="次回セッションの目標"
                  value={sessionForm.nextSessionGoals}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, nextSessionGoals: e.target.value }))}
                  rows={2}
                  placeholder="次回セッションで取り組む目標や課題"
                />

                {/* 保存ボタン */}
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setShowSessionForm(false)}>
                    キャンセル
                  </Button>
                  <Button onClick={handleSessionNoteSave}>
                    <Save className="w-4 h-4 mr-2" />
                    保存
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};