
import React, { useState } from 'react';
import Layout from './components/Layout';
import ChatView from './components/ChatView';
import LiveView from './components/LiveView';
import ExploreView from './components/ExploreView';
import FeedView from './components/FeedView';
import { AppView, User } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('feed');
  
  // Default guest user since authentication is removed
  const [user] = useState<User>({
    email: 'guest@boloindia.ai',
    name: 'अतिथि'
  });

  const handleLogout = () => {
    // No-op as auth is removed, but kept for Layout compatibility if needed
    console.log("No authentication active.");
  };

  const renderView = () => {
    switch (currentView) {
      case 'feed':
        return <FeedView user={user} />;
      case 'chat':
        return <ChatView />;
      case 'explore':
        return <ExploreView />;
      case 'live':
        return <LiveView />;
      default:
        return <FeedView user={user} />;
    }
  };

  return (
    <Layout 
      activeView={currentView} 
      setView={setCurrentView} 
      user={user} 
      onLogout={handleLogout}
    >
      <div key={currentView} className="animate-fade-in">
        {renderView()}
      </div>
    </Layout>
  );
};

export default App;
