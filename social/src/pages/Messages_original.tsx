import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase-client';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import ChatsPane from '../components/messages/ChatsPane';
import MessagesPane from '../components/messages/MessagesPane';
import type { ChatProps, MessageProps } from '../types/messages';

export default function Messages() {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatProps[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data for fallback
  const mockConversations: ChatProps[] = [
    {
      id: '1',
      created_at: '2023-10-26T10:00:00Z',
      participants: [
        { user_id: '1', profiles: { user_id: '1', full_name: 'Alice', profile_picture_url: '/static/images/avatar/default.jpg', role: 'user' } },
        { user_id: '2', profiles: { user_id: '2', full_name: 'Bob', profile_picture_url: '/static/images/avatar/default.jpg', role: 'user' } },
      ],
      sender: {
        name: 'Bob',
        username: '@bob',
        avatar: '/static/images/avatar/default.jpg',
        online: true,
      },
      messages: [],
    },
    {
      id: '2',
      created_at: '2023-10-26T11:00:00Z',
      participants: [
        { user_id: '1', profiles: { user_id: '1', full_name: 'Alice', profile_picture_url: '/static/images/avatar/default.jpg', role: 'user' } },
        { user_id: '3', profiles: { user_id: '3', full_name: 'Charlie', profile_picture_url: '/static/images/avatar/default.jpg', role: 'user' } },
      ],
      sender: {
        name: 'Charlie',
        username: '@charlie',
        avatar: '/static/images/avatar/default.jpg',
        online: true,
      },
      messages: [],
    },
  ];

  // Fetch conversations from Supabase
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('Messages loading timeout - using mock data');
        setChats(mockConversations);
        setLoading(false);
      }, 5000);

      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          id,
          created_at,
          conversation_participants!inner(
            user_id,
            profiles!inner(
              user_id,
              full_name,
              profile_picture_url,
              role
            )
          )
        `)
        .eq('conversation_participants.user_id', user?.id);

      clearTimeout(timeoutId);

      if (conversationsError) {
        console.error('Error fetching conversations:', conversationsError);
        console.log('Using mock data as fallback');
        setChats(mockConversations);
        setLoading(false);
        return;
      }

      const transformedConversations: ChatProps[] = (conversationsData || []).map((conv: any) => {
        // Find the other participant (not the current user)
        const otherParticipant = conv.conversation_participants.find((p: any) => p.user_id !== user?.id);
        const profile = otherParticipant?.profiles;
        
        return {
          id: conv.id,
          created_at: conv.created_at,
          participants: conv.conversation_participants,
          sender: profile ? {
            name: profile.full_name,
            username: `@${profile.full_name?.toLowerCase().replace(/\s+/g, '')}`,
            avatar: profile.profile_picture_url || '/static/images/avatar/default.jpg',
            online: true,
          } : undefined,
          messages: [], // Will be loaded separately
        };
      });

      setChats(transformedConversations);
      if (transformedConversations.length > 0) {
        setSelectedChat(transformedConversations[0]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      console.log('Using mock data as fallback');
      setChats(mockConversations);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch messages for a specific conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      setMessagesLoading(true);
      setError(null);
      
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          conversation_id,
          profiles!inner(
            full_name,
            profile_picture_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        setError('Failed to load messages');
        return;
      }

      const transformedMessages: MessageProps[] = (messagesData || []).map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        created_at: msg.created_at,
        sender_id: msg.sender_id,
        conversation_id: msg.conversation_id,
        timestamp: new Date(msg.created_at).toLocaleString(),
        sender: msg.sender_id === user?.id ? 'You' : {
          name: msg.profiles?.full_name || 'Unknown',
          username: `@${msg.profiles?.full_name?.toLowerCase().replace(/\s+/g, '') || 'unknown'}`,
          avatar: msg.profiles?.profile_picture_url || '/static/images/avatar/default.jpg',
          online: true,
        },
        profiles: msg.profiles,
      }));

      setSelectedChat(prev => prev ? {
        ...prev,
        messages: transformedMessages
      } : null);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  }, [user?.id]);

  // Send a new message
  const sendMessage = async (content: string) => {
    if (!selectedChat || !user) return;

    try {
      setError(null);
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedChat.id,
          sender_id: user.id,
          content: content,
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        setError('Failed to send message');
        return;
      }

      // Add the new message to the chat
      const newMessage: MessageProps = {
        id: message.id,
        content: message.content,
        timestamp: new Date(message.created_at).toLocaleString(),
        sender: 'You',
      };

      setSelectedChat(prev => prev ? {
        ...prev,
        messages: [...prev.messages, newMessage],
      } : null);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  // Handle chat selection
  const handleChatSelect = useCallback((chat: ChatProps) => {
    setSelectedChat(chat);
    fetchMessages(chat.id);
  }, [fetchMessages]);

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!selectedChat) return;

    const subscription = supabase
      .channel(`messages:${selectedChat.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedChat.id}`,
      }, (payload: any) => {
        const newMessage = payload.new;
        if (newMessage.sender_id !== user?.id) {
          // Add the new message to the chat
          const message: MessageProps = {
            id: newMessage.id,
            content: newMessage.content,
            timestamp: new Date(newMessage.created_at).toLocaleString(),
            sender: selectedChat.sender,
          };

          setSelectedChat(prev => prev ? {
            ...prev,
            messages: [...prev.messages, message],
          } : null);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedChat, user?.id]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography>Loading conversations...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: 2 }}>
        <Typography color="danger">{error}</Typography>
        <Typography level="body-sm" onClick={fetchConversations} sx={{ cursor: 'pointer', textDecoration: 'underline' }}>
          Try again
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <ChatsPane
        chats={chats}
        selectedChatId={selectedChat?.id}
        onChatSelect={handleChatSelect}
      />
      {selectedChat ? (
        <MessagesPane
          chat={selectedChat}
          onSendMessage={sendMessage}
          loading={messagesLoading}
        />
      ) : (
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          flexDirection: 'column',
          gap: 2
        }}>
          <Typography level="h4">No conversations</Typography>
          <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
            Start a conversation with someone from the directory
          </Typography>
        </Box>
      )}
    </Box>
  );
}
