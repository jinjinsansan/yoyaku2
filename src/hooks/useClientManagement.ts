import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface SessionNote {
  id: string;
  bookingId: string;
  counselorId: string;
  clientId: string;
  sessionDate: Date;
  sessionDurationMinutes: number;
  sessionType: 'initial' | 'regular' | 'followup' | 'emergency' | 'group';
  moodBefore?: number;
  moodAfter?: number;
  sessionSummary: string;
  keyTopics: string[];
  clientGoals: string[];
  progressNotes?: string;
  homeworkAssigned?: string;
  nextSessionFocus?: string;
  sessionEffectiveness?: number;
  requiresFollowup: boolean;
  crisisFlag: boolean;
  confidentialNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientProgress {
  id: string;
  clientId: string;
  counselorId: string;
  assessmentDate: Date;
  overallProgress: number;
  goalAchievement: string[];
  currentChallenges: string[];
  strengthsIdentified: string[];
  anxietyLevel?: number;
  depressionLevel?: number;
  stressLevel?: number;
  sleepQuality?: number;
  socialFunctioning?: number;
  workPerformance?: number;
  progressSummary?: string;
  recommendations?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NextSessionPrep {
  id: string;
  clientId: string;
  counselorId: string;
  lastSessionNoteId?: string;
  topicsToExplore: string[];
  techniquesToUse: string[];
  materialsNeeded: string[];
  homeworkReview?: string;
  sessionObjectives: string[];
  estimatedDuration: number;
  specialConsiderations?: string;
  priorityLevel: 'low' | 'normal' | 'high' | 'urgent';
  requiresSpecialistReferral: boolean;
  needsAdditionalResources: boolean;
  counselorNotes?: string;
  preparationStatus: 'pending' | 'in_progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientRelationship {
  id: string;
  clientId: string;
  counselorId: string;
  relationshipStartDate: Date;
  relationshipStatus: 'active' | 'paused' | 'completed' | 'transferred';
  totalSessions: number;
  initialConcerns: string[];
  treatmentGoals: string[];
  preferredCommunicationStyle?: string;
  culturalConsiderations?: string;
  emergencyContactInfo?: any;
  treatmentApproach: string[];
  sessionFrequency: 'weekly' | 'biweekly' | 'monthly' | 'as_needed';
  estimatedTreatmentLength?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientOverview {
  relationshipId: string;
  counselorId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  relationshipStartDate: Date;
  relationshipStatus: string;
  totalSessions: number;
  initialConcerns: string[];
  treatmentGoals: string[];
  sessionFrequency: string;
  overallProgress?: number;
  lastProgressDate?: Date;
  anxietyLevel?: number;
  depressionLevel?: number;
  stressLevel?: number;
  lastSessionDate?: Date;
  lastSessionMood?: number;
  nextSessionFocus?: string;
  nextSessionPriority?: string;
  preparationStatus?: string;
}

export const useClientManagement = (counselorId: string) => {
  const [clients, setClients] = useState<ClientOverview[]>([]);
  const [sessionNotes, setSessionNotes] = useState<SessionNote[]>([]);
  const [clientProgress, setClientProgress] = useState<ClientProgress[]>([]);
  const [sessionPreps, setSessionPreps] = useState<NextSessionPrep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // データ取得
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // クライアント概要を取得
      const { data: clientsData, error: clientsError } = await supabase
        .from('counselor_client_overview')
        .select('*')
        .eq('counselor_id', counselorId)
        .order('last_session_date', { ascending: false, nullsLast: true });

      if (clientsError) throw clientsError;

      // セッションノートを取得
      const { data: notesData, error: notesError } = await supabase
        .from('session_notes')
        .select('*')
        .eq('counselor_id', counselorId)
        .order('session_date', { ascending: false })
        .limit(50);

      if (notesError) throw notesError;

      // クライアント進捗を取得
      const { data: progressData, error: progressError } = await supabase
        .from('client_progress')
        .select('*')
        .eq('counselor_id', counselorId)
        .order('assessment_date', { ascending: false })
        .limit(100);

      if (progressError) throw progressError;

      // 次回セッション準備を取得
      const { data: prepData, error: prepError } = await supabase
        .from('next_session_prep')
        .select('*')
        .eq('counselor_id', counselorId);

      if (prepError) throw prepError;

      // データ変換
      setClients((clientsData || []).map(convertClientOverview));
      setSessionNotes((notesData || []).map(convertSessionNote));
      setClientProgress((progressData || []).map(convertClientProgress));
      setSessionPreps((prepData || []).map(convertNextSessionPrep));

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'データの取得に失敗しました';
      setError(errorMessage);
      console.error('Client management fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // セッションノート作成
  const createSessionNote = async (noteData: Omit<SessionNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('session_notes')
        .insert({
          booking_id: noteData.bookingId,
          counselor_id: noteData.counselorId,
          client_id: noteData.clientId,
          session_date: noteData.sessionDate.toISOString(),
          session_duration_minutes: noteData.sessionDurationMinutes,
          session_type: noteData.sessionType,
          mood_before: noteData.moodBefore,
          mood_after: noteData.moodAfter,
          session_summary: noteData.sessionSummary,
          key_topics: noteData.keyTopics,
          client_goals: noteData.clientGoals,
          progress_notes: noteData.progressNotes,
          homework_assigned: noteData.homeworkAssigned,
          next_session_focus: noteData.nextSessionFocus,
          session_effectiveness: noteData.sessionEffectiveness,
          requires_followup: noteData.requiresFollowup,
          crisis_flag: noteData.crisisFlag,
          confidential_notes: noteData.confidentialNotes
        });

      if (error) throw error;

      await fetchData();
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'セッションノートの作成に失敗しました';
      setError(errorMessage);
      return false;
    }
  };

  // セッションノート更新
  const updateSessionNote = async (id: string, updates: Partial<SessionNote>): Promise<boolean> => {
    try {
      const updateData: any = {};
      if (updates.sessionSummary) updateData.session_summary = updates.sessionSummary;
      if (updates.keyTopics) updateData.key_topics = updates.keyTopics;
      if (updates.clientGoals) updateData.client_goals = updates.clientGoals;
      if (updates.progressNotes !== undefined) updateData.progress_notes = updates.progressNotes;
      if (updates.homeworkAssigned !== undefined) updateData.homework_assigned = updates.homeworkAssigned;
      if (updates.nextSessionFocus !== undefined) updateData.next_session_focus = updates.nextSessionFocus;
      if (updates.sessionEffectiveness !== undefined) updateData.session_effectiveness = updates.sessionEffectiveness;
      if (updates.requiresFollowup !== undefined) updateData.requires_followup = updates.requiresFollowup;
      if (updates.crisisFlag !== undefined) updateData.crisis_flag = updates.crisisFlag;
      if (updates.confidentialNotes !== undefined) updateData.confidential_notes = updates.confidentialNotes;
      if (updates.moodBefore !== undefined) updateData.mood_before = updates.moodBefore;
      if (updates.moodAfter !== undefined) updateData.mood_after = updates.moodAfter;

      const { error } = await supabase
        .from('session_notes')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setSessionNotes(prev => prev.map(note => 
        note.id === id ? { ...note, ...updates } : note
      ));
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'セッションノートの更新に失敗しました';
      setError(errorMessage);
      return false;
    }
  };

  // クライアント進捗記録
  const recordClientProgress = async (progressData: Omit<ClientProgress, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('client_progress')
        .insert({
          client_id: progressData.clientId,
          counselor_id: progressData.counselorId,
          assessment_date: progressData.assessmentDate.toISOString().split('T')[0],
          overall_progress: progressData.overallProgress,
          goal_achievement: progressData.goalAchievement,
          current_challenges: progressData.currentChallenges,
          strengths_identified: progressData.strengthsIdentified,
          anxiety_level: progressData.anxietyLevel,
          depression_level: progressData.depressionLevel,
          stress_level: progressData.stressLevel,
          sleep_quality: progressData.sleepQuality,
          social_functioning: progressData.socialFunctioning,
          work_performance: progressData.workPerformance,
          progress_summary: progressData.progressSummary,
          recommendations: progressData.recommendations
        });

      if (error) throw error;

      await fetchData();
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '進捗記録の作成に失敗しました';
      setError(errorMessage);
      return false;
    }
  };

  // 次回セッション準備更新
  const updateSessionPrep = async (clientId: string, prepData: Partial<NextSessionPrep>): Promise<boolean> => {
    try {
      const updateData: any = {};
      if (prepData.topicsToExplore) updateData.topics_to_explore = prepData.topicsToExplore;
      if (prepData.techniquesToUse) updateData.techniques_to_use = prepData.techniquesToUse;
      if (prepData.materialsNeeded) updateData.materials_needed = prepData.materialsNeeded;
      if (prepData.homeworkReview !== undefined) updateData.homework_review = prepData.homeworkReview;
      if (prepData.sessionObjectives) updateData.session_objectives = prepData.sessionObjectives;
      if (prepData.estimatedDuration !== undefined) updateData.estimated_duration = prepData.estimatedDuration;
      if (prepData.specialConsiderations !== undefined) updateData.special_considerations = prepData.specialConsiderations;
      if (prepData.priorityLevel) updateData.priority_level = prepData.priorityLevel;
      if (prepData.requiresSpecialistReferral !== undefined) updateData.requires_specialist_referral = prepData.requiresSpecialistReferral;
      if (prepData.needsAdditionalResources !== undefined) updateData.needs_additional_resources = prepData.needsAdditionalResources;
      if (prepData.counselorNotes !== undefined) updateData.counselor_notes = prepData.counselorNotes;
      if (prepData.preparationStatus) updateData.preparation_status = prepData.preparationStatus;

      const { error } = await supabase
        .from('next_session_prep')
        .upsert({
          client_id: clientId,
          counselor_id: counselorId,
          ...updateData
        });

      if (error) throw error;

      await fetchData();
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'セッション準備の更新に失敗しました';
      setError(errorMessage);
      return false;
    }
  };

  // クライアント関係性作成
  const createClientRelationship = async (relationshipData: Omit<ClientRelationship, 'id' | 'totalSessions' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('client_counselor_relationships')
        .insert({
          client_id: relationshipData.clientId,
          counselor_id: relationshipData.counselorId,
          relationship_start_date: relationshipData.relationshipStartDate.toISOString().split('T')[0],
          relationship_status: relationshipData.relationshipStatus,
          initial_concerns: relationshipData.initialConcerns,
          treatment_goals: relationshipData.treatmentGoals,
          preferred_communication_style: relationshipData.preferredCommunicationStyle,
          cultural_considerations: relationshipData.culturalConsiderations,
          emergency_contact_info: relationshipData.emergencyContactInfo,
          treatment_approach: relationshipData.treatmentApproach,
          session_frequency: relationshipData.sessionFrequency,
          estimated_treatment_length: relationshipData.estimatedTreatmentLength
        });

      if (error) throw error;

      await fetchData();
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'クライアント関係性の作成に失敗しました';
      setError(errorMessage);
      return false;
    }
  };

  // データ変換関数
  const convertSessionNote = (data: any): SessionNote => ({
    id: data.id,
    bookingId: data.booking_id,
    counselorId: data.counselor_id,
    clientId: data.client_id,
    sessionDate: new Date(data.session_date),
    sessionDurationMinutes: data.session_duration_minutes,
    sessionType: data.session_type,
    moodBefore: data.mood_before,
    moodAfter: data.mood_after,
    sessionSummary: data.session_summary,
    keyTopics: data.key_topics || [],
    clientGoals: data.client_goals || [],
    progressNotes: data.progress_notes,
    homeworkAssigned: data.homework_assigned,
    nextSessionFocus: data.next_session_focus,
    sessionEffectiveness: data.session_effectiveness,
    requiresFollowup: data.requires_followup,
    crisisFlag: data.crisis_flag,
    confidentialNotes: data.confidential_notes,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  });

  const convertClientProgress = (data: any): ClientProgress => ({
    id: data.id,
    clientId: data.client_id,
    counselorId: data.counselor_id,
    assessmentDate: new Date(data.assessment_date),
    overallProgress: data.overall_progress,
    goalAchievement: data.goal_achievement || [],
    currentChallenges: data.current_challenges || [],
    strengthsIdentified: data.strengths_identified || [],
    anxietyLevel: data.anxiety_level,
    depressionLevel: data.depression_level,
    stressLevel: data.stress_level,
    sleepQuality: data.sleep_quality,
    socialFunctioning: data.social_functioning,
    workPerformance: data.work_performance,
    progressSummary: data.progress_summary,
    recommendations: data.recommendations,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  });

  const convertNextSessionPrep = (data: any): NextSessionPrep => ({
    id: data.id,
    clientId: data.client_id,
    counselorId: data.counselor_id,
    lastSessionNoteId: data.last_session_note_id,
    topicsToExplore: data.topics_to_explore || [],
    techniquesToUse: data.techniques_to_use || [],
    materialsNeeded: data.materials_needed || [],
    homeworkReview: data.homework_review,
    sessionObjectives: data.session_objectives || [],
    estimatedDuration: data.estimated_duration,
    specialConsiderations: data.special_considerations,
    priorityLevel: data.priority_level,
    requiresSpecialistReferral: data.requires_specialist_referral,
    needsAdditionalResources: data.needs_additional_resources,
    counselorNotes: data.counselor_notes,
    preparationStatus: data.preparation_status,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  });

  const convertClientOverview = (data: any): ClientOverview => ({
    relationshipId: data.relationship_id,
    counselorId: data.counselor_id,
    clientId: data.client_id,
    clientName: data.client_name,
    clientEmail: data.client_email,
    relationshipStartDate: new Date(data.relationship_start_date),
    relationshipStatus: data.relationship_status,
    totalSessions: data.total_sessions,
    initialConcerns: data.initial_concerns || [],
    treatmentGoals: data.treatment_goals || [],
    sessionFrequency: data.session_frequency,
    overallProgress: data.overall_progress,
    lastProgressDate: data.last_progress_date ? new Date(data.last_progress_date) : undefined,
    anxietyLevel: data.anxiety_level,
    depressionLevel: data.depression_level,
    stressLevel: data.stress_level,
    lastSessionDate: data.last_session_date ? new Date(data.last_session_date) : undefined,
    lastSessionMood: data.last_session_mood,
    nextSessionFocus: data.next_session_focus,
    nextSessionPriority: data.next_session_priority,
    preparationStatus: data.preparation_status
  });

  useEffect(() => {
    if (counselorId) {
      fetchData();
    }
  }, [counselorId]);

  return {
    clients,
    sessionNotes,
    clientProgress,
    sessionPreps,
    loading,
    error,
    createSessionNote,
    updateSessionNote,
    recordClientProgress,
    updateSessionPrep,
    createClientRelationship,
    refetch: fetchData
  };
};