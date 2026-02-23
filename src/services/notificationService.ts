import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { app } from '../config/firebase';

export type PushTokens = {
  expoPushToken?: string;
  webPushToken?: string;
};

let notificationHandlerConfigured = false;
let webForegroundListenerConfigured = false;

export const configureNotificationHandlers = () => {
  if (notificationHandlerConfigured || Platform.OS === 'web') return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  notificationHandlerConfigured = true;
};

export const requestNotificationPermissions = async () => {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  const existing = await Notifications.getPermissionsAsync();
  let finalStatus = existing.status;

  if (finalStatus !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('queue-updates', {
      name: 'Queue Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#D4AF37',
    });
  }

  return finalStatus === 'granted';
};

const getExpoProjectId = () => {
  const fromEasConfig = Constants?.easConfig?.projectId;
  const fromExpoConfig = (Constants?.expoConfig as any)?.extra?.eas?.projectId;
  return fromEasConfig || fromExpoConfig;
};

const ensureWebForegroundListener = async () => {
  if (webForegroundListenerConfigured || Platform.OS !== 'web') return;

  try {
    const messagingModule = require('firebase/messaging') as typeof import('firebase/messaging');
    const supported = await messagingModule.isSupported();
    if (!supported) return;

    const messaging = messagingModule.getMessaging(app);
    messagingModule.onMessage(messaging, (payload) => {
      const title = payload.notification?.title || 'Queue Update';
      const body = payload.notification?.body || 'There is a new queue update.';
      showLocalNotification(title, body);
    });

    webForegroundListenerConfigured = true;
  } catch (error) {
    console.warn('Web foreground messaging is not configured yet:', error);
  }
};

export const registerDevicePushToken = async (): Promise<PushTokens> => {
  const granted = await requestNotificationPermissions();
  configureNotificationHandlers();

  if (!granted) return {};

  if (Platform.OS === 'web') {
    await ensureWebForegroundListener();

    const vapidKey = process.env.EXPO_PUBLIC_FIREBASE_WEB_VAPID_KEY;
    if (!vapidKey) {
      return {};
    }

    try {
      const messagingModule = require('firebase/messaging') as typeof import('firebase/messaging');
      const supported = await messagingModule.isSupported();
      if (!supported) return {};

      const messaging = messagingModule.getMessaging(app);
      const webPushToken = await messagingModule.getToken(messaging, { vapidKey });
      return webPushToken ? { webPushToken } : {};
    } catch (error) {
      console.warn('Failed to get web push token:', error);
      return {};
    }
  }

  if (!Device.isDevice) {
    return {};
  }

  try {
    const projectId = getExpoProjectId();
    const tokenResult = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    return tokenResult?.data ? { expoPushToken: tokenResult.data } : {};
  } catch (error) {
    console.warn('Failed to get Expo push token:', error);
    return {};
  }
};

export const showLocalNotification = async (title: string, body: string) => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
    },
    trigger: null,
  });
};
