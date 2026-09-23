import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { AB } from '../../src/components/ExploreUI';
import { useAuth } from '../../src/auth';

export default function TabsLayout() {
  const { user } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: AB.red,
        tabBarInactiveTintColor: '#B0B0B0',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
        tabBarIconStyle: { marginTop: 4 },
        tabBarStyle: {
          backgroundColor: AB.white,
          borderTopColor: AB.line,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'heart' : 'heart-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <View style={[tabStyles.avatarRing, focused && tabStyles.avatarRingOn]}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={tabStyles.avatar} />
              ) : (
                <View style={[tabStyles.avatar, tabStyles.avatarFallback]}>
                  <Ionicons name="person" size={14} color={focused ? AB.red : '#717171'} />
                </View>
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const tabStyles = StyleSheet.create({
  avatarRing: {
    width: 26, height: 26, borderRadius: 13, padding: 1.5,
    borderWidth: 1.5, borderColor: 'transparent',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarRingOn: { borderColor: AB.red },
  avatar: { width: 22, height: 22, borderRadius: 11 },
  avatarFallback: {
    backgroundColor: '#F2F2F2', alignItems: 'center', justifyContent: 'center',
  },
});
