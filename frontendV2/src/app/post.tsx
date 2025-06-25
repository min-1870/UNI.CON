import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  Animated,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useColorScheme } from '@/hooks/useColorScheme';
import { fetchAPI } from '@/components/Utils';
import URLs from '@/constants/Urls';
import Toast from 'react-native-toast-message';
import AppContainer from '@/components/AppContainer';
import BottomNav from '@/components/ui/BottomNav';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [currentHashtag, setCurrentHashtag] = useState('');
  const [loading, setLoading] = useState(false);
  const [unicon, setUnicon] = useState(false);
  
  // Animation for loading spinner
  const spinValue = useRef(new Animated.Value(0)).current;
  
  // Start spinning animation when loading
  useEffect(() => {
    if (loading) {
      spinValue.setValue(0);
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [loading]);
  
  // Create rotation interpolation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  // Theme colors
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'default_background_color');
  const cardBackground = useThemeColor({}, 'default_card_background_color');
  const textColor = useThemeColor({}, 'default_text_color');
  const placeholderColor = useThemeColor({}, 'default_placeholder_color');
  const brandColor = useThemeColor({}, 'default_brand_color');

  // Extract hashtags from content
  const extractHashtags = (text: string) => {
    const hashtagPattern = /#\w+/g;
    const foundHashtags = text.match(hashtagPattern) || [];
    return foundHashtags.map(tag => tag.slice(1));
  };

  // Handle content change and auto-extract hashtags
  const handleContentChange = (value: string) => {
    setContent(value);
    const extractedHashtags = extractHashtags(value);
    setHashtags(extractedHashtags);
  };

  // Handle image selection
  const handleImageUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => asset.uri);
      setImages(prev => [...prev, ...newImages].slice(0, 4)); // Limit to 4 images
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Add hashtag manually
  const addHashtag = () => {
    if (currentHashtag.trim() && !hashtags.includes(currentHashtag.trim())) {
      const newHashtag = currentHashtag.trim();
      setHashtags(prev => [...prev, newHashtag]);
      setContent(prev => prev + ` #${newHashtag}`);
      setCurrentHashtag('');
    }
  };

  // Remove hashtag
  const removeHashtag = (tagToRemove: string) => {
    setHashtags(prev => prev.filter(tag => tag !== tagToRemove));
    setContent(prev => prev.replace(new RegExp(`#${tagToRemove}\\b`, 'g'), '').trim());
  };

  // Handle post submission
  const handleSubmit = async () => {
    if (!title.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Please add a title to your post',
      });
      return;
    }

    if (!content.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Please add some content to your post',
      });
      return;
    }

    setLoading(true);

    try {
      // Use the correct API format as specified
      const response = await fetchAPI(URLs.ARTICLE(), {
        method: 'POST',
        token: true,
        body: {
          title: title.trim(),
          body: content.trim(),
          unicon: unicon,
          course_code: hashtags.length > 0 ? hashtags : undefined, // Optional course codes
        },
      });

      if (!response.error) {
        const articleId = response.data?.id;
        
        Toast.show({
          type: 'success',
          text1: 'Post created successfully!',
        });

        // Reset form
        setTitle('');
        setContent('');
        setImages([]);
        setHashtags([]);
        setCurrentHashtag('');
        setUnicon(false);

        // Navigate to the created article page
        if (articleId) {
          router.push(`/article/${articleId}` as any);
        } else {
          router.push('/' as any);
        }
      } else {
        console.error('Post creation failed:', response.data);
        Toast.show({
          type: 'error',
          text1: `Failed to post: ${response.data?.detail || 'Unknown error'}`,
        });
      }
    } catch (error) {
      console.error('Post creation error:', error);
      Toast.show({
        type: 'error',
        text1: 'Network error. Please try again.',
      });
    }

    setLoading(false);
  };

  // Handle back navigation
  const handleBack = () => {
    router.push('/' as any);
  };



  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor,
    },
    header: {
      backgroundColor: cardBackground,
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingTop: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB',
    },
    backButton: {
      padding: 8,
      borderRadius: 20,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: textColor,
    },
    postButton: {
      backgroundColor: '#10B981',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
    },
    postButtonDisabled: {
      backgroundColor: placeholderColor,
      opacity: 0.5,
    },
    postButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      marginLeft: 4,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    titleSection: {
      marginBottom: 20,
    },
    titleInput: {
      backgroundColor: cardBackground,
      borderRadius: 12,
      padding: 16,
      fontSize: 18,
      fontWeight: '600',
      color: textColor,
      shadowColor: colorScheme === 'dark' ? '#000' : 'rgba(0, 0, 0, 0.1)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    titleCharCount: {
      fontSize: 12,
      color: placeholderColor,
      textAlign: 'right',
      marginTop: 8,
      paddingHorizontal: 4,
    },
    textSection: {
      marginBottom: 24,
    },
    textArea: {
      backgroundColor: cardBackground,
      borderRadius: 16,
      padding: 20,
      fontSize: 16,
      color: textColor,
      minHeight: 200,
      textAlignVertical: 'top',
      shadowColor: colorScheme === 'dark' ? '#000' : 'rgba(0, 0, 0, 0.1)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    textInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
      paddingHorizontal: 4,
    },
    shareText: {
      fontSize: 14,
      color: placeholderColor,
    },
    charCount: {
      fontSize: 14,
      color: placeholderColor,
    },
    charCountLimit: {
      color: '#EF4444',
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: textColor,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: cardBackground,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB',
    },
    addButtonText: {
      fontSize: 14,
      color: textColor,
      marginLeft: 8,
    },
    imageGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    imageItem: {
      position: 'relative',
      width: '47%',
      aspectRatio: 1,
    },
    image: {
      width: '100%',
      height: '100%',
      borderRadius: 12,
    },
    removeImageButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: 12,
      padding: 4,
    },
    hashtagInput: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      marginTop: 16,
    },
    hashtagInputField: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: cardBackground,
      borderRadius: 25,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB',
    },
    hashtagTextInput: {
      flex: 1,
      fontSize: 14,
      color: textColor,
      marginLeft: 8,
    },
    hashtagAddButton: {
      backgroundColor: '#10B981',
      borderRadius: 20,
      padding: 8,
    },
    hashtagAddButtonDisabled: {
      backgroundColor: placeholderColor,
      opacity: 0.5,
    },
    hashtagList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    hashtagChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colorScheme === 'dark' ? 'rgba(59, 130, 246, 0.3)' : '#DBEAFE',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    hashtagChipText: {
      fontSize: 14,
      color: colorScheme === 'dark' ? '#60A5FA' : '#2563EB',
      marginRight: 4,
    },
    tipsSection: {
      backgroundColor: cardBackground,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB',
    },
    tipsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: textColor,
      marginBottom: 8,
    },
    tipItem: {
      fontSize: 12,
      color: placeholderColor,
      marginBottom: 4,
    },
    uniconSection: {
      backgroundColor: cardBackground,
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB',
    },
    uniconHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    uniconToggle: {
      width: 50,
      height: 30,
      borderRadius: 15,
      backgroundColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    uniconToggleActive: {
      backgroundColor: '#10B981',
    },
    uniconToggleIndicator: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#FFFFFF',
      alignSelf: 'flex-start',
    },
    uniconToggleIndicatorActive: {
      alignSelf: 'flex-end',
    },
    uniconDescription: {
      fontSize: 14,
      color: placeholderColor,
      lineHeight: 20,
    },
    loadingOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingContainer: {
      backgroundColor: cardBackground,
      padding: 30,
      borderRadius: 20,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    loadingSpinner: {
      width: 60,
      height: 60,
      borderRadius: 30,
      borderWidth: 4,
      borderColor: 'rgba(16, 185, 129, 0.3)',
      borderTopColor: '#10B981',
      marginBottom: 20,
    },
    loadingSpinnerInner: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: 'transparent',
    },
    loadingText: {
      fontSize: 16,
      color: textColor,
      fontWeight: '600',
      textAlign: 'center',
    },
  });

  return (
    <ProtectedRoute>
      <AppContainer>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
            >
              <Ionicons name="arrow-back" size={24} color={textColor} />
            </TouchableOpacity>
            
            <Text style={styles.title}>Create Post</Text>
            
            <TouchableOpacity
              style={[
                styles.postButton,
                (!title.trim() || !content.trim()) || loading ? styles.postButtonDisabled : null
              ]}
              onPress={handleSubmit}
              disabled={(!title.trim() || !content.trim()) || loading}
            >
              <Ionicons name="send" size={16} color="#FFFFFF" />
              <Text style={styles.postButtonText}>
                {loading ? 'Posting...' : 'Post'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Main Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Title Section */}
            <View style={styles.titleSection}>
              <TextInput
                style={styles.titleInput}
                placeholder="Add a catchy title..."
                placeholderTextColor={placeholderColor}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
              <Text style={styles.titleCharCount}>{title.length}/100</Text>
            </View>

            {/* Text Area */}
            <View style={styles.textSection}>
              <TextInput
                style={styles.textArea}
                placeholder="What's your thoughts?"
                placeholderTextColor={placeholderColor}
                value={content}
                onChangeText={handleContentChange}
                multiline
                textAlignVertical="top"
              />
              
              <View style={styles.textInfo}>
                <Text style={styles.shareText}>
                  Share your thoughts with the community
                </Text>
                <Text style={[
                  styles.charCount,
                  content.length > 280 ? styles.charCountLimit : null
                ]}>
                  {content.length}/280
                </Text>
              </View>
            </View>

            {/* Images Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Images</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleImageUpload}
                >
                  <Ionicons name="image" size={16} color={textColor} />
                  <Text style={styles.addButtonText}>Add Image</Text>
                </TouchableOpacity>
              </View>

              {images.length > 0 && (
                <View style={styles.imageGrid}>
                  {images.map((image, index) => (
                    <View key={index} style={styles.imageItem}>
                      <Image source={{ uri: image }} style={styles.image} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                      >
                        <Ionicons name="close" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Hashtags Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hashtags</Text>
              
              {/* Hashtag Input */}
              <View style={styles.hashtagInput}>
                <View style={styles.hashtagInputField}>
                  <Ionicons name="pricetag-outline" size={16} color={placeholderColor} />
                  <TextInput
                    style={styles.hashtagTextInput}
                    placeholder="Add hashtag"
                    placeholderTextColor={placeholderColor}
                    value={currentHashtag}
                    onChangeText={setCurrentHashtag}
                    onSubmitEditing={addHashtag}
                    returnKeyType="done"
                  />
                </View>
                <TouchableOpacity
                  style={[
                    styles.hashtagAddButton,
                    !currentHashtag.trim() ? styles.hashtagAddButtonDisabled : null
                  ]}
                  onPress={addHashtag}
                  disabled={!currentHashtag.trim()}
                >
                  <Ionicons name="pricetag" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Display Hashtags */}
              {hashtags.length > 0 && (
                <View style={styles.hashtagList}>
                  {hashtags.map((tag, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.hashtagChip}
                      onPress={() => removeHashtag(tag)}
                    >
                      <Text style={styles.hashtagChipText}>#{tag}</Text>
                      <Ionicons name="close" size={12} color={colorScheme === 'dark' ? '#60A5FA' : '#2563EB'} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* UNI.CON Toggle Section */}
            <View style={styles.uniconSection}>
              <View style={styles.uniconHeader}>
                <Text style={styles.sectionTitle}>UNI.CON Visibility</Text>
                <TouchableOpacity
                  style={[styles.uniconToggle, unicon && styles.uniconToggleActive]}
                  onPress={() => setUnicon(!unicon)}
                >
                  <View style={[styles.uniconToggleIndicator, unicon && styles.uniconToggleIndicatorActive]} />
                </TouchableOpacity>
              </View>
              <Text style={styles.uniconDescription}>
                Enable to make your post visible to other university students across UNI.CON network
              </Text>
            </View>

          </ScrollView>

                     <BottomNav />
        </View>

        {/* Loading Overlay */}
        <Modal
          visible={loading}
          transparent
          animationType="fade"
        >
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <View style={styles.loadingSpinner}>
                  <View style={styles.loadingSpinnerInner} />
                </View>
              </Animated.View>
              <Text style={styles.loadingText}>Creating your post...</Text>
            </View>
          </View>
        </Modal>
      </AppContainer>
    </ProtectedRoute>
  );
} 