# Database Schema Issues Report

## Critical Issues Found

### 1. Database Schema vs Code Mismatches

#### A. Connections Table
- **Issue**: Schema shows composite primary key `(requester_id, addressee_id)` but code expects `id` field
- **Files Affected**: 
  - `c:\projects\chat-app1\social\src\services\api.ts` (line 126)
  - All connection-related components
- **Fix**: Add `id` field to connections table (see schema-fixes.sql)

#### B. Announcements Table
- **Issue**: Schema uses `user_id` but code expects `author_id`
- **Files Affected**:
  - `c:\projects\chat-app1\social\src\services\api.ts` (lines 243, 265)
  - `c:\projects\chat-app1\social\src\types\index.ts`
- **Fix**: Rename column in database (see schema-fixes.sql)

#### C. Messages Foreign Key Relationships
- **Issue**: Code expects `profiles` join but uses incorrect relationship syntax
- **Files Affected**:
  - `c:\projects\chat-app1\social\src\pages\Messages.tsx` (line 113)
- **Fix**: Use proper foreign key relationship syntax

### 2. Type Definition Issues

#### A. UserRole Enum
- **Issue**: TypeScript allows 'moderator' and 'developer' but DB constraint doesn't
- **Files Affected**:
  - `c:\projects\chat-app1\social\src\types\index.ts`
  - Database constraint on profiles table
- **Fix**: Update database constraint (see schema-fixes.sql)

#### B. Connection Status Type
- **Issue**: Using string literals instead of defined enum type
- **Fix**: Create proper enum type in database

### 3. Missing Table Implementations

#### A. Event RSVPs
- **Issue**: Table exists in schema but enum type may not be properly defined
- **Fix**: Ensure rsvp_status enum exists

#### B. Skills and Profile Skills
- **Issue**: Tables exist but limited integration in main application
- **Recommendation**: Either implement fully or remove from schema

### 4. RLS Policy Inconsistencies

#### A. Messages vs Conversations
- **Issue**: DATABASE-SETUP.md shows different message structure than actual schema
- **Files Affected**:
  - `c:\projects\chat-app1\social\DATABASE-SETUP.md` (lines 69-87)
  - Actual message queries in code
- **Fix**: Align RLS policies with actual conversation-based structure

### 5. Performance Issues

#### A. Missing Indexes
- **Issue**: Some queries may not have optimal indexes
- **Recommendation**: Add indexes for:
  - `messages(conversation_id, created_at)`
  - `connections(requester_id, addressee_id, status)`
  - `notifications(user_id, read, created_at)`

#### B. N+1 Query Problems
- **Issue**: Some components may trigger multiple database calls
- **Files Affected**: Directory and Messages components
- **Fix**: Use proper eager loading with select joins

## Immediate Actions Required

1. **Run schema-fixes.sql** to fix critical database issues
2. **Update RLS policies** to match actual table structure
3. **Test all CRUD operations** after schema changes
4. **Update type definitions** to match database constraints
5. **Review and optimize database queries** for performance

## Testing Recommendations

1. Test user registration and profile creation
2. Test connection request flow (send, accept, reject)
3. Test messaging functionality
4. Test announcements creation and display
5. Test events and RSVP functionality
6. Verify all foreign key constraints work correctly
7. Test RLS policies with different user roles

## Files Requiring Updates After Schema Changes

- `c:\projects\chat-app1\social\src\services\api.ts`
- `c:\projects\chat-app1\social\src\pages\Messages.tsx`
- `c:\projects\chat-app1\social\src\components\messages\*.tsx`
- `c:\projects\chat-app1\social\src\types\index.ts`
- `c:\projects\chat-app1\social\DATABASE-SETUP.md`
- All notification-related components
- All connection-related components
