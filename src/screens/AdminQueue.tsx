import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, ActivityIndicator, Image, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { subscribeToQueue, markAsDone, removeCustomer, moveDown, markAsServing, joinQueue } from '../services/queueService';
import { Customer } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { setAdminNotificationSession } from '../services/adminSessionService';
import { LinearGradient } from 'expo-linear-gradient';

const ADMIN_PASSWORD = 'admin'; // Simple password for demonstration

export const AdminQueue = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const [queue, setQueue] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');
  const [walkInModalVisible, setWalkInModalVisible] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInError, setWalkInError] = useState('');
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'danger' | 'warning';
    actionLabel?: string;
    onAction?: () => void;
    dismissLabel?: string;
  } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const unsubscribe = subscribeToQueue(setQueue);
      return () => unsubscribe();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const hideToast = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast(null);
  };

  const showToast = (
    nextToast: {
      message: string;
      type: 'success' | 'danger' | 'warning';
      actionLabel?: string;
      onAction?: () => void;
      dismissLabel?: string;
    },
    duration = 3000,
  ) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast(nextToast);
    if (duration > 0) {
      toastTimerRef.current = setTimeout(() => {
        setToast(null);
        toastTimerRef.current = null;
      }, duration);
    }
  };

  const checkAuth = async () => {
    try {
      const authStatus = await AsyncStorage.getItem('admin_auth');
      if (authStatus === 'true') {
        setIsAuthenticated(true);
        setAdminNotificationSession(true);
      } else {
        setAdminNotificationSession(false);
      }
    } catch (e) {
      console.error('Failed to load auth status', e);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLogin = async () => {
    if (passwordInput === ADMIN_PASSWORD) {
      try {
        await AsyncStorage.setItem('admin_auth', 'true');
        setIsAuthenticated(true);
        setAdminNotificationSession(true);
        setAuthError('');
      } catch (e) {
        console.error('Failed to save auth status', e);
      }
    } else {
      setAuthError(t('incorrectPassword'));
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('admin_auth');
      setIsAuthenticated(false);
      setAdminNotificationSession(false);
      setPasswordInput('');
    } catch (e) {
      console.error('Failed to remove auth status', e);
    }
  };

  const handleMarkDone = (customer: Customer) => {
    setSelectedCustomer(customer);
    setPaymentModalVisible(true);
  };

  const confirmPayment = async () => {
    if (!selectedCustomer || !amountPaid) return;
    try {
      await markAsDone(selectedCustomer, parseFloat(amountPaid));
      showToast({
        message: `${selectedCustomer.name} marked as done.`,
        type: 'success',
      });
      setPaymentModalVisible(false);
      setSelectedCustomer(null);
      setAmountPaid('');
    } catch (error) {
      console.error('Failed to mark customer as done', error);
      showToast({ message: 'Failed to complete payment action.', type: 'danger' });
    }
  };

  const handleAddWalkIn = () => {
    setWalkInName('');
    setWalkInError('');
    setWalkInModalVisible(true);
  };

  const confirmAddWalkIn = async () => {
    const trimmedName = walkInName.trim();
    if (!trimmedName) {
      setWalkInError(t('name_required'));
      return;
    }
    try {
      await joinQueue(trimmedName, undefined, 'walk-in');
      showToast({ message: `${trimmedName} added to queue.`, type: 'success' });
      setWalkInModalVisible(false);
      setWalkInName('');
      setWalkInError('');
    } catch (error: any) {
      console.error('Failed to add walk-in customer', error);
      setWalkInError(t(error?.message || 'join_failed'));
      showToast({ message: 'Failed to add walk-in customer.', type: 'danger' });
    }
  };

  const handleMarkServing = async (customer: Customer) => {
    try {
      await markAsServing(customer.id);
      showToast({ message: `${customer.name} is now serving.`, type: 'success' });
    } catch (error) {
      console.error('Failed to mark as serving', error);
      showToast({ message: 'Failed to update serving status.', type: 'danger' });
    }
  };

  const handleMoveDown = async (customer: Customer) => {
    try {
      await moveDown(customer.id, queue);
      showToast({ message: `${customer.name} moved down in queue.`, type: 'warning' });
    } catch (error) {
      console.error('Failed to move customer down', error);
      showToast({ message: 'Failed to move customer.', type: 'danger' });
    }
  };

  const handleRemoveRequest = (customer: Customer) => {
    showToast(
      {
        message: `Remove ${customer.name} from queue?`,
        type: 'warning',
        actionLabel: t('confirm'),
        dismissLabel: t('cancel'),
        onAction: async () => {
          hideToast();
          try {
            await removeCustomer(customer.id);
            showToast({ message: `${customer.name} removed from queue.`, type: 'success' });
          } catch (error) {
            console.error('Failed to remove customer', error);
            showToast({ message: 'Failed to remove customer.', type: 'danger' });
          }
        },
      },
      0,
    );
  };

  const contentMaxWidth = width >= 1200 ? 1080 : width >= 768 ? 820 : '100%';

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, padding: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 10 },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    brandIconContainer: {
      width: 46,
      height: 46,
      borderRadius: 23,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.surfaceElevated,
      marginRight: 12,
      borderWidth: 2,
      borderColor: theme.primaryLight,
      shadowColor: theme.primary,
      shadowOpacity: 0.15,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 4,
    },
    brandIcon: { width: '90%', height: '90%' },
    title: { flexShrink: 1, fontSize: 22, fontWeight: '900', color: theme.text, letterSpacing: 0.5 },
    addButton: {
      overflow: 'hidden',
      borderRadius: 14,
      shadowColor: theme.primary,
      shadowOpacity: 0.3,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    addButtonGradient: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 14,
    },
    addButtonText: { color: '#FFFFFF', fontWeight: '800', marginLeft: 7, fontSize: 13, letterSpacing: 0.3 },
    card: {
      backgroundColor: theme.surface,
      padding: 22,
      borderRadius: 22,
      marginBottom: 14,
      shadowColor: theme.cardShadow,
      shadowOpacity: 1,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 5,
      borderWidth: 1,
      borderColor: theme.border,
      borderLeftWidth: 4,
      borderLeftColor: theme.border,
    },
    cardServing: {
      borderLeftColor: theme.primary,
      backgroundColor: theme.surfaceElevated,
      shadowColor: theme.elevatedShadow,
      shadowOpacity: 1,
      shadowRadius: 20,
      elevation: 8,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    name: { fontSize: 19, fontWeight: '800', color: theme.text, letterSpacing: 0.3 },
    service: { fontSize: 13, color: theme.primary, marginTop: 6, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    badgeText: { fontSize: 10, fontWeight: '800', color: '#FFF', textTransform: 'uppercase', letterSpacing: 0.8 },
    badgeOnline: { backgroundColor: theme.primary },
    badgeWalkIn: { backgroundColor: theme.textMuted },
    actions: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', marginTop: 12 },
    actionBtn: {
      width: '48%',
      minHeight: 46,
      paddingVertical: 11,
      paddingHorizontal: 8,
      borderRadius: 14,
      marginBottom: 8,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    actionBtnGradient: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 14,
    },
    btnText: { color: '#FFF', fontSize: 12, fontWeight: '800', marginLeft: 6, letterSpacing: 0.3 },
    btnTextPrimary: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', marginLeft: 6, letterSpacing: 0.3 },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.75)' },
    modalContent: {
      backgroundColor: theme.surface,
      padding: 28,
      borderRadius: 24,
      width: '90%',
      maxWidth: 420,
      shadowColor: theme.elevatedShadow,
      shadowOpacity: 1,
      shadowRadius: 30,
      elevation: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    modalTitle: { fontSize: 20, fontWeight: '900', color: theme.text, marginBottom: 20, textAlign: 'center', letterSpacing: 0.4 },
    input: {
      borderWidth: 1.5,
      borderColor: theme.border,
      padding: 16,
      borderRadius: 14,
      color: theme.text,
      marginBottom: 20,
      fontSize: 16,
      backgroundColor: theme.backgroundSecondary,
      fontWeight: '600',
      textAlign: 'center',
    },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
    modalBtn: { paddingVertical: 14, borderRadius: 14, flex: 1, alignItems: 'center', marginHorizontal: 6 },
    modalBtnConfirm: {
      overflow: 'hidden',
      shadowColor: theme.primary,
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    modalBtnCancel: { backgroundColor: theme.backgroundSecondary, borderWidth: 1.5, borderColor: theme.border },
    
    // Auth styles
    authContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background, padding: 20 },
    authCard: {
      backgroundColor: theme.surface,
      padding: 40,
      borderRadius: 28,
      width: '100%',
      maxWidth: 400,
      shadowColor: theme.elevatedShadow,
      shadowOpacity: 1,
      shadowRadius: 30,
      elevation: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    authLogoContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.backgroundSecondary,
      marginBottom: 24,
      borderWidth: 2,
      borderColor: theme.primaryLight,
    },
    authLogo: { width: '90%', height: '90%' },
    authTitle: { fontSize: 26, fontWeight: '900', color: theme.text, marginBottom: 10, letterSpacing: 1.5, textTransform: 'uppercase' },
    authSubtitle: { fontSize: 14, color: theme.textSecondary, marginBottom: 36, textAlign: 'center', fontWeight: '500', lineHeight: 20 },
    authInput: {
      width: '100%',
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1.5,
      borderColor: theme.border,
      padding: 18,
      borderRadius: 14,
      color: theme.text,
      marginBottom: 22,
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    authButton: {
      width: '100%',
      overflow: 'hidden',
      borderRadius: 16,
      shadowColor: theme.primary,
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
    authButtonGradient: {
      padding: 18,
      alignItems: 'center',
      borderRadius: 16,
    },
    authButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
    errorText: { color: theme.danger, marginBottom: 20, fontWeight: '700', fontSize: 14 },
    logoutBtn: { padding: 8 },
    toastContainer: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 24,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 8,
    },
    toastGradient: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 16,
    },
    toastText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14, lineHeight: 20 },
    toastActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
    toastActionBtn: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 10,
      marginLeft: 8,
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.3)',
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    toastActionText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  });

  if (isCheckingAuth) {
    return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" color={theme.primary} /></View>;
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <View style={styles.authCard}>
          <View style={styles.authLogoContainer}>
            <Image source={require('../../assets/icon.png')} style={styles.authLogo} resizeMode="cover" />
          </View>
          <Text style={styles.authTitle}>{t('adminAccess')}</Text>
          <Text style={styles.authSubtitle}>{t('enterPasswordToManageQueue')}</Text>
          
          <TextInput
            style={styles.authInput}
            placeholder={t('password')}
            placeholderTextColor={theme.textMuted}
            secureTextEntry
            value={passwordInput}
            onChangeText={setPasswordInput}
            onSubmitEditing={handleLogin}
          />
          
          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
          
          <TouchableOpacity style={styles.authButton} onPress={handleLogin} activeOpacity={0.85}>
            <LinearGradient
              colors={[theme.gradientPrimaryStart, theme.gradientPrimaryEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.authButtonGradient}
            >
              <Text style={styles.authButtonText}>{t('login')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Customer }) => (
    <View style={[styles.card, item.status === 'serving' && styles.cardServing]}>
      <View style={styles.cardHeader}>
        <View>
            <Text style={styles.name}>{item.name} {item.status === 'serving' && <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }}> ({t('serving')})</Text>}</Text>
          <Text style={styles.service}>{item.service || t('none')}</Text>
        </View>
        <View style={[styles.badge, item.type === 'online' ? styles.badgeOnline : styles.badgeWalkIn]}>
          <Text style={styles.badgeText}>{item.type === 'online' ? t('online') : t('walkIn')}</Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        {item.status !== 'serving' && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleMarkServing(item)} activeOpacity={0.8}>
            <LinearGradient colors={[theme.gradientPrimaryStart, theme.gradientPrimaryEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionBtnGradient} />
            <MaterialCommunityIcons name="content-cut" size={16} color="#FFFFFF" />
            <Text style={styles.btnTextPrimary}>{t('serve')}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleMarkDone(item)} activeOpacity={0.8}>
          <LinearGradient colors={[theme.gradientSuccessStart, theme.gradientSuccessEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionBtnGradient} />
          <MaterialCommunityIcons name="check-circle" size={16} color="#FFFFFF" />
          <Text style={styles.btnText}>{t('markDone')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleMoveDown(item)} activeOpacity={0.8}>
          <LinearGradient colors={[theme.gradientWarningStart, theme.gradientWarningEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionBtnGradient} />
          <MaterialCommunityIcons name="arrow-down-bold-circle" size={16} color="#FFFFFF" />
          <Text style={styles.btnText}>{t('moveDown')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleRemoveRequest(item)} activeOpacity={0.8}>
          <LinearGradient colors={[theme.gradientDangerStart, theme.gradientDangerEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionBtnGradient} />
          <MaterialCommunityIcons name="delete-circle" size={16} color="#FFFFFF" />
          <Text style={styles.btnText}>{t('remove')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={{ width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', flex: 1 }}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.brandIconContainer}>
            <Image source={require('../../assets/icon.png')} style={styles.brandIcon} resizeMode="cover" />
          </View>
          <Text style={styles.title}>{t('adminQueue')}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddWalkIn} activeOpacity={0.85}>
            <LinearGradient
              colors={[theme.gradientPrimaryStart, theme.gradientPrimaryEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addButtonGradient}
            >
              <MaterialCommunityIcons name="account-plus" size={18} color="#FFFFFF" />
              <Text style={styles.addButtonText}>{t('addWalkIn')}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.logoutBtn, { marginLeft: 12 }]} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={26} color={theme.danger} />
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={queue}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 60, padding: 20 }}>
            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: theme.backgroundSecondary, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: theme.border }}>
              <MaterialCommunityIcons name="chair-rolling" size={50} color={theme.textMuted} />
            </View>
            <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 4, fontSize: 16, fontWeight: '600' }}>{t('queueEmpty')}</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
      </View>

      <Modal visible={paymentModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.primaryLight, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 18 }}>
              <MaterialCommunityIcons name="cash-register" size={32} color={theme.primary} />
            </View>
            <Text style={styles.modalTitle}>{t('paymentModalTitle').toUpperCase()}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('amountPaid')}
              placeholderTextColor={theme.textMuted}
              keyboardType="decimal-pad"
              value={amountPaid}
              onChangeText={setAmountPaid}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setPaymentModalVisible(false)}>
                <Text style={{ color: theme.text, fontWeight: '800' }}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnConfirm]} onPress={confirmPayment} activeOpacity={0.85}>
                <LinearGradient
                  colors={[theme.gradientPrimaryStart, theme.gradientPrimaryEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ ...StyleSheet.absoluteFillObject, borderRadius: 14 }}
                />
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>{t('confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={walkInModalVisible} transparent animationType="fade" onRequestClose={() => setWalkInModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.primaryLight, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 18 }}>
              <MaterialCommunityIcons name="account-plus" size={32} color={theme.primary} />
            </View>
            <Text style={styles.modalTitle}>{t('addWalkIn')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('name')}
              placeholderTextColor={theme.textMuted}
              value={walkInName}
              onChangeText={(text) => {
                setWalkInName(text);
                if (walkInError) setWalkInError('');
              }}
              onSubmitEditing={confirmAddWalkIn}
              autoFocus
            />
            {!!walkInError && (
              <Text style={{ color: theme.danger, fontWeight: '700', textAlign: 'center', marginBottom: 12 }}>{walkInError}</Text>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setWalkInModalVisible(false)}>
                <Text style={{ color: theme.text, fontWeight: '800' }}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnConfirm]} onPress={confirmAddWalkIn} activeOpacity={0.85}>
                <LinearGradient
                  colors={[theme.gradientPrimaryStart, theme.gradientPrimaryEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ ...StyleSheet.absoluteFillObject, borderRadius: 14 }}
                />
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>{t('confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {toast && (
        <View style={styles.toastContainer}>
          <LinearGradient
            colors={
              toast.type === 'success'
                ? [theme.gradientSuccessStart, theme.gradientSuccessEnd]
                : toast.type === 'danger'
                  ? [theme.gradientDangerStart, theme.gradientDangerEnd]
                  : [theme.gradientWarningStart, theme.gradientWarningEnd]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.toastGradient}
          >
            <Text style={styles.toastText}>{toast.message}</Text>
            <View style={styles.toastActions}>
              {toast.onAction && toast.actionLabel ? (
                <TouchableOpacity
                  style={styles.toastActionBtn}
                  onPress={toast.onAction}
                >
                  <Text style={styles.toastActionText}>{toast.actionLabel}</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.toastActionBtn} onPress={hideToast}>
                <Text style={styles.toastActionText}>{toast.dismissLabel || 'OK'}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      )}
    </View>
  );
};
