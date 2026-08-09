// App.js
// Root component: shows AuthScreen until logged in, then the Home screen.

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AuthScreen from './src/screens/AuthScreen';
import { getCurrentUser, onAuthStateChange } from './src/data/auth';

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    getCurrentUser().then((u) => {
      setUser(u);
      setCheckingSession(false);
    });

    const subscription = onAuthStateChange((u) => setUser(u));
    return () => subscription?.unsubscribe();
  }, []);

  if (checkingSession) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={setUser} />;
  }

  // Placeholder until HomeScreen is built in the next step
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#2563EB" />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
});