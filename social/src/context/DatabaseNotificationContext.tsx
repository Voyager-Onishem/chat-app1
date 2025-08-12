import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase-client';
import { useAuth } from './AuthContext';

export interface DatabaseNotification {
  id: string;
  user_id: string;
  type: 'connection_request' | 'connection_accepted' | 'connection_rejected' | 'message' | 'announcement';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
}

interface DatabaseNotificationContextType {
  notifications: DatabaseNotification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  handleConnectionAction: (notificationId: string, action: 'accept' | 'reject') => Promise<void>;
}

const DatabaseNotificationContext = createContext<DatabaseNotificationContextType | undefined>(undefined);

export function DatabaseNotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<DatabaseNotification[]>([]);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }

      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleConnectionAction = async (notificationId: string, action: 'accept' | 'reject') => {
    if (!user) return;

    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification || notification.type !== 'connection_request') {
        console.error('Invalid notification for connection action');
        return;
      }

      const { requester_id, addressee_id } = notification.data;

      // Update connection status using composite key
      const { error: connectionError } = await supabase
        .from('connections')
        .update({ 
          status: action === 'accept' ? 'accepted' : 'blocked',
          updated_at: new Date().toISOString()
        })
        .eq('requester_id', requester_id)
        .eq('addressee_id', addressee_id);

      if (connectionError) {
        console.error('Error updating connection:', connectionError);
        throw connectionError;
      }

      // Get current user's profile for notification
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      // Create notification for the requester
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: requester_id,
          type: action === 'accept' ? 'connection_accepted' : 'connection_rejected',
          title: action === 'accept' ? 'Connection Accepted' : 'Connection Rejected',
          message: action === 'accept' 
            ? `${currentUserProfile?.full_name || 'Someone'} accepted your connection request`
            : `${currentUserProfile?.full_name || 'Someone'} rejected your connection request`,
          data: {
            requester_id,
            addressee_id,
            action_by: user.id
          },
          read: false,
        });

      if (notificationError) {
        console.error('Error creating response notification:', notificationError);
      }

      // Mark original notification as read
      await markAsRead(notificationId);

      // Remove the original notification from the list
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      console.log(`Connection ${action}ed successfully`);
    } catch (error) {
      console.error(`Error ${action}ing connection:`, error);
      throw error;
    }
  };

  const refreshNotifications = async () => {
    await fetchNotifications();
  };

  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription for new notifications
    if (user) {
      const subscription = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload: any) => {
            setNotifications(prev => [payload.new as DatabaseNotification, ...prev]);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload: any) => {
            setNotifications(prev => 
              prev.map(notif => 
                notif.id === payload.new.id ? payload.new as DatabaseNotification : notif
              )
            );
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    handleConnectionAction,
  };

  return (
    <DatabaseNotificationContext.Provider value={value}>
      {children}
    </DatabaseNotificationContext.Provider>
  );
}

export function useDatabaseNotifications() {
  const context = useContext(DatabaseNotificationContext);
  if (context === undefined) {
    throw new Error('useDatabaseNotifications must be used within a DatabaseNotificationProvider');
  }
  return context;
}
