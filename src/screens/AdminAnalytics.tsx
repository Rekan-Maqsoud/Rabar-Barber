import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { getRevenueStats } from '../services/queueService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export const AdminAnalytics = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState({
    today: 0,
    weekly: 0,
    monthly: 0,
    totalRevenue: 0,
    totalCustomersToday: 0,
    totalCustomersAllTime: 0,
    averageTicket: 0,
    dailyAverageThisMonth: 0,
    popularService: 'None',
    monthlyHistory: [] as { monthStart: number; revenue: number; customers: number; averageTicket: number }[],
    serviceBreakdown: [] as { service: string; count: number; revenue: number }[],
    recentDays: [] as { dayStart: number; revenue: number; customers: number }[],
    dailyRevenueByMonth: [] as { monthStart: number; days: { dayStart: number; revenue: number; customers: number }[] }[],
  });
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [loading, setLoading] = useState(true);

  const formatIQD = (value: number) => `IQD ${Math.round(value).toLocaleString()}`;

  const locale = i18n.language === 'ar' ? 'ar-IQ' : i18n.language === 'en' ? 'en-US' : 'ckb-IQ';

  const formatService = (service: string) => {
    if (service === 'Hair') return t('hair');
    if (service === 'Hair & Beard') return t('hairAndBeard');
    if (service === 'Organize/Trim') return t('organizeTrim');
    return service;
  };

  useEffect(() => {
    const checkAccessAndFetchStats = async () => {
      try {
        const authStatus = await AsyncStorage.getItem('admin_auth');
        const hasAccess = authStatus === 'true';
        setIsAuthorized(hasAccess);

        if (!hasAccess) return;

        const data = await getRevenueStats();
        setStats(data);
        if (data.monthlyHistory.length > 0) {
          setSelectedMonth(data.monthlyHistory[data.monthlyHistory.length - 1].monthStart);
        }
      } catch (error) {
        console.error('Failed to load analytics access or data', error);
      } finally {
        setIsCheckingAccess(false);
        setLoading(false);
      }
    };

    checkAccessAndFetchStats();
  }, []);

  const monthOptions = stats.monthlyHistory;
  const selectedMonthStart = selectedMonth ?? monthOptions[monthOptions.length - 1]?.monthStart ?? null;
  const selectedMonthData = stats.dailyRevenueByMonth.find((item) => item.monthStart === selectedMonthStart);

  const getDailySeriesForSelectedMonth = () => {
    if (!selectedMonthStart) return [] as { dayStart: number; revenue: number; customers: number }[];

    const date = new Date(selectedMonthStart);
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dayLookup = new Map((selectedMonthData?.days || []).map((d) => [d.dayStart, d]));

    return Array.from({ length: daysInMonth }, (_, index) => {
      const dayStart = new Date(year, month, index + 1).getTime();
      const found = dayLookup.get(dayStart);
      return {
        dayStart,
        revenue: found?.revenue || 0,
        customers: found?.customers || 0,
      };
    });
  };

  const selectedMonthSeries = getDailySeriesForSelectedMonth();
  const contentMaxWidth = width >= 1200 ? 1080 : width >= 768 ? 840 : '100%';

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, padding: 20 },
    title: { fontSize: 26, fontWeight: '900', color: theme.text, marginBottom: 28, marginTop: 10, letterSpacing: 1, textTransform: 'uppercase' },
    card: {
      backgroundColor: theme.surface,
      padding: 22,
      borderRadius: 22,
      marginBottom: 18,
      shadowColor: theme.cardShadow,
      shadowOpacity: 1,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 5,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      width: 60,
      height: 60,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 18,
      overflow: 'hidden',
    },
    iconGradient: {
      width: 60,
      height: 60,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    contentContainer: { flex: 1 },
    label: { fontSize: 12, color: theme.textSecondary, marginBottom: 6, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    value: { fontSize: 30, fontWeight: '900', color: theme.text, letterSpacing: 0.3 },
    miniGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 8 },
    miniCard: {
      width: '48.5%',
      backgroundColor: theme.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      marginBottom: 12,
      shadowColor: theme.cardShadow,
      shadowOpacity: 1,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    miniLabel: { color: theme.textSecondary, fontWeight: '700', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 },
    miniValue: { color: theme.text, fontSize: 20, fontWeight: '900', marginTop: 8 },
    sectionCard: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 22,
      padding: 20,
      marginBottom: 18,
      shadowColor: theme.cardShadow,
      shadowOpacity: 1,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    sectionTitle: { color: theme.text, fontWeight: '800', fontSize: 15, marginBottom: 18, textTransform: 'uppercase', letterSpacing: 0.8 },
    chartRow: { flexDirection: 'row', alignItems: 'flex-end', minHeight: 180 },
    barWrap: { width: 48, alignItems: 'center', marginRight: 8 },
    bar: { width: 24, borderRadius: 8, minHeight: 4, overflow: 'hidden' },
    barGradient: { flex: 1, borderRadius: 8 },
    barLabel: { color: theme.textMuted, fontSize: 10, marginTop: 6, textAlign: 'center', fontWeight: '600' },
    valueLabel: { color: theme.text, fontSize: 10, marginBottom: 6, fontWeight: '700' },
    serviceRow: { marginBottom: 14 },
    serviceHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    serviceName: { color: theme.text, fontWeight: '700', fontSize: 14 },
    serviceMeta: { color: theme.textSecondary, fontWeight: '700', fontSize: 12 },
    serviceBarTrack: { width: '100%', height: 10, borderRadius: 8, backgroundColor: theme.backgroundSecondary, overflow: 'hidden' },
    serviceBarFill: { height: 10, borderRadius: 8, overflow: 'hidden' },
    serviceBarGradient: { flex: 1, borderRadius: 8 },
    dropdownButton: {
      borderWidth: 1.5,
      borderColor: theme.border,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.backgroundSecondary,
      marginBottom: 14,
    },
    dropdownText: { color: theme.text, fontWeight: '700' },
    dropdownList: { borderWidth: 1, borderColor: theme.border, borderRadius: 14, overflow: 'hidden', marginBottom: 14 },
    dropdownItem: { paddingVertical: 12, paddingHorizontal: 14, backgroundColor: theme.backgroundSecondary },
    dropdownItemActive: { backgroundColor: theme.primaryLight, borderLeftWidth: 4, borderLeftColor: theme.primary },
    dropdownItemText: { color: theme.text, fontWeight: '600' },
    blockedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: theme.background },
    blockedCard: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: theme.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 24,
      alignItems: 'center',
    },
    blockedTitle: { color: theme.text, fontSize: 18, fontWeight: '800', marginTop: 14, marginBottom: 8, textAlign: 'center' },
    blockedText: { color: theme.textSecondary, fontWeight: '600', textAlign: 'center', marginBottom: 18 },
    blockedButton: {
      backgroundColor: theme.primary,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 18,
      width: '100%',
      alignItems: 'center',
    },
    blockedButtonText: { color: '#FFFFFF', fontWeight: '800' },
  });

  if (loading || isCheckingAccess) return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" color={theme.primary} /></View>;

  if (!isAuthorized) {
    return (
      <View style={styles.blockedContainer}>
        <View style={styles.blockedCard}>
          <MaterialCommunityIcons name="shield-lock-outline" size={44} color={theme.primary} />
          <Text style={styles.blockedTitle}>Owner Access Only</Text>
          <Text style={styles.blockedText}>Only the shop owner can view analytics and stats.</Text>
          <TouchableOpacity style={styles.blockedButton} onPress={() => navigation.navigate('AdminQueue')}>
            <Text style={styles.blockedButtonText}>Go to Admin Queue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <View style={{ width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' }}>
      <Text style={styles.title}>{t('adminAnalytics')}</Text>

      <View style={styles.miniGrid}>
        <View style={[styles.miniCard, { borderLeftWidth: 4, borderLeftColor: theme.primary }]}>
          <Text style={styles.miniLabel}>{t('totalRevenue')}</Text>
          <Text style={styles.miniValue}>{formatIQD(stats.totalRevenue)}</Text>
        </View>
        <View style={[styles.miniCard, { borderLeftWidth: 4, borderLeftColor: theme.accent }]}>
          <Text style={styles.miniLabel}>{t('averageTicket')}</Text>
          <Text style={styles.miniValue}>{formatIQD(stats.averageTicket)}</Text>
        </View>
        <View style={[styles.miniCard, { borderLeftWidth: 4, borderLeftColor: theme.success }]}>
          <Text style={styles.miniLabel}>{t('allTimeCustomers')}</Text>
          <Text style={styles.miniValue}>{stats.totalCustomersAllTime}</Text>
        </View>
        <View style={[styles.miniCard, { borderLeftWidth: 4, borderLeftColor: theme.warning }]}>
          <Text style={styles.miniLabel}>{t('dailyAverageThisMonth')}</Text>
          <Text style={styles.miniValue}>{formatIQD(stats.dailyAverageThisMonth)}</Text>
        </View>
      </View>
      
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <LinearGradient colors={[theme.gradientSuccessStart, theme.gradientSuccessEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconGradient}>
            <MaterialCommunityIcons name="cash-multiple" size={28} color="#FFFFFF" />
          </LinearGradient>
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.label}>{t('totalRevenueToday')}</Text>
          <Text style={styles.value}>{formatIQD(stats.today)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <LinearGradient colors={[theme.gradientPrimaryStart, theme.gradientPrimaryEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconGradient}>
            <MaterialCommunityIcons name="calendar-week" size={28} color="#FFFFFF" />
          </LinearGradient>
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.label}>{t('weeklyRevenue')}</Text>
          <Text style={styles.value}>{formatIQD(stats.weekly)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <LinearGradient colors={[theme.gradientAccentStart, theme.gradientAccentEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconGradient}>
            <MaterialCommunityIcons name="calendar-month" size={28} color="#FFFFFF" />
          </LinearGradient>
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.label}>{t('monthlyRevenue')}</Text>
          <Text style={styles.value}>{formatIQD(stats.monthly)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <LinearGradient colors={[theme.gradientWarningStart, theme.gradientWarningEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconGradient}>
            <MaterialCommunityIcons name="account-group" size={28} color="#FFFFFF" />
          </LinearGradient>
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.label}>{t('totalCustomersToday')}</Text>
          <Text style={styles.value}>{stats.totalCustomersToday}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <LinearGradient colors={[theme.gradientPrimaryStart, theme.gradientPrimaryEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconGradient}>
            <MaterialCommunityIcons name="star-circle" size={28} color="#FFFFFF" />
          </LinearGradient>
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.label}>{t('mostPopularService')}</Text>
          <Text style={[styles.value, { fontSize: 20 }]}>{stats.popularService === 'None' ? t('none') : formatService(stats.popularService)}</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{t('monthlyRevenueHistory')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chartRow}>
            {stats.monthlyHistory.map((month) => {
              const maxValue = Math.max(...stats.monthlyHistory.map((m) => m.revenue), 1);
              const height = Math.max((month.revenue / maxValue) * 140, 6);
              const label = new Date(month.monthStart).toLocaleDateString(locale, { month: 'short', year: '2-digit' });
              return (
                <View key={String(month.monthStart)} style={styles.barWrap}>
                  <Text style={styles.valueLabel}>{Math.round(month.revenue).toLocaleString()}</Text>
                  <View style={[styles.bar, { height }]}>
                    <LinearGradient
                      colors={[theme.gradientPrimaryStart, theme.gradientPrimaryEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.barGradient}
                    />
                  </View>
                  <Text style={styles.barLabel}>{label}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{t('dailyRevenueByMonth')}</Text>
        <TouchableOpacity style={styles.dropdownButton} onPress={() => setMonthDropdownOpen((prev) => !prev)}>
          <Text style={styles.dropdownText}>
            {selectedMonthStart
              ? new Date(selectedMonthStart).toLocaleDateString(locale, { month: 'long', year: 'numeric' })
              : t('none')}
          </Text>
          <MaterialCommunityIcons name={monthDropdownOpen ? 'chevron-up' : 'chevron-down'} size={20} color={theme.textSecondary} />
        </TouchableOpacity>

        {monthDropdownOpen && (
          <View style={styles.dropdownList}>
            {monthOptions.map((month) => {
              const isActive = month.monthStart === selectedMonthStart;
              return (
                <TouchableOpacity
                  key={String(month.monthStart)}
                  style={[styles.dropdownItem, isActive && styles.dropdownItemActive]}
                  onPress={() => {
                    setSelectedMonth(month.monthStart);
                    setMonthDropdownOpen(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>
                    {new Date(month.monthStart).toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chartRow}>
            {selectedMonthSeries.map((day) => {
              const maxValue = Math.max(...selectedMonthSeries.map((d) => d.revenue), 1);
              const height = Math.max((day.revenue / maxValue) * 140, 6);
              const label = new Date(day.dayStart).toLocaleDateString(locale, { day: '2-digit' });
              return (
                <View key={String(day.dayStart)} style={styles.barWrap}>
                  <Text style={styles.valueLabel}>{Math.round(day.revenue).toLocaleString()}</Text>
                  <View style={[styles.bar, { width: 22, height }]}>
                    <LinearGradient
                      colors={[theme.gradientWarningStart, theme.gradientWarningEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.barGradient}
                    />
                  </View>
                  <Text style={styles.barLabel}>{label}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{t('servicePerformance')}</Text>
        {stats.serviceBreakdown.length === 0 && (
          <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>{t('none')}</Text>
        )}
        {stats.serviceBreakdown.map((item) => {
          const maxCount = Math.max(...stats.serviceBreakdown.map((s) => s.count), 1);
          const widthPercent = Math.max((item.count / maxCount) * 100, 6);
          return (
            <View key={item.service} style={styles.serviceRow}>
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceName}>{formatService(item.service)}</Text>
                <Text style={styles.serviceMeta}>{item.count} • {formatIQD(item.revenue)}</Text>
              </View>
              <View style={styles.serviceBarTrack}>
                <View style={[styles.serviceBarFill, { width: `${widthPercent}%` as `${number}%` }]}>
                  <LinearGradient
                    colors={[theme.gradientPrimaryStart, theme.gradientAccentEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.serviceBarGradient}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>
      
      <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
};
