import React, { useEffect, useState, useCallback } from 'react';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import { useConversations, useMessages, useSendMessage } from '../hooks/useApiQueries';
import { useNotifications } from '../context/NotificationContext';
import { supabase } from '../supabase-client';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { getErrorMessage } from '../utils/errorHandling';
import type { ChatProps, MessageProps } from '../types/messages';
import type { Conversation, ConversationParticipant } from '../types';
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

  // Fetch conversations using React Query
  const {
    data: rawConversations = [],
    isLoading: conversationsLoading,
    error: conversationsError,
    refetch: refetchConversations,
  } = useConversations(user?.id || '', {
    enabled: !!user,
  });

  // Transform conversations to ChatProps format
  const conversations: ChatProps[] = rawConversations.map((conv: any) => {
    const otherParticipant = conv.participants?.find(
      (p: any) => p.user_id !== user?.id
    );
    const profile = otherParticipant?.profile;
    
    return {
      id: conv.id,
      created_at: conv.created_at,
      participants: conv.participants || [],
      sender: profile ? {
        name: profile.full_name,
        username: `@${profile.full_name.toLowerCase().replace(/\s+/g, '')}`,
        avatar: profile.profile_picture_url || '/static/images/avatar/default.jpg',
        online: true,
      } : undefined,
      messages: [],
    };
  });

  // Fetch messages for selected conversation using React Query
  const {
    data: rawMessages = [],
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useMessages(selectedChat?.id || '', {
    enabled: !!selectedChat?.id,
  });

  // Transform messages to MessageProps format
  const messages: MessageProps[] = rawMessages.map((msg: any) => ({
    id: msg.id,
    content: msg.content,
    timestamp: msg.created_at,
    sender: {
      id: msg.sender_id,
      name: msg.sender?.full_name || 'Unknown',
      username: `@${msg.sender?.full_name?.toLowerCase().replace(/\s+/g, '') || 'unknown'}`,
      avatar: msg.sender?.profile_picture_url || '/static/images/avatar/default.jpg',
      online: true,
    },
  }));

  // Send message mutation using React Query
  const {
    mutate: sendMessage,
    isPending: sendingMessage,
    error: sendMessageError,
  } = useSendMessage({
    onSuccess: () => {
      success('Message sent successfully');
    },
    onError: (error: any) => {
      notifyError(getErrorMessage(error), 'Failed to send message');
    },
  });

  const handleChatSelect = useCallback((chat: ChatProps) => {
    setSelectedChat(chat);
  }, []);

  const handleSendMessage = useCallback((content: string) => {
    if (!selectedChat || !content.trim() || !user) return;
    sendMessage({ 
      content, 
      conversationId: selectedChat.id,
      senderId: user.id 
    });
  }, [selectedChat, sendMessage, user]);

  // Show loading state
  if (conversationsLoading) {
    return <LoadingSpinner text="Loading conversations..." />;
  }

  // Show error state with retry option
  if (conversationsError) {
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
        <Alert color="danger" sx={{ maxWidth: 400, textAlign: 'center' }}>
          <Typography level="h4" sx={{ mb: 1 }}>
            Failed to load conversations
          </Typography>
          <Typography level="body-md" sx={{ mb: 2 }}>
            {getErrorMessage(conversationsError)}
          </Typography>
          <Button onClick={() => refetchConversations()} variant="outlined">
            Try Again
          </Button>
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
    <MessagesContent
      conversations={conversations || []}
      selectedChat={selectedChat}
      messages={messages || []}
      messagesLoading={messagesLoading}
      sendingMessage={sendingMessage}
      onChatSelect={handleChatSelect}
      onSendMessage={handleSendMessage}
    />
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
