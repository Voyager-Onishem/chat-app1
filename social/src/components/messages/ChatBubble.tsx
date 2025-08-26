import Avatar from '@mui/joy/Avatar';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import type { MessageProps } from '../../types/messages';
import { useSimpleAuth } from '../../context/SimpleAuthContext';

interface ChatBubbleProps {
  message: MessageProps;
}

export const ChatBubble = ({ message }: ChatBubbleProps) => {
  const { user } = useSimpleAuth();
  const isOwnMessage = message.sender_id === user?.id;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: isOwnMessage ? 'row-reverse' : 'row',
          alignItems: 'flex-end',
          gap: 1,
          maxWidth: '70%',
        }}
      >
        {!isOwnMessage && (
          <Avatar
            src={message.profiles?.profile_picture_url}
            alt={message.profiles?.full_name || 'User'}
            size="sm"
            sx={{ width: 24, height: 24 }}
          />
        )}
        <Box
          sx={{
            backgroundColor: isOwnMessage ? 'primary.500' : 'neutral.100',
            color: isOwnMessage ? 'white' : 'text.primary',
            borderRadius: 2,
            px: 2,
            py: 1,
            maxWidth: '100%',
            wordBreak: 'break-word',
          }}
        >
          <Typography level="body-sm">{message.content}</Typography>
          <Typography
            level="body-xs"
            sx={{
              color: isOwnMessage ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
              fontSize: '0.75rem',
              mt: 0.5,
            }}
          >
            {message.created_at ? new Date(message.created_at).toLocaleTimeString() : ''}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}; 