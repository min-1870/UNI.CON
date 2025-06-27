import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'share' | 'mention';
  user: string;
  username: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface NotificationPanelProps {
  visible: boolean;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ visible, onClose }) => {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  // Theme
  const { theme, isDark } = useTheme();

  // Dynamic styles based on theme
  const styles = StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.computed.overlayBackground,
    },
    panel: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      width: 350,
      maxWidth: '90%',
    },
    blurContainer: {
      flex: 1,
      backgroundColor: Platform.OS === 'ios' 
        ? (isDark ? 'rgba(25, 25, 25, 0.1)' : 'rgba(255, 255, 255, 0.7)')
        : (isDark ? theme.colors.surface : 'rgba(255, 255, 255, 0.95)'),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing['5xl'],
      paddingBottom: theme.spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold as any,
      color: theme.colors.text,
      marginLeft: theme.spacing.sm,
    },
    badge: {
      backgroundColor: theme.colors.error,
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: 2,
      marginLeft: theme.spacing.sm,
      minWidth: 16,
      alignItems: 'center',
    },
    badgeText: {
      color: '#ffffff',
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    closeButton: {
      padding: theme.spacing.sm,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      borderRadius: theme.borderRadius.xl,
    },
    markAllButton: {
      padding: theme.spacing.sm,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      borderRadius: theme.borderRadius.xl,
      marginHorizontal: theme.spacing.xl,
      marginTop: theme.spacing.md,
      alignItems: 'center',
    },
    markAllText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text,
      fontWeight: theme.typography.fontWeight.medium,
    },
    notificationsList: {
      flex: 1,
      paddingHorizontal: theme.spacing.xl,
      marginTop: theme.spacing.md,
    },
    notificationItem: {
      backgroundColor: 'transparent',
      padding: theme.spacing.lg,
      marginVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    notificationItemUnread: {
      backgroundColor: isDark ? 'rgba(74, 222, 128, 0.1)' : 'rgba(0, 122, 255, 0.02)',
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    avatarText: {
      color: '#ffffff',
      fontWeight: theme.typography.fontWeight.semibold,
      fontSize: theme.typography.fontSize.base,
    },
    notificationContent: {
      flex: 1,
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    userName: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text,
    },
    userHandle: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textMuted,
      marginLeft: theme.spacing.xs,
    },
    notificationMessage: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text,
      lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
      marginBottom: theme.spacing.xs,
    },
    timestamp: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textMuted,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
      marginLeft: theme.spacing.sm,
    },
    typeIcon: {
      marginRight: theme.spacing.xs,
    },
    apiComment: {
      padding: theme.spacing.lg,
      margin: theme.spacing.lg,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
      borderRadius: theme.borderRadius.md,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
    },
    apiCommentText: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textMuted,
      fontStyle: 'italic',
    },
  });

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // API needed - Replace with actual notification data
  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'like',
      user: 'Sarah Chen',
      username: '@sarahc',
      message: 'liked your post about the mid-term exam',
      timestamp: '2 min ago',
      isRead: false,
    },
    {
      id: '2',
      type: 'comment',
      user: 'Alex Kim',
      username: '@alexk',
      message: 'commented on your lunch photo',
      timestamp: '15 min ago',
      isRead: false,
    },
    {
      id: '3',
      type: 'follow',
      user: 'Emma Wilson',
      username: '@emmaw',
      message: 'started following you',
      timestamp: '1 hour ago',
      isRead: false,
    },
    {
      id: '4',
      type: 'share',
      user: 'James Lee',
      username: '@jamesl',
      message: 'shared your post about IT class',
      timestamp: '2 hours ago',
      isRead: false,
    },
    {
      id: '5',
      type: 'mention',
      user: 'Lisa Park',
      username: '@lisap',
      message: 'mentioned you in a comment',
      timestamp: '3 hours ago',
      isRead: false,
    },
  ];

  const getNotificationIcon = (type: string) => {
    const iconProps = { size: 16, style: styles.typeIcon };
    switch (type) {
      case 'like':
        return <Ionicons name="heart" color={theme.colors.error} {...iconProps} />;
      case 'comment':
        return <Ionicons name="chatbubble" color={theme.colors.info} {...iconProps} />;
      case 'follow':
        return <Ionicons name="person-add" color={theme.colors.success} {...iconProps} />;
      case 'share':
        return <Ionicons name="share" color={theme.colors.warning} {...iconProps} />;
      case 'mention':
        return <Ionicons name="at" color={theme.colors.primary} {...iconProps} />;
      default:
        return <Ionicons name="notifications" color={theme.colors.textMuted} {...iconProps} />;
    }
  };

  const getUserInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const getUserAvatarColor = (name: string) => {
    const colors = [theme.colors.error, theme.colors.info, theme.colors.success, theme.colors.warning, theme.colors.primary];
    const index = name.length % colors.length;
    return colors[index];
  };

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.overlay,
        {
          opacity: opacityAnim,
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={onClose}
      />
      
      <Animated.View
        style={[
          styles.panel,
          {
            transform: [{ translateX: slideAnim }],
          }
        ]}
      >
        <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.blurContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="notifications" size={24} color={theme.colors.text} />
              <Text style={styles.headerTitle}>Notifications</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>2</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Mark all as read */}
          <TouchableOpacity style={styles.markAllButton}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>

          {/* Notifications List */}
          <ScrollView 
            style={styles.notificationsList}
            showsVerticalScrollIndicator={false}
          >
            {mockNotifications.map((notification) => (
              <TouchableOpacity 
                key={notification.id}
                style={[
                  styles.notificationItem,
                  !notification.isRead && styles.notificationItemUnread
                ]}
                activeOpacity={0.7}
              >
                {/* User Avatar */}
                <View 
                  style={[
                    styles.avatar,
                    { backgroundColor: getUserAvatarColor(notification.user) }
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {getUserInitial(notification.user)}
                  </Text>
                </View>

                {/* Notification Content */}
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    {getNotificationIcon(notification.type)}
                    <Text style={styles.userName}>{notification.user}</Text>
                    <Text style={styles.userHandle}>{notification.username}</Text>
                    {!notification.isRead && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notificationMessage}>{notification.message}</Text>
                  <Text style={styles.timestamp}>{notification.timestamp}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* API Needed Comment */}
          <View style={styles.apiComment}>
            <Text style={styles.apiCommentText}>// API needed - Replace mock data with real notifications</Text>
          </View>
        </BlurView>
      </Animated.View>
    </Animated.View>
  );
};

export default NotificationPanel;
