export type UserProps = {
  name: string;
  username: string;
  avatar: string;
  online: boolean;
};

export type MessageProps = {
  id: string | number;
  content: string;
  timestamp?: string;
  created_at?: string;
  sender_id?: string;
  conversation_id?: string;
  unread?: boolean;
  sender?: UserProps | 'You';
  profiles?: {
    full_name: string;
    profile_picture_url?: string;
  };
  attachment?: {
    fileName: string;
    type: string;
    size: string;
  };
};

export type ChatProps = {
  id: string;
  sender?: UserProps;
  messages: MessageProps[];
  created_at?: string;
  participants?: Array<{
    user_id: string;
    profiles: {
      user_id: string;
      full_name: string;
      profile_picture_url?: string;
      role: string;
    };
  }>;
}; 