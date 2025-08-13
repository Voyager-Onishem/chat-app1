# Alumni Networking Platform

A comprehensive alumni networking platform built with React, Joy UI, and Supabase. This platform enables alumni, students, and administrators to connect, share opportunities, and build professional relationships with enhanced reliability and performance.

## 🚀 Features

### Core Features
- **User Authentication**: Secure registration and login with Supabase Auth
- **Profile Management**: Comprehensive user profiles with photo upload and skills
- **Alumni Directory**: Browse and search alumni with interactive cards and real-time updates
- **Connection System**: Send and manage networking requests with status tracking
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

### Enhanced Features ✨
- **Window Focus Data Refresh**: Automatic data refreshing when returning to the app
- **Enhanced Error Handling**: Robust error boundaries with user-friendly error messages
- **Connection Resilience**: Automatic retry mechanisms and timeout handling
- **Type-Safe Architecture**: Full TypeScript implementation with comprehensive error handling
- **Performance Optimization**: Efficient data fetching with caching and intelligent loading states
- **Enhanced Security**: Row Level Security (RLS) with comprehensive auth cleanup

### UI/UX Features
- **Beautiful Login Interface**: Modern split-screen design with dark/light theme toggle
- **Real-time Updates**: Live messaging and notifications without page refresh
- **Fuzzy Search**: Auto-complete for skills selection with smart matching
- **Responsive Design**: Seamless experience across desktop and mobile devices
- **Loading States**: Proper loading indicators with timeout handling and fallback data
- **Error Recovery**: Graceful error handling with retry mechanisms

### Future Features
- **Guidance Library**: Alumni-contributed tips and FAQs with moderation
- **LinkedIn Integration**: Auto-fill profiles using LinkedIn data
- **Mentorship Matching**: Alumni can opt-in to mentor students
- **Advanced Search**: Vector-based search for FAQs and content

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library with latest features and concurrent rendering
- **Joy UI** - Component library for beautiful, accessible interfaces
- **React Router DOM** - Client-side routing with future flags enabled
- **React Hook Form** - Form handling and validation
- **TypeScript** - Complete type safety throughout the application

### Backend & Infrastructure
- **Supabase** - Backend-as-a-Service with enhanced connection handling
- **PostgreSQL** - Database with optimized queries and proper indexing
- **Row Level Security (RLS)** - Data access control with comprehensive policies
- **Supabase Storage** - File storage for profile photos
- **Supabase Realtime** - Real-time messaging and live updates

### Enhanced Architecture & Performance
- **Custom useQuery Hook**: Intelligent data fetching with automatic retries and window focus refresh
- **Enhanced Error Boundaries**: Comprehensive error handling with user-friendly recovery options
- **Window Focus Management**: Automatic data refresh when users return to the app
- **Robust Query System**: Timeout handling, fallback data, and connection resilience
- **Type Safety**: Complete TypeScript coverage with custom types and interfaces
- **Performance**: Optimized queries with intelligent caching and debounced updates
- **Security**: Enhanced authentication with automatic cleanup and session management

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

### Beautiful Login Interface
- **Split-Screen Design**: Modern layout with left form panel and right background image
- **Dynamic Theming**: Dark/light mode toggle with smooth transitions
- **Role-Based Access**: Quick links for Student, Alumni, and Admin login
- **Responsive Design**: Seamless experience across desktop and mobile devices
- **Visual Feedback**: Loading states, error handling, and success notifications

### Design System
- **Joy UI Components**: Modern, accessible components with consistent styling
- **Theme Integration**: Professional dark theme with customizable color schemes
- **Interactive Elements**: Smooth hover effects and transitions throughout
- **Typography**: Clear hierarchy with proper contrast and readability

### User Experience
- **Fuzzy Search**: Auto-complete for skills selection with smart matching
- **Real-time Updates**: Live messaging and notifications without page refresh
- **Intuitive Navigation**: Clear navigation structure with breadcrumbs
- **Loading States**: Proper loading indicators with timeout handling
- **Error Boundaries**: Graceful error handling with recovery options

## 🔧 Configuration

### Environment Variables
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Database Configuration
- All tables use UUIDs for primary keys
- Foreign key relationships with proper constraints
- Automatic timestamps for created_at/updated_at
- Proper indexing for performance

## 🔧 Backend Connection & Performance

### Connection Resilience
The application includes comprehensive backend connection handling:

- **Automatic Retries**: Failed requests are automatically retried with exponential backoff
- **Intelligent Timeouts**: 8-second timeouts for queries with graceful fallback mechanisms
- **Error Handling**: User-friendly error messages with detailed logging for developers
- **Session Management**: Automatic session cleanup and renewal with window focus detection
- **Connection Monitoring**: Real-time connection status monitoring and feedback

### Performance Optimizations
- **Query Optimization**: Efficient database queries with proper indexing and RLS policies
- **Smart Caching**: Intelligent caching of frequently accessed data with window focus refresh
- **Loading States**: Proper loading indicators with timeout handling and fallback data
- **Type Safety**: Complete TypeScript coverage prevents runtime errors
- **Debounced Operations**: Window focus refresh and search operations are debounced for performance

