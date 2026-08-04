import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Camera, ImagePlus, X, Send, MapPin } from 'lucide-react-native';
import { requestService } from '@/src/services/requestService';
import { SERVICE_CATEGORIES, PRIORITY_COLORS } from '@/src/lib/mockData';
import { Colors } from '@/constants/Colors';
import type { ServiceCategory, RequestPriority } from '@/src/types';

const PRIORITIES: { key: RequestPriority; labelKey: string }[] = [
  { key: 'low', labelKey: 'priority.low' },
  { key: 'medium', labelKey: 'priority.medium' },
  { key: 'high', labelKey: 'priority.high' },
  { key: 'urgent', labelKey: 'priority.urgent' },
];

export default function NewRequestScreen() {
  const { t } = useTranslation();
  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<RequestPriority>('medium');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState('');
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'ready' | 'denied'>('idle');

  useEffect(() => {
    void loadLocation();
  }, []);

  const loadLocation = async () => {
    setLocationStatus('loading');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('denied');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      const places = await Location.reverseGeocodeAsync(pos.coords);
      if (places[0]) {
        const p = places[0];
        setAddress([p.name, p.street, p.city, p.region].filter(Boolean).join(', '));
      }
      setLocationStatus('ready');
    } catch {
      setLocationStatus('denied');
    }
  };

  const pickImage = async (useCamera: boolean) => {
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('newRequest.permissionRequired'), t('newRequest.cameraPermission'));
        return;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('newRequest.permissionRequired'), t('newRequest.libraryPermission'));
        return;
      }
    }
    const fn = useCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const result = await fn({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled && result.assets[0]) setImages((prev) => [...prev, result.assets[0].uri]);
  };

  const removeImage = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!category) {
      Alert.alert(t('common.error'), t('newRequest.selectCategory'));
      return;
    }
    if (!description.trim()) {
      Alert.alert(t('common.error'), t('newRequest.describe'));
      return;
    }
    setSubmitting(true);
    try {
      const uploaded = images.length ? await requestService.uploadPhotos(images) : [];
      await requestService.createRequest({
        category,
        description,
        priority,
        images: uploaded,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        address: address || undefined,
      });
      Alert.alert(t('common.success'), t('newRequest.success'), [
        { text: 'OK', onPress: () => router.push('/(tabs)/requests') },
      ]);
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('newRequest.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>{t('newRequest.title')}</Text>

        <Text style={s.label}>{t('newRequest.selectCategory')}</Text>
        <View style={s.catGrid}>
          {SERVICE_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                s.catCard,
                category === cat.key && { borderColor: cat.color, backgroundColor: cat.color + '15' },
              ]}
              onPress={() => setCategory(cat.key)}
              accessibilityRole="button"
              accessibilityLabel={cat.label}
            >
              <Text style={s.catIcon}>{cat.icon}</Text>
              <Text style={[s.catLabel, category === cat.key && { color: cat.color }]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>{t('newRequest.describe')}</Text>
        <TextInput
          style={s.textArea}
          placeholder={t('newRequest.descriptionPlaceholder')}
          placeholderTextColor={Colors.gray[500]}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={s.label}>{t('newRequest.selectPriority')}</Text>
        <View style={s.priorityRow}>
          {PRIORITIES.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[
                s.priorityChip,
                priority === p.key && {
                  borderColor: PRIORITY_COLORS[p.key],
                  backgroundColor: PRIORITY_COLORS[p.key] + '20',
                },
              ]}
              onPress={() => setPriority(p.key)}
            >
              <View style={[s.priorityDot, { backgroundColor: PRIORITY_COLORS[p.key] }]} />
              <Text style={[s.priorityText, priority === p.key && { color: PRIORITY_COLORS[p.key] }]}>
                {t(p.labelKey, { defaultValue: p.key })}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>{t('newRequest.location', { defaultValue: 'Location' })}</Text>
        <View style={s.locationCard}>
          <MapPin size={18} color={Colors.primary[400]} />
          <View style={{ flex: 1 }}>
            {locationStatus === 'loading' && (
              <Text style={s.locationText}>{t('newRequest.locating', { defaultValue: 'Getting your location…' })}</Text>
            )}
            {locationStatus === 'denied' && (
              <TouchableOpacity onPress={loadLocation}>
                <Text style={s.locationText}>
                  {t('newRequest.locationDenied', { defaultValue: 'Location unavailable. Tap to retry.' })}
                </Text>
              </TouchableOpacity>
            )}
            {locationStatus === 'ready' && (
              <Text style={s.locationText}>
                {address || `${coords?.latitude.toFixed(5)}, ${coords?.longitude.toFixed(5)}`}
              </Text>
            )}
          </View>
        </View>

        <Text style={s.label}>{t('newRequest.addPhotos')}</Text>
        <Text style={s.hint}>
          {t('newRequest.photosHint', { defaultValue: 'Photos upload securely when you submit.' })}
        </Text>
        <View style={s.photoRow}>
          <TouchableOpacity style={s.photoBtn} onPress={() => pickImage(true)} accessibilityRole="button">
            <Camera size={20} color={Colors.gray[400]} />
            <Text style={s.photoBtnText}>{t('newRequest.takePhoto')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.photoBtn} onPress={() => pickImage(false)} accessibilityRole="button">
            <ImagePlus size={20} color={Colors.gray[400]} />
            <Text style={s.photoBtnText}>{t('newRequest.chooseFromLibrary')}</Text>
          </TouchableOpacity>
        </View>
        {images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.imgRow}>
            {images.map((uri, i) => (
              <View key={i} style={s.imgWrap}>
                <Image source={{ uri }} style={s.imgThumb} />
                <TouchableOpacity style={s.imgRemove} onPress={() => removeImage(i)}>
                  <X size={14} color={Colors.white} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity
          style={[s.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting}
          accessibilityRole="button"
        >
          {submitting ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Send size={18} color={Colors.white} />
              <Text style={s.submitText}>{t('newRequest.submit')}</Text>
            </>
          )}
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
  hint: { fontSize: 12, color: Colors.gray[500], marginBottom: 8, marginTop: -4 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catCard: {
    width: '30%',
    backgroundColor: Colors.slate[800],
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.gray[700],
  },
  catIcon: { fontSize: 26 },
  catLabel: { fontSize: 11, color: Colors.gray[400], fontWeight: '500', textAlign: 'center' },
  textArea: {
    backgroundColor: Colors.slate[800],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.gray[700],
    padding: 14,
    fontSize: 14,
    color: Colors.white,
    minHeight: 100,
  },
  priorityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  priorityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.slate[800],
    borderWidth: 1.5,
    borderColor: Colors.gray[700],
  },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  priorityText: { fontSize: 13, color: Colors.gray[400], fontWeight: '500' },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.slate[800],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.gray[700],
    padding: 14,
  },
  locationText: { fontSize: 13, color: Colors.gray[300] },
  photoRow: { flexDirection: 'row', gap: 10 },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.slate[800],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray[700],
    borderStyle: 'dashed',
    paddingVertical: 16,
  },
  photoBtnText: { fontSize: 12, color: Colors.gray[400] },
  imgRow: { marginTop: 12 },
  imgWrap: { marginRight: 10, position: 'relative' },
  imgThumb: { width: 80, height: 80, borderRadius: 10 },
  imgRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.red[500],
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary[500],
    borderRadius: 14,
    height: 56,
    marginTop: 24,
  },
  submitText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});
