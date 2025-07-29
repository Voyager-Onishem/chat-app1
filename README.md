# Alumni Networking Platform

A comprehensive alumni networking platform built with React, Joy UI, and Supabase. This platform enables alumni, students, and administrators to connect, share opportunities, and build professional relationships.

## 🚀 Features

### Core Features
- **User Authentication**: Secure registration and login with Supabase Auth
- **Profile Management**: Comprehensive user profiles with photo upload and skills
- **Alumni Directory**: Browse and search alumni with interactive cards
- **Connection System**: Send and manage networking requests
- **Real-time Messaging**: Chat with connected users using Supabase real-time
- **Announcements Board**: Admin/moderator announcements for the community
- **Job Opportunities**: Alumni can post jobs, students can browse and apply
- **Events Management**: Admin-created events with RSVP functionality

### User Roles
- **Admin**: Full platform control and management
- **Moderator**: Content oversight and community management
- **Student**: Current enrolled students seeking connections
- **Alumni**: Graduates who can mentor and share opportunities
- **Developer**: Technical team for platform maintenance

### Extended Features (Future)
- **Guidance Library**: Alumni-contributed tips and FAQs with moderation
- **LinkedIn Integration**: Auto-fill profiles using LinkedIn data
- **Mentorship Matching**: Alumni can opt-in to mentor students
- **Advanced Search**: Vector-based search for FAQs and content

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **Joy UI** - Component library for beautiful interfaces
- **React Router DOM** - Client-side routing
- **React Hook Form** - Form handling and validation
- **React Query** - Data fetching and caching
- **Fuse.js** - Fuzzy search for skills
- **TypeScript** - Type safety

### Backend
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Database
- **Row Level Security (RLS)** - Data access control
- **Supabase Storage** - File storage for profile photos
- **Supabase Realtime** - Real-time messaging

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Git

## 🚀 Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd chat-app1
```

### 2. Install Dependencies
```bash
cd social
npm install
```

### 3. Set Up Supabase

#### Create a New Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and anon key

#### Set Environment Variables
Create a `.env` file in the `social` directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Run Database Schema
Execute the SQL files in your Supabase SQL editor in this order:

1. `01_core_users_profiles.sql` - Core user and profile tables
2. `02_social_communication.sql` - Connections, conversations, and messages
3. `03_platform_features.sql` - Announcements, jobs, and events
4. `04_extended_features.sql` - Guidance articles and tags
5. `05_profile_trigger.sql` - Automatic profile creation trigger
6. `07_rls_policies.sql` - Row Level Security policies

#### Create Storage Bucket
1. Go to Storage in your Supabase dashboard
2. Create a new bucket called `profile-photos`
3. Set it to public for read access

#### Add Sample Data
Add some skills to the `skills` table:
```sql
INSERT INTO skills (name) VALUES 
('JavaScript'), ('React'), ('Node.js'), ('Python'), ('Java'), 
('Machine Learning'), ('Data Science'), ('Web Development'), 
('Mobile Development'), ('DevOps'), ('UI/UX Design'), ('Product Management');
```

### 4. Start the Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📁 Project Structure

```
social/
├── src/
│   ├── components/
│   │   └── Navbar.tsx          # Navigation component
│   ├── pages/
│   │   ├── Home.tsx            # Landing page
│   │   ├── Login.tsx           # Login page
│   │   ├── Register.tsx        # Registration page
│   │   ├── Profile.tsx         # User profile management
│   │   ├── Directory.tsx       # Alumni directory
│   │   ├── Connections.tsx     # Connection management
│   │   ├── Messages.tsx        # Real-time messaging
│   │   ├── Announcements.tsx   # Announcements board
│   │   ├── Jobs.tsx            # Job opportunities
│   │   └── Events.tsx          # Events management
│   ├── supabase-client.ts      # Supabase client configuration
│   ├── App.tsx                 # Main app component
│   └── main.tsx                # App entry point
├── package.json
└── README.md
```

## 🔐 Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Role-based access control for different user types
- Secure file uploads with user-specific permissions

### Authentication
- Supabase Auth for secure user authentication
- Email confirmation required for account activation
- Automatic profile creation upon email confirmation

## 🎨 UI/UX Features

### Design System
- **Joy UI Components**: Modern, accessible components
- **Dark Theme**: Professional dark theme throughout
- **Responsive Design**: Works on desktop and mobile
- **Interactive Elements**: Hover effects and smooth transitions

### User Experience
- **Fuzzy Search**: Auto-complete for skills selection
- **Real-time Updates**: Live messaging and notifications
- **Intuitive Navigation**: Clear navigation structure
- **Loading States**: Proper loading indicators

## 🔧 Configuration

### Environment Variables
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Database Configuration
- All tables use UUIDs for primary keys
- Foreign key relationships with proper constraints
- Automatic timestamps for created_at/updated_at
- Proper indexing for performance

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel/Netlify
1. Connect your repository to Vercel or Netlify
2. Set environment variables in the deployment platform
3. Deploy automatically on push to main branch

## 📊 Database Schema

### Core Tables
- `profiles` - User profile information
- `connections` - User connection requests
- `conversations` - Chat conversations
- `messages` - Chat messages
- `announcements` - Platform announcements
- `jobs` - Job postings
- `events` - Platform events
- `event_rsvps` - Event RSVPs
- `skills` - Available skills
- `profile_skills` - User-skill relationships

### Extended Tables
- `guidance_articles` - Alumni guidance articles
- `tags` - Article tags
- `article_tags` - Article-tag relationships

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
1. Check the documentation
2. Review existing issues
3. Create a new issue with detailed information

## 🔮 Future Enhancements

- **Advanced Search**: Vector-based search implementation
- **LinkedIn Integration**: Profile auto-fill from LinkedIn
- **Mentorship System**: Automated mentor-student matching
- **Mobile App**: React Native mobile application
- **Analytics Dashboard**: User engagement analytics
- **Email Notifications**: Automated email notifications
- **API Documentation**: Comprehensive API documentation 