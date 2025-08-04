import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface CounselorChatRoom {
  id: string;
  booking_id: string;
  created_at: string;
  booking: {
    id: string;
    scheduled_at: string;
    status: string;
    service_type: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  chat_messages: Array<{
    id: string;
    message: string;
    created_at: string;
  }>;
}

export const useCounselorChat = () => {
  const [chatRooms, setChatRooms] = useState<CounselorChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchChatRooms = useCallback(async () => {
    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('ユーザーが未認証のため、チャットルーム取得をスキップ');
      }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (process.env.NODE_ENV === 'development') {
        console.log('=== カウンセラーチャットルーム取得開始 ===');
        console.log('ユーザーID:', user.id);
      }

      // まず、現在のユーザーがカウンセラーとして登録されているか確認
      const { data: counselorData, error: counselorError } = await supabase
        .from('counselors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (counselorError) {
        console.error('カウンセラー情報取得エラー:', counselorError);
        if (counselorError.code === 'PGRST116') {
          setError('カウンセラーとして登録されていません');
        } else {
          setError('カウンセラー情報の取得に失敗しました');
        }
        setLoading(false);
        return;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('カウンセラーID:', counselorData.id);
      }

      // このカウンセラーの予約を取得（より詳細な情報を含む）
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          scheduled_at,
          status,
          service_type,
          amount,
          notes,
          created_at,
          user:users(id, name, email)
        `)
        .eq('counselor_id', counselorData.id)
        .in('status', ['confirmed', 'pending', 'completed'])
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('予約取得エラー:', bookingsError);
        setError('予約情報の取得に失敗しました');
        setLoading(false);
        return;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('取得された予約数:', bookings?.length || 0);
        console.log('予約詳細:', bookings);
      }

      if (!bookings || bookings.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log('予約データが存在しません');
        }
        
        // デモデータを表示（本番環境でも）
        const demoChatRooms: CounselorChatRoom[] = [
          {
            id: 'demo-1',
            booking_id: 'demo-booking-1',
            created_at: new Date().toISOString(),
            booking: {
              id: 'demo-booking-1',
              scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              status: 'confirmed',
              service_type: 'single',
              user: {
                id: 'demo-user-1',
                name: '田中太郎',
                email: 'tanaka@example.com'
              }
            },
            chat_messages: [
              {
                id: 'demo-msg-1',
                message: 'こんにちは、カウンセリングをお願いします。',
                created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
              }
            ]
          },
          {
            id: 'demo-2',
            booking_id: 'demo-booking-2',
            created_at: new Date().toISOString(),
            booking: {
              id: 'demo-booking-2',
              scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'pending',
              service_type: 'monthly',
              user: {
                id: 'demo-user-2',
                name: '佐藤花子',
                email: 'sato@example.com'
              }
            },
            chat_messages: []
          }
        ];
        
        setChatRooms(demoChatRooms);
        setLoading(false);
        return;
      }

      // 各予約に対してチャットルームを取得または作成
      const chatRoomsData: CounselorChatRoom[] = [];

      for (const booking of bookings) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`予約 ${booking.id} のチャットルームを確認中...`);
        }
        
        // 既存のチャットルームを確認
        const { data: existingRoom, error: roomError } = await supabase
          .from('chat_rooms')
          .select(`
            id,
            created_at,
            is_active,
            chat_messages(
              id,
              message,
              created_at
            )
          `)
          .eq('booking_id', booking.id)
          .single();
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`チャットルーム取得結果 (予約 ${booking.id}):`, { existingRoom, roomError });
        }
        
        let chatRoom;
        
        if (roomError && roomError.code !== 'PGRST116') {
          console.error(`チャットルーム取得エラー (予約 ${booking.id}):`, roomError);
          continue;
        }
        
        if (existingRoom) {
          // 既存のチャットルームを使用
          chatRoom = existingRoom;
          if (process.env.NODE_ENV === 'development') {
            console.log(`既存のチャットルームを使用: ${existingRoom.id}`);
          }
        } else {
          // チャットルームが存在しない場合は作成
          if (process.env.NODE_ENV === 'development') {
            console.log(`チャットルームを作成中 (予約 ${booking.id})...`);
          }
          
          const { data: newRoom, error: createError } = await supabase
            .from('chat_rooms')
            .insert({
              booking_id: booking.id,
              is_active: true
            })
            .select(`
              id,
              created_at,
              is_active,
              chat_messages(
                id,
                message,
                created_at
              )
            `)
            .single();
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`チャットルーム作成結果 (予約 ${booking.id}):`, { newRoom, createError });
          }
          
          if (createError) {
            console.error(`チャットルーム作成エラー (予約 ${booking.id}):`, createError);
            continue;
          }
          
          chatRoom = newRoom;
          if (process.env.NODE_ENV === 'development') {
            console.log(`新しいチャットルームを作成: ${newRoom.id}`);
          }
        }

        // チャットルームデータを構築
        const roomData: CounselorChatRoom = {
          id: chatRoom.id,
          booking_id: booking.id,
          created_at: chatRoom.created_at,
          booking: {
            id: booking.id,
            scheduled_at: booking.scheduled_at,
            status: booking.status,
            service_type: booking.service_type,
            user: booking.user
          },
          chat_messages: chatRoom.chat_messages || []
        };

        chatRoomsData.push(roomData);
        if (process.env.NODE_ENV === 'development') {
          console.log(`チャットルーム ${chatRoom.id} をリストに追加`);
        }
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('最終的なチャットルーム数:', chatRoomsData.length);
        console.log('チャットルーム詳細:', chatRoomsData);
      }
      setChatRooms(chatRoomsData);

    } catch (err: unknown) {
      console.error('チャットルーム取得エラー:', err);
      const errorMessage = err instanceof Error ? err.message : 'チャットルームの取得に失敗しました';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchChatRooms();
  }, [user]);

  return {
    chatRooms,
    loading,
    error,
    refetch: fetchChatRooms
  };
}; 