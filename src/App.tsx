/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/navigation/Header';
import { BottomNav } from './components/navigation/BottomNav';
import { DesktopNav } from './components/navigation/DesktopNav';
import { TimerView } from './components/timer/TimerView';
import { ProjectsView } from './components/projects/ProjectsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { ProfileView } from './components/profile/ProfileView';
import { ProfileSwitcherModal } from './components/profile/ProfileSwitcherModal';
import { DataBackupModal } from './components/settings/DataBackupModal';
import { CelebrationModal } from './components/common/CelebrationModal';
import { PWAInstallModal } from './components/common/PWAInstallModal';
import { OfflineIndicator } from './components/common/OfflineIndicator';

const AppContent: React.FC = () => {
  const { activeTab } = useApp();
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* Offline Status Indicator */}
      <OfflineIndicator />

      {/* Top Application Header */}
      <Header
        onOpenProfileSwitcher={() => setShowProfileSwitcher(true)}
        onOpenBackupModal={() => setShowBackupModal(true)}
        onOpenInstallModal={() => setShowInstallModal(true)}
      />

      {/* Desktop Navigation */}
      <DesktopNav />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-2 sm:px-4">
        {activeTab === 'timer' && <TimerView />}
        {activeTab === 'projects' && <ProjectsView />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'profile' && (
          <ProfileView onOpenProfileSwitcher={() => setShowProfileSwitcher(true)} />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Global Modals */}
      {showProfileSwitcher && (
        <ProfileSwitcherModal onClose={() => setShowProfileSwitcher(false)} />
      )}

      {showBackupModal && (
        <DataBackupModal onClose={() => setShowBackupModal(false)} />
      )}

      {showInstallModal && (
        <PWAInstallModal onClose={() => setShowInstallModal(false)} />
      )}

      {/* Milestone / Streak Celebration Modal */}
      <CelebrationModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
