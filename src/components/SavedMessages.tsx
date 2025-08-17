import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Clock, Trash2, Bell, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useNotifications } from '@/hooks/useNotifications';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SavedMessage {
  id: string;
  title: string;
  content: string;
  scheduledTime: Date;
  isCompleted: boolean;
  createdAt: Date;
}

interface SavedMessagesProps {
  onBack: () => void;
  darkMode: boolean;
}

const API_URL = import.meta.env.VITE_API_URL;

const SavedMessages: React.FC<SavedMessagesProps> = ({ onBack, darkMode }) => {
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isAddingMessage, setIsAddingMessage] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editScheduledDate, setEditScheduledDate] = useState('');
  const [editScheduledTime, setEditScheduledTime] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<SavedMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { addNotification } = useNotifications();

  // Load messages from backend
  useEffect(() => {
    const fetchMessages = async () => {
      const token = localStorage.getItem('access');
      const res = await fetch(`${API_URL}/notifications/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMessages(
        (Array.isArray(data.results) ? data.results : data).map((msg: any) => ({
          id: msg.id,
          title: msg.title,
          content: msg.message || msg.content,
          scheduledTime: new Date(msg.scheduled_time || msg.scheduledTime),
          isCompleted: !!msg.is_completed,
          createdAt: new Date(msg.created_at)
        }))
      );
    };
    fetchMessages();
  }, []);

  // WebSocket connection for notifications
  useEffect(() => {
    const token = localStorage.getItem('access');
    if (!token) return;
    const wsUrl =
      (window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
      window.location.host +
      '/ws/notifications/';
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // If notification is added/edited/deleted, refresh list
        if (data.action === 'refresh') {
          // Re-fetch messages
          fetch(`${API_URL}/notifications/`, {
            headers: { Authorization: `Bearer ${token}` }
          })
            .then((res) => res.json())
            .then((data) => {
              setMessages(
                (Array.isArray(data.results) ? data.results : data).map((msg: any) => ({
                  id: msg.id,
                  title: msg.title,
                  content: msg.message || msg.content,
                  scheduledTime: new Date(msg.scheduled_time || msg.scheduledTime),
                  isCompleted: !!msg.is_completed,
                  createdAt: new Date(msg.created_at)
                }))
              );
            });
        }
      } catch {}
    };

    return () => {
      ws.close();
    };
  }, []);


  // WebSocket safe send function
  const wsSend = (data: any) => {
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify(data));
    }
  };

  // Add message to backend
  const handleAddMessage = async () => {
    if (!title.trim() || !content.trim() || !scheduledDate || !scheduledTime) {
      setAddError("Barcha maydonlarni to'ldiring.");
      return;
    }
    setAddError(null);

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const token = localStorage.getItem('access');
    const payload = {
      title: title.trim(),
      message: content.trim(),
      scheduled_time: scheduledDateTime.toISOString(),
      is_completed: false
    };
    const res = await fetch(`${API_URL}/notifications/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      // Optionally, you can push to messages or just refresh
      setIsAddingMessage(false);
      setTitle('');
      setContent('');
      setScheduledDate('');
      setScheduledTime('');
      // Refresh messages
      const data = await res.json();
      setMessages(prev => [
        {
          id: data.id,
          title: data.title,
          content: data.message,
          scheduledTime: new Date(data.scheduled_time),
          isCompleted: !!data.is_completed,
          createdAt: new Date(data.created_at)
        },
        ...prev
      ]);
      // Notify websocket listeners
      wsSend({ action: 'refresh' }); // Use safe send
    }
  };

  // Delete message from backend
  const handleDeleteMessage = async (id: string) => {
    const token = localStorage.getItem('access');
    await fetch(`${API_URL}/notifications/${id}/`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    setMessages(prev => prev.filter(msg => msg.id !== id));
    wsSend({ action: 'refresh' }); // Use safe send
    setDeleteConfirmOpen(false);
    setMessageToDelete(null);
  };

  // Edit message logic
  const startEditMessage = (msg: SavedMessage) => {
    setEditingId(msg.id);
    setEditTitle(msg.title);
    setEditContent(msg.content);
    setEditScheduledDate(msg.scheduledTime.toISOString().slice(0, 10));
    setEditScheduledTime(msg.scheduledTime.toTimeString().slice(0, 5));
  };

  const handleEditMessage = async () => {
    if (!editTitle.trim() || !editContent.trim() || !editScheduledDate || !editScheduledTime) {
      setEditError("Barcha maydonlarni to'ldiring.");
      return;
    }
    setEditError(null);

    if (!editingId) return;
    const token = localStorage.getItem('access');
    const scheduledDateTime = new Date(`${editScheduledDate}T${editScheduledTime}`);
    const payload = {
      title: editTitle.trim(),
      message: editContent.trim(),
      scheduled_time: scheduledDateTime.toISOString()
    };
    const res = await fetch(`${API_URL}/notifications/${editingId}/`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      setEditingId(null);
      wsSend({ action: 'refresh' }); // Use safe send
      // Optionally, refresh messages here
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('uz-UZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 shadow-sm`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className={darkMode ? 'text-white hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Saqlangan Xabarlar
            </h1>
          </div>
          <Button
            onClick={() => setIsAddingMessage(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Qo'shish
          </Button>
        </div>
      </div>

      <div className="p-4">
        {/* Add Message Form */}
        {isAddingMessage && (
          <Card className={`mb-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
            <CardHeader>
              <CardTitle className={darkMode ? 'text-white' : 'text-gray-900'}>
                Yangi Xabar Qo'shish
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Sarlavha"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
              />
              <Textarea
                placeholder="Xabar matni"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                rows={3}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
              {addError && (
                <div className="text-red-500 text-sm">{addError}</div>
              )}
              <div className="flex gap-2">
                <Button onClick={handleAddMessage} className="bg-green-500 hover:bg-green-600 text-white">
                  Saqlash
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddingMessage(false)}
                  className={darkMode ? 'border-gray-600 text-gray-300' : ''}
                >
                  Bekor qilish
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Message Form */}
        {editingId && (
          <Card className={`mb-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
            <CardHeader>
              <CardTitle className={darkMode ? 'text-white' : 'text-gray-900'}>
                Xabarni tahrirlash
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Sarlavha"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
              />
              <Textarea
                placeholder="Xabar matni"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                rows={3}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  value={editScheduledDate}
                  onChange={(e) => setEditScheduledDate(e.target.value)}
                  className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
                <Input
                  type="time"
                  value={editScheduledTime}
                  onChange={(e) => setEditScheduledTime(e.target.value)}
                  className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
              {editError && (
                <div className="text-red-500 text-sm">{editError}</div>
              )}
              <div className="flex gap-2">
                <Button onClick={handleEditMessage} className="bg-blue-500 hover:bg-blue-600 text-white">
                  Saqlash
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingId(null)}
                  className={darkMode ? 'border-gray-600 text-gray-300' : ''}
                >
                  Bekor qilish
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Messages List */}
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className={`text-gray-500 ${darkMode ? 'text-gray-400' : ''}`}>
                Saqlangan xabarlar yo'q
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <Card
                key={message.id}
                className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} ${
                  message.isCompleted ? 'opacity-60' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    {/* Matn bo'limi */}
                    <div className="flex-1 min-w-0 pr-4"> {/* min-w-0 overflow oldini oladi */}
                      <div className="flex items-center gap-2 mb-2">
                        <h3
                          className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'} truncate max-w-[80%]`}
                          title={message.title}
                        >
                          {message.title}
                        </h3>
                        {message.isCompleted && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Bajarilgan
                          </span>
                        )}
                      </div>

                      {/* Matn */}
                      <p
                        className={`text-xs mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'} break-words line-clamp-3`}
                      >
                        {message.content}
                      </p>

                      {/* Vaqt */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(message.scheduledTime)}
                        </div>
                      </div>
                    </div>

                    {/* Tugmalar */}
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditMessage(message)}
                        className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setMessageToDelete(message);
                          setDeleteConfirmOpen(true);
                        }}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>

              </Card>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <DialogHeader>
            <DialogTitle className={darkMode ? 'text-white' : 'text-gray-900'}>
              Xabarni o'chirishni tasdiqlaysizmi?
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <div className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
              Ushbu xabar o'chiriladi: <br />
              <span className="font-semibold">{messageToDelete?.title}</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Bekor qilish
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                if (messageToDelete) handleDeleteMessage(messageToDelete.id);
              }}
            >
              O'chirish
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SavedMessages;
