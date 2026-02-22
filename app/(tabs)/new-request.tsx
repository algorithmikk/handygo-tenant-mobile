import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImagePlus, X, Send } from 'lucide-react-native';
import { requestService } from '@/src/services/requestService';
import { SERVICE_CATEGORIES, PRIORITY_COLORS } from '@/src/lib/mockData';
import { Colors } from '@/constants/Colors';
import type { ServiceCategory, RequestPriority } from '@/src/types';

const PRIORITIES: { key: RequestPriority; label: string }[] = [
  { key: 'low', label: 'Low' }, { key: 'medium', label: 'Medium' },
  { key: 'high', label: 'High' }, { key: 'urgent', label: 'Urgent' },
];

export default function NewRequestScreen() {
  const { t } = useTranslation();
  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<RequestPriority>('medium');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async (useCamera: boolean) => {
    const fn = useCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const result = await fn({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled && result.assets[0]) setImages(prev => [...prev, result.assets[0].uri]);
  };

  const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!category) { Alert.alert('Error', t('newRequest.selectCategory')); return; }
    if (!description.trim()) { Alert.alert('Error', t('newRequest.describe')); return; }
    setSubmitting(true);
    try {
      await requestService.createRequest({ category, description, priority, images });
      Alert.alert('✅', t('newRequest.success'), [{ text: 'OK', onPress: () => router.push('/(tabs)/requests') }]);
    } catch { Alert.alert('Error', t('newRequest.error')); }
    finally { setSubmitting(false); }
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>{t('newRequest.title')}</Text>

        {/* Category Picker */}
        <Text style={s.label}>{t('newRequest.selectCategory')}</Text>
        <View style={s.catGrid}>
          {SERVICE_CATEGORIES.map(cat => (
            <TouchableOpacity key={cat.key} style={[s.catCard, category === cat.key && { borderColor: cat.color, backgroundColor: cat.color + '15' }]}
              onPress={() => setCategory(cat.key)}>
              <Text style={s.catIcon}>{cat.icon}</Text>
              <Text style={[s.catLabel, category === cat.key && { color: cat.color }]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        <Text style={s.label}>{t('newRequest.describe')}</Text>
        <TextInput style={s.textArea} placeholder={t('newRequest.descriptionPlaceholder')} placeholderTextColor={Colors.gray[500]}
          value={description} onChangeText={setDescription} multiline numberOfLines={4} textAlignVertical="top" />

        {/* Priority */}
        <Text style={s.label}>{t('newRequest.selectPriority')}</Text>
        <View style={s.priorityRow}>
          {PRIORITIES.map(p => (
            <TouchableOpacity key={p.key} style={[s.priorityChip, priority === p.key && { borderColor: PRIORITY_COLORS[p.key], backgroundColor: PRIORITY_COLORS[p.key] + '20' }]}
              onPress={() => setPriority(p.key)}>
              <View style={[s.priorityDot, { backgroundColor: PRIORITY_COLORS[p.key] }]} />
              <Text style={[s.priorityText, priority === p.key && { color: PRIORITY_COLORS[p.key] }]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Photos */}
        <Text style={s.label}>{t('newRequest.addPhotos')}</Text>
        <View style={s.photoRow}>
          <TouchableOpacity style={s.photoBtn} onPress={() => pickImage(true)}>
            <Camera size={20} color={Colors.gray[400]} /><Text style={s.photoBtnText}>{t('newRequest.takePhoto')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.photoBtn} onPress={() => pickImage(false)}>
            <ImagePlus size={20} color={Colors.gray[400]} /><Text style={s.photoBtnText}>{t('newRequest.chooseFromLibrary')}</Text>
          </TouchableOpacity>
        </View>
        {images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.imgRow}>
            {images.map((uri, i) => (
              <View key={i} style={s.imgWrap}>
                <Image source={{ uri }} style={s.imgThumb} />
                <TouchableOpacity style={s.imgRemove} onPress={() => removeImage(i)}><X size={14} color={Colors.white} /></TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Submit */}
        <TouchableOpacity style={[s.submitBtn, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color={Colors.white} /> : <><Send size={18} color={Colors.white} /><Text style={s.submitText}>{t('newRequest.submit')}</Text></>}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.slate[900] },
  scroll: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.white, paddingTop: 16, marginBottom: 20 },
  label: { fontSize: 15, fontWeight: '600', color: Colors.gray[300], marginBottom: 10, marginTop: 16 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catCard: { width: '30%', backgroundColor: Colors.slate[800], borderRadius: 14, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: Colors.gray[700] },
  catIcon: { fontSize: 26 },
  catLabel: { fontSize: 11, color: Colors.gray[400], fontWeight: '500', textAlign: 'center' },
  textArea: { backgroundColor: Colors.slate[800], borderRadius: 14, borderWidth: 1, borderColor: Colors.gray[700], padding: 14, fontSize: 14, color: Colors.white, minHeight: 100 },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.slate[800], borderWidth: 1.5, borderColor: Colors.gray[700] },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  priorityText: { fontSize: 13, color: Colors.gray[400], fontWeight: '500' },
  photoRow: { flexDirection: 'row', gap: 10 },
  photoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.slate[800], borderRadius: 12, borderWidth: 1, borderColor: Colors.gray[700], borderStyle: 'dashed', paddingVertical: 14 },
  photoBtnText: { fontSize: 12, color: Colors.gray[400] },
  imgRow: { marginTop: 12 },
  imgWrap: { marginRight: 10, position: 'relative' },
  imgThumb: { width: 80, height: 80, borderRadius: 10 },
  imgRemove: { position: 'absolute', top: -6, right: -6, backgroundColor: Colors.red[500], borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.primary[500], borderRadius: 14, height: 52, marginTop: 24 },
  submitText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});

