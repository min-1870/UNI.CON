import {View, Platform, TextStyle} from 'react-native';
import { StyleSheet, TextInput, Pressable,  ScrollView, Image } from 'react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import {  CommonActions } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { ImagePickerResult } from 'expo-image-picker'
import { useThemeColor } from '@/hooks/useThemeColor';
import ThemedButton from '@/components/ThemedButton';
import ThemedView from '@/components/ThemedView';
import ThemedCard from '@/components/ThemedCard';
import ThemedInput from '@/components/ThemedInput';
import * as ImagePicker from 'expo-image-picker'; 
import ThemedText from '@/components/ThemedText';
import type { TabParamList } from './_layout';
import ThemedTag from '@/components/ThemedTag';
import {fetchAPI} from "@/components/Utils";
import URLs from "@/constants/Urls";
import { useToast } from '@/contexts/ToastContext';
import { ThemedDropdown, Option } from '@/components/ThemedDropdown';
const postOptions: Option[] = [
  { label: 'Article', value: 'article' },
  { label: 'Market Place', value: 'marketplace' },
];
const statusOptions: Option[] = [
  { label: 'Selling', value: 'selling' },
  { label: 'Pending', value: 'pending' },
  { label: 'Sold', value: 'sold' },
];

export default function NewArticlePage() {
  
  const { showToast } = useToast();
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList, 'post'>>();
  const [title, setTitle] = useState('');
  const [postType, setPostType] = useState('article');
  const [status, setStatus] = useState('selling');
  const [price, setPrice] = useState('');
  const [contact, setContact] = useState('');
  const [bodies,  setBodies]  = useState<string[]>([""]);
  const [imgResults,  setImgResults]  = useState<ImagePickerResult[]>([]);
  const [inputHeights, setInputHeights] = useState<number[]>([]);
  const [unicon, setUnicon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [raw, setRaw] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [ratios, setRatios] = useState<number[]>([]);

  const tagInputRef = useRef<TextInput>(null);

  const default_card_background_color = useThemeColor({}, 'DEFAULT_CARD_BACKGROUND');
  const place_holder_color = useThemeColor({}, 'DEFAULT_GRAY_TEXT');
  const default_text_color = useThemeColor({}, 'DEFAULT_TEXT');
  const ALWAYS_BLACK = useThemeColor({}, 'ALWAYS_BLACK');
  
  const handlePost = async () => {
    setLoading(true);
    if (!title || !bodies) {
      showToast({
        type: 'error',
        text1: `Title and body cannot be empty!`,
      });
      setLoading(false);
      return;
    }
    if (postType === 'marketplace') {
      if (!price || !contact) {
        showToast({
          type: 'error',
          text1: `Price and contact cannot be empty!`,
        });
        setLoading(false);
        return;
      }
    }
    
    const uploadedImageUrls = await Promise.all(
      imgResults.slice(0, bodies.length - 1).map(img => handleUploadImgs(img))
    );

    let body_raw = '';
    bodies.forEach((body, idx) => {
      body_raw += body;
      if (idx + 1 < bodies.length) {
        const imgUrl = uploadedImageUrls[idx];
        if (imgUrl) {
          body_raw += `\n![](${imgUrl})\n`;
        }
      }
    });

    const response = await fetchAPI(
      URLs.ARTICLE(), 
      {
        method: 'POST',
        token: true,
        body: { 
          title: title, 
          body: body_raw, 
          unicon: postType === 'article' ? unicon : false,
          tag: tags,
          marketplace: postType === 'marketplace' ? true : false,
          price: postType === 'marketplace' ? price : undefined,
          contact: postType === 'marketplace' ? contact : undefined,
        },
      }
    );
    if (!response.error){
      setTitle('');
      setBodies(['']);
      setImgResults([])
      setInputHeights([])
      setUnicon(false);
      setRaw('');
      setTags([]);
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [
            { name: '(tabs)' }, 
            { 
              name: 'article/[id]',
              params: { id: String(response.data.id) },
            },
          ],
        })
      );
    }else{
      showToast({
        type: 'error',
        text1: `Sorry, ${response.data.detail}!`,
      });
    }    
    setLoading(false);
  };  

  const handleUploadImgs = async (imgResult: ImagePickerResult) => {
    setLoading(true);

    if (!imgResult.assets || imgResult.assets.length === 0) {
      showToast({
        type: 'error',
        text1: 'No image asset found!',
      });
      setLoading(false);
      return;
    }

    const asset = imgResult.assets[0]
    const { uri, mimeType, fileName } = asset
    const type = mimeType ?? 'image/jpeg'
    const name = fileName ?? uri.split('/').pop()
    const fileKey = `uploads/${Date.now()}_${name}`
    const getResponse = await fetchAPI(
      URLs.ARTICLE_IMG(`?file_name=${encodeURIComponent(fileKey)}&file_type=${encodeURIComponent(type)}`), 
      {
        method: 'GET',
        token: true,
        body: {},
      }
    );
    if (!getResponse.error){
      const file = await fetch(uri)
      const blob = await file.blob()
      const putResponse = await fetch(getResponse.data.uploadUrl, {
          method: 'PUT',
          body: blob,
          headers: { 'Content-Type': type },
      });
      if (putResponse.ok){
        return getResponse.data.publicUrl
      }else{
        showToast({
          type: 'error',
          text1: `Sorry, the image uploading was unsuccessful!`,
        });
      }
    }else{
      showToast({
        type: 'error',
        text1: `Hi, ${getResponse.data.detail}!`,
      });
    }
    setLoading(false);
    return null
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
      backgroundColor: default_card_background_color, // navbar background
      // shadowColor: 'transparent', // remove iOS bottom border
      elevation: 0, // remove Android shadow
      borderWidth: 0, 
      },
      headerTitle: () => (
        <ThemedDropdown
          options={postOptions}
          selectedValue={postType}
          onValueChange={(v)=>{setPostType(v);}}
          style={{width:150}}
        />
      ),
      headerTintColor: default_text_color,
      headerLeft: () => (
        <Feather 
          name="arrow-left" 
          size={24} 
          color={default_text_color}
          onPress={() => {
            setTitle('');
            setBodies(['']);
            setImgResults([])
            setInputHeights([])
            setUnicon(false);
            setRaw('');
            setTags([]);
            navigation.navigate('home');
          }}
          style={{ marginLeft: 20 }}
        />
      ),

      headerRight: () => (
        <ThemedText
          size='smaller'
          font='textMedium'
          onPress={handlePost} 
          disabled={loading}
          style={{ marginRight: 30 }}
        >
          Post
        </ThemedText>
      ),
      headerTitleAlign: 'center',
    });
  }, [navigation, handlePost, loading]);

  useEffect(() => {
    Promise.all(
      imgResults.map(
        img =>
          new Promise<number>(resolve => {
            const uri = img && 'assets' in img && img.assets && img.assets[0]?.uri
              ? img.assets[0].uri
              : undefined;
            if (uri) {
              Image.getSize(
                uri,
                (w, h) => resolve(w / h),
                () => resolve(16 / 9) // fallback
              );
            } else {
              resolve(16 / 9); // fallback if no uri
            }
          })
      )
    ).then(setRatios);
  }, [imgResults]);

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setBodies(prevBodies => [...prevBodies, ""])
      setInputHeights(prevInputHeights => [...prevInputHeights, 30])
      setImgResults(prevImgResults => [...prevImgResults, result])
    }
  };

  const handleCurrentBody = async (text: string, idx: number) => {

    setInputHeights(prev => {
      const newHeights = [...prev];
      newHeights[idx] = ((text.match(/\n/g) || []).length + 1) * 30;
      console.log(newHeights[idx])
      return newHeights;
    });

    setBodies((prevBodies) =>
      prevBodies.map((body, i) => (i === idx ? text : body))
    );
    
  }

  const handleRemoveImg = async (idx: number) => {
    setImgResults(prevImgResults => prevImgResults.filter((_, i) => i !== idx))
    setBodies((prevBodies) => {
      if (prevBodies.length < 2 || idx < 0 || idx >= prevBodies.length - 1) return prevBodies;
      const mergedBody = prevBodies[idx] + "\n" + prevBodies[idx + 1];
      return [
      ...prevBodies.slice(0, idx),
      mergedBody,
      ...prevBodies.slice(idx + 2),
      ];
    });

    setInputHeights((prevInputHeights) => {
      const mergedHeight = prevInputHeights[idx]  + prevInputHeights[idx + 1];
      if (prevInputHeights.length == 2){
        return [mergedHeight]
      } else {
        return [
        ...prevInputHeights.slice(0, idx),
        mergedHeight,
        ...prevInputHeights.slice(idx + 2),
        ];
      };
    });
  }

  const removeTag = (indexToRemove: number) => {
    setTags(prev => prev.filter((_, i) => i !== indexToRemove));
  };
  const removeOutline = {
        ...(Platform.OS === 'web'
          ? ({ outlineStyle: 'none' } as TextStyle)
          : {}),
  };
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
    },
    cardContainer: {
      minHeight: 600,
      display: 'flex',
    },
    textAreasContainer:{
      display: 'flex',
      flex: 1,
    },
    uniconContainer:{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 10,
    },
    textWrapper:{
      flex: 1,
      justifyContent: 'center',
      alignSelf: 'center',
      flexDirection: 'column',
      alignItems: 'center',
    },
    titleTextArea: {
      borderWidth: 0,         
      borderRadius: 4,
      fontSize: 20,
      color: default_text_color,
      paddingVertical: 10,
    },
    activeBodyTextArea: {
      marginBottom: 20, 
      flex:1
    },
    bodyTextArea: {
      borderWidth: 0,
      borderRadius: 4,
      fontSize: 16,
      color: default_text_color,
      lineHeight: 30
    },
    tagAreaContainer:{
      padding: 20,
      gap: 20,
      display: 'flex',
      minHeight: 200,
      flex: 1,
    },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 5,
      marginTop   : 10,
    },
    tagTextArea: {
      color: default_text_color,
      flexGrow: 1,
      minWidth: 80,
      fontSize: 16,
      padding: 4,
      borderWidth: 0,
    },
    pressableWrapper: {
      height: '100%',
      display: 'flex',
    },
    img: {
      width: '100%',
      borderRadius: 20,
      marginVertical: 10,
      maxHeight: 1000,
    },
    marketPlaceContainer: {
      gap: 20,
      marginTop: 20,
    },
    marketPlaceContactWrapper: {
      display: 'flex',
      gap: 10,
    },
    marketPlaceSPWrapper: {
      display: 'flex',
      flexDirection: 'row',
    },
    marketPlaceSP: {
      flex:1,
      gap: 10,
    }
  });

  return (
    <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
    >
    <ThemedView style={styles.container}>
      <ThemedCard type='detail' style={styles.cardContainer}>
        <View style={styles.textAreasContainer}>
          <TextInput
            style={[removeOutline, styles.titleTextArea]}
            underlineColorAndroid="transparent" 
            numberOfLines={6}            
            placeholder={postType === 'article' ? "Title of the article" : "Title of the market place"}
            placeholderTextColor={place_holder_color}
            value={title}
            onChangeText={setTitle}
            textAlignVertical="top"      
            scrollEnabled                
          />
          {bodies.map((bodyText, idx) => {
            
            const isLastBlock = idx === bodies.length - 1;

            return (
              
              <React.Fragment key={`content-block-${idx}`}>
                <TextInput
                    style={[
                        styles.bodyTextArea,
                        { height: inputHeights[idx] || undefined },
                        removeOutline,
                        isLastBlock && styles.activeBodyTextArea
                    ]}
                    underlineColorAndroid="transparent"
                    multiline
                    placeholder={isLastBlock ? "Continue writing..." : ""}
                    placeholderTextColor={place_holder_color}
                    value={bodyText}
                    onChangeText={(text) => handleCurrentBody(text, idx)}
                    textAlignVertical="top"
                    scrollEnabled={false} 
                    onKeyPress={({ nativeEvent }) => {
                      if (nativeEvent.key === 'Backspace' && bodyText === '' && idx > 0) {
                        handleRemoveImg(idx-1);
                      }
                    }}
                />
                {imgResults[idx]?.assets && imgResults[idx].assets[0]?.uri && (
                  <Pressable onPress={() => handleRemoveImg(idx)}>
                    <Image
                      source={{ uri: imgResults[idx].assets![0].uri }}
                      style={[styles.img, { aspectRatio: ratios[idx] || 16 / 9 }]}
                    />
                  </Pressable>
                )}
              </React.Fragment>
            );
          })}
        </View>
        <View style={styles.uniconContainer}>
            {postType === 'article' && (
              <View style={styles.textWrapper}>
                
                <ThemedText  size='smaller' color='gray'>
                  By enabling the unicon option your post will be
                </ThemedText>
                <ThemedText  size='smaller' color='gray'>
                  visible to other supported university students
                </ThemedText>
              </View>
            )}
          <ThemedButton
            type={'toggled'}
            onPress={() => handlePickImage()}
          >
            <MaterialIcons
              name="add-to-photos" 
              size={17} 
              color={ALWAYS_BLACK}
            />
          </ThemedButton>
          {postType === 'article' && (
            <ThemedButton
              type={unicon ? 'toggled' : 'unToggled'}
              onPress={() => {setUnicon(!unicon);}}
            >
              <ThemedText size='smaller' color={unicon ? 'black' : 'gray' }>UNI.CON</ThemedText>
            </ThemedButton>
          )}
        </View>
          {postType === 'marketplace' && (
            <View style={styles.marketPlaceContainer}>
            <View style={styles.marketPlaceSPWrapper}>
              <View style={styles.marketPlaceSP}>
                <ThemedText size='bigger' font='textMedium' color='gray'>Status</ThemedText>
                <ThemedDropdown
                  options={statusOptions}
                  selectedValue={status}
                  onValueChange={(v)=>{setStatus(v);}}
                  style={{width:90}}
                />
              </View>
              <View style={styles.marketPlaceSP}>
                <ThemedText size='bigger' font='textMedium' color='gray'>Price</ThemedText>
                <ThemedInput
                  placeholder="Price"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
              <View style={styles.marketPlaceContactWrapper}>
                <ThemedText size='bigger' font='textMedium' color='gray'>Contact</ThemedText>
                <ThemedInput
                  placeholder="Email or Phone"
                  value={contact}
                  onChangeText={setContact}
                  keyboardType="default"
                />
              </View>
            </View>
          )}
      </ThemedCard>
      <View style={styles.tagAreaContainer} >
        <Pressable  style={styles.pressableWrapper} onPress={() => tagInputRef.current?.focus()} pointerEvents="box-only" >
        <ThemedText size='h3' font='displayBold'>Add Tags</ThemedText>
        <View style={styles.chipContainer}>
          {tags.map((tag, i) => (
            <Pressable onPress={() => removeTag(i)}>
              <ThemedTag unClickable={true} text={tag} type={'default'} key={i}/>
            </Pressable>
          ))}
          
            
          <TextInput
            style={[removeOutline, styles.tagTextArea]}
            value={raw}
            onChangeText={(text) => {
              if (text.endsWith(' ') || text.endsWith(',')) {
                const word = text.trim().toLowerCase();
                if (word.length > 0 && !tags.includes(word)) {
                  setTags([...tags, word]);
                }
                setRaw('');
              } else {
                setRaw(text);
              }
            }}
            ref={tagInputRef}
            placeholder="Type and hit space"
            placeholderTextColor={place_holder_color}
            autoCorrect={false}
            autoCapitalize="none"
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace' && raw.length === 0 && tags.length > 0) {
                setTags(prevTags => prevTags.slice(0, -1));
              }
            }}
          />
        </View>
        </Pressable>
      </View>
    </ThemedView>
    </ScrollView>
  );
}

