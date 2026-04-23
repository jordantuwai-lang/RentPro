import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';

// Must import location task at top level before anything else
import './src/tasks/locationTask';

import { getStoredUser, DriverUser } from './src/auth';
import LoginScreen from './src/screens/LoginScreen';
import JobsScreen from './src/screens/JobsScreen';
import JobDetailScreen from './src/screens/JobDetailScreen';

type Screen = 'loading' | 'login' | 'jobs' | 'jobDetail';

export default function App() {
  const [screen, setScreen] = useState<Screen>('loading');
  const [user, setUser] = useState<DriverUser | null>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // Check for existing session on app launch
  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = await getStoredUser();
      if (storedUser) {
        setUser(storedUser);
        setScreen('jobs');
      } else {
        setScreen('login');
      }
    };
    checkAuth();
  }, []);

  if (screen === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0fdf4' }}>
        <ActivityIndicator size="large" color="#01ae42" />
      </View>
    );
  }

  if (screen === 'login') {
    return (
      <LoginScreen
        onLogin={async () => {
          const storedUser = await getStoredUser();
          setUser(storedUser);
          setScreen('jobs');
        }}
      />
    );
  }

  if (screen === 'jobDetail' && selectedJob) {
    return (
      <JobDetailScreen
        job={selectedJob}
        onBack={() => setScreen('jobs')}
        onUpdated={() => {
          // Refresh will happen when going back via useFocusEffect
          setScreen('jobs');
        }}
      />
    );
  }

  return (
    <JobsScreen
      user={user!}
      onLogout={() => {
        setUser(null);
        setScreen('login');
      }}
      onSelectJob={(job) => {
        setSelectedJob(job);
        setScreen('jobDetail');
      }}
    />
  );
}

