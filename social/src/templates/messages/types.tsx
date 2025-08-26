export interface UserProps {
  name: string;
  username: string;
  avatar: string;
  online: boolean;
}

export interface MessageProps {
  id: string;
  content: string;
  timestamp: string;
  unread?: boolean;
  sender: UserProps | 'You';
  attachment?: {
    fileName: string;
    type: string;
    size: string;
  };
}

export interface ChatProps {
  id: string;
  sender: UserProps;
  messages: MessageProps[];
}
