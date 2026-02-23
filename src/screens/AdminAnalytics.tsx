import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { getRevenueStats } from '../services/queueService';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const AdminAnalytics = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
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
    const fetchStats = async () => {
      const data = await getRevenueStats();
      setStats(data);
      if (data.monthlyHistory.length > 0) {
        setSelectedMonth(data.monthlyHistory[data.monthlyHistory.length - 1].monthStart);
      }
      setLoading(false);
    };
    fetchStats();
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

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, padding: 20 },
    title: { fontSize: 28, fontWeight: '900', color: theme.text, marginBottom: 28, marginTop: 10, letterSpacing: 1, textTransform: 'uppercase' },
    card: { backgroundColor: theme.surface, padding: 24, borderRadius: 20, marginBottom: 20, shadowColor: theme.primary, shadowOpacity: 0.08, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 5, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center' },
    iconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', marginRight: 20, borderWidth: 1.5, borderColor: theme.border, shadowColor: theme.primary, shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
    contentContainer: { flex: 1 },
    label: { fontSize: 15, color: theme.textSecondary, marginBottom: 6, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    value: { fontSize: 32, fontWeight: '900', color: theme.text, letterSpacing: 0.5 },
    miniGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 8 },
    miniCard: { width: '48.5%', backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border, padding: 16, marginBottom: 12 },
    miniLabel: { color: theme.textSecondary, fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
    miniValue: { color: theme.text, fontSize: 22, fontWeight: '900', marginTop: 6 },
    sectionCard: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 20, padding: 18, marginBottom: 18 },
    sectionTitle: { color: theme.text, fontWeight: '800', fontSize: 16, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
    chartRow: { flexDirection: 'row', alignItems: 'flex-end', minHeight: 180 },
    barWrap: { width: 48, alignItems: 'center', marginRight: 8 },
    bar: { width: 24, borderTopLeftRadius: 6, borderTopRightRadius: 6, minHeight: 4 },
    barLabel: { color: theme.textSecondary, fontSize: 10, marginTop: 6, textAlign: 'center' },
    valueLabel: { color: theme.text, fontSize: 10, marginBottom: 6, fontWeight: '700' },
    serviceRow: { marginBottom: 12 },
    serviceHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    serviceName: { color: theme.text, fontWeight: '700' },
    serviceMeta: { color: theme.textSecondary, fontWeight: '700', fontSize: 12 },
    serviceBarTrack: { width: '100%', height: 10, borderRadius: 8, backgroundColor: theme.background, overflow: 'hidden' },
    serviceBarFill: { height: 10, borderRadius: 8, backgroundColor: theme.primary },
    dropdownButton: { borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.background, marginBottom: 12 },
    dropdownText: { color: theme.text, fontWeight: '700' },
    dropdownList: { borderWidth: 1, borderColor: theme.border, borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
    dropdownItem: { paddingVertical: 10, paddingHorizontal: 12, backgroundColor: theme.background },
    dropdownItemActive: { backgroundColor: theme.surface, borderLeftWidth: 3, borderLeftColor: theme.primary },
    dropdownItemText: { color: theme.text, fontWeight: '600' },
  });

  if (loading) return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" color={theme.primary} /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{t('adminAnalytics')}</Text>

      <View style={styles.miniGrid}>
        <View style={styles.miniCard}>
          <Text style={styles.miniLabel}>{t('totalRevenue')}</Text>
          <Text style={styles.miniValue}>{formatIQD(stats.totalRevenue)}</Text>
        </View>
        <View style={styles.miniCard}>
          <Text style={styles.miniLabel}>{t('averageTicket')}</Text>
          <Text style={styles.miniValue}>{formatIQD(stats.averageTicket)}</Text>
        </View>
        <View style={styles.miniCard}>
          <Text style={styles.miniLabel}>{t('allTimeCustomers')}</Text>
          <Text style={styles.miniValue}>{stats.totalCustomersAllTime}</Text>
        </View>
        <View style={styles.miniCard}>
          <Text style={styles.miniLabel}>{t('dailyAverageThisMonth')}</Text>
          <Text style={styles.miniValue}>{formatIQD(stats.dailyAverageThisMonth)}</Text>
        </View>
      </View>
      
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="cash-multiple" size={32} color={theme.success} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.label}>{t('totalRevenueToday')}</Text>
          <Text style={styles.value}>{formatIQD(stats.today)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="calendar-week" size={32} color={theme.primary} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.label}>{t('weeklyRevenue')}</Text>
          <Text style={styles.value}>{formatIQD(stats.weekly)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="calendar-month" size={32} color={theme.primary} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.label}>{t('monthlyRevenue')}</Text>
          <Text style={styles.value}>{formatIQD(stats.monthly)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="account-group" size={32} color={theme.warning} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.label}>{t('totalCustomersToday')}</Text>
          <Text style={styles.value}>{stats.totalCustomersToday}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="star-circle" size={32} color={theme.warning} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.label}>{t('mostPopularService')}</Text>
          <Text style={[styles.value, { fontSize: 22 }]}>{stats.popularService === 'None' ? t('none') : formatService(stats.popularService)}</Text>
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
                  <View style={[styles.bar, { height, backgroundColor: theme.primary }]} />
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
                  <View style={[styles.bar, { width: 22, height, backgroundColor: theme.warning }]} />
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
                <View style={[styles.serviceBarFill, { width: `${widthPercent}%` as `${number}%` }]} />
              </View>
            </View>
          );
        })}
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};
