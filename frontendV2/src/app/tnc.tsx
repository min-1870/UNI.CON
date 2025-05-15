import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, TouchableOpacity, FlatList, Switch, Image } from 'react-native';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

const TAGS = ['Events', 'Jobs', 'News', 'Announcements', 'Clubs'];
const FILTERS = ['All', 'My Feed', 'Popular', 'Recent'];

const SAMPLE_POSTS = [
  {
    id: '1',
    user: {
      name: 'Jane Doe',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    },
    timestamp: '2h ago',
    title: 'Welcome to UNI.CON!',
    content: 'We are excited to launch the new platform for UNSW students. Join events, find jobs, and stay updated.',
    tags: ['Announcements', 'Events'],
    likes: 24,
    comments: 5,
    bookmarks: 3,
    image: 'https://images.unsplash.com/photo-1508780709619-79562169bc64?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '2',
    user: {
      name: 'John Smith',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    timestamp: '5h ago',
    title: 'Part-time Job Opportunity',
    content: 'Looking for a part-time assistant for the library. Flexible hours and great pay.',
    tags: ['Jobs'],
    likes: 18,
    comments: 2,
    bookmarks: 7,
  },
  {
    id: '3',
    user: {
      name: 'Emily Chen',
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    },
    timestamp: '1d ago',
    title: 'Student Club Fair',
    content: 'Don’t miss the annual club fair this Friday at the main quad. Meet new people and join clubs!',
    tags: ['Events', 'Clubs'],
    likes: 42,
    comments: 12,
    bookmarks: 15,
  },
];

export default function FeedPage() {
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [toggleEnabled, setToggleEnabled] = useState(false);

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const filteredPosts = SAMPLE_POSTS.filter(post => {
    const matchesTags = selectedTags.length === 0 || post.tags.some(tag => selectedTags.includes(tag));
    const matchesSearch = post.title.toLowerCase().includes(searchText.toLowerCase()) || post.content.toLowerCase().includes(searchText.toLowerCase());
    // For simplicity, filter tabs do not filter posts differently here except 'All'
    return matchesTags && matchesSearch;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>UNICON</Text>
        <Text style={styles.headerSubtitle}>UNSW SYDNEY</Text>
      </View>

      <View style={styles.tagsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TAGS.map(tag => (
            <TouchableOpacity
              key={tag}
              style={[styles.tagBadge, selectedTags.includes(tag) && styles.tagBadgeSelected]}
              onPress={() => toggleTag(tag)}
            >
              <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextSelected]}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={{ marginLeft: 10 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search posts"
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.filterTabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FILTERS.map(filter => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterTab, selectedFilter === filter && styles.filterTabSelected]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[styles.filterTabText, selectedFilter === filter && styles.filterTabTextSelected]}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Show only bookmarked</Text>
        <Switch
          value={toggleEnabled}
          onValueChange={setToggleEnabled}
          trackColor={{ false: '#767577', true: '#4ade80' }}
          thumbColor={toggleEnabled ? '#16a34a' : '#f4f3f4'}
        />
      </View>

      <FlatList
        data={filteredPosts}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View
            style={styles.postCard}
            // React Native doesn't support hover natively.
            // For web adaptation, consider using react-native-web's Pressable or other libraries to add hover effect.
            // Example (web only): onMouseEnter and onMouseLeave to toggle style.
          >
            <View style={styles.postHeader}>
              <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.userName}>{item.user.name}</Text>
                <Text style={styles.timestamp}>{item.timestamp}</Text>
              </View>
              <TouchableOpacity>
                <MaterialCommunityIcons name="dots-vertical" size={20} color="#999" />
              </TouchableOpacity>
            </View>
            <Text style={styles.postTitle}>{item.title}</Text>
            <Text style={styles.postContent} numberOfLines={3}>{item.content}</Text>
            {item.image && (
              <Image
                source={{ uri: item.image }}
                style={{
                  width: '100%',
                  height: 180,
                  borderRadius: 12,
                  marginBottom: 12,
                  marginTop: 4,
                }}
                resizeMode="cover"
              />
            )}
            <View style={styles.postTags}>
              {item.tags.map(tag => (
                <View key={tag} style={styles.postTagBadge}>
                  <Text style={styles.postTagText}>{tag}</Text>
                </View>
              ))}
            </View>
            <View style={styles.postActions}>
              <View style={styles.actionItem}>
                <FontAwesome name="heart-o" size={18} color="#999" />
                <Text style={styles.actionText}>{item.likes}</Text>
              </View>
              <View style={styles.actionItem}>
                <FontAwesome name="comment-o" size={18} color="#999" />
                <Text style={styles.actionText}>{item.comments}</Text>
              </View>
              <View style={styles.actionItem}>
                <Ionicons name="bookmark-outline" size={18} color="#999" />
                <Text style={styles.actionText}>{item.bookmarks}</Text>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 4,
  },
  tagsContainer: {
    marginBottom: 16,
  },
  tagBadge: {
    backgroundColor: '#d1fae5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  tagBadgeSelected: {
    backgroundColor: '#16a34a',
    borderColor: '#166534',
  },
  tagText: {
    fontSize: 14,
    color: '#065f46',
  },
  tagTextSelected: {
    color: '#d1fae5',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 16,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
    color: '#111827',
  },
  filterTabs: {
    marginBottom: 16,
  },
  filterTab: {
    backgroundColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
  },
  filterTabSelected: {
    backgroundColor: '#16a34a',
  },
  filterTabText: {
    fontSize: 14,
    color: '#4b5563',
  },
  filterTabTextSelected: {
    color: '#d1fae5',
    fontWeight: 'bold',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#374151',
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    transitionDuration: '200ms',
    transform: [{ scale: 1 }],
    // For web hover effect, one might add a hoverStyle or use Pressable onMouseEnter/onMouseLeave to scale or add shadow.
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#111827',
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 6,
  },
  postContent: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
  postTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  postTagBadge: {
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  postTagText: {
    fontSize: 12,
    color: '#065f46',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 6,
    color: '#6b7280',
    fontSize: 14,
  },
});