### Data Fetching Strategy
- **useQuery Hook**: Custom hook with automatic retries, timeouts, and window focus refresh
- **Fallback Data**: Mock data when real data is unavailable for better user experience
- **Error Recovery**: Graceful degradation with retry mechanisms and user feedback
- **Real-time Updates**: WebSocket connections for live messaging and notifications

### Troubleshooting Connection Issues

#### Common Issues & Solutions
1. **Environment Variables**: 
   - Ensure `.env` file contains valid Supabase credentials
   - Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set correctly
   
2. **Network Timeouts**: 
   - The app automatically handles timeouts with 8-second limits
   - Failed requests are retried automatically with exponential backoff
   
3. **RLS Policies**: 
   - Row Level Security policies are properly configured for all user roles
   - Check browser console for detailed RLS error messages
   
4. **Session Expiry**: 
   - Automatic session cleanup prevents stale authentication
   - Window focus detection refreshes session status
   
5. **Data Loading Issues**:
   - Window focus refresh ensures data is current when returning to app
   - Fallback data provides immediate feedback while real data loads

#### Debug Tools & Features
- **Browser Console**: Detailed error logs with context and stack traces
- **Connection Status**: Real-time indicator shows backend connectivity status
- **Error Boundaries**: Catch and display user-friendly error messages with retry options
- **Development Mode**: Enhanced logging and error details in development environment
- **System Diagnostics**: Built-in component for checking connection and configuration status

#### Performance Monitoring
- **Query Performance**: Monitor query execution times in browser console
- **Connection Health**: Real-time monitoring of Supabase connection status
- **Error Tracking**: Comprehensive error logging with context and recovery suggestions
- **User Feedback**: Visual indicators for loading states, errors, and success operations

## �🚀 Deployment

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

## ✨ Recent Improvements

### Version 2.1 Updates - Window Focus & Data Reliability
- **🔄 Window Focus Data Refresh**: Automatic data refreshing when users return to the app after minimizing/switching tabs
- **🛡️ Enhanced Error Boundaries**: Comprehensive error handling with user-friendly recovery options
- **🔧 Improved useQuery Hook**: Better timeout handling, window focus refresh, and fallback data management
- **📊 Enhanced Data Service**: Robust data fetching with intelligent error recovery and fallback mechanisms
- **🎯 Better TypeScript Coverage**: Improved type definitions and error handling throughout the application

### Version 2.0 Updates
- **Enhanced Login UI**: Beautiful split-screen design with theme toggle
- **Type Safety**: Complete TypeScript coverage with custom types
- **Error Handling**: Centralized error management system
- **Connection Resilience**: Automatic retries and timeout handling
- **Performance**: Optimized queries and caching mechanisms
- **Security**: Enhanced auth cleanup and session management
- **Code Quality**: Improved code structure and documentation

### Fixed Issues ✅
- ✅ **Window Focus Data Loading**: Data now automatically refreshes when window regains focus after being minimized
- ✅ **Backend Connection Reliability**: Enhanced with automatic retries and intelligent fallbacks
- ✅ **Authentication Session Management**: Improved logout process and session cleanup for all user types
- ✅ **Data Fetching Robustness**: Enhanced error recovery with graceful fallbacks and user feedback
- ✅ **TypeScript Compilation**: Resolved export issues and improved type definitions
- ✅ **Loading State Management**: Better timeout handling and user feedback
- ✅ **Error Recovery**: Enhanced error boundaries with retry mechanisms

## 🔧 Window Focus Feature

### How It Works
The application now automatically refreshes data when you return to the app after:
- Minimizing and maximizing the window
- Switching to another tab and back
- Alt-tabbing to other applications and returning

### Implementation Details
- **Debounced Refresh**: Prevents excessive API calls with 1-second debounce
- **Selective Refresh**: Different components can choose whether to refresh on focus
- **Smart Detection**: Uses both `window.focus` and `document.visibilitychange` events
- **Performance Optimized**: Only refreshes when necessary and doesn't interfere with real-time features

### Components with Window Focus Refresh
- **Directory**: Refreshes user profiles when returning to the app
- **Messages**: Refreshes message lists (but not conversations with real-time subscriptions)
- **Jobs**: Automatically gets latest job postings
- **Events**: Updates event information and RSVPs

## 🛡️ Enhanced Error Handling

### Error Boundary Features
- **User-Friendly Messages**: Clear, actionable error messages instead of technical jargon
- **Retry Mechanisms**: One-click retry for failed operations
- **Fallback UI**: Graceful degradation when components fail
- **Development Mode**: Detailed error information for developers
- **Automatic Recovery**: Some errors can be recovered automatically

### Data Fetching Resilience
- **Automatic Retries**: Failed requests are automatically retried with exponential backoff
- **Fallback Data**: Mock/cached data when real data is unavailable
- **Timeout Management**: Prevents hanging requests with intelligent timeouts
- **Connection Monitoring**: Real-time feedback on connection status

## 🚀 Getting Started

The application is now ready for development with all improvements implemented. Simply follow the setup instructions above to get started! 