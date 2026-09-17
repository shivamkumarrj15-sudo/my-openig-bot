import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AddSessionModal } from './components/AddSessionModal';
import { Overview } from './pages/Overview';
import { AIPilot } from './pages/AIPilot';
import { Sessions } from './pages/Sessions';
import { LiveChat } from './pages/LiveChat';
import { Publisher } from './pages/Publisher';
import { Automation } from './pages/Automation';
import { Comments } from './pages/Comments';
import { Webhooks } from './pages/Webhooks';
import { ApiKeys } from './pages/ApiKeys';
import { Docs } from './pages/Docs';
import { Settings } from './pages/Settings';
import { api } from './services/api';
import { useWebSocket } from './services/websocket';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [metrics, setMetrics] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Live WebSocket Connection
  const { isConnected, lastMessage } = useWebSocket((msg) => {
    if (msg.type === 'session.status_changed') {
      fetchSessions();
    }
    if (msg.type === 'message.received' || msg.type === 'message.sent' || msg.type === 'comment.created' || msg.type === 'automation.triggered' || msg.type === 'post.published') {
      fetchMetrics();
      fetchAuditLogs();
    }
  });

  const fetchSessions = async () => {
    try {
      const data = await api.getSessions();
      setSessions(data);
      if (data.length > 0 && !selectedSessionId) {
        setSelectedSessionId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  const fetchMetrics = async () => {
    try {
      const data = await api.getMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const data = await api.getAuditLogs(20);
      setAuditLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchMetrics();
    fetchAuditLogs();

    const interval = setInterval(() => {
      fetchMetrics();
      fetchAuditLogs();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleSessionCreated = (session: any) => {
    fetchSessions();
    setSelectedSessionId(session.id);
  };

  return (
    <div className="flex h-screen bg-[#0b0f17] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeSessionsCount={sessions.filter(s => s.status === 'READY').length}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          sessions={sessions}
          selectedSessionId={selectedSessionId}
          setSelectedSessionId={setSelectedSessionId}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenNewPost={() => setActiveTab('publisher')}
          isWsConnected={isConnected}
        />

        {/* View Routing */}
        <main className="flex-1 overflow-y-auto bg-[#0b0f17]">
          {activeTab === 'overview' && (
            <Overview
              metrics={metrics}
              sessions={sessions}
              auditLogs={auditLogs}
              setActiveTab={setActiveTab}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onOpenNewPost={() => setActiveTab('publisher')}
            />
          )}

          {activeTab === 'aipilot' && (
            <AIPilot
              selectedSessionId={selectedSessionId}
              sessions={sessions}
            />
          )}

          {activeTab === 'sessions' && (
            <Sessions
              sessions={sessions}
              onRefresh={fetchSessions}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              setActiveTab={setActiveTab}
              setSelectedSessionId={setSelectedSessionId}
            />
          )}

          {activeTab === 'chat' && (
            <LiveChat
              selectedSessionId={selectedSessionId}
              sessions={sessions}
            />
          )}

          {activeTab === 'publisher' && (
            <Publisher
              selectedSessionId={selectedSessionId}
              sessions={sessions}
            />
          )}

          {activeTab === 'automation' && (
            <Automation
              selectedSessionId={selectedSessionId}
              sessions={sessions}
            />
          )}

          {activeTab === 'comments' && (
            <Comments
              selectedSessionId={selectedSessionId}
              sessions={sessions}
            />
          )}

          {activeTab === 'webhooks' && (
            <Webhooks />
          )}

          {activeTab === 'apikeys' && (
            <ApiKeys />
          )}

          {activeTab === 'docs' && (
            <Docs />
          )}

          {activeTab === 'settings' && (
            <Settings />
          )}
        </main>
      </div>

      {/* Connect Account Modal */}
      <AddSessionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSessionCreated={handleSessionCreated}
      />
    </div>
  );
};
