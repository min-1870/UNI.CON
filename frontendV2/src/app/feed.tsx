




// huh??????? I already built the feed page at (tabs)/index.tsx
// login w EMAIL: root@unsw.edu.au PW: rootroot




import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Switch,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import PostCard from '../components/PostCard';

const TAGS = ['All', 'School', 'IT'];

const POSTS = [
  {
    id: '1',
    user: 'Jane Doe',
    timestamp: '2h ago',
    title: 'Welcome to UNICON!',
    content:
      'We are excited to launch the new UNICON platform for all UNSW Sydney students. Stay tuned for updates and events.',
    tags: ['News', 'Events'],
    likes: 12,
    comments: 5,
    bookmarks: 3,
    image: 'https://images.unsplash.com/photo-1508780709619-79562169bc64?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '2',
    user: 'John Smith',
    timestamp: '1d ago',
    title: 'Campus Job Fair',
    content:
      'Join us this Friday at the campus job fair to meet potential employers and learn about internship opportunities.',
    tags: ['Jobs', 'Events'],
    likes: 30,
    comments: 10,
    bookmarks: 7,
  },
  {
    id: '3',
    user: 'Emily Chen',
    timestamp: '3d ago',
    title: 'Library Renovation Update',
    content:
      'The main library will be closed for renovation starting next week. Please plan your study sessions accordingly.',
    tags: ['Updates'],
    likes: 8,
    comments: 2,
    bookmarks: 1,
  },
  {
    id: '4',
    user: 'Emily Chen',
    timestamp: '3d ago',
    title: 'Library Renovation Update',
    content:
      'The main library will be closed for renovation starting next week. Please plan your study sessions accordingly.',
    tags: ['Updates'],
    likes: 8,
    comments: 2,
    bookmarks: 1,
  },
  {
    id: '5',
    user: 'Emily Chen',
    timestamp: '3d ago',
    title: 'Library Renovation Update',
    content:
      'The main library will be closed for renovation starting next week. Please plan your study sessions accordingly.',
    tags: ['Updates'],
    likes: 8,
    comments: 2,
    bookmarks: 1,
  },
];

export default function Feed() {
  const [selectedTag, setSelectedTag] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [isSwitchOn, setIsSwitchOn] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Latest');

  const filteredPosts = POSTS.filter(post => {
    const matchesTag = selectedTag === 'All' || post.tags.includes(selectedTag);
    const matchesSearch =
      post.title.toLowerCase().includes(searchText.toLowerCase()) ||
      post.content.toLowerCase().includes(searchText.toLowerCase());
    return matchesTag && matchesSearch;
  });

  const FILTERS = ['All', 'Hot', 'Recommended'];

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

      {/* New Post */}
      <View style={styles.newPostContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="What's on your mind?"
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#999"
        />
        <FontAwesome name="pencil" size={20} color="#666" />
      </View>

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
              onPress={() => setSelectedFilter(filter)}
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
      <FlatList
        data={filteredPosts}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            styles={styles}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
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
  newPostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 0.2,
    borderColor: '#E5E7EB',
    height: 50,
    marginHorizontal: 15,
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  searchInput: {
    marginLeft: 10,
    flex: 1,
    fontSize: 16,
    color: '#222',
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
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    transitionDuration: '200ms',
    transform: [{ scale: 1 }],
   
  },
  postHeader: {
  
    flexDirection: 'row',
    marginBottom: 10,
    fontFamily: 'Roboto_400Regular',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    backgroundColor: '#57EC6B',
    width: 30,
    height: 30,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userAvatarText: {
    color: '#fff',
    fontWeight: '300',
    fontSize: 15,
  },
  userName: {
    fontWeight: '700',
    fontSize: 14,
    color: '#222',
  },
  postTimestamp: {
    marginLeft:15,
    fontSize: 12,
    color: '#999',
  },
  postTitle: {
    fontWeight: '600',
    fontSize: 20,
    marginBottom: 10,
    color: '#222',
  },
  postContent: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  postTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  postTagBadge: {
    backgroundColor: '#e0f2f1',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 6,
  },
  postTagText: {
    fontSize: 12,
    color: '#00796b',
    fontWeight: '600',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    marginLeft: 6,
    color: '#666',
    fontSize: 13,
  },
});
