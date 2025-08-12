# Announcement Delete Functionality Fix

## Issues Fixed

### 1. Column Name Mismatch
**Problem**: API service was using `author_id` but database uses `user_id`
**Fix**: Updated API service to use `user_id` for delete operation

### 2. Missing Permission Check
**Problem**: Delete operation wasn't checking user permissions properly
**Fix**: Added proper permission checking in the delete query

### 3. Missing user_id Field
**Problem**: Component interface didn't include `user_id` field needed for permission checks
**Fix**: Updated local Announcement interface to include `user_id`

### 4. Improved Permission Logic
**Before**: Only admins could delete announcements
**After**: 
- Admins can delete any announcement
- Users can delete their own announcements
- Delete button only shows for authorized users

### 5. Better Error Handling
**Added**: More descriptive error messages for permission failures

### 6. Display Improvements
**Fixed**: Show actual author name and avatar instead of hardcoded "Admin"

## Code Changes

### 1. API Service (api.ts)
```typescript
// Changed from author_id to user_id
.eq('user_id', userId)
```

### 2. Component Interface
```typescript
interface Announcement {
  // ... other fields
  user_id: string;  // Added this field
}
```

### 3. Delete Permission Logic
```typescript
// Show delete button if admin OR author
{(userRole === 'admin' || announcement.user_id === currentUser?.id) && (
  <Button onClick={() => handleDeleteAnnouncement(announcement.id)}>
    Delete
  </Button>
)}
```

### 4. Delete Function
```typescript
// Admins can delete any announcement, users only their own
let query = supabase.from('announcements').delete().eq('id', announcementId);
if (userRole !== 'admin') {
  query = query.eq('user_id', currentUser.id);
}
```

## Testing Recommendations

1. **As Admin**: Should be able to delete any announcement
2. **As Regular User**: Should only be able to delete own announcements
3. **Permission Denied**: Should show appropriate error message
4. **UI**: Delete button should only appear for authorized users

The delete functionality should now work correctly with proper permission checking!
