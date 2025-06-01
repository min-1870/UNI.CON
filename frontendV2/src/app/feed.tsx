import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Switch,
  Animated,
  Keyboard,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
  Pressable,
  Image,
  TextInputProps,
  TextStyle,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import PostCard from '../components/PostCard';
import BottomNav from '../components/ui/BottomNav';
import CreatePost from '../components/CreatePost';
import { fetchAPI, getData } from '../components/Utils';
import { API_URL } from '../constants/Domains';
import URLS from '../constants/Urls';
import { useFocusEffect } from '@react-navigation/native';

const TAGS = ['All', 'School', 'IT'];

interface TextFormat {
  bold: boolean;
  italic: boolean;
  size: 'normal' | 'heading';
}

interface FormattedText {
  text: string;
  format: TextFormat;
}

const apiEndpoints = {
  All: `${API_URL}/community/article`,
  Hot: `${API_URL}/community/article/hot`,
  Recommended: `${API_URL}/community/article/preference`,
};

export default function Feed() {
  const [selectedTag, setSelectedTag] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [isSwitchOn, setIsSwitchOn] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<keyof typeof apiEndpoints>('All');
  const [navVisible, setNavVisible] = useState(true);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollOffset = useRef(0);
  
  // New state for post creation
  const [postContent, setPostContent] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [selectedPostTags, setSelectedPostTags] = useState<string[]>([]);
  
  // New state for hashtags
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  
  // Animation values
  const expandAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  // Animation values for modal
  const modalAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const blurAnim = useRef(new Animated.Value(0)).current;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [formattedContent, setFormattedContent] = useState<FormattedText[]>([]);
  const [currentFormat, setCurrentFormat] = useState<TextFormat>({ bold: false, italic: false, size: 'normal' });
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isContentFocused, setIsContentFocused] = useState(false);
  const [isHashtagInputActive, setIsHashtagInputActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPostAnim, setNewPostAnim] = useState(new Animated.Value(0));
  const [lastPostId, setLastPostId] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      fetchFeed();
    }, [selectedFilter])
  );

  const fetchFeed = async () => {
    setLoading(true);
    setError(null);
    const url = apiEndpoints[selectedFilter] || apiEndpoints.All;
    const response = await fetchAPI(url, { method: 'GET', token: true });
    console.log('Feed response:', response);
    if (!response.error) {
      // Try to find the articles array in the response
      const articles = response.data?.results?.articles || response.data?.articles || response.data?.results || response.data || [];
      setArticles(Array.isArray(articles) ? articles : []);
    } else {
      setError(response?.data?.detail || 'An error occurred');
      console.error('Feed error:', response.data);
    }
    setLoading(false);
  };

  const handleCreatePostPress = () => {
    setIsCreatingPost(true);
    Animated.parallel([
      Animated.timing(expandAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCancelPost = () => {
    Animated.parallel([
      Animated.timing(expandAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsCreatingPost(false);
    });
  };

  const handleSubmitPost = async (post: {
    title: string;
    content: string;
    hashtags: string[];
    image?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      // Convert hashtags array to comma-separated string
      const course_code = post.hashtags.join(',');
      const response = await fetchAPI(`${API_URL}/community/article/`, {
        method: 'POST',
        token: true,
        body: {
          title: post.title,
          body: post.content,
          unicon: true, // or get from UI
          course_code,
          // image: post.image, // Uncomment if backend supports image
        },
      });
      if (response.error) {
        setError(response.data?.detail || 'Failed to post article');
        console.error('Post error:', response.data);
      } else {
        setIsCreatingPost(false);
        await fetchFeed();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to post article');
      console.error('Post error:', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePostTag = (tag: string) => {
    setSelectedPostTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleContentChange = (text: string) => {
    setPostContent(text);
    // Apply formatting to the text
    const formattedText = {
      text,
      format: currentFormat
    };
    setFormattedContent([formattedText]);
  };

  const toggleFormat = (format: keyof TextFormat) => {
    setCurrentFormat(prev => ({
      ...prev,
      [format]: format === 'size' ? (prev.size === 'normal' ? 'heading' : 'normal') : !prev[format],
    }));
  };

  const handleHashtagInput = (text: string) => {
    if (text.endsWith(' ') || text.endsWith(',')) {
      const tag = text.trim().replace(',', '');
      if (tag && !hashtags.includes(tag)) {
        setHashtags(prev => [...prev, tag]);
        setHashtagInput('');
      }
    } else {
      setHashtagInput(text);
    }
  };

  const removeHashtag = (tagToRemove: string) => {
    setHashtags(hashtags.filter(tag => tag !== tagToRemove));
  };

  const filteredArticles = articles.filter(post => {
    const matchesTag = selectedTag === 'All' || (post.course_code && post.course_code.toLowerCase().includes(selectedTag.toLowerCase()));
    const matchesSearch =
      post.title.toLowerCase().includes(searchText.toLowerCase()) ||
      post.body.toLowerCase().includes(searchText.toLowerCase());
    return matchesTag && matchesSearch;
  });

  const FILTERS = ['All', 'Hot', 'Recommended'];

  const handleScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentOffset = nativeEvent.contentOffset.y;
    const direction = currentOffset > scrollOffset.current ? 'down' : 'up';
    setNavVisible(direction === 'up' && currentOffset > 10);
    scrollOffset.current = currentOffset;
  };

  const pickImage = async () => {
    try {
      // For Mac, we'll use a file input
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
      alert('Error selecting image. Please try again.');
    }
  };

  const renderPost = ({ item, index }: { item: any; index: number }) => {
    const isNewPost = item.id === lastPostId;
    
    return (
      <Animated.View
        style={[
          isNewPost && {
            transform: [
              {
                scale: newPostAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
            opacity: newPostAnim,
          },
        ]}
      >
        <PostCard post={{
          id: String(item.id),
          user: item.user_temp_name || 'Unknown',
          timestamp: item.created_at,
          title: item.title,
          content: item.body,
          tags: item.course_code ? item.course_code.split(',') : [],
          likes: item.likes_count,
          comments: item.comments_count,
          bookmarks: 0, // You can add save_status if available
          image: undefined, // Add image if available
        }} />
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>UNICON</Text>
        <Text style={styles.headerSubtitle}>UNSW SYDNEY</Text>
      </View>

      {/* Tags */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tagsContainer}
        contentContainerStyle={{ paddingHorizontal: 10, alignItems: 'center'}}
      >
        {TAGS.map(tag => (
          <TouchableOpacity
            key={tag}
            style={[
              styles.tagBadge,
              selectedTag === tag && styles.tagBadgeSelected,
            ]}
            onPress={() => setSelectedTag(tag)}
          >
            <Text
              style={[
                styles.tagText,
                selectedTag === tag && styles.tagTextSelected,
              ]}
            >
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* New Post Button */}
      <TouchableOpacity
        style={styles.newPostButton}
        onPress={handleCreatePostPress}
      >
        <TextInput
          style={styles.searchInput}
          placeholder="What's on your mind?"
          placeholderTextColor="#999"
          editable={false}
        />
        <FontAwesome name="pencil" size={20} color="#666" />
      </TouchableOpacity>

      {/* Create Post Modal */}
      <CreatePost
        isVisible={isCreatingPost}
        onClose={handleCancelPost}
        onSubmit={handleSubmitPost}
      />

      {/* Filter Tabs and Toggle */}
      <View style={styles.filterToggleContainer}>
        <View style={styles.filterTabs}>
          {FILTERS.map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                selectedFilter === filter && styles.filterTabSelected,
              ]}
              onPress={() => setSelectedFilter(filter as keyof typeof apiEndpoints)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  selectedFilter === filter && styles.filterTabTextSelected,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Toggle</Text>
          <Switch
            value={isSwitchOn}
            onValueChange={setIsSwitchOn}
            trackColor={{ false: '#ccc', true: '#4CAF50' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Posts List */}
      {loading ? (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>Loading...</Text>
      ) : error ? (
        <Text style={{ textAlign: 'center', color: 'red', marginTop: 20 }}>{error}</Text>
      ) : (
        <FlatList
          data={filteredArticles}
          keyExtractor={item => String(item.id)}
          renderItem={renderPost}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
      <BottomNav isVisible={navVisible && !isCreatingPost} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    minWidth: 450,
    maxWidth: 500,
    alignSelf: 'center',
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#222',
  },
  headerSubtitle: {
    fontSize: 20,
    color: '#282828',
  },
  tagsContainer: {
    paddingVertical: 6,
    maxHeight: 40,
    marginBottom: 10,
  },

  tagBadge: {
    backgroundColor: '#\F3F4F6',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 15,
    marginRight: 10,
    marginBottom: 6,
    textAlign: 'center',
  },
  tagBadgeSelected: {
    backgroundColor: '#57EC6B',
  },
  tagText: {
    color: '#444',
    fontWeight: '600',
  },
  tagTextSelected: {
    color: '#fff',
  },
  newPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 0.2,
    borderColor: '#E5E7EB',
    marginHorizontal: 15,
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    height: 50,
    width: '90%',
    alignSelf: 'center',
  },
  searchInput: {
    marginLeft: 10,
    flex: 1,
    fontSize: 16,
    color: '#222',
  },
  postForm: {
    flex: 1,
    padding: 10,
  },
  postTitleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 15,
    padding: 5,
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
  postTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  postTagBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 6,
  },
  postTagBadgeSelected: {
    backgroundColor: '#57EC6B',
  },
  postTagText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  postTagTextSelected: {
    color: '#fff',
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
  filterToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 15,
    marginBottom: 15,
  },
  filterTabs: {
    flexDirection: 'row',
  },
  
  filterTab: {
    paddingHorizontal: 15,
    height: 32,
    borderRadius: 20,
    backgroundColor: '#FEFEFE',
    borderWidth: 0.2,
    borderColor: '#E5E7EB',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },

  filterTabSelected: {
    backgroundColor: '#57EC6B',
  },

 filterTabText: {
   fontSize: 14,
   fontWeight: '600',
   textAlign: 'center',
   lineHeight: 18,
 },

  filterTabTextSelected: {
    color: '#fff',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    marginRight: 8,
    fontSize: 14,
    color: '#444',
    fontWeight: '600',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  backdropPressable: {
    flex: 1,
  },
  modalContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    zIndex: 2,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    transform: [
      { translateX: -225 },
      { translateY: -300 },
    ],
  },
  modalContent: {
    flex: 1,
    padding: 20,
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
  hashtagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  hashtagInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 120,
    fontSize: 14,
    color: '#374151',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  hashtagIcon: {
    fontSize: 16,
    color: '#666',
    marginRight: 4,
  },
  hashtagButtonText: {
    color: '#666',
    fontSize: 14,
  },
  inputFocused: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
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
  postCardWrapper: {
    marginHorizontal: 15,
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
});
