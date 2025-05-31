import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TextFormat {
  bold: boolean;
  italic: boolean;
  size: 'normal' | 'heading';
}

interface CreatePostProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (post: {
    title: string;
    content: string;
    hashtags: string[];
    image?: string;
  }) => Promise<void>;
}

export default function CreatePost({ isVisible, onClose, onSubmit }: CreatePostProps) {
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentFormat, setCurrentFormat] = useState<TextFormat>({
    bold: false,
    italic: false,
    size: 'normal',
  });
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isContentFocused, setIsContentFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const blurAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;

  const window = Dimensions.get('window');
  const MODAL_WIDTH = Math.min(window.width * 0.9, 420);
  const MODAL_HEIGHT = Math.min(window.height * 0.8, 600);

  React.useEffect(() => {
    if (isVisible) {
      setError(null);
      Animated.parallel([
        Animated.spring(backdropAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(blurAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(blurAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const handleHashtagInput = (text: string) => {
    if ((text.endsWith(' ') || text.endsWith(',')) && hashtags.length < 5) {
      const tag = text.trim().replace(',', '');
      if (tag && !hashtags.includes(tag)) {
        setHashtags(prev => [...prev, tag]);
        setHashtagInput('');
      }
    } else if (text.includes('\n') && hashtags.length < 5) {
      const tag = text.trim().replace('\n', '');
      if (tag && !hashtags.includes(tag)) {
        setHashtags(prev => [...prev, tag]);
        setHashtagInput('');
      }
    } else {
      setHashtagInput(text);
    }
  };

  const removeHashtag = (tagToRemove: string) => {
    setHashtags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const toggleFormat = (format: keyof TextFormat) => {
    setCurrentFormat(prev => ({
      ...prev,
      [format]: format === 'size' ? (prev.size === 'normal' ? 'heading' : 'normal') : !prev[format],
    }));
  };

  const pickImage = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event: any) => {
            setSelectedImage(event.target.result);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleSubmit = async () => {
    if (!postTitle || !postContent) {
      setError('Please fill in both title and content');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        title: postTitle,
        content: postContent,
        hashtags,
        image: selectedImage || undefined,
      });
      // Reset form
      setPostTitle('');
      setPostContent('');
      setHashtags([]);
      setHashtagInput('');
      setSelectedImage(null);
      onClose();
    } catch (err) {
      setError('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdropAnim,
            backgroundColor: `rgba(0, 0, 255, ${blurAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.2],
            })})`,
            backdropFilter: 'blur(8px)',
          },
        ]}
      >
        <Pressable style={styles.backdropPressable} onPress={onClose} />
      </Animated.View>
      <View style={styles.centeredOverlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              width: MODAL_WIDTH,
              height: MODAL_HEIGHT,
              transform: [
                { scale: scaleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
                { translateY: translateY },
              ],
              opacity: scaleAnim,
            },
          ]}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Post</Text>
              <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <ScrollView 
              style={styles.modalScrollContent}
              contentContainerStyle={styles.modalScrollContentContainer}
            >
              <View style={styles.modalContentWrapper}>
                <TextInput
                  style={[
                    styles.postTitleInput,
                    isTitleFocused && styles.inputFocused,
                  ]}
                  placeholder="Title"
                  value={postTitle}
                  onChangeText={setPostTitle}
                  placeholderTextColor="#999"
                  onFocus={() => setIsTitleFocused(true)}
                  onBlur={() => setIsTitleFocused(false)}
                />

                <View style={styles.formatToolbar}>
                  <TouchableOpacity
                    onPress={() => toggleFormat('bold')}
                    style={[styles.formatButton, currentFormat.bold && styles.formatButtonActive]}
                  >
                    <Ionicons name="text" size={20} color={currentFormat.bold ? '#57EC6B' : '#666'} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => toggleFormat('italic')}
                    style={[styles.formatButton, currentFormat.italic && styles.formatButtonActive]}
                  >
                    <Ionicons name="text" size={20} color={currentFormat.italic ? '#57EC6B' : '#666'} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => toggleFormat('size')}
                    style={[styles.formatButton, currentFormat.size === 'heading' && styles.formatButtonActive]}
                  >
                    <Ionicons name="text" size={20} color={currentFormat.size === 'heading' ? '#57EC6B' : '#666'} />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={[
                    styles.postContentInput,
                    isContentFocused && styles.inputFocused,
                    currentFormat.bold && styles.boldText,
                    currentFormat.italic && styles.italicText,
                    currentFormat.size === 'heading' && styles.headingText,
                  ]}
                  placeholder="Write your post..."
                  value={postContent}
                  onChangeText={setPostContent}
                  placeholderTextColor="#999"
                  multiline
                  textAlignVertical="top"
                  onFocus={() => setIsContentFocused(true)}
                  onBlur={() => setIsContentFocused(false)}
                />

                <TouchableOpacity 
                  style={styles.imageUploadButton} 
                  onPress={pickImage}
                >
                  {selectedImage ? (
                    <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="image-outline" size={20} color="#666" />
                      <Text style={styles.imagePlaceholderText}>Add Image</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.hashtagContainer}>
                  <View style={styles.hashtagScrollContainer}>
                    {hashtags.map((tag, index) => (
                      <View key={index} style={styles.hashtagPill}>
                        <Text style={styles.hashtagPillText}>#{tag}</Text>
                        <TouchableOpacity
                          onPress={() => removeHashtag(tag)}
                          style={styles.hashtagRemoveButton}
                        >
                          <Ionicons name="close-circle" size={16} color="#666" />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TextInput
                      style={styles.hashtagInput}
                      placeholder={hashtags.length < 5 ? "Add hashtags (press , or enter)" : "Maximum 5 hashtags"}
                      value={hashtagInput}
                      onChangeText={handleHashtagInput}
                      editable={hashtags.length < 5}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.postActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!postTitle || !postContent || isSubmitting) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!postTitle || !postContent || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Post</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  backdropPressable: {
    flex: 1,
  },
  centeredOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },
  modalContainer: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    zIndex: 2,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    overflow: 'hidden',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  modalScrollContent: {
    flex: 1,
  },
  modalScrollContentContainer: {
    flexGrow: 1,
  },
  modalContentWrapper: {
    padding: 20,
  },
  postTitleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  postContentInput: {
    fontSize: 16,
    color: '#222',
    padding: 10,
    textAlignVertical: 'top',
    minHeight: 150,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  formatToolbar: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 10,
  },
  formatButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
  },
  formatButtonActive: {
    backgroundColor: '#F3F4F6',
  },
  boldText: {
    fontWeight: 'bold',
  },
  italicText: {
    fontStyle: 'italic',
  },
  headingText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  imageUploadButton: {
    width: '100%',
    height: 80,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  imagePlaceholderText: {
    color: '#666',
    fontSize: 14,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  hashtagContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  hashtagScrollContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hashtagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  hashtagPillText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  hashtagRemoveButton: {
    marginLeft: 6,
  },
  hashtagInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 200,
    fontSize: 14,
    color: '#374151',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputFocused: {
    borderColor: '#000',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 15,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  submitButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#57EC6B',
  },
  submitButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
}); 