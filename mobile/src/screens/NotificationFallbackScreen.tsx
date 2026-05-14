// Task: M06 | Path: mobile/src/screens/NotificationFallbackScreen.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function NotificationFallbackScreen({ navigation }: { navigation: any }) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>{'\u{1F517}'}</Text>
        <Text style={styles.title}>Content Unavailable</Text>
        <Text style={styles.message}>
          The activity or content linked to this notification is no longer available.
          It may have been deleted or is no longer accessible.
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('NotificationList')}
        >
          <Text style={styles.primaryButtonText}>Back to Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() =>
            navigation.reset({ index: 0, routes: [{ name: 'ActivityFeed' }] })
          }
        >
          <Text style={styles.secondaryButtonText}>Go to Activity Feed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'space-between' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  icon: { fontSize: 56, marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 12 },
  message: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22 },
  footer: { padding: 20, paddingBottom: 36 },
  primaryButton: {
    backgroundColor: '#4A90D9',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryButton: { alignItems: 'center', paddingVertical: 10 },
  secondaryButtonText: { color: '#4A90D9', fontSize: 14 },
});
