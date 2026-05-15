import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function PersonalActivityListPlaceholderScreen({ route }: { route: any }) {
  const activityId = route?.params?.activityId;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Temporary Placeholder</Text>
      <Text style={styles.body}>
        Personal activity history is not wired yet in the mobile app. This screen only exists so
        current navigation targets do not crash on a fresh scaffold.
      </Text>
      {activityId ? <Text style={styles.context}>Requested activity context: {activityId}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    color: '#222',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555',
  },
  context: {
    marginTop: 16,
    fontSize: 13,
    color: '#888',
  },
});
