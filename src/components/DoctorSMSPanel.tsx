import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Clock, Calendar, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { messageService, Message, CreateMessageDto } from '@/services/message.service';

interface DoctorSMSPanelProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: {
    id: number;
    name: string;
    phone: string;
  };
  darkMode: boolean;
}

const DoctorSMSPanel: React.FC<DoctorSMSPanelProps> = ({
  isOpen,
  onClose,
  doctor,
  darkMode
}) => {
  const [message, setMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [isDaily, setIsDaily] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<number[]>([]);
  const endRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => endRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => {
    if (isOpen && !loading) scrollToBottom();
  }, [messages, isOpen, loading]);

  // Load messages when panel opens
  useEffect(() => {
    if (isOpen) {
      loadMessages();
    }
  }, [isOpen, doctor.id]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await messageService.getDoctorMessages(doctor.id);
      const normalized = Array.isArray(data) ? data : (data && Array.isArray((data as any).results) ? (data as any).results : []);
      setMessages(normalized);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: 'Xatolik',
        description: 'Xabarlarni yuklashda xatolik',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast({
        title: 'Xatolik',
        description: 'Xabar matnini kiriting',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast({
        title: 'Xatolik',
        description: 'Sana va vaqtni tanlang',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Combine date and time
      const [hours, minutes] = selectedTime.split(':');
      const sendDateTime = new Date(selectedDate);
      sendDateTime.setHours(parseInt(hours), parseInt(minutes));

      const messageData: CreateMessageDto = {
        user_id: doctor.id,
        user_name: doctor.name,
        phone_number: doctor.phone,
        message: message.trim(),
        send_time: sendDateTime.toISOString(),
        daily_repeat: isDaily,
      };

      await messageService.sendMessage(messageData as Message);

      toast({
        title: 'Muvaffaqiyat',
        description: isDaily ? 'SMS har kuni yuborilishga tayyor' : 'SMS yuborishga tayyor',
      });

      // Reset form
      setMessage('');
      setSelectedDate(undefined);
      setSelectedTime('');
      setIsDaily(false);

      // Reload messages
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Xatolik',
        description: 'Xabar yuborishda xatolik',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDailyToggle = async (msg: Message, checked: boolean) => {
    try {
      setUpdatingIds(prev => [...prev, msg.id]);
      const token = localStorage.getItem('access');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/messages/${msg.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ daily_repeat: checked })
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Failed to update message');
      }
      const updated = await res.json();
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, daily_repeat: updated.daily_repeat ?? checked } : m));
    } catch (error) {
      console.error('Toggle daily repeat error:', error);
      toast({ variant: 'destructive', title: 'Xatolik', description: 'Takrorlanishni yangilashda xatolik' });
    } finally {
      setUpdatingIds(prev => prev.filter(id => id !== msg.id));
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent
        className={cn(
          'fixed right-0 z-50 h-full w-full max-w-md border-l transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0 ' : 'translate-x-full',
          darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        )}
        style={{
          transform: isOpen ? 'translateX(0%)' : 'translateX(0%)',
        }}
      >
        <DrawerHeader className={cn(
          'border-b p-4',
          darkMode ? 'border-gray-700' : 'border-gray-200'
        )}>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <DrawerTitle className={cn(
                'text-lg font-semibold text-left',
                darkMode ? 'text-white' : 'text-gray-900'
              )}>
                {doctor.name}
              </DrawerTitle>
              <p className={cn(
                'text-sm text-left',
                darkMode ? 'text-gray-400' : 'text-gray-600'
              )}>
                {doctor.phone}
              </p>
            </div>
          </div>
        </DrawerHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex-1 overflow-y-auto touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="p-4 space-y-3 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">Yuklanmoqda...</div>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex flex-col space-y-2 p-3 rounded-2xl max-w-[85%]',
                        'ml-auto bg-blue-500 text-white'
                      )}
                    >
                      <div className="flex justify-between items-center text-xs opacity-70">
                        <span>{format(new Date(msg.send_time), 'dd/MM/yyyy HH:mm')}</span>
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          msg.status === 'sent' ? 'bg-green-500/20 text-green-100' :
                          msg.status === 'sending' ? 'bg-yellow-500/20 text-yellow-100' :
                          'bg-blue-500/20 text-blue-100'
                        )}>
                          {msg.status === 'sent' ? 'Yuborildi' : msg.status === 'sending' ? 'Yuborilmoqda' : 'Kutilmoqda'}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {msg.message}
                      </p>
                      <div className="text-xs opacity-70 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Har kuni yuborilsin
                        </div>
                        <Checkbox
                          id={`daily-${msg.id}`}
                          checked={msg.daily_repeat}
                          disabled={updatingIds.includes(msg.id)}
                          onCheckedChange={(checked) => handleDailyToggle(msg, checked === true)}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Hozircha SMS yuborilmagan</p>
                  </div>
                )}
                <div ref={endRef} />
              </div>
            </div>
          </div>

          {/* SMS Form - Moved to bottom */}
          <div className={cn(
            'border-t p-4 space-y-4 bg-gray-50',
            darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
          )}>
            {/* Date and Time Selection */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className={cn('text-xs', darkMode ? 'text-gray-300' : 'text-gray-700')}>
                  Sana
                </Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !selectedDate && 'text-muted-foreground',
                        darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-200'
                      )}
                    >
                      <Calendar className="mr-2 h-3 w-3" />
                      {selectedDate ? format(selectedDate, 'dd/MM') : 'Sana'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setCalendarOpen(false);
                      }}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex-1">
                <Label className={cn('text-xs', darkMode ? 'text-gray-300' : 'text-gray-700')}>
                  Vaqt
                </Label>
                <div className="relative">
                  <Clock className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
                  <Input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className={cn(
                      'pl-8 text-xs h-8',
                      darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-200'
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Daily Repeat Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="daily"
                checked={isDaily}
                onCheckedChange={(checked) => setIsDaily(checked === true)}
              />
              <Label 
                htmlFor="daily"
                className={cn(
                  'text-xs',
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                )}
              >
                Har kuni yuborilsin
              </Label>
            </div>

            {/* Message Input and Send Button */}
            <div className="flex gap-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="SMS matni..."
                rows={2}
                className={cn(
                  'resize-none flex-1 text-sm',
                  darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200'
                )}
              />
              <Button
                onClick={handleSendMessage}
                disabled={loading || !message.trim() || !selectedDate || !selectedTime}
                size="sm"
                className="px-3 self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default DoctorSMSPanel;
