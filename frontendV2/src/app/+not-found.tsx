import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { FileX } from "lucide-react";

import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <ThemedView style={styles.container}>
        <FileX size={100} color="black" />
        <ThemedText type="wording">Oops! 404 :(</ThemedText>
        <ThemedText type="wording" style={{ fontSize:25 }}>This page doesn't exist.</ThemedText>
        <Link href="/" style={styles.link}>
          <ThemedText type="link">Go to home screen!</ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
