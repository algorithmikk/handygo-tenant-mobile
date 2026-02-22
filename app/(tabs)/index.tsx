import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Home, ClipboardList, Clock, CheckCircle, CreditCard, PlusCircle } from 'lucide-react-native';
import { useAuth } from '@/src/context/AuthContext';
import { requestService } from '@/src/services/requestService';
import { getCategoryInfo, PRIORITY_COLORS, STATUS_COLORS } from '@/src/lib/mockData';
import { Colors } from '@/constants/Colors';
import type { MaintenanceRequest } from '@/src/types';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!authLoading && !isAuthenticated) router.replace('/(auth)/login'); }, [authLoading, isAuthenticated]);
  useEffect(() => { if (isAuthenticated) loadData(); }, [isAuthenticated]);

  const loadData = async () => {
    try { const data = await requestService.getRequests(); setRequests(data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false); }, []);

  if (authLoading || loading) {
    return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color={Colors.primary[500]} /></View></SafeAreaView>;
  }

  const active = requests.filter(r => ['pending', 'assigned', 'in_progress'].includes(r.status)).length;
  const completed = requests.filter(r => r.status === 'completed').length;
  const recent = requests.slice(0, 3);

  const timeAgo = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[400]} />}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoIcon}><Home size={22} color={Colors.white} /></View>
            <View>
              <Text style={styles.headerTitle}>HandyGo</Text>
              <Text style={styles.headerSubtitle}>{t('dashboard.welcome')}, {user?.firstName}</Text>
            </View>
          </View>
        </View>

        {/* Quick Action */}
        <TouchableOpacity style={styles.newRequestCard} onPress={() => router.push('/(tabs)/new-request')}>
          <PlusCircle size={24} color={Colors.white} />
          <View>
            <Text style={styles.newRequestTitle}>{t('dashboard.newRequest')}</Text>
            <Text style={styles.newRequestSub}>Report a maintenance issue</Text>
          </View>
        </TouchableOpacity>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <ClipboardList size={20} color={Colors.amber[400]} />
            <Text style={styles.statValue}>{active}</Text>
            <Text style={styles.statLabel}>{t('dashboard.activeRequests')}</Text>
          </View>
          <View style={styles.statCard}>
            <CheckCircle size={20} color={Colors.primary[400]} />
            <Text style={styles.statValue}>{completed}</Text>
            <Text style={styles.statLabel}>{t('dashboard.completedRequests')}</Text>
          </View>
        </View>

        {/* Recent Requests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('dashboard.recentRequests')}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/requests')}>
              <Text style={styles.viewAll}>{t('dashboard.viewAll')}</Text>
            </TouchableOpacity>
          </View>
          {recent.length === 0 ? (
            <Text style={styles.emptyText}>{t('dashboard.noRequests')}</Text>
          ) : (
            recent.map(req => {
              const cat = getCategoryInfo(req.category);
              return (
                <TouchableOpacity key={req.id} style={styles.requestCard} onPress={() => router.push(`/request/${req.id}`)}>
                  <View style={styles.requestLeft}>
                    <Text style={styles.catIcon}>{cat?.icon}</Text>
                    <View style={styles.requestInfo}>
                      <Text style={styles.requestTitle} numberOfLines={1}>{req.description}</Text>
                      <Text style={styles.requestSub}>{cat?.label} · {timeAgo(req.createdAt)}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[req.status] || '#666') + '20' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[req.status] || '#666' }]}>{req.status.replace('_', ' ')}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.slate[900] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary[500], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.white },
  headerSubtitle: { fontSize: 13, color: Colors.gray[400], marginTop: 2 },
  newRequestCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.primary[600], borderRadius: 16, padding: 18, marginBottom: 16 },
  newRequestTitle: { fontSize: 16, fontWeight: '700', color: Colors.white },
  newRequestSub: { fontSize: 12, color: Colors.primary[200], marginTop: 2 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: Colors.slate[800], borderRadius: 14, padding: 16, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: Colors.gray[700] },
  statValue: { fontSize: 28, fontWeight: 'bold', color: Colors.white },
  statLabel: { fontSize: 11, color: Colors.gray[400], textAlign: 'center' },
  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.white },
  viewAll: { fontSize: 13, color: Colors.primary[400], fontWeight: '600' },
  emptyText: { fontSize: 14, color: Colors.gray[500], textAlign: 'center', paddingVertical: 24 },
  requestCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.slate[800], borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.gray[700] },
  requestLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  catIcon: { fontSize: 24 },
  requestInfo: { flex: 1 },
  requestTitle: { fontSize: 14, fontWeight: '600', color: Colors.white },
  requestSub: { fontSize: 12, color: Colors.gray[400], marginTop: 3 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
});