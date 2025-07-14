'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  message: string;
  timestamp: Date;
  ticker: string;
  likes: number;
  replies: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  isModerated: boolean;
  isFlagged: boolean;
}

interface TickerChatProps {
  ticker: string;
}

export default function TickerChat({ ticker }: TickerChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sentiment, setSentiment] = useState<'bullish' | 'bearish' | 'neutral'>('neutral');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Alternative query structure to avoid composite index requirement
    const messagesQuery = query(
      collection(db, 'tickerChat'),
      where('ticker', '==', ticker),
      limit(50)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const chatMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as ChatMessage[];

      // Sort messages by timestamp on client side
      const sortedMessages = chatMessages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setMessages(sortedMessages.reverse()); // Reverse to show oldest first
      setLoading(false);
    });

    return () => unsubscribe();
  }, [ticker]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const detectSentiment = (text: string): 'bullish' | 'bearish' | 'neutral' => {
    const bullishWords = ['buy', 'bull', 'bullish', 'up', 'rise', 'growth', 'positive', 'strong', 'moon', 'rocket', 'calls'];
    const bearishWords = ['sell', 'bear', 'bearish', 'down', 'fall', 'decline', 'negative', 'weak', 'crash', 'puts'];
    
    const lowerText = text.toLowerCase();
    const bullishCount = bullishWords.filter(word => lowerText.includes(word)).length;
    const bearishCount = bearishWords.filter(word => lowerText.includes(word)).length;
    
    if (bullishCount > bearishCount) return 'bullish';
    if (bearishCount > bullishCount) return 'bearish';
    return 'neutral';
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !newMessage.trim() || sending) return;

    setSending(true);
    
    try {
      const detectedSentiment = detectSentiment(newMessage);
      
      await addDoc(collection(db, 'tickerChat'), {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userPhoto: user.photoURL || '',
        message: newMessage.trim(),
        timestamp: serverTimestamp(),
        ticker: ticker,
        likes: 0,
        replies: 0,
        sentiment: detectedSentiment,
        isModerated: false,
        isFlagged: false
      });

      setNewMessage('');
      setSentiment('neutral');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-600';
      case 'bearish': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return '📈';
      case 'bearish': return '📉';
      default: return '💬';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{ticker} Discussion</h3>
            <p className="text-sm text-gray-500">Real-time community chat</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{messages.length} messages</span>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-600">Live</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">💬</div>
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex space-x-3">
              <img
                src={message.userPhoto || '/default-avatar.png'}
                alt={message.userName}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900 text-sm">{message.userName}</span>
                  <span className="text-xs text-gray-500">{formatTimestamp(message.timestamp)}</span>
                  <span className={`text-xs ${getSentimentColor(message.sentiment)}`}>
                    {getSentimentIcon(message.sentiment)}
                  </span>
                </div>
                <p className="text-gray-700 text-sm mt-1 break-words">{message.message}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <button className="text-xs text-gray-500 hover:text-blue-600 flex items-center">
                    <span className="mr-1">👍</span>
                    {message.likes}
                  </button>
                  <button className="text-xs text-gray-500 hover:text-blue-600 flex items-center">
                    <span className="mr-1">💬</span>
                    Reply
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        {user ? (
          <form onSubmit={handleSendMessage} className="space-y-3">
            <div className="flex space-x-3">
              <img
                src={user.photoURL || '/default-avatar.png'}
                alt={user.displayName || 'You'}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    adjustTextareaHeight();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder={`Share your thoughts on ${ticker}...`}
                  className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={1}
                  maxLength={500}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  {newMessage.length}/500
                </span>
                {newMessage.trim() && (
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-gray-500">Sentiment:</span>
                    <span className={`text-xs ${getSentimentColor(detectSentiment(newMessage))}`}>
                      {getSentimentIcon(detectSentiment(newMessage))}
                    </span>
                  </div>
                )}
              </div>
              
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  !newMessage.trim() || sending
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">
              <a href="/auth/signin" className="text-blue-600 hover:underline">
                Sign in
              </a>
              {' '}to join the conversation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
