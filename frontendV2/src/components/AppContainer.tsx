import React from 'react';
import { View, StyleSheet } from 'react-native';

const AppContainer = ({ children }) => (
  <View style={styles.outer}>
    <View style={styles.inner}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#f3f4f6', // light gray for letterbox
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  inner: {
    width: '100%',
    maxWidth: 430, // iPhone Pro Max width
    flex: 1,
    backgroundColor: '#fff',
    alignSelf: 'center',
  },
});

export default AppContainer; 