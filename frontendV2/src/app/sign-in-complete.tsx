import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ThemedText from '@/components/ThemedText';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  withSequence,
  withDelay,
  useSharedValue,
  interpolate,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const SignInComplete = () => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const checkmarkScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    // Start animations
    scale.value = withSpring(1);
    opacity.value = withTiming(1, { duration: 1000 });
    checkmarkScale.value = withSequence(
      withDelay(500, withSpring(1)),
      withDelay(2000, withSpring(0.8))
    );
    textOpacity.value = withDelay(1000, withTiming(1, { duration: 1000 }));

    // Navigate to feed after delay
    const timer = setTimeout(() => {
      router.replace('/feed');
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const gradientStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${interpolate(scale.value, [0, 1], [0, 360])}deg` }
      ],
      opacity: opacity.value,
    };
  });

  const checkmarkStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: checkmarkScale.value }],
    };
  });

  const textStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
      transform: [
        { translateY: interpolate(textOpacity.value, [0, 1], [20, 0]) }
      ],
    };
  });

  return (
    <View style={styles.container}>
      {/* Animated gradient background */}
      <Animated.View style={[styles.gradientContainer, gradientStyle]}>
        <View style={styles.gradient} />
      </Animated.View>

      {/* Content */}
      <View style={styles.content}>
        <Animated.View style={[styles.checkmarkContainer, checkmarkStyle]}>
          <View style={styles.checkmarkBackground}>
            <Ionicons name="checkmark" size={64} color="#fff" />
          </View>
        </Animated.View>

        <Animated.View style={textStyle}>
          <ThemedText type="Wording" style = {{textAlign:'center',color:'rgb(255, 255, 255)',}}>Registration{'\n'}Success !</ThemedText>
        <ThemedText type="Wording" style = {{fontSize:25,color:'rgb(241, 241, 241)'}}>Redirecting to home.</ThemedText>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gradientContainer: {
    position: 'absolute',
    width: width * 1.5,
    height: height * 1.5,
    top: -height * 0.25,
    left: -width * 0.25,
  },
  gradient: {
    flex: 1,
    backgroundColor: '#57EC6B',
    transform: [
      { rotate: '45deg' },
      { scale: 1.5 }
    ],
    opacity: 0.8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkContainer: {
    marginBottom: 32,
  },
  checkmarkBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 56,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginTop: 12,
    opacity: 0.9,
  },
});

export default SignInComplete; 