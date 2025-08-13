// Quick diagnostic to check announcements table structure
// Run this in your browser console or as a test to see the actual columns

import { supabase } from '../supabase-client';

// Function to inspect table structure
export const inspectAnnouncementsTable = async () => {
  try {
    // Try to get the first announcement to see the structure
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error querying announcements:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Announcements table columns:', Object.keys(data[0]));
      console.log('Sample data:', data[0]);
    } else {
      console.log('No announcements found, but table exists');
      
      // Try inserting with different column names to see which one works
      const testInserts = [
        { author_id: 'test', title: 'test', content: 'test' },
        { user_id: 'test', title: 'test', content: 'test' },
        { created_by: 'test', title: 'test', content: 'test' },
        { posted_by: 'test', title: 'test', content: 'test' }
      ];
      
      for (const testData of testInserts) {
        try {
          const { error: insertError } = await supabase
            .from('announcements')
            .insert(testData);
          
          if (!insertError) {
            console.log('Success with columns:', Object.keys(testData));
            // Clean up test data
            await supabase.from('announcements').delete().eq('title', 'test');
            break;
          }
        } catch (e: any) {
          console.log('Failed with:', Object.keys(testData), e.message);
        }
      }
    }
  } catch (err) {
    console.error('Failed to inspect table:', err);
  }
};

// Call this function to run the diagnostic
// inspectAnnouncementsTable();
