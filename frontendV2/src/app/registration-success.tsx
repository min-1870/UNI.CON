import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ThemedText from '@/components/ThemedText';
import { Feather } from '@expo/vector-icons'; // includes `check` icon

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#57EC6B',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  animatedBlob: {
    position: 'absolute',
    width: width * 1.5,
    height: height * 1.5,
    backgroundColor: '#9b87f5',
    borderRadius: width,
    opacity: 0.25,
    top: -height * 0.25,
    left: -width * 0.25,
  },
  content: {
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 20,
    borderRadius: 100,
    marginBottom: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    lineHeight: 42,
  },
});

export default function registrationComplete() {
  const navigation = useNavigation();
  const wobbleAnim = useRef(new Animated.Value(0)).current;
  const backgroundFade = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0.5)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
    Animated.sequence([
      Animated.timing(backgroundFade, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(checkScale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(checkOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        navigation.navigate('(tabs)', { screen: 'feed' });
      }, 2000);
    });
  }, []);
  // Background wobble animation
  useEffect(() => {
  Animated.loop(
    Animated.sequence([
      Animated.timing(wobbleAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      }),
      Animated.timing(wobbleAnim, {
        toValue: -1,
        duration: 2000,
        useNativeDriver: false,
      }),
    ])
  ).start();
}, []);

  const wobbleInterpolate = wobbleAnim.interpolate({
  inputRange: [-1, 0, 1],
  outputRange: ['-2deg', '0deg', '2deg'],
});

  return (
        <Animated.View style={[styles.container, { opacity: backgroundFade }]}>
      <Animated.View style={[styles.iconContainer, { transform: [{ scale: checkScale }], opacity: checkOpacity }]}>
        <Feather name="check" size={64} color="white" />
      </Animated.View>
      <Animated.View style={{ opacity: textOpacity }}>
        <ThemedText type="Wording" style={{ textAlign: 'center', color: 'rgb(255, 255, 255)' }}>
          Registration{'\n'}Success !
        </ThemedText>
        <ThemedText type="Wording" style={{ textAlign: 'center', fontSize: 20, color: 'rgb(241, 241, 241)' }}>
          Enjoy the supercharged university experience.
        </ThemedText>
      </Animated.View>
    </Animated.View>
  );
}