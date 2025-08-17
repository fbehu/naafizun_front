
import { useState, useEffect } from 'react';

export interface Notification {
  id: string;
  message: string;
  time: Date;
  isRead: boolean;
  type: 'info' | 'warning' | 'success';
}

const STORAGE_KEY = 'app.notifications';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const readStored = (): Notification[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Notification[];
      // revive dates
      return parsed.map(n => ({ ...n, time: new Date(n.time) }));
    } catch {
      return [];
    }
  };

  const saveNotifications = (next: Notification[]) => {
    setNotifications(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    } catch {}
  };

  // Initialize and subscribe for cross-component sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setNotifications(readStored());
    };
    const onCustom = () => setNotifications(readStored());

    window.addEventListener('storage', onStorage);
    window.addEventListener('notificationsUpdated', onCustom as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('notificationsUpdated', onCustom as EventListener);
    };
  }, []);

  const addNotification = (notification: Omit<Notification, 'id' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      isRead: false,
    };
    const next = [newNotification, ...readStored()];
    saveNotifications(next);
  };

  const markAsRead = (id: string) => {
    const next = readStored().map(n => (n.id === id ? { ...n, isRead: true } : n));
    saveNotifications(next);
  };

  const removeNotification = (id: string) => {
    const next = readStored().filter(n => n.id !== id);
    saveNotifications(next);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    addNotification,
    markAsRead,
    removeNotification,
    unreadCount,
  };
};
