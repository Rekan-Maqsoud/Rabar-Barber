import React, { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Customer } from '../types';
import { subscribeToQueue } from '../services/queueService';
import { getOrCreateDeviceId } from '../services/deviceService';
import { configureNotificationHandlers, showLocalNotification } from '../services/notificationService';
import {
  setAdminNotificationSession,
  subscribeAdminNotificationSession,
} from '../services/adminSessionService';

const ADMIN_AUTH_KEY = 'admin_auth';

export const QueueNotificationWatcher = () => {
  const [adminNotificationsEnabled, setAdminNotificationsEnabled] = useState(false);
  const adminNotificationsEnabledRef = useRef(false);
  const deviceIdRef = useRef<string | null>(null);
  const lastAheadRef = useRef<number | null>(null);
  const servedNoticeKeyRef = useRef<string | null>(null);
  const previousQueueRef = useRef<Customer[]>([]);

  useEffect(() => {
    adminNotificationsEnabledRef.current = adminNotificationsEnabled;
  }, [adminNotificationsEnabled]);

  useEffect(() => {
    configureNotificationHandlers();

    let isMounted = true;

    const init = async () => {
      const [deviceId, authStatus] = await Promise.all([
        getOrCreateDeviceId(),
        AsyncStorage.getItem(ADMIN_AUTH_KEY),
      ]);

      if (!isMounted) return;

      deviceIdRef.current = deviceId;
      const isAdmin = authStatus === 'true';
      setAdminNotificationSession(isAdmin);
    };

    init();

    const unsubscribeAdminSession = subscribeAdminNotificationSession(setAdminNotificationsEnabled);
    const unsubscribeQueue = subscribeToQueue((queue) => {
      handleCustomerNotifications(queue);
      if (adminNotificationsEnabledRef.current) {
        handleAdminNotifications(queue);
      }
      previousQueueRef.current = queue;
    });

    return () => {
      isMounted = false;
      unsubscribeAdminSession();
      unsubscribeQueue();
    };
  }, []);

  const handleCustomerNotifications = (queue: Customer[]) => {
    const deviceId = deviceIdRef.current;
    if (!deviceId) return;

    const waitingQueue = queue.filter((customer) => customer.status === 'waiting');
    const myEntry = queue.find(
      (customer) =>
        customer.type === 'online' &&
        customer.deviceId === deviceId &&
        (customer.status === 'waiting' || customer.status === 'serving'),
    );

    if (!myEntry) {
      lastAheadRef.current = null;
      servedNoticeKeyRef.current = null;
      return;
    }

    if (myEntry.status === 'serving') {
      if (servedNoticeKeyRef.current !== myEntry.id) {
        servedNoticeKeyRef.current = myEntry.id;
        showLocalNotification('It is your turn', 'Please go to the barber chair now.');
      }
      return;
    }

    const aheadCount = waitingQueue.findIndex((customer) => customer.id === myEntry.id);
    if (aheadCount < 0) return;

    const previousAhead = lastAheadRef.current;
    const shouldNotify = [2, 1, 0].includes(aheadCount) && previousAhead !== aheadCount;

    if (shouldNotify) {
      const body = aheadCount === 0
        ? 'You are next in line.'
        : `${aheadCount} customer${aheadCount > 1 ? 's' : ''} ahead of you.`;
      showLocalNotification('Queue update', body);
    }

    lastAheadRef.current = aheadCount;
  };

  const handleAdminNotifications = (queue: Customer[]) => {
    const previousQueue = previousQueueRef.current;

    const previousById = new Map(previousQueue.map((customer) => [customer.id, customer]));
    const currentWaiting = queue.filter((customer) => customer.status === 'waiting');
    const previousWaitingIds = new Set(
      previousQueue
        .filter((customer) => customer.status === 'waiting')
        .map((customer) => customer.id),
    );

    const newlyJoined = currentWaiting.filter((customer) => !previousWaitingIds.has(customer.id));
    if (newlyJoined.length > 0) {
      const firstNew = newlyJoined[0];
      showLocalNotification('New customer in queue', `${firstNew.name} joined the queue.`);
    }

    queue.forEach((customer) => {
      const previous = previousById.get(customer.id);
      if (!previous) return;

      if (previous.status !== 'serving' && customer.status === 'serving') {
        showLocalNotification('Customer is now serving', `${customer.name} is now in service.`);
      }
    });
  };

  return null;
};
