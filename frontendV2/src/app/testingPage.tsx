import React, { useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import ThemedBottomSheet from '@/components/ThemedBSheet';
import ThemedView from '@/components/ThemedView';
import ThemedCard from '@/components/ThemedCard';
import ThemedText from '@/components/ThemedText';

export default function testingPage() {
const [ref, setRef] = React.useState(false);

  return (
    <ThemedView style={styles.container}>
        <ThemedCard style={styles.contentContainer}>
            <ThemedText size='h2' font='textMedium' color="gray" style={{ marginBottom: 10 }}>
              Testing Page
            </ThemedText>
            <Button title="Open Sheet" onPress={() => setRef(true)} />
            <Button title="Close Sheet" onPress={() => setRef(false)} />
        </ThemedCard>
        
      <ThemedBottomSheet visible={ref} onDismiss={() => setRef(false)} height={500}>
        <ThemedText size='h3' font='textMedium' color="gray" style={{ marginBottom: 10 }}>
          Test
        </ThemedText>
      </ThemedBottomSheet>
    </ThemedView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  contentContainer: {
    marginTop: 20,
    flex: 1,
    alignItems: 'center',
  },
});