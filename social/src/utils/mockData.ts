// Mock data for when Supabase is not configured
export const mockProfiles = [
  {
    user_id: 'user1',
    full_name: 'John Doe',
    profile_picture_url: undefined,
    role: 'alumni',
    bio: 'Software Engineer with 5 years of experience',
    location: 'San Francisco, CA',
    company: 'Tech Corp',
    job_title: 'Senior Developer',
    graduation_year: 2019,
    major: 'Computer Science',
    skills: ['JavaScript', 'React', 'Node.js'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    user_id: 'user2',
    full_name: 'Jane Smith',
    profile_picture_url: undefined,
    role: 'student',
    bio: 'Final year student looking for opportunities',
    location: 'New York, NY',
    company: undefined,
    job_title: undefined,
    graduation_year: 2024,
    major: 'Business Administration',
    skills: ['Marketing', 'Analytics', 'Leadership'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const mockJobs = [
  {
    id: '1',
    title: 'Software Engineer',
    company: 'Tech Corp',
    location: 'San Francisco, CA',
    description: 'We are looking for a talented software engineer to join our team.',
    apply_url: 'https://example.com/apply',
    created_at: '2024-01-01T00:00:00Z',
    posted_by_user_id: 'user1',
    posted_by: {
      full_name: 'John Doe',
      profile_picture_url: undefined,
      role: 'alumni'
    }
  }
];

export const mockEvents = [
  {
    id: '1',
    title: 'Alumni Networking Event',
    description: 'Join us for an evening of networking with fellow alumni.',
    location: 'San Francisco, CA',
    event_time: '2024-12-31T18:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    created_by_user_id: 'user1',
    created_by: {
      full_name: 'John Doe',
      profile_picture_url: undefined,
      role: 'alumni'
    },
    rsvps: []
  }
];

export const mockConnections = [
  {
    requester_id: 'user1',
    addressee_id: 'user2',
    status: 'accepted',
    created_at: '2024-01-01T00:00:00Z'
  }
];

export const mockConversations = [
  {
    id: '1',
    created_at: '2024-01-01T00:00:00Z',
    participants: [
      {
        user_id: 'user1',
        profiles: {
          user_id: 'user1',
          full_name: 'John Doe',
          profile_picture_url: undefined,
          role: 'alumni'
        }
      },
      {
        user_id: 'user2',
        profiles: {
          user_id: 'user2',
          full_name: 'Jane Smith',
          profile_picture_url: undefined,
          role: 'student'
        }
      }
    ]
  }
];

export const mockMessages = [
  {
    id: 1,
    content: 'Hello! How are you doing?',
    created_at: '2024-01-01T10:00:00Z',
    sender_id: 'user1',
    conversation_id: '1',
    profiles: {
      full_name: 'John Doe',
      profile_picture_url: undefined
    }
  },
  {
    id: 2,
    content: 'I\'m doing great! Thanks for asking.',
    created_at: '2024-01-01T10:05:00Z',
    sender_id: 'user2',
    conversation_id: '1',
    profiles: {
      full_name: 'Jane Smith',
      profile_picture_url: undefined
    }
  }
]; 