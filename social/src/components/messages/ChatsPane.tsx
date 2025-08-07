import Avatar from '@mui/joy/Avatar';
import Box from '@mui/joy/Box';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import ListItemButton from '@mui/joy/ListItemButton';
import ListItemContent from '@mui/joy/ListItemContent';
import ListItemDecorator from '@mui/joy/ListItemDecorator';
import Typography from '@mui/joy/Typography';
import Sheet from '@mui/joy/Sheet';
import type { ChatProps } from '../../types/messages';
import { useAuth } from '../../context/AuthContext';

interface ChatsPaneProps {
  chats: ChatProps[];
  selectedChatId?: string;
  onChatSelect: (chat: ChatProps) => void;
}

export default function ChatsPane({ chats, selectedChatId, onChatSelect }: ChatsPaneProps) {
  const { user: currentUser } = useAuth();
  
  const getOtherParticipant = (chat: ChatProps) => {
    if (chat.participants) {
      const otherParticipant = chat.participants.find(p => p.user_id !== currentUser?.id);
      return otherParticipant?.profiles;
    }
    return null;
  };

  const getParticipantAvatar = (chat: ChatProps) => {
    const participant = getOtherParticipant(chat);
    if (participant && 'profile_picture_url' in participant) {
      return participant.profile_picture_url;
    }
    if (chat.sender && 'avatar' in chat.sender) {
      return chat.sender.avatar;
    }
    return '/static/images/avatar/default.jpg';
  };

  const getParticipantName = (chat: ChatProps) => {
    const participant = getOtherParticipant(chat);
    if (participant && 'full_name' in participant) {
      return participant.full_name;
    }
    if (chat.sender && 'name' in chat.sender) {
      return chat.sender.name;
    }
    return 'Unknown User';
  };

  const getLastMessageTime = (chat: ChatProps) => {
    if (chat.messages && chat.messages.length > 0) {
      const lastMessage = chat.messages[chat.messages.length - 1];
      const timestamp = lastMessage.timestamp || lastMessage.created_at;
      if (timestamp) {
        return new Date(timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    }
    return '';
  };

  return (
    <Sheet
      sx={{
        borderRight: '1px solid',
        borderColor: 'divider',
        width: 320,
        height: '100%',
        overflow: 'auto',
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography level="title-lg">Messages</Typography>
      </Box>
      <List sx={{ py: 0 }}>
        {chats.map((chat) => (
          <ListItem key={chat.id} sx={{ p: 0 }}>
            <ListItemButton
              selected={selectedChatId === chat.id}
              onClick={() => onChatSelect(chat)}
              sx={{
                py: 1.5,
                px: 2,
                '&:hover': {
                  bgcolor: 'background.level1',
                },
              }}
            >
              <ListItemDecorator>
                <Avatar
                  src={getParticipantAvatar(chat)}
                  alt={getParticipantName(chat)}
                  size="sm"
                  sx={{ mr: 1 }}
                />
              </ListItemDecorator>
              <ListItemContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography level="title-sm">
                    {getParticipantName(chat)}
                  </Typography>
                  <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                    {getLastMessageTime(chat)}
                  </Typography>
                </Box>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }} noWrap>
                  {chat.messages.length > 0 
                    ? chat.messages[chat.messages.length - 1].content
                    : 'No messages yet'
                  }
                </Typography>
              </ListItemContent>
            </ListItemButton>
          </ListItem>
        ))}
        {chats.length === 0 && (
          <ListItem>
            <ListItemContent>
              <Typography level="body-sm" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                No conversations yet
              </Typography>
            </ListItemContent>
          </ListItem>
        )}
      </List>
    </Sheet>
  );
} 