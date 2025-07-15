import React from 'react'
import { StyleSheet, TouchableOpacity, Platform, Animated, Easing } from 'react-native'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurView } from 'expo-blur'
import { Octicons } from '@expo/vector-icons'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useRef } from 'react'
import { useArticlesStore } from '@/store/articleStore'

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

export default function ThemedBNavBar({ state, navigation }: BottomTabBarProps) {
  
    const insets = useSafeAreaInsets()
    const INACTIVE = useThemeColor({}, 'DEFAULT_TEXT')
    const ACTIVE = useThemeColor({}, 'UNICON_BACKGROUND')
    const TEXT_SHADOW = useThemeColor({}, 'TEXT_GRADIENT_START')
    const DEFAULT_BG = useThemeColor({}, 'DEFAULT_BACKGROUND')

    const routeName = useRef('')
    const currentRoute = state.routes[state.index].name
    
    const slideY = React.useRef(new Animated.Value(0)).current

    React.useEffect(() => {
        Animated.timing(slideY, {
        toValue: currentRoute === 'post' ? 100 : 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),    // ← non-linear “ease out” curve
        useNativeDriver: true,
    }).start()
    }, [currentRoute])

    return (
        <AnimatedBlurView
        intensity={100}
        tint={DEFAULT_BG === '#f8f9f7' ? 'light' : 'dark'}
        style={[
            styles.container,
            {
            bottom: insets.bottom + 12,
            transform: [{ translateY: slideY }],
            },
        ]}
        >
        {state.routes.map((route, idx) => {
            const isFocused = state.index === idx
            const color = isFocused ? ACTIVE : INACTIVE

            const onPress = () => {
            if (isFocused) {
                if (route.name === routeName.current) {
                useArticlesStore.getState().reset(route.name)
                }
                routeName.current = route.name
            } else {
                navigation.navigate(route.name)
            }
            }

            const icons: Record<string, React.ComponentProps<typeof Octicons>['name']> = {
                home: 'home',
                search: 'search',
                post: 'plus',
                marketplace: 'rocket',
                profile: 'person',
            }

            return (
            <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.button}
                activeOpacity={0.7}
            >
                <Octicons
                name={icons[route.name]}
                size={24}
                color={color}
                style={
                    isFocused
                    ? {
                        textShadowColor: TEXT_SHADOW,
                        textShadowOffset: { width: 0, height: 0 },
                        textShadowRadius: 8,
                        }
                    : undefined
                }
                />
            </TouchableOpacity>
            )
        })}
        </AnimatedBlurView>
    )
    }

const styles = StyleSheet.create({
container: {
    position: 'absolute',
    left: 15,
    right: 15,
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: 30,
    ...Platform.select({
    ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    android: {
        elevation: 8,
    },
    web: {
        boxShadow: '0px 3px 13px rgba(0, 0, 0, 0.08)',
    },
    }),
},
button: {
    flex: 1,
    alignItems: 'center',
},
})
