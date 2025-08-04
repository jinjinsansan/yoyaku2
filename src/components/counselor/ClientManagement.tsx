import React, { useState } from 'react';
import {
  Users,
  FileText,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ClientOverview, useClientManagement } from '../../hooks/useClientManagement';
import { formatDate } from '../../lib/utils';

interface ClientManagementProps {
  counselorId: string;
}

const CLIENT_STATUSES = {
  active: { label: 'アクティブ', color: 'text-green-700 bg-green-100', icon: CheckCircle },
  paused: { label: '一時停止', color: 'text-yellow-700 bg-yellow-100', icon: Clock },
  completed: { label: '完了', color: 'text-blue-700 bg-blue-100', icon: CheckCircle },
  transferred: { label: '転院', color: 'text-gray-700 bg-gray-100', icon: Users }
};

const PRIORITY_LEVELS = {
  low: { label: '低', color: 'text-gray-700 bg-gray-100' },
  normal: { label: '通常', color: 'text-blue-700 bg-blue-100' },
  high: { label: '高', color: 'text-orange-700 bg-orange-100' },
  urgent: { label: '緊急', color: 'text-red-700 bg-red-100' }
};

const SESSION_FREQUENCIES = {
  weekly: '週1回',
  biweekly: '隔週',
  monthly: '月1回',
  as_needed: '必要に応じて'
};

export const ClientManagement: React.FC<ClientManagementProps> = ({ counselorId }) => {
  const {
    clients,
    sessionNotes,
    clientProgress,
    sessionPreps,
    loading,
    error
  } = useClientManagement(counselorId);

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedClient, setSelectedClient] = useState<ClientOverview | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // フィルタリングされたクライアント
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.clientEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.relationshipStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 統計情報の計算
  const stats = {
    totalClients: clients.length,
    activeClients: clients.filter(c => c.relationshipStatus === 'active').length,
    urgentPreps: sessionPreps.filter(p => p.priorityLevel === 'urgent').length,
    completedSessions: sessionNotes.length
  };

  const renderClientCard = (client: ClientOverview) => {
    const statusConfig = CLIENT_STATUSES[client.relationshipStatus as keyof typeof CLIENT_STATUSES];
    const StatusIcon = statusConfig?.icon || Users;
    const prep = sessionPreps.find(p => p.clientId === client.clientId);
    const priorityConfig = prep ? PRIORITY_LEVELS[prep.priorityLevel as keyof typeof PRIORITY_LEVELS] : null;

    return (
      <Card 
        key={client.clientId} 
        className="hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => setSelectedClient(client)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">{client.clientName}</h3>
              <p className="text-sm text-slate-600">{client.clientEmail}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={statusConfig?.color || 'text-gray-700 bg-gray-100'}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig?.label || client.relationshipStatus}
                </Badge>
                {priorityConfig && (
                  <Badge className={priorityConfig.color}>
                    {priorityConfig.label}優先度
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="text-right text-sm text-slate-600">
            <p>{client.totalSessions}回セッション</p>
            <p>{SESSION_FREQUENCIES[client.sessionFrequency as keyof typeof SESSION_FREQUENCIES]}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-slate-500">全体的な進捗</p>
            <div className="flex items-center space-x-2">
              {client.overallProgress ? (
                <>
                  <div className="flex-1 bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${client.overallProgress * 10}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{client.overallProgress}/10</span>
                </>
              ) : (
                <span className="text-sm text-slate-400">未評価</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500">最終セッション</p>
            <p className="text-sm font-medium">
              {client.lastSessionDate 
                ? new Date(client.lastSessionDate).toLocaleDateString('ja-JP')
                : '未実施'
              }
            </p>
          </div>
        </div>

        {client.nextSessionFocus && (
          <div className="mb-4">
            <p className="text-xs text-slate-500">次回セッションの焦点</p>
            <p className="text-sm text-slate-700 line-clamp-2">{client.nextSessionFocus}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex space-x-1">
            {client.anxietyLevel && (
              <div className="text-xs">
                <span className="text-slate-500">不安:</span>
                <span className={`ml-1 font-medium ${
                  client.anxietyLevel <= 3 ? 'text-green-600' :
                  client.anxietyLevel <= 6 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {client.anxietyLevel}
                </span>
              </div>
            )}
            {client.depressionLevel && (
              <div className="text-xs">
                <span className="text-slate-500">うつ:</span>
                <span className={`ml-1 font-medium ${
                  client.depressionLevel <= 3 ? 'text-green-600' :
                  client.depressionLevel <= 6 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {client.depressionLevel}
                </span>
              </div>
            )}
            {client.stressLevel && (
              <div className="text-xs">
                <span className="text-slate-500">ストレス:</span>
                <span className={`ml-1 font-medium ${
                  client.stressLevel <= 3 ? 'text-green-600' :
                  client.stressLevel <= 6 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {client.stressLevel}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Button size="sm" variant="outline">
              詳細
            </Button>
          </div>
        </div>
      </Card>
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
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新規クライアント
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            {error}
          </div>
        )}

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">総クライアント数</p>
                <p className="text-2xl font-bold text-blue-700">{stats.totalClients}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">アクティブ</p>
                <p className="text-2xl font-bold text-green-700">{stats.activeClients}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">緊急準備</p>
                <p className="text-2xl font-bold text-orange-700">{stats.urgentPreps}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">完了セッション</p>
                <p className="text-2xl font-bold text-purple-700">{stats.completedSessions}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* 検索・フィルター */}
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="クライアント名やメールアドレスで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">全ステータス</option>
              <option value="active">アクティブ</option>
              <option value="paused">一時停止</option>
              <option value="completed">完了</option>
              <option value="transferred">転院</option>
            </select>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            クライアント一覧
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'sessions'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            セッション記録
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'progress'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            進捗管理
          </button>
          <button
            onClick={() => setActiveTab('prep')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'prep'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            次回準備
          </button>
        </div>
      </Card>

      {/* タブコンテンツ */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {filteredClients.length === 0 ? (
            <Card className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">
                {searchTerm || statusFilter !== 'all' ? '該当するクライアントがありません' : 'クライアントがいません'}
              </h3>
              <p className="text-slate-500 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? '検索条件を変更してください' 
                  : '新しいクライアントを追加しましょう'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  新規クライアントを追加
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map(renderClientCard)}
            </div>
          )}
        </div>
      )}

      {activeTab === 'sessions' && (
        <Card className="text-center py-12">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">
            セッション記録機能
          </h3>
          <p className="text-slate-500">
            セッション記録の詳細表示機能を実装中です
          </p>
        </Card>
      )}

      {activeTab === 'progress' && (
        <Card className="text-center py-12">
          <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">
            進捗管理機能
          </h3>
          <p className="text-slate-500">
            クライアント進捗の詳細表示機能を実装中です
          </p>
        </Card>
      )}

      {activeTab === 'prep' && (
        <Card className="text-center py-12">
          <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">
            次回セッション準備
          </h3>
          <p className="text-slate-500">
            セッション準備機能を実装中です
          </p>
        </Card>
      )}
    </div>
  );
};