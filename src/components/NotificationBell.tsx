import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationBellProps {
  darkMode: boolean;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, markAsRead, removeNotification, unreadCount, addNotification } = useNotifications(); // Added addNotification
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access');
    if (!token) return;

    const wsUrl =
      (window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
      window.location.host +
      '/ws/notifications/';
    let websocket: WebSocket | null = null;

    const connectWebSocket = () => {
      websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        console.log('WebSocket connection established');
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      websocket.onclose = (event) => {
        console.warn('WebSocket connection closed:', event.reason);
        // Retry connection after a delay
        setTimeout(connectWebSocket, 5000); // Retry after 5 seconds
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.action === 'new_notification') {
            addNotification({
              message: data.message,
              time: new Date(data.time),
              type: data.type || 'info',
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    };

    connectWebSocket();

    return () => {
      websocket?.close();
    };
  }, []); // Fixed dependency array to avoid infinite loop

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative ${darkMode ? 'text-white hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-[9998] sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80">
          <div className="absolute inset-0 bg-black/50 sm:hidden" onClick={() => setIsOpen(false)} />
          <div className={`relative h-full w-full flex flex-col sm:h-auto sm:max-h-96 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg sm:rounded-lg sm:border`}>
            <div className={`p-3 border-b flex-shrink-0 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Уведомления
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className={darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center">
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Уведомления отсутствуют
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      darkMode ? 'border-gray-700' : 'border-gray-100'
                    } ${!notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {notification.message}
                        </p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatTime(notification.time)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                          className={`text-gray-400 hover:text-red-500 ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-red-50'} p-1`}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
