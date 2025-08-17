import axios from 'axios';

export interface Message {
  id: number;
  user_id: number;
  user_name: string;
  phone_number: string;
  message: string;
  send_time: string;
  status: 'waiting' | 'sending' | 'sent';
  daily_repeat: boolean;
  created_at: string;
}

export interface CreateMessageDto {
  user_id: number;
  user_name: string;
  phone_number: string;
  message: string;
  send_time: string;
  daily_repeat: boolean;
}

export const messageService = {
  // Get messages for specific doctor
  async getDoctorMessages(doctorId: number): Promise<Message[]> {
    const token = localStorage.getItem('access');
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/messages/?user_id=${doctorId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  // Send new message
  async sendMessage(data: Message): Promise<Message> {
    const token = localStorage.getItem('access');
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/messages/`, data, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  }
};
