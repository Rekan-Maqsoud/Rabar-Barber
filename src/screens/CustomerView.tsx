import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Image, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { joinQueue, removeCustomer, subscribeToQueue } from '../services/queueService';
import { Customer, ServiceType } from '../types';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getOrCreateDeviceId } from '../services/deviceService';
import { registerDevicePushToken } from '../services/notificationService';
import { LinearGradient } from 'expo-linear-gradient';

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
    headerContainer: { alignItems: 'center', marginBottom: 28, marginTop: 14 },
    logoIconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 14,
      backgroundColor: theme.surfaceElevated,
      borderWidth: 2,
      borderColor: theme.primaryLight,
      shadowColor: theme.primary,
      shadowOpacity: 0.2,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    logoIcon: { width: '90%', height: '90%', opacity: 0.95 },
    welcomeText: { fontSize: 13, color: theme.textMuted, fontWeight: '700', letterSpacing: 2.5, textTransform: 'uppercase' },
    card: {
      backgroundColor: theme.surface,
      padding: 24,
      borderRadius: 22,
      marginBottom: 20,
      shadowColor: theme.cardShadow,
      shadowOpacity: 1,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 6,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardAccent: {
      borderTopWidth: 3,
      borderTopColor: theme.primary,
    },
    title: { fontSize: 22, fontWeight: '800', color: theme.text, marginBottom: 24, textAlign: 'center', letterSpacing: 0.3 },
    input: {
      backgroundColor: theme.backgroundSecondary,
      color: theme.text,
      padding: 18,
      borderRadius: 14,
      marginBottom: 20,
      borderWidth: 1.5,
      borderColor: theme.border,
      fontSize: 16,
      fontWeight: '500',
    },
    warningText: { color: theme.danger, fontWeight: '700', marginTop: -12, marginBottom: 14, textAlign: 'center', fontSize: 13 },
    joinedInfo: { color: theme.primary, fontWeight: '800', textAlign: 'center', marginBottom: 8, fontSize: 16 },
    joinedSubInfo: { color: theme.textSecondary, fontWeight: '600', textAlign: 'center', marginBottom: 6, fontSize: 14 },
    leaveButton: {
      overflow: 'hidden',
      borderRadius: 14,
      marginTop: 16,
    },
    leaveButtonGradient: {
      padding: 16,
      alignItems: 'center',
      borderRadius: 14,
    },
    leaveButtonText: { color: '#FFFFFF', fontWeight: '800', letterSpacing: 0.5, fontSize: 15 },
    button: {
      overflow: 'hidden',
      borderRadius: 16,
      marginTop: 8,
      shadowColor: theme.primary,
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
    buttonGradient: {
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
    },
    buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', marginLeft: 10, letterSpacing: 1 },
    serviceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    serviceBtn: {
      flex: 1,
      padding: 16,
      borderWidth: 1.5,
      borderColor: theme.border,
      borderRadius: 18,
      marginHorizontal: 5,
      alignItems: 'center',
      backgroundColor: theme.surfaceElevated,
    },
    serviceBtnActive: {
      borderColor: theme.primary,
      borderWidth: 0,
      overflow: 'hidden',
    },
    serviceBtnActiveGradient: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 18,
    },
    serviceBtnContent: {
      alignItems: 'center',
      paddingVertical: 0,
    },
    serviceText: { color: theme.textSecondary, fontSize: 12, textAlign: 'center', fontWeight: '700', marginTop: 8 },
    serviceTextActive: { color: '#FFFFFF', fontWeight: '800' },
    statBox: {
      alignItems: 'center',
      padding: 22,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 18,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
      borderLeftWidth: 4,
      borderLeftColor: theme.primary,
    },
    statLabel: { color: theme.textSecondary, fontSize: 12, marginBottom: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    statValue: { color: theme.text, fontSize: 28, fontWeight: '900' },
    queueListTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 20,
      marginTop: 8,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    queueItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 18,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.border,
      borderLeftWidth: 4,
      borderLeftColor: 'transparent',
    },
    queueItemMy: {
      borderColor: theme.primaryLight,
      borderWidth: 1.5,
      borderLeftWidth: 4,
      borderLeftColor: theme.primary,
      backgroundColor: theme.surfaceElevated,
      shadowColor: theme.primary,
      shadowOpacity: 0.12,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    queueItemIndex: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.primaryLight,
      textAlign: 'center',
      textAlignVertical: 'center',
      lineHeight: 38,
      fontSize: 16,
      fontWeight: '800',
      color: theme.primary,
      marginRight: 14,
      overflow: 'hidden',
    },
    queueItemName: { flex: 1, fontSize: 16, fontWeight: '700', color: theme.text },
    badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginLeft: 8 },
    badgeText: { fontSize: 10, fontWeight: '800', color: '#FFF', textTransform: 'uppercase', letterSpacing: 0.8 },
    badgeOnline: { backgroundColor: theme.primary },
    badgeWalkIn: { backgroundColor: theme.textMuted },
    sectionDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 8,
    },
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

      <View style={[styles.card, styles.cardAccent]}>
        <Text style={styles.title}>{t('joinQueue')}</Text>
        {!hasActiveEntry ? (
          <>
            <TextInput
              style={styles.input}
              placeholder={t('name')}
              placeholderTextColor={theme.textMuted}
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
                  activeOpacity={0.7}
                >
                  {service === s && (
                    <LinearGradient
                      colors={[theme.gradientPrimaryStart, theme.gradientPrimaryEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.serviceBtnActiveGradient}
                    />
                  )}
                  <View style={styles.serviceBtnContent}>
                    <MaterialCommunityIcons 
                      name={s === 'Hair' ? 'content-cut' : s === 'Hair & Beard' ? 'face-man' : 'auto-fix'} 
                      size={28} 
                      color={service === s ? '#FFFFFF' : theme.primary} 
                    />
                    <Text style={[styles.serviceText, service === s && styles.serviceTextActive]}>
                      {s === 'Hair' ? t('hair') : s === 'Hair & Beard' ? t('hairAndBeard') : t('organizeTrim')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.button} onPress={handleJoin} activeOpacity={0.85}>
              <LinearGradient
                colors={[theme.gradientPrimaryStart, theme.gradientPrimaryEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <MaterialCommunityIcons name="ticket-confirmation" size={22} color="#FFFFFF" />
                <Text style={styles.buttonText}>{t('submit')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.joinedInfo}>{t('alreadyJoinedDevice')}</Text>
            <Text style={styles.joinedSubInfo}>{t('inputHiddenAfterJoin')}</Text>
            <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveQueue} activeOpacity={0.85}>
              <LinearGradient
                colors={[theme.gradientDangerStart, theme.gradientDangerEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.leaveButtonGradient}
              >
                <Text style={styles.leaveButtonText}>{t('leaveQueue')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.card}>
        <View style={[styles.statBox, { borderLeftColor: theme.accent }]}>
          <MaterialCommunityIcons name="content-cut" size={26} color={theme.accent} style={{ marginBottom: 10 }} />
          <Text style={styles.statLabel}>{t('currentlyServing')}</Text>
          <Text style={[styles.statValue, { color: currentlyServing ? theme.primary : theme.textMuted }]}>{currentlyServing ? currentlyServing.name : t('none')}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={[styles.statBox, { flex: 1, marginRight: 8, borderLeftColor: theme.textSecondary }]}>
            <MaterialCommunityIcons name="account-group" size={24} color={theme.textSecondary} style={{ marginBottom: 10 }} />
            <Text style={styles.statLabel}>{t('totalInQueue')}</Text>
            <Text style={styles.statValue}>{waitingQueue.length}</Text>
          </View>
          {myId && (
            <View style={[styles.statBox, { flex: 1, marginLeft: 8, borderLeftColor: theme.primary, backgroundColor: theme.primaryLight }]}>
              <MaterialCommunityIcons name="clock-fast" size={24} color={theme.primary} style={{ marginBottom: 10 }} />
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
      <View style={{ height: 50 }} />
    </ScrollView>
  );
};
