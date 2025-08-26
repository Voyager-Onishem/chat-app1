import React, { useEffect, useState, useCallback } from 'react';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import { useQuery, useMutation, useSubscription } from '../hooks/useQuery';
import { useNotifications } from '../context/NotificationContext';
import { supabase } from '../supabase-client';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { getErrorMessage } from '../utils/errorHandling';
import { debugMessagesSystem, createTestConversation } from '../utils/messages-debug';
import type { ChatProps, MessageProps } from '../types/messages';
import type { Conversation, ConversationParticipant, UserConversation, UserProfile } from '../types';
import {
  Box,
  Typography,
  Alert,
  Button,
} from '@mui/joy';
import ChatsPane from '../components/messages/ChatsPane';
import MessagesPane from '../components/messages/MessagesPane';

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
];

const MessagesImproved: React.FC = () => {
  const { user } = useSimpleAuth();
  const { error: notifyError, success } = useNotifications();
  const [selectedChat, setSelectedChat] = useState<ChatProps | null>(null);

  // Memoize the query function to prevent infinite re-renders
  const fetchConversations = useCallback(async () => {
      if (!user) throw new Error('User not authenticated');
      
      console.log('Fetching conversations for user:', user.id);

      // First get conversations where user is a participant
      const { data: userConversations, error: convError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (convError) {
        console.error('User conversations error:', convError);
        throw convError;
      }
      
      if (!userConversations || userConversations.length === 0) {
        console.log('No conversations found for user');
        return [];
      }

      const conversationIds = userConversations.map((uc: UserConversation) => uc.conversation_id);
      console.log('Found conversation IDs:', conversationIds);

      // Get conversations details
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('id, created_at')
        .in('id', conversationIds);

      if (conversationsError) {
        console.error('Conversations details error:', conversationsError);
        throw conversationsError;
      }

      // Get all participants for these conversations
      const { data: allParticipants, error: participantsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, user_id')
        .in('conversation_id', conversationIds);

      if (participantsError) {
        console.error('Participants error:', participantsError);
        throw participantsError;
      }

      // Get profiles for all participants
      const participantUserIds = [...new Set(allParticipants?.map((p: ConversationParticipant) => p.user_id) || [])];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, profile_picture_url, role')
        .in('user_id', participantUserIds);

      if (profilesError) {
        console.error('Profiles error:', profilesError);
        throw profilesError;
      }

      console.log('Raw data:', { conversationsData, allParticipants, profiles });

      // Combine the data
      return (conversationsData || []).map((conv: Conversation) => {
        // Get participants for this conversation
        const conversationParticipants = (allParticipants || [])
          .filter((p: ConversationParticipant) => p.conversation_id === conv.id)
          .map((p: ConversationParticipant) => {
            const profile = (profiles || []).find((prof: UserProfile) => prof.user_id === p.user_id);
            return {
              user_id: p.user_id,
              profiles: profile || {
                user_id: p.user_id,
                full_name: 'Unknown User',
                profile_picture_url: null,
                role: 'student'
              }
            };
          });

        // Find the other participant (not the current user)
        const otherParticipant = conversationParticipants.find((p: ConversationParticipant) => p.user_id !== user.id);
        const profile = otherParticipant?.profiles;
        
        return {
          id: conv.id,
          created_at: conv.created_at,
          participants: conversationParticipants,
          sender: profile ? {
            name: profile.full_name,
            username: `@${profile.full_name.toLowerCase().replace(/\s+/g, '')}`,
            avatar: profile.profile_picture_url || '/static/images/avatar/default.jpg',
            online: true,
          } : {
            name: 'Unknown User',
            username: '@unknown',
            avatar: '/static/images/avatar/default.jpg',
            online: false,
          },
          messages: [],
        };
      });
  }, [user]); // Only depend on user, not the entire function

  // Fetch conversations with robust error handling
  const {
    data: conversations,
    loading: conversationsLoading,
    error: conversationsError,
    refetch: refetchConversations,
    fromFallback,
  } = useQuery<ChatProps[]>(
    'conversations',
    fetchConversations,
    {
      enabled: !!user,
      fallbackData: mockConversations,
      retry: 2, // Increased retries
      timeout: 20000, // Increased timeout for complex query
      refetchOnWindowFocus: false, // Keep disabled due to complex multi-step query
    }
  );

  // Memoize the messages query function
  const fetchMessages = useCallback(async () => {
    if (!selectedChat) return [];
    
    console.log('Fetching messages for conversation:', selectedChat.id);

      // Get messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, content, created_at')
        .eq('conversation_id', selectedChat.id)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Messages query error:', messagesError);
        throw messagesError;
      }

      if (!messagesData || messagesData.length === 0) {
        console.log('No messages found for conversation');
        return [];
      }

      // Get profiles for message senders
      const senderIds = [...new Set(messagesData.map((m: any) => m.sender_id))];
      const { data: senderProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, profile_picture_url')
        .in('user_id', senderIds);

      if (profilesError) {
        console.error('Sender profiles error:', profilesError);
        throw profilesError;
      }

      // Combine messages with sender profiles
      const messagesWithProfiles = messagesData.map((message: any) => {
        const senderProfile = (senderProfiles || []).find((p: any) => p.user_id === message.sender_id);
        return {
          ...message,
          profiles: senderProfile ? {
            full_name: senderProfile.full_name,
            profile_picture_url: senderProfile.profile_picture_url
          } : {
            full_name: 'Unknown User',
            profile_picture_url: null
          }
        };
      });
      
      console.log('Messages with profiles:', messagesWithProfiles);
      return messagesWithProfiles;
  }, [selectedChat, user?.id]); // Dependencies: selectedChat and user.id

  // Fetch messages for selected conversation
  const {
    data: messages,
    loading: messagesLoading,
    refetch: refetchMessages,
  } = useQuery<MessageProps[]>(
    `messages-${selectedChat?.id}`,
    fetchMessages,
    {
      enabled: !!selectedChat,
      retry: 2,
      timeout: 15000, // Increased timeout
      refetchOnWindowFocus: false, // Disable to prevent conflicts with conversations query
    }
  );

  // Send message mutation
  const {
    mutate: sendMessage,
    loading: sendingMessage,
    error: sendMessageError,
  } = useMutation(
    async ({ content, conversationId }: { content: string; conversationId: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          content: content.trim(),
          conversation_id: conversationId,
          sender_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    {
      onSuccess: () => {
        refetchMessages();
        success('Message sent successfully');
      },
      onError: (error) => {
        notifyError(getErrorMessage(error), 'Failed to send message');
      },
    }
  );

  // Real-time subscription for new messages
  useSubscription(
    'messages',
    selectedChat ? `conversation_id=eq.${selectedChat.id}` : undefined,
    {
      enabled: !!selectedChat,
      onInsert: (payload: any) => {
        console.log('New message received:', payload);
        refetchMessages();
      },
      onUpdate: (payload: any) => {
        console.log('Message updated:', payload);
        refetchMessages();
      },
    }
  );

  const handleChatSelect = useCallback((chat: ChatProps) => {
    setSelectedChat(chat);
  }, []);

  const handleSendMessage = useCallback((content: string) => {
    if (!selectedChat || !content.trim()) return;
    sendMessage({ content, conversationId: selectedChat.id });
  }, [selectedChat, sendMessage]);

  // Show loading state
  if (conversationsLoading) {
    return <LoadingSpinner text="Loading conversations..." />;
  }

  // Show error state with retry option
  if (conversationsError && !fromFallback) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 2,
          p: 4,
        }}
      >
        <Alert color="danger" sx={{ maxWidth: 600, textAlign: 'center' }}>
          <Typography level="h4" sx={{ mb: 1 }}>
            Failed to load conversations
          </Typography>
          <Typography level="body-md" sx={{ mb: 2 }}>
            {getErrorMessage(conversationsError)}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button onClick={refetchConversations} variant="outlined">
              Try Again
            </Button>
            <Button 
              onClick={() => debugMessagesSystem()} 
              variant="soft"
              size="sm"
            >
              Debug
            </Button>
          </Box>
        </Alert>
      </Box>
    );
  }

  // Show fallback warning
  if (fromFallback) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert color="warning" sx={{ mb: 2 }}>
          <Typography level="body-sm">
            Using offline data. Some features may not work properly.
          </Typography>
          <Button 
            size="sm" 
            variant="outlined" 
            onClick={refetchConversations}
            sx={{ ml: 2 }}
          >
            Retry Connection
          </Button>
        </Alert>
        
        {/* Debug controls */}
        <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
          <Button 
            size="sm" 
            variant="soft" 
            onClick={() => debugMessagesSystem()}
          >
            Debug System
          </Button>
          <Button 
            size="sm" 
            variant="soft" 
            onClick={() => createTestConversation().then(() => refetchConversations())}
          >
            Create Test Chat
          </Button>
        </Box>
        
        <MessagesContent
          conversations={conversations || []}
          selectedChat={selectedChat}
          messages={messages || []}
          messagesLoading={messagesLoading}
          sendingMessage={sendingMessage}
          onChatSelect={handleChatSelect}
          onSendMessage={handleSendMessage}
        />
      </Box>
    );
  }

  return (
    <Box>
      {/* Temporary debug controls */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
        <Button 
          size="sm" 
          variant="soft" 
          onClick={() => debugMessagesSystem()}
        >
          Debug System
        </Button>
        <Button 
          size="sm" 
          variant="soft" 
          onClick={() => createTestConversation().then(() => refetchConversations())}
        >
          Create Test Chat
        </Button>
        <Typography level="body-sm" sx={{ alignSelf: 'center', ml: 2 }}>
          Conversations: {conversations?.length || 0} | Selected: {selectedChat?.id || 'none'}
        </Typography>
      </Box>
      
      <MessagesContent
        conversations={conversations || []}
        selectedChat={selectedChat}
        messages={messages || []}
        messagesLoading={messagesLoading}
        sendingMessage={sendingMessage}
        onChatSelect={handleChatSelect}
        onSendMessage={handleSendMessage}
      />
    </Box>
  );
};

interface MessagesContentProps {
  conversations: ChatProps[];
  selectedChat: ChatProps | null;
  messages: MessageProps[];
  messagesLoading: boolean;
  sendingMessage: boolean;
  onChatSelect: (chat: ChatProps) => void;
  onSendMessage: (content: string) => void;
}

const MessagesContent: React.FC<MessagesContentProps> = ({
  conversations,
  selectedChat,
  messages,
  messagesLoading,
  sendingMessage,
  onChatSelect,
  onSendMessage,
}) => {
  // Update selected chat with messages
  const chatWithMessages = selectedChat ? {
    ...selectedChat,
    messages: messages,
  } : null;

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 100px)' }}>
      <ChatsPane
        chats={conversations}
        selectedChatId={selectedChat?.id}
        onChatSelect={onChatSelect}
      />
      {chatWithMessages ? (
        <MessagesPane
          chat={chatWithMessages}
          onSendMessage={onSendMessage}
          loading={messagesLoading || sendingMessage}
        />
      ) : (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Typography level="h4">No conversation selected</Typography>
          <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
            Choose a conversation from the list to start messaging
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MessagesImproved;
