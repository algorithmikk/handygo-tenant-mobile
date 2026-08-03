import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Home, Mail, Lock, User, Phone } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { api } from '@/src/lib/api';
import * as SecureStore from 'expo-secure-store';

const WEB_SIGNUP_URL = 'https://handygo.vercel.app/signup/tenant';

export default function SignupScreen() {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [emiratesId, setEmiratesId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!firstName || !lastName || !email || !phoneNumber || !password || !inviteCode) {
      setError(t('auth.signupRequired'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const raw = await api.post<any>('/auth/register', {
        role: 'TENANT',
        firstName,
        lastName,
        email: email.trim().toLowerCase(),
        phoneNumber,
        password,
        inviteCode: inviteCode.trim().toUpperCase(),
        unitNumber,
        buildingName,
        emiratesId: emiratesId || undefined,
        city: 'Dubai',
        emirate: 'Dubai',
      });
      if (!raw?.token) {
        throw new Error(raw?.error || t('auth.signupError'));
      }
      const userData = raw.user || raw;
      await SecureStore.setItemAsync('token', raw.token);
      await SecureStore.setItemAsync(
        'user',
        JSON.stringify({
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phoneNumber || phoneNumber,
          role: 'TENANT',
          createdAt: userData.createdAt,
        }),
      );
      router.replace('/(tabs)');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('auth.signupError'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWebSignup = async () => {
    await Linking.openURL(WEB_SIGNUP_URL);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Home size={32} color={Colors.white} />
            </View>
            <Text style={styles.logoTitle}>{t('auth.signupTitle')}</Text>
            <Text style={styles.logoSubtitle}>{t('auth.signupSubtitle')}</Text>
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputRow}>
              <User size={18} color={Colors.gray[400]} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.firstName')}
                placeholderTextColor={Colors.gray[500]}
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View style={styles.inputRow}>
              <User size={18} color={Colors.gray[400]} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.lastName')}
                placeholderTextColor={Colors.gray[500]}
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
            <View style={styles.inputRow}>
              <Mail size={18} color={Colors.gray[400]} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.email')}
                placeholderTextColor={Colors.gray[500]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputRow}>
              <Phone size={18} color={Colors.gray[400]} />
              <TextInput
                style={styles.input}
                placeholder="+971 5X XXX XXXX"
                placeholderTextColor={Colors.gray[500]}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.inputRow}>
              <Lock size={18} color={Colors.gray[400]} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.password')}
                placeholderTextColor={Colors.gray[500]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder={t('auth.inviteCode')}
                placeholderTextColor={Colors.gray[500]}
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
              />
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder={t('auth.buildingName')}
                placeholderTextColor={Colors.gray[500]}
                value={buildingName}
                onChangeText={setBuildingName}
              />
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder={t('auth.unitNumber')}
                placeholderTextColor={Colors.gray[500]}
                value={unitNumber}
                onChangeText={setUnitNumber}
              />
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder={t('auth.emiratesId')}
                placeholderTextColor={Colors.gray[500]}
                value={emiratesId}
                onChangeText={setEmiratesId}
              />
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleSignup}
              disabled={loading}
              accessibilityLabel={t('auth.signup')}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.loginBtnText}>{t('auth.signup')}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleOpenWebSignup} style={styles.webLink}>
              <Text style={styles.webLinkText}>{t('auth.signupOnWeb')}</Text>
            </TouchableOpacity>

            <View style={styles.demoHint}>
              <Text style={styles.demoText}>{t('auth.hasAccount')} </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.linkText}>{t('auth.login')}</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.slate[900] },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 24 },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.amber[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoTitle: { fontSize: 24, fontWeight: '700', color: Colors.white },
  logoSubtitle: { marginTop: 4, color: Colors.gray[400], textAlign: 'center' },
  form: { gap: 12 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.slate[700],
    backgroundColor: Colors.slate[800],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  input: { flex: 1, color: Colors.white, fontSize: 15 },
  loginBtn: {
    marginTop: 8,
    backgroundColor: Colors.amber[500],
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: Colors.gray[950], fontWeight: '700', fontSize: 16 },
  errorBox: {
    backgroundColor: 'rgba(244,63,94,0.15)',
    borderRadius: 8,
    padding: 10,
  },
  errorText: { color: '#fb7185', fontSize: 13 },
  demoHint: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  demoText: { color: Colors.gray[500], fontSize: 13 },
  linkText: { color: Colors.amber[400], fontSize: 13, fontWeight: '600' },
  webLink: { alignItems: 'center', marginTop: 4 },
  webLinkText: { color: Colors.blue[400], fontSize: 13 },
});
