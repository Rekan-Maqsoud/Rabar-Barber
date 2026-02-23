import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme/ThemeContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { QueueNotificationWatcher } from './src/components/QueueNotificationWatcher';
import './src/config/i18n'; // Initialize i18n

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueueNotificationWatcher />
        <AppNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
