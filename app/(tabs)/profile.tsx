import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User as UserIcon, Mail, Phone, MapPin, Building2, Bell, Globe, HelpCircle, LogOut, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/src/context/AuthContext';
import { Colors } from '@/constants/Colors';
import i18n from '@/src/lib/i18n';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, tenant, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [isArabic, setIsArabic] = useState(i18n.language === 'ar');

  const toggleLanguage = async () => {
    const newLang = isArabic ? 'en' : 'ar';
    await i18n.changeLanguage(newLang);
    await AsyncStorage.setItem('language', newLang);
    setIsArabic(!isArabic);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView style={s.scroll}>
        <Text style={s.title}>{t('profile.title')}</Text>

        {/* Avatar */}
        <View style={s.avatarSection}>
          <View style={s.avatar}><Text style={s.avatarText}>{user?.firstName?.[0]}{user?.lastName?.[0]}</Text></View>
          <Text style={s.name}>{user?.firstName} {user?.lastName}</Text>
          <Text style={s.email}>{user?.email}</Text>
        </View>

        {/* Personal Info */}
        <Text style={s.sectionTitle}>{t('profile.personalInfo')}</Text>
        <View style={s.card}>
          <InfoRow icon={<Mail size={18} color={Colors.gray[400]} />} label={t('profile.email')} value={user?.email || ''} />
          <InfoRow icon={<Phone size={18} color={Colors.gray[400]} />} label={t('profile.phone')} value={user?.phone || ''} />
          <InfoRow icon={<MapPin size={18} color={Colors.gray[400]} />} label={t('profile.property')} value={tenant?.propertyAddress || ''} />
          {tenant?.unit && <InfoRow icon={<Building2 size={18} color={Colors.gray[400]} />} label={t('profile.unit')} value={tenant.unit} />}
        </View>

        {/* Settings */}
        <Text style={s.sectionTitle}>{t('profile.settings')}</Text>
        <View style={s.card}>
          <View style={s.settingRow}>
            <View style={s.settingLeft}><Bell size={18} color={Colors.gray[400]} /><Text style={s.settingLabel}>{t('profile.notifications')}</Text></View>
            <Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: Colors.gray[700], true: Colors.primary[500] + '60' }} thumbColor={notifications ? Colors.primary[400] : Colors.gray[500]} />
          </View>
          <View style={s.divider} />
          <TouchableOpacity style={s.settingRow} onPress={toggleLanguage}>
            <View style={s.settingLeft}><Globe size={18} color={Colors.gray[400]} /><Text style={s.settingLabel}>{t('profile.language')}</Text></View>
            <Text style={s.settingValue}>{isArabic ? 'العربية' : 'English'}</Text>
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity style={s.settingRow}>
            <View style={s.settingLeft}><HelpCircle size={18} color={Colors.gray[400]} /><Text style={s.settingLabel}>{t('profile.support')}</Text></View>
            <ChevronRight size={18} color={Colors.gray[600]} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <LogOut size={18} color={Colors.red[400]} />
          <Text style={s.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>

        <Text style={s.version}>{t('profile.version')} 1.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      {icon}
      <View style={s.infoText}><Text style={s.infoLabel}>{label}</Text><Text style={s.infoValue}>{value}</Text></View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.slate[900] },
  scroll: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.white, paddingTop: 16, marginBottom: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primary[500], alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 26, fontWeight: 'bold', color: Colors.white },
  name: { fontSize: 20, fontWeight: '700', color: Colors.white },
  email: { fontSize: 14, color: Colors.gray[400], marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: Colors.gray[300], marginBottom: 10, marginTop: 8 },
  card: { backgroundColor: Colors.slate[800], borderRadius: 14, borderWidth: 1, borderColor: Colors.gray[700], padding: 4, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 12, color: Colors.gray[500], marginBottom: 2 },
  infoValue: { fontSize: 14, color: Colors.white, fontWeight: '500' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontSize: 14, color: Colors.white },
  settingValue: { fontSize: 13, color: Colors.gray[400] },
  divider: { height: 1, backgroundColor: Colors.gray[700], marginHorizontal: 14 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 16, paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.red[500] + '15', borderWidth: 1, borderColor: Colors.red[500] + '30' },
  logoutText: { fontSize: 15, fontWeight: '600', color: Colors.red[400] },
  version: { textAlign: 'center', fontSize: 12, color: Colors.gray[600], marginTop: 20 },
});

