import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ScheduleTemplate {
  id: string;
  counselorId: string;
  name: string;
  description?: string;
  weekdays: number[];
  startTime: string;
  endTime: string;
  sessionDurationMinutes: number;
  bufferMinutes: number;
  isActive: boolean;
  effectiveStartDate: string;
  effectiveEndDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeOff {
  id: string;
  counselorId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  isAllDay: boolean;
  timeOffType: 'vacation' | 'sick_leave' | 'personal' | 'training' | 'other';
  recurringType?: 'none' | 'weekly' | 'monthly' | 'yearly';
  recurringEndDate?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarSettings {
  id: string;
  counselorId: string;
  googleCalendarId?: string;
  syncEnabled: boolean;
  autoSyncBookings: boolean;
  syncBufferMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerationLog {
  id: string;
  counselorId: string;
  templateId?: string;
  template?: ScheduleTemplate;
  generationDate: string;
  startDate: string;
  endDate: string;
  slotsCreated: number;
  slotsFailed: number;
  errorMessages: string[];
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

export const useAdvancedSchedule = (counselorId: string) => {
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [timeOffs, setTimeOffs] = useState<TimeOff[]>([]);
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings | null>(null);
  const [generationLogs, setGenerationLogs] = useState<GenerationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // データ取得
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // スケジュールテンプレート取得
      const { data: templatesData, error: templatesError } = await supabase
        .from('schedule_templates')
        .select('*')
        .eq('counselor_id', counselorId)
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;

      // 休暇・不在期間取得
      const { data: timeOffsData, error: timeOffsError } = await supabase
        .from('counselor_time_off')
        .select('*')
        .eq('counselor_id', counselorId)
        .order('start_date', { ascending: false });

      if (timeOffsError) throw timeOffsError;

      // カレンダー設定取得
      const { data: settingsData, error: settingsError } = await supabase
        .from('counselor_calendar_settings')
        .select('*')
        .eq('counselor_id', counselorId)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

      // 生成ログ取得
      const { data: logsData, error: logsError } = await supabase
        .from('schedule_generation_logs')
        .select(`
          *,
          template:schedule_templates(*)
        `)
        .eq('counselor_id', counselorId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (logsError) throw logsError;

      // データ変換
      setTemplates((templatesData || []).map(convertTemplate));
      setTimeOffs((timeOffsData || []).map(convertTimeOff));
      setCalendarSettings(settingsData ? convertCalendarSettings(settingsData) : null);
      setGenerationLogs((logsData || []).map(convertGenerationLog));

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'データの取得に失敗しました';
      setError(errorMessage);
      console.error('Advanced schedule fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // スケジュールテンプレート作成
  const createTemplate = async (templateData: Omit<ScheduleTemplate, 'id' | 'counselorId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('schedule_templates')
        .insert({
          counselor_id: counselorId,
          name: templateData.name,
          description: templateData.description,
          weekdays: templateData.weekdays,
          start_time: templateData.startTime,
          end_time: templateData.endTime,
          session_duration_minutes: templateData.sessionDurationMinutes,
          buffer_minutes: templateData.bufferMinutes,
          is_active: templateData.isActive,
          effective_start_date: templateData.effectiveStartDate,
          effective_end_date: templateData.effectiveEndDate
        })
        .select()
        .single();

      if (error) throw error;

      setTemplates(prev => [convertTemplate(data), ...prev]);
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'テンプレートの作成に失敗しました';
      setError(errorMessage);
      return false;
    }
  };

  // スケジュールテンプレート更新
  const updateTemplate = async (id: string, updates: Partial<ScheduleTemplate>): Promise<boolean> => {
    try {
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.weekdays) updateData.weekdays = updates.weekdays;
      if (updates.startTime) updateData.start_time = updates.startTime;
      if (updates.endTime) updateData.end_time = updates.endTime;
      if (updates.sessionDurationMinutes) updateData.session_duration_minutes = updates.sessionDurationMinutes;
      if (updates.bufferMinutes !== undefined) updateData.buffer_minutes = updates.bufferMinutes;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.effectiveStartDate) updateData.effective_start_date = updates.effectiveStartDate;
      if (updates.effectiveEndDate !== undefined) updateData.effective_end_date = updates.effectiveEndDate;

      const { error } = await supabase
        .from('schedule_templates')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setTemplates(prev => prev.map(template => 
        template.id === id ? { ...template, ...updates } : template
      ));
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'テンプレートの更新に失敗しました';
      setError(errorMessage);
      return false;
    }
  };

  // スケジュールテンプレート削除
  const deleteTemplate = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('schedule_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTemplates(prev => prev.filter(template => template.id !== id));
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'テンプレートの削除に失敗しました';
      setError(errorMessage);
      return false;
    }
  };

  // 休暇・不在期間作成
  const createTimeOff = async (timeOffData: Omit<TimeOff, 'id' | 'counselorId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('counselor_time_off')
        .insert({
          counselor_id: counselorId,
          title: timeOffData.title,
          description: timeOffData.description,
          start_date: timeOffData.startDate,
          end_date: timeOffData.endDate,
          start_time: timeOffData.startTime,
          end_time: timeOffData.endTime,
          is_all_day: timeOffData.isAllDay,
          time_off_type: timeOffData.timeOffType,
          recurring_type: timeOffData.recurringType,
          recurring_end_date: timeOffData.recurringEndDate,
          status: timeOffData.status
        })
        .select()
        .single();

      if (error) throw error;

      setTimeOffs(prev => [convertTimeOff(data), ...prev]);
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '休暇の作成に失敗しました';
      setError(errorMessage);
      return false;
    }
  };

  // 休暇・不在期間更新
  const updateTimeOff = async (id: string, updates: Partial<TimeOff>): Promise<boolean> => {
    try {
      const updateData: any = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.startDate) updateData.start_date = updates.startDate;
      if (updates.endDate) updateData.end_date = updates.endDate;
      if (updates.startTime !== undefined) updateData.start_time = updates.startTime;
      if (updates.endTime !== undefined) updateData.end_time = updates.endTime;
      if (updates.isAllDay !== undefined) updateData.is_all_day = updates.isAllDay;
      if (updates.timeOffType) updateData.time_off_type = updates.timeOffType;
      if (updates.recurringType !== undefined) updateData.recurring_type = updates.recurringType;
      if (updates.recurringEndDate !== undefined) updateData.recurring_end_date = updates.recurringEndDate;
      if (updates.status) updateData.status = updates.status;

      const { error } = await supabase
        .from('counselor_time_off')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setTimeOffs(prev => prev.map(timeOff => 
        timeOff.id === id ? { ...timeOff, ...updates } : timeOff
      ));
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '休暇の更新に失敗しました';
      setError(errorMessage);
      return false;
    }
  };

  // 休暇・不在期間削除
  const deleteTimeOff = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('counselor_time_off')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTimeOffs(prev => prev.filter(timeOff => timeOff.id !== id));
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '休暇の削除に失敗しました';
      setError(errorMessage);
      return false;
    }
  };

  // スケジュール一括生成
  const generateFromTemplate = async (templateId: string, startDate: string, endDate: string): Promise<{
    success: boolean;
    created: number;
    skipped: number;
    errors: number;
    errorMessages: string[];
  }> => {
    try {
      const { data, error } = await supabase.rpc('generate_schedule_from_template', {
        p_template_id: templateId,
        p_start_date: startDate,
        p_end_date: endDate
      });

      if (error) throw error;

      const result = data[0];
      await fetchData(); // データを再取得
      
      return {
        success: result.error_count === 0,
        created: result.created_count,
        skipped: result.skipped_count,
        errors: result.error_count,
        errorMessages: result.errors || []
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'スケジュール生成に失敗しました';
      setError(errorMessage);
      return {
        success: false,
        created: 0,
        skipped: 0,
        errors: 1,
        errorMessages: [errorMessage]
      };
    }
  };

  // カレンダー設定更新
  const updateCalendarSettings = async (settings: Partial<CalendarSettings>): Promise<boolean> => {
    try {
      const updateData: any = {};
      if (settings.googleCalendarId !== undefined) updateData.google_calendar_id = settings.googleCalendarId;
      if (settings.syncEnabled !== undefined) updateData.sync_enabled = settings.syncEnabled;
      if (settings.autoSyncBookings !== undefined) updateData.auto_sync_bookings = settings.autoSyncBookings;
      if (settings.syncBufferMinutes !== undefined) updateData.sync_buffer_minutes = settings.syncBufferMinutes;

      if (calendarSettings) {
        // 更新
        const { error } = await supabase
          .from('counselor_calendar_settings')
          .update(updateData)
          .eq('counselor_id', counselorId);

        if (error) throw error;
        setCalendarSettings(prev => prev ? { ...prev, ...settings } : null);
      } else {
        // 新規作成
        const { data, error } = await supabase
          .from('counselor_calendar_settings')
          .insert({
            counselor_id: counselorId,
            ...updateData
          })
          .select()
          .single();

        if (error) throw error;
        setCalendarSettings(convertCalendarSettings(data));
      }

      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'カレンダー設定の更新に失敗しました';
      setError(errorMessage);
      return false;
    }
  };

  // データ変換関数
  const convertTemplate = (data: any): ScheduleTemplate => ({
    id: data.id,
    counselorId: data.counselor_id,
    name: data.name,
    description: data.description,
    weekdays: data.weekdays,
    startTime: data.start_time,
    endTime: data.end_time,
    sessionDurationMinutes: data.session_duration_minutes,
    bufferMinutes: data.buffer_minutes,
    isActive: data.is_active,
    effectiveStartDate: data.effective_start_date,
    effectiveEndDate: data.effective_end_date,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  });

  const convertTimeOff = (data: any): TimeOff => ({
    id: data.id,
    counselorId: data.counselor_id,
    title: data.title,
    description: data.description,
    startDate: data.start_date,
    endDate: data.end_date,
    startTime: data.start_time,
    endTime: data.end_time,
    isAllDay: data.is_all_day,
    timeOffType: data.time_off_type,
    recurringType: data.recurring_type,
    recurringEndDate: data.recurring_end_date,
    status: data.status,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  });

  const convertCalendarSettings = (data: any): CalendarSettings => ({
    id: data.id,
    counselorId: data.counselor_id,
    googleCalendarId: data.google_calendar_id,
    syncEnabled: data.sync_enabled,
    autoSyncBookings: data.auto_sync_bookings,
    syncBufferMinutes: data.sync_buffer_minutes,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  });

  const convertGenerationLog = (data: any): GenerationLog => ({
    id: data.id,
    counselorId: data.counselor_id,
    templateId: data.template_id,
    template: data.template ? convertTemplate(data.template) : undefined,
    generationDate: data.generation_date,
    startDate: data.start_date,
    endDate: data.end_date,
    slotsCreated: data.slots_created,
    slotsFailed: data.slots_failed,
    errorMessages: data.error_messages || [],
    status: data.status,
    createdAt: new Date(data.created_at)
  });

  useEffect(() => {
    fetchData();
  }, [counselorId]);

  return {
    templates,
    timeOffs,
    calendarSettings,
    generationLogs,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    createTimeOff,
    updateTimeOff,
    deleteTimeOff,
    generateFromTemplate,
    updateCalendarSettings,
    refetch: fetchData
  };
};