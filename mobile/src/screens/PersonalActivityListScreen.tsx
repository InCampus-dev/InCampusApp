import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PersonalActivityListScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Activities</Text>
      <Text style={styles.placeholder}>
        Personal activity list coming soon — upcoming and past activities will appear here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  placeholder: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22 },
});
