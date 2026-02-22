import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Star, Send } from 'lucide-react-native';
import { requestService } from '@/src/services/requestService';
import { reviewService } from '@/src/services/reviewService';
import { Colors } from '@/constants/Colors';
import type { MaintenanceRequest } from '@/src/types';

export default function ReviewScreen() {
  const { t } = useTranslation();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const [request, setRequest] = useState<MaintenanceRequest | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const data = await requestService.getRequest(requestId!); setRequest(data); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [requestId]);

  const handleSubmit = async () => {
    if (rating === 0) { Alert.alert('Error', 'Please select a rating'); return; }
    if (!request?.assignedHandymanId) return;
    setSubmitting(true);
    try {
      await reviewService.createReview({
        requestId: request.id,
        handymanId: request.assignedHandymanId,
        rating,
        comment,
      });
      Alert.alert('✅', t('review.thanks'), [{ text: 'OK', onPress: () => router.back() }]);
    } catch { Alert.alert('Error', 'Failed to submit review'); }
    finally { setSubmitting(false); }
  };

  if (loading) {
    return <SafeAreaView style={s.container}><View style={s.center}><ActivityIndicator size="large" color={Colors.primary[500]} /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><ArrowLeft size={22} color={Colors.white} /></TouchableOpacity>
        <Text style={s.headerTitle}>{t('review.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.content}>
        {/* Handyman Info */}
        {request?.assignedHandymanName && (
          <View style={s.handymanSection}>
            <View style={s.avatar}><Text style={s.avatarText}>{request.assignedHandymanName[0]}</Text></View>
            <Text style={s.handymanName}>{request.assignedHandymanName}</Text>
            <Text style={s.handymanSub}>{request.category} service</Text>
          </View>
        )}

        {/* Star Rating */}
        <Text style={s.label}>{t('review.rateHandyman')}</Text>
        <View style={s.starsRow}>
          {[1, 2, 3, 4, 5].map(i => (
            <TouchableOpacity key={i} onPress={() => setRating(i)}>
              <Star size={40} color={i <= rating ? Colors.amber[400] : Colors.gray[700]}
                fill={i <= rating ? Colors.amber[400] : 'transparent'} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Comment */}
        <Text style={s.label}>{t('review.addComment')}</Text>
        <TextInput style={s.textArea} placeholder={t('review.commentPlaceholder')} placeholderTextColor={Colors.gray[500]}
          value={comment} onChangeText={setComment} multiline numberOfLines={4} textAlignVertical="top" />

        {/* Submit */}
        <TouchableOpacity style={[s.submitBtn, (submitting || rating === 0) && { opacity: 0.5 }]} onPress={handleSubmit} disabled={submitting || rating === 0}>
          {submitting ? <ActivityIndicator color={Colors.white} /> : <><Send size={18} color={Colors.white} /><Text style={s.submitText}>{t('review.submit')}</Text></>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.slate[900] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.slate[800], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.white },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 12 },
  handymanSection: { alignItems: 'center', marginBottom: 28 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary[500], alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: Colors.white },
  handymanName: { fontSize: 20, fontWeight: '700', color: Colors.white },
  handymanSub: { fontSize: 14, color: Colors.gray[400], marginTop: 4, textTransform: 'capitalize' },
  label: { fontSize: 15, fontWeight: '600', color: Colors.gray[300], marginBottom: 12, marginTop: 8 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  textArea: { backgroundColor: Colors.slate[800], borderRadius: 14, borderWidth: 1, borderColor: Colors.gray[700], padding: 14, fontSize: 14, color: Colors.white, minHeight: 100, marginBottom: 20 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.primary[500], borderRadius: 14, height: 52 },
  submitText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});

