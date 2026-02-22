import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Home, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/src/context/AuthContext';
import { Colors } from '@/constants/Colors';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    setError('');
    try {
      await login({ email, password });
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Home size={32} color={Colors.white} />
            </View>
            <Text style={styles.logoTitle}>{t('auth.welcomeTitle')}</Text>
            <Text style={styles.logoSubtitle}>{t('auth.welcomeSubtitle')}</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.formTitle}>{t('auth.login')}</Text>

            {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

            <View style={styles.inputRow}>
              <Mail size={18} color={Colors.gray[400]} />
              <TextInput style={styles.input} placeholder={t('auth.email')} placeholderTextColor={Colors.gray[500]}
                value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>

            <View style={styles.inputRow}>
              <Lock size={18} color={Colors.gray[400]} />
              <TextInput style={styles.input} placeholder={t('auth.password')} placeholderTextColor={Colors.gray[500]}
                value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} color={Colors.gray[400]} /> : <Eye size={18} color={Colors.gray[400]} />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.loginBtn, loading && styles.loginBtnDisabled]} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.loginBtnText}>{t('auth.login')}</Text>}
            </TouchableOpacity>

            <View style={styles.demoHint}>
              <Text style={styles.demoText}>{t('auth.demoHint')}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.slate[900] },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoIcon: { width: 72, height: 72, borderRadius: 20, backgroundColor: Colors.primary[500], alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoTitle: { fontSize: 32, fontWeight: 'bold', color: Colors.white },
  logoSubtitle: { fontSize: 15, color: Colors.gray[400], marginTop: 6 },
  form: { gap: 14 },
  formTitle: { fontSize: 22, fontWeight: '700', color: Colors.white, marginBottom: 4 },
  errorBox: { backgroundColor: Colors.red[500] + '20', borderRadius: 10, padding: 12 },
  errorText: { color: Colors.red[400], fontSize: 13 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.slate[800], borderRadius: 14, borderWidth: 1, borderColor: Colors.gray[700], paddingHorizontal: 16, height: 52 },
  input: { flex: 1, fontSize: 15, color: Colors.white },
  loginBtn: { backgroundColor: Colors.primary[500], borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  demoHint: { alignItems: 'center', marginTop: 16, paddingVertical: 10, backgroundColor: Colors.primary[500] + '10', borderRadius: 10, borderWidth: 1, borderColor: Colors.primary[500] + '20' },
  demoText: { fontSize: 12, color: Colors.primary[400] },
});

