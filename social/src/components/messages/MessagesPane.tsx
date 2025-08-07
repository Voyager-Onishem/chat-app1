import { useRef, useEffect, useState } from 'react';
import Avatar from '@mui/joy/Avatar';
import Box from '@mui/joy/Box';
import IconButton from '@mui/joy/IconButton';
import Input from '@mui/joy/Input';
import Typography from '@mui/joy/Typography';
import Sheet from '@mui/joy/Sheet';
import SendIcon from '@mui/icons-material/Send';
import type { ChatProps } from '../../types/messages';
import { ChatBubble } from './ChatBubble';

interface MessagesPaneProps {
  chat: ChatProps;
  onSendMessage: (content: string) => void;
  loading?: boolean;
}

export default function MessagesPane({ chat, onSendMessage, loading = false }: MessagesPaneProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <Sheet
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Avatar
          src={chat.sender?.avatar || '/static/images/avatar/default.jpg'}
          alt={chat.sender?.name || 'User'}
          size="sm"
        />
        <Box sx={{ flex: 1 }}>
          <Typography level="title-sm">{chat.sender?.name || 'Unknown User'}</Typography>
          <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
            {chat.sender?.online ? 'Online' : 'Offline'}
          </Typography>
        </Box>
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
              Loading messages...
            </Typography>
          </Box>
        ) : (
          <>
            {chat.messages.map((message) => (
              <ChatBubble
                key={message.id}
                message={message}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* Input */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          gap: 1,
        }}
      >
        <Input
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          sx={{ flex: 1 }}
          disabled={loading}
        />
        <IconButton
          onClick={handleSend}
          disabled={!inputValue.trim() || loading}
          color="primary"
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Sheet>
  );
} 