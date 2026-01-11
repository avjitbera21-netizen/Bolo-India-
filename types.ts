
export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Post {
  id: string;
  author: string;
  category: string;
  content: string;
  imageUrl?: string;
  link?: string;
  timestamp: number;
  likes: number;
}

export type AppView = 'chat' | 'explore' | 'live' | 'feed';
export type AuthScreen = 'login' | 'signup' | 'reset';

export interface User {
  email: string;
  name: string;
}
