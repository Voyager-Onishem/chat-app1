import { supabase } from '../supabase-client';

/**
 * Debug utility for messages functionality
 */

export async function debugMessagesSystem() {
  console.log('🔍 Debugging Messages System...');
  
  try {
    // Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ No authenticated user:', userError);
      return;
    }
    console.log('✅ Authenticated user:', user.id);

    // Test conversations table
    console.log('\n📋 Testing conversations table...');
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('*')
      .limit(5);
    
    if (conversationsError) {
      console.error('❌ Conversations error:', conversationsError);
    } else {
      console.log('✅ Conversations data:', conversations);
    }

    // Test conversation_participants table
    console.log('\n👥 Testing conversation_participants table...');
    const { data: participants, error: participantsError } = await supabase
      .from('conversation_participants')
      .select('*')
      .limit(5);
    
    if (participantsError) {
      console.error('❌ Participants error:', participantsError);
    } else {
      console.log('✅ Participants data:', participants);
    }

    // Test messages table
    console.log('\n💬 Testing messages table...');
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .limit(5);
    
    if (messagesError) {
      console.error('❌ Messages error:', messagesError);
    } else {
      console.log('✅ Messages data:', messages);
    }

    // Test profiles table
    console.log('\n👤 Testing profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, full_name, profile_picture_url')
      .limit(5);
    
    if (profilesError) {
      console.error('❌ Profiles error:', profilesError);
    } else {
      console.log('✅ Profiles data:', profiles);
    }

    // Test complex query
    console.log('\n🔗 Testing complex conversations query...');
    const { data: complexData, error: complexError } = await supabase
      .from('conversations')
      .select(`
        id,
        created_at,
        conversation_participants(
          user_id,
          profiles(
            user_id,
            full_name,
            profile_picture_url,
            role
          )
        )
      `)
      .limit(5);
    
    if (complexError) {
      console.error('❌ Complex query error:', complexError);
    } else {
      console.log('✅ Complex query data:', complexData);
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

export async function createTestConversation() {
  console.log('🧪 Creating test conversation...');
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ No authenticated user');
      return;
    }

    // Get another user to chat with
    const { data: otherUsers, error: usersError } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .neq('user_id', user.id)
      .limit(1);
    
    if (usersError || !otherUsers || otherUsers.length === 0) {
      console.error('❌ No other users found:', usersError);
      return;
    }

    const otherUser = otherUsers[0];
    console.log('👥 Creating conversation between:', user.id, 'and', otherUser.user_id);

    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single();
    
    if (convError) {
      console.error('❌ Failed to create conversation:', convError);
      return;
    }
    
    console.log('✅ Created conversation:', conversation.id);

    // Add participants
    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: conversation.id, user_id: user.id },
        { conversation_id: conversation.id, user_id: otherUser.user_id }
      ]);
    
    if (participantsError) {
      console.error('❌ Failed to add participants:', participantsError);
      return;
    }
    
    console.log('✅ Added participants');

    // Add a test message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        content: 'Hello! This is a test message.'
      })
      .select()
      .single();
    
    if (messageError) {
      console.error('❌ Failed to create message:', messageError);
      return;
    }
    
    console.log('✅ Created test message:', message.id);
    return conversation.id;

  } catch (error) {
    console.error('❌ Test creation error:', error);
  }
}
