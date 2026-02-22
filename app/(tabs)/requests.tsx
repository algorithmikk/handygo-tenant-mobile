import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, RefreshControl, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Search, Filter, ClipboardList } from 'lucide-react-native';
import { requestService } from '@/src/services/requestService';
import { getCategoryInfo, STATUS_COLORS, PRIORITY_COLORS } from '@/src/lib/mockData';
import { Colors } from '@/constants/Colors';
import type { MaintenanceRequest, RequestStatus } from '@/src/types';

const FILTERS: { key: RequestStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'pending', label: 'Pending' },
  { key: 'assigned', label: 'Assigned' }, { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

export default function RequestsScreen() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [filter, setFilter] = useState<RequestStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { const data = await requestService.getRequests(); setRequests(data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false); }, []);

  const filtered = requests.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (search && !r.description.toLowerCase().includes(search.toLowerCase()) && !r.category.includes(search.toLowerCase())) return false;
    return true;
  });

  const timeAgo = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  if (loading) {
    return <SafeAreaView style={s.container}><View style={s.center}><ActivityIndicator size="large" color={Colors.primary[500]} /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.titleRow}><Text style={s.title}>{t('requests.title')}</Text></View>
      <View style={s.searchRow}>
        <Search size={18} color={Colors.gray[400]} />
        <TextInput style={s.searchInput} placeholder={t('requests.search')} placeholderTextColor={Colors.gray[500]}
          value={search} onChangeText={setSearch} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f.key} style={[s.filterChip, filter === f.key && s.filterChipActive]} onPress={() => setFilter(f.key)}>
            <Text style={[s.filterText, filter === f.key && s.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView style={s.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[400]} />}>
        {filtered.length === 0 ? (
          <View style={s.emptyState}><ClipboardList size={40} color={Colors.gray[600]} /><Text style={s.emptyText}>{t('requests.noRequests')}</Text></View>
        ) : (
          filtered.map(req => {
            const cat = getCategoryInfo(req.category);
            return (
              <TouchableOpacity key={req.id} style={s.card} onPress={() => router.push(`/request/${req.id}`)}>
                <View style={s.cardTop}>
                  <Text style={s.catIcon}>{cat?.icon}</Text>
                  <View style={s.cardInfo}>
                    <Text style={s.cardTitle} numberOfLines={1}>{req.description}</Text>
                    <Text style={s.cardSub}>{cat?.label} · {timeAgo(req.createdAt)}</Text>
                  </View>
                </View>
                <View style={s.cardBottom}>
                  <View style={[s.badge, { backgroundColor: (STATUS_COLORS[req.status] || '#666') + '20' }]}>
                    <Text style={[s.badgeText, { color: STATUS_COLORS[req.status] || '#666' }]}>{req.status.replace('_', ' ')}</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: (PRIORITY_COLORS[req.priority] || '#666') + '20' }]}>
                    <Text style={[s.badgeText, { color: PRIORITY_COLORS[req.priority] || '#666' }]}>{req.priority}</Text>
                  </View>
                  {req.assignedHandymanName && <Text style={s.handymanText}>{req.assignedHandymanName}</Text>}
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.slate[900] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  titleRow: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.white },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, backgroundColor: Colors.slate[800], borderRadius: 12, borderWidth: 1, borderColor: Colors.gray[700], paddingHorizontal: 14, height: 44, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.white },
  filterRow: { maxHeight: 44, marginBottom: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.slate[800], borderWidth: 1, borderColor: Colors.gray[700] },
  filterChipActive: { backgroundColor: Colors.primary[500], borderColor: Colors.primary[500] },
  filterText: { fontSize: 13, color: Colors.gray[400], fontWeight: '500' },
  filterTextActive: { color: Colors.white },
  list: { flex: 1, paddingHorizontal: 16 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: Colors.gray[500] },
  card: { backgroundColor: Colors.slate[800], borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.gray[700] },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  catIcon: { fontSize: 24 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: Colors.white },
  cardSub: { fontSize: 12, color: Colors.gray[400], marginTop: 2 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  handymanText: { fontSize: 12, color: Colors.gray[400], marginLeft: 'auto' },
});

