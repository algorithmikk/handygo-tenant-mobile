import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Phone, Star, MapPin, Clock, User, AlertTriangle, XCircle } from 'lucide-react-native';
import { requestService } from '@/src/services/requestService';
import { getCategoryInfo, STATUS_COLORS, PRIORITY_COLORS } from '@/src/lib/mockData';
import { Colors } from '@/constants/Colors';
import type { MaintenanceRequest } from '@/src/types';

export default function RequestDetailScreen() {
  const { t } = useTranslation();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const [request, setRequest] = useState<MaintenanceRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const data = await requestService.getRequest(requestId!); setRequest(data); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [requestId]);

  if (loading || !request) {
    return <SafeAreaView style={s.container}><View style={s.center}><ActivityIndicator size="large" color={Colors.primary[500]} /></View></SafeAreaView>;
  }

  const cat = getCategoryInfo(request.category);
  const canCancel = ['pending', 'assigned'].includes(request.status);
  const canRate = request.status === 'completed' && request.assignedHandymanId;

  const handleCancel = async () => {
    await requestService.cancelRequest(request.id);
    setRequest({ ...request, status: 'cancelled' });
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <SafeAreaView style={s.container}>
      <View style={s.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><ArrowLeft size={22} color={Colors.white} /></TouchableOpacity>
        <Text style={s.headerTitle}>{t('requests.requestDetails')}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={s.scroll}>
        {/* Status & Category */}
        <View style={s.topRow}>
          <Text style={s.catIconBig}>{cat?.icon}</Text>
          <View style={s.topInfo}>
            <Text style={s.catName}>{cat?.label}</Text>
            <View style={s.badges}>
              <View style={[s.badge, { backgroundColor: (STATUS_COLORS[request.status] || '#666') + '20' }]}>
                <Text style={[s.badgeText, { color: STATUS_COLORS[request.status] }]}>{request.status.replace('_', ' ')}</Text>
              </View>
              <View style={[s.badge, { backgroundColor: (PRIORITY_COLORS[request.priority] || '#666') + '20' }]}>
                <Text style={[s.badgeText, { color: PRIORITY_COLORS[request.priority] }]}>{request.priority}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={s.card}>
          <Text style={s.cardLabel}>{t('requests.description')}</Text>
          <Text style={s.descText}>{request.description}</Text>
        </View>

        {/* Details */}
        <View style={s.card}>
          <DetailRow icon={<MapPin size={16} color={Colors.gray[400]} />} label={t('requests.address')} value={request.propertyAddress} />
          <DetailRow icon={<Clock size={16} color={Colors.gray[400]} />} label={t('requests.createdAt')} value={formatDate(request.createdAt)} />
          {request.estimatedCost != null && (
            <DetailRow icon={<AlertTriangle size={16} color={Colors.amber[400]} />} label={t('requests.estimatedCost')} value={`AED ${request.estimatedCost}`} />
          )}
        </View>

        {/* Assigned Handyman */}
        {request.assignedHandymanName && (
          <View style={s.card}>
            <Text style={s.cardLabel}>{t('requests.assignedTo')}</Text>
            <View style={s.handymanRow}>
              <View style={s.handymanAvatar}><User size={20} color={Colors.white} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.handymanName}>{request.assignedHandymanName}</Text>
                {request.handymanPhone && <Text style={s.handymanPhone}>{request.handymanPhone}</Text>}
              </View>
              {request.handymanPhone && (
                <TouchableOpacity style={s.callBtn} onPress={() => Linking.openURL(`tel:${request.handymanPhone}`)}>
                  <Phone size={16} color={Colors.white} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={s.actions}>
          {canRate && (
            <TouchableOpacity style={s.rateBtn} onPress={() => router.push(`/review/${request.id}`)}>
              <Star size={18} color={Colors.white} /><Text style={s.rateBtnText}>{t('requests.rateService')}</Text>
            </TouchableOpacity>
          )}
          {canCancel && (
            <TouchableOpacity style={s.cancelBtn} onPress={handleCancel}>
              <XCircle size={18} color={Colors.red[400]} /><Text style={s.cancelBtnText}>{t('requests.cancelRequest')}</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={s.detailRow}>{icon}<View style={{ flex: 1 }}><Text style={s.detailLabel}>{label}</Text><Text style={s.detailValue}>{value}</Text></View></View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.slate[900] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.slate[800], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.white },
  scroll: { flex: 1, paddingHorizontal: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  catIconBig: { fontSize: 40 },
  topInfo: { flex: 1 },
  catName: { fontSize: 20, fontWeight: '700', color: Colors.white, marginBottom: 6 },
  badges: { flexDirection: 'row', gap: 8 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  card: { backgroundColor: Colors.slate[800], borderRadius: 14, borderWidth: 1, borderColor: Colors.gray[700], padding: 16, marginBottom: 12 },
  cardLabel: { fontSize: 13, fontWeight: '600', color: Colors.gray[400], marginBottom: 8 },
  descText: { fontSize: 15, color: Colors.white, lineHeight: 22 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  detailLabel: { fontSize: 12, color: Colors.gray[500] },
  detailValue: { fontSize: 14, color: Colors.white, fontWeight: '500', marginTop: 2 },
  handymanRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  handymanAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary[500], alignItems: 'center', justifyContent: 'center' },
  handymanName: { fontSize: 15, fontWeight: '600', color: Colors.white },
  handymanPhone: { fontSize: 13, color: Colors.gray[400], marginTop: 2 },
  callBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primary[500], alignItems: 'center', justifyContent: 'center' },
  actions: { gap: 10, marginTop: 8 },
  rateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.amber[500], borderRadius: 14, height: 50 },
  rateBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 14, height: 50, borderWidth: 1, borderColor: Colors.red[500] + '40', backgroundColor: Colors.red[500] + '10' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: Colors.red[400] },
});

