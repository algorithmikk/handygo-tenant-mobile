import React from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Home, ClipboardList, PlusCircle, User } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary[400],
        tabBarInactiveTintColor: Colors.gray[500],
        tabBarStyle: {
          backgroundColor: Colors.slate[900],
          borderTopColor: Colors.gray[700],
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}>
      <Tabs.Screen name="index" options={{
        title: t('dashboard.title'),
        tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
      }} />
      <Tabs.Screen name="requests" options={{
        title: t('requests.title'),
        tabBarIcon: ({ color, size }) => <ClipboardList size={size} color={color} />,
      }} />
      <Tabs.Screen name="new-request" options={{
        title: t('dashboard.newRequest'),
        tabBarIcon: ({ color, size }) => <PlusCircle size={size} color={color} />,
      }} />
      <Tabs.Screen name="profile" options={{
        title: t('profile.title'),
        tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
      }} />
    </Tabs>
  );
}
