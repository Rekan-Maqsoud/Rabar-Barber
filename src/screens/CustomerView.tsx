import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { joinQueue, removeCustomer, subscribeToQueue } from '../services/queueService';
import { Customer, ServiceType } from '../types';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getOrCreateDeviceId } from '../services/deviceService';
import { registerDevicePushToken } from '../services/notificationService';

export const CustomerView = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [service, setService] = useState<ServiceType | undefined>();
  const [queue, setQueue] = useState<Customer[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [myDeviceId, setMyDeviceId] = useState<string | null>(null);
  const [pushTokens, setPushTokens] = useState<{ expoPushToken?: string; webPushToken?: string }>({});
  const [loading, setLoading] = useState(true);
  const [joinWarning, setJoinWarning] = useState('');

  useEffect(() => {
    const initDevice = async () => {
      const [deviceId, registration] = await Promise.all([
        getOrCreateDeviceId(),
        registerDevicePushToken(),
      ]);
      setMyDeviceId(deviceId);
      setPushTokens(registration);
    };
    initDevice();

    const unsubscribe = subscribeToQueue((data) => {
      setQueue(data);

      if (myDeviceId) {
        const myActive = data.find(
          (customer) => customer.type === 'online' && customer.deviceId === myDeviceId,
        );
        setMyId(myActive?.id || null);
      }

      setLoading(false);
    });
    return () => unsubscribe();
  }, [myDeviceId]);

  const handleJoin = async () => {
    if (!name.trim()) {
      setJoinWarning(t('name_required'));
      return;
    }

    try {
      const deviceId = myDeviceId || (await getOrCreateDeviceId());
      if (!myDeviceId) setMyDeviceId(deviceId);

      const id = await joinQueue(name, service, 'online', deviceId, pushTokens);
      setMyId(id);
      setName('');
      setService(undefined);
      setJoinWarning('');
    } catch (error: any) {
      const key = error?.message || 'join_failed';
      setJoinWarning(t(key));
    }
  };

  const handleLeaveQueue = async () => {
    if (!myId) return;

    try {
      await removeCustomer(myId);
      setMyId(null);
      setJoinWarning('');
    } catch (error: any) {
      setJoinWarning(t(error?.message || 'join_failed'));
    }
  };

  const currentlyServing = queue.find(c => c.status === 'serving');
  const waitingQueue = queue.filter(c => c.status === 'waiting');
  const myIndex = myId ? waitingQueue.findIndex(c => c.id === myId) : -1;
  const peopleAhead = myIndex > -1 ? myIndex : waitingQueue.length;
  const hasActiveEntry = !!myId;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollContent: { padding: 20, paddingBottom: 40 },
    headerContainer: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
    logoIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      backgroundColor: theme.surface,
    },
    logoIcon: { width: '90%', height: '90%', opacity: 0.9 },
    welcomeText: { fontSize: 16, color: theme.textSecondary, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
    card: { backgroundColor: theme.surface, padding: 24, borderRadius: 20, marginBottom: 20, shadowColor: theme.primary, shadowOpacity: 0.08, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 5, borderWidth: 1, borderColor: theme.border },
    title: { fontSize: 24, fontWeight: '800', color: theme.text, marginBottom: 24, textAlign: 'center', letterSpacing: 0.5 },
    input: { backgroundColor: theme.background, color: theme.text, padding: 18, borderRadius: 14, marginBottom: 20, borderWidth: 1, borderColor: theme.border, fontSize: 16, fontWeight: '500' },
    warningText: { color: theme.danger, fontWeight: '700', marginTop: -12, marginBottom: 14, textAlign: 'center' },
    joinedInfo: { color: theme.primary, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
    joinedSubInfo: { color: theme.textSecondary, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
    leaveButton: { backgroundColor: theme.danger, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 14 },
    leaveButtonText: { color: '#FFFFFF', fontWeight: '800', letterSpacing: 0.5 },
    button: { backgroundColor: theme.primary, padding: 18, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', shadowColor: theme.primary, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6, marginTop: 8 },
    buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginLeft: 10, letterSpacing: 1 },
    serviceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    serviceBtn: { flex: 1, padding: 16, borderWidth: 1.5, borderColor: theme.border, borderRadius: 16, marginHorizontal: 6, alignItems: 'center', backgroundColor: theme.surface },
    serviceBtnActive: { backgroundColor: theme.primary, borderColor: theme.primary, shadowColor: theme.primary, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
    serviceText: { color: theme.textSecondary, fontSize: 13, textAlign: 'center', fontWeight: '600', marginTop: 8 },
    serviceTextActive: { color: '#FFFFFF', fontWeight: '800' },
    statBox: { alignItems: 'center', padding: 20, backgroundColor: theme.background, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border },
    statLabel: { color: theme.textSecondary, fontSize: 14, marginBottom: 8, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    statValue: { color: theme.text, fontSize: 28, fontWeight: '900' },
    queueListTitle: { fontSize: 20, fontWeight: '800', color: theme.text, marginBottom: 20, marginTop: 8, letterSpacing: 0.5 },
    queueItem: { flexDirection: 'row', alignItems: 'center', padding: 18, backgroundColor: theme.background, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.border },
    queueItemMy: { borderColor: theme.primary, borderWidth: 2, backgroundColor: theme.surface, shadowColor: theme.primary, shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
    queueItemIndex: { width: 36, fontSize: 18, fontWeight: '800', color: theme.primary },
    queueItemName: { flex: 1, fontSize: 17, fontWeight: '700', color: theme.text },
    badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginLeft: 8 },
    badgeText: { fontSize: 12, fontWeight: '800', color: '#FFF', textTransform: 'uppercase', letterSpacing: 0.5 },
    badgeOnline: { backgroundColor: theme.primary }, // Gold for online
    badgeWalkIn: { backgroundColor: theme.textSecondary }, // Gray for walk-in
  });

  if (loading) return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" color={theme.primary} /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.headerContainer}>
        <View style={styles.logoIconContainer}>
          <Image source={require('../../assets/icon.png')} style={styles.logoIcon} resizeMode="cover" />
        </View>
        <Text style={styles.welcomeText}>{t('welcome') || 'Premium Grooming'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{t('joinQueue')}</Text>
        {!hasActiveEntry ? (
          <>
            <TextInput
              style={styles.input}
              placeholder={t('name')}
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (joinWarning) setJoinWarning('');
              }}
            />
            {!!joinWarning && <Text style={styles.warningText}>{joinWarning}</Text>}
            <View style={styles.serviceRow}>
              {(['Hair', 'Hair & Beard', 'Organize/Trim'] as ServiceType[]).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.serviceBtn, service === s && styles.serviceBtnActive]}
                  onPress={() => setService(s)}
                >
                  <MaterialCommunityIcons 
                    name={s === 'Hair' ? 'content-cut' : s === 'Hair & Beard' ? 'face-man-shimmer' : 'scissors-cutting'} 
                    size={28} 
                    color={service === s ? '#FFFFFF' : theme.primary} 
                  />
                  <Text style={[styles.serviceText, service === s && styles.serviceTextActive]}>
                    {s === 'Hair' ? t('hair') : s === 'Hair & Beard' ? t('hairAndBeard') : t('organizeTrim')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.button} onPress={handleJoin}>
              <MaterialCommunityIcons name="ticket-confirmation" size={24} color="#FFFFFF" />
              <Text style={styles.buttonText}>{t('submit')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.joinedInfo}>{t('alreadyJoinedDevice')}</Text>
            <Text style={styles.joinedSubInfo}>{t('inputHiddenAfterJoin')}</Text>
            <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveQueue}>
              <Text style={styles.leaveButtonText}>{t('leaveQueue')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.statBox}>
          <MaterialCommunityIcons name="content-cut" size={24} color={theme.primary} style={{ marginBottom: 8 }} />
          <Text style={styles.statLabel}>{t('currentlyServing')}</Text>
          <Text style={styles.statValue}>{currentlyServing ? currentlyServing.name : t('none')}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={[styles.statBox, { flex: 1, marginRight: 8 }]}>
            <MaterialCommunityIcons name="account-group" size={24} color={theme.textSecondary} style={{ marginBottom: 8 }} />
            <Text style={styles.statLabel}>{t('totalInQueue')}</Text>
            <Text style={styles.statValue}>{waitingQueue.length}</Text>
          </View>
          {myId && (
            <View style={[styles.statBox, { flex: 1, marginLeft: 8, borderColor: theme.primary, backgroundColor: theme.surface }]}>
              <MaterialCommunityIcons name="clock-fast" size={24} color={theme.primary} style={{ marginBottom: 8 }} />
              <Text style={[styles.statLabel, { color: theme.primary }]}>{t('peopleAhead')}</Text>
              <Text style={[styles.statValue, { color: theme.primary }]}>{peopleAhead}</Text>
            </View>
          )}
        </View>
      </View>

      {waitingQueue.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.queueListTitle}>{t('upNext')}</Text>
          {waitingQueue.map((customer, index) => (
            <View key={customer.id} style={[styles.queueItem, customer.id === myId && styles.queueItemMy]}>
              <Text style={styles.queueItemIndex}>{index + 1}</Text>
              <Text style={styles.queueItemName}>{customer.name} {customer.id === myId ? `(${t('you')})` : ''}</Text>
              <View style={[styles.badge, customer.type === 'online' ? styles.badgeOnline : styles.badgeWalkIn]}>
                <Text style={styles.badgeText}>{customer.type === 'online' ? t('online') : t('walkIn')}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};
