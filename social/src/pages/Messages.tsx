import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabase-client';
import { Box, Typography, CircularProgress, Alert, Button, Card, Avatar, Input, IconButton } from '@mui/joy';
import { Send as SendIcon } from '@mui/icons-material';

interface Message {
  id: number;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender: {
    full_name: string;
    profile_picture_url?: string;
  };
}

interface Conversation {
  id: string;
  participants: {
    user_id: string;
    full_name: string;
    profile_picture_url?: string;
  }[];
  last_message?: Message;
}

export const Messages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      setError('');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError('Not logged in.');
        setLoading(false);
        return;
      }
      
      setCurrentUser(user);

      // Fetch conversations where user is a participant
      const { data: participantData, error } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (!participantData || participantData.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const conversationIds = participantData.map(p => p.conversation_id);

      // Fetch conversations
      const { data: conversationsData } = await supabase
        .from('conversations')
        .select('id')
        .in('id', conversationIds);

      // Fetch all participants for these conversations
      const { data: participantsData } = await supabase
        .from('conversation_participants')
        .select('conversation_id, user_id')
        .in('conversation_id', conversationIds);

      // Fetch profiles for all participants
      const participantUserIds = participantsData?.map(p => p.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, profile_picture_url')
        .in('user_id', participantUserIds);

      // Create profiles map
      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.user_id, profile);
      });

      // Fetch messages for all conversations
      const { data: messagesData } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, content, created_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: true });

      // Group messages by conversation
      const messagesByConversation = new Map();
      messagesData?.forEach(message => {
        if (!messagesByConversation.has(message.conversation_id)) {
          messagesByConversation.set(message.conversation_id, []);
        }
        messagesByConversation.get(message.conversation_id).push({
          ...message,
          sender: profilesMap.get(message.sender_id)
        });
      });

      // Format conversations
      const formattedConversations = conversationsData?.map(conversation => {
        const conversationParticipants = participantsData?.filter(p => p.conversation_id === conversation.id) || [];
        const conversationMessages = messagesByConversation.get(conversation.id) || [];
        
        return {
          id: conversation.id,
          participants: conversationParticipants
            .filter(p => p.user_id !== user.id)
            .map(p => profilesMap.get(p.user_id)),
          last_message: conversationMessages[conversationMessages.length - 1]
        };
      }) || [];

      setConversations(formattedConversations);
      setLoading(false);
    };

    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
      subscribeToMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const fetchMessages = async (conversationId: string) => {
    const { data: messagesData, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      setError(error.message);
      return;
    }

    if (messagesData && messagesData.length > 0) {
      // Fetch sender profiles
      const senderIds = [...new Set(messagesData.map(m => m.sender_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, profile_picture_url')
        .in('user_id', senderIds);

      // Create profiles map
      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.user_id, profile);
      });

      // Add sender info to messages
      const messagesWithSenders = messagesData.map(message => ({
        ...message,
        sender: profilesMap.get(message.sender_id)
      }));

      setMessages(messagesWithSenders);
      scrollToBottom();
    } else {
      setMessages([]);
    }
  };

  const subscribeToMessages = (conversationId: string) => {
    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
        scrollToBottom();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation,
          sender_id: currentUser.id,
          content: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const createConversation = async (otherUserId: string) => {
    try {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUser.id);

      const existingConversationIds = existing?.map(c => c.conversation_id) || [];

      if (existingConversationIds.length > 0) {
        const { data: otherParticipant } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', otherUserId)
          .in('conversation_id', existingConversationIds);

        if (otherParticipant && otherParticipant.length > 0) {
          setSelectedConversation(otherParticipant[0].conversation_id);
          return;
        }
      }

      // Create new conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conversation.id, user_id: currentUser.id },
          { conversation_id: conversation.id, user_id: otherUserId }
        ]);

      setSelectedConversation(conversation.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <Box sx={{ mt: 8, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ mt: 8 }}><Alert color="danger">{error}</Alert></Box>;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 8, height: 'calc(100vh - 120px)', display: 'flex' }}>
      {/* Conversations List */}
      <Box sx={{ width: 300, borderRight: 1, borderColor: 'divider', overflowY: 'auto' }}>
        <Typography level="h4" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          Conversations
        </Typography>
        {conversations.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography level="body-sm" color="neutral">
              No conversations yet. Connect with someone to start chatting!
            </Typography>
          </Box>
        ) : (
          <Box>
            {conversations.map((conv) => (
              <Card
                key={conv.id}
                sx={{
                  m: 1,
                  cursor: 'pointer',
                  bgcolor: selectedConversation === conv.id ? 'primary.50' : 'background.surface',
                  '&:hover': { bgcolor: 'primary.50' }
                }}
                onClick={() => setSelectedConversation(conv.id)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1 }}>
                  <Avatar
                    src={conv.participants[0]?.profile_picture_url}
                    alt={conv.participants[0]?.full_name}
                    sx={{ width: 40, height: 40 }}
                  >
                    {conv.participants[0]?.full_name[0]}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography level="title-sm" noWrap>
                      {conv.participants[0]?.full_name}
                    </Typography>
                    {conv.last_message && (
                      <Typography level="body-xs" color="neutral" noWrap>
                        {conv.last_message.content}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      {/* Messages Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedConversation ? (
          <>
            {/* Messages Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography level="title-lg">
                {conversations.find(c => c.id === selectedConversation)?.participants[0]?.full_name}
              </Typography>
            </Box>

            {/* Messages */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: message.sender_id === currentUser?.id ? 'flex-end' : 'flex-start',
                    mb: 1
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: '70%',
                      bgcolor: message.sender_id === currentUser?.id ? 'primary.500' : 'neutral.100',
                      color: message.sender_id === currentUser?.id ? 'white' : 'text.primary',
                      p: 1.5,
                      borderRadius: 2,
                      wordBreak: 'break-word'
                    }}
                  >
                    <Typography level="body-sm">{message.content}</Typography>
                    <Typography level="body-xs" sx={{ opacity: 0.7, mt: 0.5 }}>
                      {new Date(message.created_at).toLocaleTimeString()}
                    </Typography>
                  </Box>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Box>

            {/* Message Input */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Input
                  fullWidth
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <IconButton onClick={sendMessage} disabled={!newMessage.trim()}>
                  <SendIcon />
                </IconButton>
              </Box>
            </Box>
          </>
        ) : (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography level="body-lg" color="neutral">
              Select a conversation to start messaging
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}; 