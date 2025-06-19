import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, Pressable, Image, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface CreatePostProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; content: string; hashtags: string[]; images: string[]; unicon: boolean }) => void;
  loading?: boolean;
}

const MAX_LENGTH = 280;
const MAX_IMAGES = 10;

const CreatePost: React.FC<CreatePostProps> = ({ visible, onClose, onSubmit, loading }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hashtag, setHashtag] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [unicon, setUnicon] = useState(false);

  const handleAddHashtag = () => {
    const tag = hashtag.trim().replace(/^#/, '');
    if (tag && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
      setHashtag('');
    }
  };

  const handleHashtagInput = (text: string) => {
    if (text.endsWith(',') || text.endsWith(' ')) {
      setHashtag('');
      handleAddHashtag();
    } else {
      setHashtag(text);
    }
  };

  const handleRemoveHashtag = (tag: string) => {
    setHashtags(hashtags.filter(h => h !== tag));
  };

  const handlePickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      quality: 0.7,
    });
    if (!result.canceled) {
      const uris = result.assets.map(asset => asset.uri);
      setImages([...images, ...uris].slice(0, MAX_IMAGES));
    }
  };

  const handleRemoveImage = (uri: string) => {
    setImages(images.filter(img => img !== uri));
  };

  const handlePost = () => {
    if (title.trim() && content.trim()) {
      onSubmit({ title, content, hashtags, images, unicon });
      setTitle('');
      setContent('');
      setHashtag('');
      setHashtags([]);
      setImages([]);
      setUnicon(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Create Post</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#888" />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.titleInput}
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            maxLength={60}
          />
          <TextInput
            style={styles.textarea}
            placeholder="What's your thoughts?"
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={MAX_LENGTH}
          />
          <View style={styles.hashtagRow}>
            <Ionicons name="pricetag-outline" size={18} color="#bbb" style={{ marginRight: 6 }} />
            <TextInput
              style={styles.hashtagInput}
              placeholder="# Add hashtag"
              value={hashtag}
              onChangeText={handleHashtagInput}
              onSubmitEditing={handleAddHashtag}
              maxLength={30}
            />
            <TouchableOpacity onPress={handleAddHashtag} style={styles.addHashtagBtn}>
              <Ionicons name="add-circle" size={24} color="#57EC6B" />
            </TouchableOpacity>
          </View>
          <View style={styles.hashtagList}>
            {hashtags.map(tag => (
              <Pressable key={tag} style={styles.hashtagBadge} onPress={() => handleRemoveHashtag(tag)}>
                <Text style={styles.hashtagText}>#{tag}</Text>
                <Ionicons name="close-circle" size={16} color="#bbb" style={{ marginLeft: 2 }} />
              </Pressable>
            ))}
          </View>
          <ScrollView horizontal style={styles.imagePreviewRow} showsHorizontalScrollIndicator={false}>
            {images.map(uri => (
              <View key={uri} style={styles.imageThumbBox}>
                <Image source={{ uri }} style={styles.imageThumb} />
                <TouchableOpacity style={styles.removeImageBtn} onPress={() => handleRemoveImage(uri)}>
                  <Ionicons name="close-circle" size={18} color="#e11d48" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < MAX_IMAGES && (
              <TouchableOpacity style={styles.addImageBtn} onPress={handlePickImages}>
                <Ionicons name="image-outline" size={28} color="#bbb" />
              </TouchableOpacity>
            )}
          </ScrollView>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ marginRight: 8 }}>UNI.CON</Text>
            <TouchableOpacity
              onPress={() => setUnicon(!unicon)}
              style={{
                width: 32,
                height: 20,
                borderRadius: 10,
                backgroundColor: unicon ? '#57EC6B' : '#ccc',
                justifyContent: 'center',
                padding: 2,
              }}
            >
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: '#fff',
                  alignSelf: unicon ? 'flex-end' : 'flex-start',
                }}
              />
            </TouchableOpacity>
            <Text style={{ marginLeft: 8, color: '#888', fontSize: 12 }}>
              {unicon ? 'Visible to all universities' : 'Visible to your school only'}
            </Text>
          </View>
          <View style={styles.footerRow}>
            <Text style={styles.charCount}>{content.length}/{MAX_LENGTH}</Text>
            <TouchableOpacity
              style={[styles.postBtn, (!title.trim() || !content.trim()) && { backgroundColor: '#b7eac2' }]}
              onPress={handlePost}
              disabled={!title.trim() || !content.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.postBtnText}>Post</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    width: 370,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  titleInput: {
    fontSize: 17,
    color: '#222',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    fontWeight: '600',
  },
  textarea: {
    minHeight: 120,
    fontSize: 16,
    color: '#222',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  hashtagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  hashtagInput: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    backgroundColor: 'transparent',
    paddingVertical: 8,
  },
  addHashtagBtn: {
    marginLeft: 4,
  },
  hashtagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 6,
  },
  hashtagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2f1',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  hashtagText: {
    fontSize: 13,
    color: '#00796b',
    fontWeight: '600',
  },
  imagePreviewRow: {
    flexDirection: 'row',
    marginBottom: 8,
    minHeight: 60,
  },
  imageThumbBox: {
    position: 'relative',
    marginRight: 8,
  },
  imageThumb: {
    width: 54,
    height: 54,
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  removeImageBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 2,
    zIndex: 2,
  },
  addImageBtn: {
    width: 54,
    height: 54,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  charCount: {
    flex: 1,
    textAlign: 'right',
    color: '#888',
    fontSize: 13,
    marginRight: 12,
  },
  postBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#57EC6B',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  postBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default CreatePost; 