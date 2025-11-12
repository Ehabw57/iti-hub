import { useState } from 'react';
import { useIntlayer } from 'react-intlayer';
import Sidebar from '../components/messages/sidebar/Sidebar';
import ChatWindow from '../components/messages/chatwindow/ChatWindow';

// Mock data for conversations
const mockConversations = [
  {
    id: 1,
    name: 'Aarav Lynn',
    avatar: '👤',
    lastMessage: 'Absolutely! Looking forward to it. Same time and place?',
    timestamp: '10:42 AM',
    online: true,
  },
  {
    id: 2,
    name: 'Malia Reid',
    avatar: '👩',
    lastMessage: 'Sounds great, I\'ll send over the file shortly.',
    timestamp: 'Yesterday',
    online: false,
  },
  {
    id: 3,
    name: 'Javier Neal',
    avatar: '👨',
    lastMessage: 'Can you check the latest design I uploaded?',
    timestamp: '2 days ago',
    online: false,
  },
  {
    id: 4,
    name: 'Sara-Louise',
    avatar: '👧',
    lastMessage: 'Happy Birthday! Hope you have a wonderful day!',
    timestamp: '03/15',
    online: false,
  },
];

// Mock messages for the selected chat
const mockMessages = {
  1: [
    {
      id: 1,
      sender: 'Aarav Lynn',
      text: 'Hey! Are we still on for tonight?',
      timestamp: '10:40 AM',
      isUser: false,
    },
    {
      id: 2,
      sender: 'You',
      text: 'Absolutely! Looking forward to it. Same time and place?',
      timestamp: '10:42 AM',
      isUser: true,
    },
    {
      id: 3,
      sender: 'Aarav Lynn',
      text: 'Yep, see you then!',
      timestamp: '10:43 AM',
      isUser: false,
    },
    {
      id: 4,
      sender: 'Aarav Lynn',
      text: 'Can\'t wait.',
      timestamp: '10:43 AM',
      isUser: false,
    },
    {
      id: 4,
      sender: 'Aarav Lynn',
      text: 'Can\'t wait.',
      timestamp: '10:43 AM',
      isUser: false,
    },
    {
      id: 4,
      sender: 'Aarav Lynn',
      text: 'Can\'t wait.',
      timestamp: '10:43 AM',
      isUser: false,
    },
    {
      id: 4,
      sender: 'Aarav Lynn',
      text: 'اوف اح.',
      timestamp: '10:43 AM',
      isUser: false,
    },
    {
      id: 4,
      sender: 'Aarav Lynn',
      text: 'Can\'t wait.',
      timestamp: '10:43 AM',
      isUser: false,
    },
    {
      id: 4,
      sender: 'Aarav Lynn',
      text: 'Can\'t wait.',
      timestamp: '10:43 AM',
      isUser: false,
    },
    {
      id: 4,
      sender: 'Aarav Lynn',
      text: 'Can\'t wait.',
      timestamp: '10:43 AM',
      isUser: false,
    },
  ],
  2: [
    {
      id: 1,
      sender: 'Malia Reid',
      text: 'Sounds great, I\'ll send over the file shortly.',
      timestamp: 'Yesterday',
      isUser: false,
    },
  ],
  3: [
    {
      id: 1,
      sender: 'Javier Neal',
      text: 'Can you check the latest design I uploaded?',
      timestamp: '2 days ago',
      isUser: false,
    },
  ],
  4: [
    {
      id: 1,
      sender: 'Sara-Louise',
      text: 'Happy Birthday! Hope you have a wonderful day!',
      timestamp: '03/15',
      isUser: false,
    },
  ],
};

function Messages() {
  // Internationalization
  const content = useIntlayer('messages-page');
  
  // State to track selected chat
  const [selectedChatId, setSelectedChatId] = useState(null);
  
  // Find the selected conversation
  const selectedConversation = mockConversations.find(
    (conv) => conv.id === selectedChatId
  );
  
  // Get messages for the selected chat
  const messages = selectedChatId ? mockMessages[selectedChatId] || [] : [];

  /**
   * Handle chat selection from Sidebar
   * @param {number} chatId - ID of the selected chat
   */
  const handleSelectChat = (chatId) => {
    setSelectedChatId(chatId);
  };

  /**
   * Handle back button click (return to sidebar on mobile)
   */
  const handleBack = () => {
    setSelectedChatId(null);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Hidden on mobile when chat is selected */}
      <div
        className={`${
          selectedChatId ? 'hidden md:block' : 'block'
        } w-full md:w-80 bg-white border-r border-gray-200`}
      >
        <Sidebar
          conversations={mockConversations}
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
        />
      </div>

      {/* ChatWindow - Hidden on mobile when no chat is selected */}
      <div
        className={`${
          selectedChatId ? 'block' : 'hidden md:block'
        } flex-1 flex flex-col bg-white`}
      >
        {selectedChatId && selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            messages={messages}
            onBack={handleBack}
          />
        ) : (
          // Empty state for desktop when no chat is selected
          <div className="hidden md:flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-6xl mb-4">{content.emptyStateIcon}</div>
              <p className="text-xl">{content.emptyStateText}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Messages;
