import { StyleSheet, TextInput, Pressable,  ScrollView, Image } from 'react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { ThemedDropdown, Option } from '@/components/ThemedDropdown';
import * as ImageManipulator from 'expo-image-manipulator';
import {  CommonActions } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { Feather, Octicons } from '@expo/vector-icons';
import {View, Platform, TextStyle} from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ImagePickerResult } from 'expo-image-picker';
import ThemedButton from '@/components/ThemedButton';
import { useRoute } from '@react-navigation/native';
import { useToast } from '@/contexts/ToastContext';
import ThemedInput from '@/components/ThemedInput';
import ThemedView from '@/components/ThemedView';
import ThemedCard from '@/components/ThemedCard';
import * as ImagePicker from 'expo-image-picker'; 
import ThemedText from '@/components/ThemedText';
import ThemedTag from '@/components/ThemedTag';
import type { TabParamList } from './_layout';
import {fetchAPI} from "@/components/Utils";
import { useFonts } from 'expo-font';
import URLs from "@/constants/Urls";
const postOptions: Option[] = [
  { label: 'Article', value: 'article' },
  { label: 'Market Place', value: 'marketplace' },
];
const statusOptions: Option[] = [
  { label: 'Selling', value: 'selling' },
  { label: 'Pending', value: 'pending' },
  { label: 'Sold', value: 'sold' },
];
const contactOptions: Option[] = [
  { label: 'Comment', value: 'comment' },
  { label: 'Phone', value: 'phone' },
  { label: 'Other', value: 'other' },
];

export default function NewArticlePage() {
  const { showToast } = useToast();
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList, 'post'>>();

  const [title, setTitle] = useState('');
  const [bodies,  setBodies]  = useState<string[]>([""]);
  const [inputHeights, setInputHeights] = useState<number[]>([]);
  const [unicon, setUnicon] = useState(false);
  
  const [imgResults,  setImgResults]  = useState<(ImagePickerResult|string)[]>([]);
  const [ratios, setRatios] = useState<number[]>([]);
  
  const [postType, setPostType] = useState('article');
  const [status, setStatus] = useState('selling');
  const [price, setPrice] = useState('');
  const [contact, setContact] = useState('');
  const [contactType, setContactType] = useState('comment');

  const [tags, setTags] = useState<string[]>([]);
  const tagInputRef = useRef<TextInput>(null);
  const [raw, setRaw] = useState('');

  const [loading, setLoading] = useState(false);

  const articleId = (useRoute().params as { id?: string })?.id || null;

  const default_card_background_color = useThemeColor({}, 'DEFAULT_CARD_BACKGROUND');
  const place_holder_color = useThemeColor({}, 'DEFAULT_GRAY_TEXT');
  const default_text_color = useThemeColor({}, 'DEFAULT_TEXT');
  const ALWAYS_BLACK = useThemeColor({}, 'ALWAYS_BLACK');
  
  useEffect(() => {
    articleId && fetchArticle();
  }, [articleId]);

  const fetchArticle = async () => {

    function parseMarkdownImages(raw: string): {
      bodies: string[];
      imgUris: string[];
    } {  
      const imgRegex = new RegExp(
        `!\\[[^\\]]*\\]\\((${URLs.BUCKET}[^)]+)\\)`,
        'g'
      );
      const bodies: string[] = [];
      const imgUris: string[] = [];
      let lastIndex = 0;
      let m: RegExpExecArray | null;

      while ((m = imgRegex.exec(raw)) !== null) {
        bodies.push(raw.slice(lastIndex, m.index).trim());
        imgUris.push(m[1]);
        lastIndex = m.index + m[0].length;
      }
      bodies.push(raw.slice(lastIndex).trimStart());

      return { bodies, imgUris };
    }

    setLoading(true);
    const response = await fetchAPI(
      URLs.ARTICLE(String(articleId)), {
      method: 'GET',
      token: true,
    });

    if (!response.error) {
      const { bodies, imgUris } = parseMarkdownImages(response.data.results.article.body);
      setBodies(bodies);
      setImgResults(imgUris);
      setTitle(response.data.results.article.title);
      setUnicon(response.data?.results?.article?.unicon);
      setTags(response.data.results.article.tag);
      setInputHeights(prev => {
      const newHeights = [...prev];
        bodies.forEach((body, idx) => {
          newHeights[idx] = ((body.match(/\n/g) || []).length + 1) * 30;
        });
        return newHeights;
      });
      console.log(response.data.results.article);
      if (response.data.results.article.marketplace) {
        setPostType('marketplace');
        const responseStatus = response.data.results.article.status;
        responseStatus == 0
          ? setStatus('selling')
          : responseStatus == 1 
            ? setStatus('pending')
            : setStatus('sold');
        setPrice(response.data.results.article.price?.toString() || '');
        setContact(response.data.results.article.contact || '');
        setContactType(response.data.results.article.contact_type || 'comment');
      }
    } else {
      showToast({
        type: 'error',
        text1: `Hi, ${response.data.detail}!`,
      });
    }
    setLoading(false);
  };
  
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
      if (!price || (contactType != 'comment' && !contact)) {
        showToast({
          type: 'error',
          text1: `Price and contact cannot be empty!`,
        });
        setLoading(false);
        return;
      }
    }
    
    const uploadedImageUrls = await Promise.all(
      imgResults
        .slice(0, bodies.length - 1)
        .map(img => (typeof img !== 'string' ? handleUploadImgs(img) : img))
    );

    let body_raw = '';
    let img_upload_success = true;
    bodies.forEach((body, idx) => {
      body_raw += body;
      if (idx + 1 < bodies.length) {  
        const imgUrl = uploadedImageUrls[idx];
        if (imgUrl) {
          body_raw += `\n![](${imgUrl})\n`;
        } else {
          img_upload_success = false;
        }
      }
    });
    if (!img_upload_success) {
      showToast({
        type: 'error',
        text1: `Sorry, the image uploading was unsuccessful!`,
      });
      setLoading(false);
      return;
    }

    const response = await fetchAPI(
      articleId ? URLs.ARTICLE(String(articleId) + '/') : URLs.ARTICLE(), 
      {
        method: articleId ? 'PATCH':'POST',
        token: true,
        body: {
          title: title,
          body: body_raw,
          unicon: postType === 'article' ? unicon : false,
          tag: tags,
          marketplace: postType === 'marketplace' ? true : false,
          price: price ? parseFloat(price) : 0,
          contact: contact || 'Leave a comment',
          status: status === 'selling' ? 0 : status === 'pending' ? 1 : 2,
        }
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
              params: { id: articleId ? articleId : String(response.data.id) },
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
      return;
    }

    const asset = imgResult.assets[0]
    const { uri, mimeType, fileName } = asset
    const name = fileName ?? uri.split('/').pop()
    const fileKey = `uploads/${Date.now()}_${name}`
    const isPNG = mimeType === 'image/png';
    const outputFormat = isPNG
      ? ImageManipulator.SaveFormat.PNG
      : ImageManipulator.SaveFormat.JPEG;
    const finalMimeType = isPNG ? 'image/png' : 'image/jpeg';
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 800 } }],
      {
        compress: isPNG ? 1 : 0.7,
        format: outputFormat
      }
    );


    const getResponse = await fetchAPI(
      URLs.ARTICLE_IMG(`?file_name=${encodeURIComponent(fileKey)}&file_type=${encodeURIComponent(finalMimeType)}`), 
      {
        method: 'GET',
        token: true,
        body: {},
      }
    );
    if (!getResponse.error){
      const file = await fetch(manipulated.uri)
      const blob = await file.blob()
      try {
        const putResponse = await fetch(getResponse.data.uploadUrl, {
            method: 'PUT',
            body: blob,
            headers: { 'Content-Type': finalMimeType },
        });
        if (putResponse.ok){
          return getResponse.data.publicUrl
        }
      } catch (error) {
      }
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
        articleId ? (
          <ThemedText size="bigger" font="textSemibold">
            Edit {postType === 'article' ? 'Article' : 'Market Place'}
          </ThemedText>
        ) : (
          <ThemedDropdown
            options={postOptions}
            selectedValue={postType}
            onValueChange={(v)=>{setPostType(v);}}
            style={{width:200}}
            size='bigger'
            font='textSemibold'
          />
        )
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
            setPostType('article');
            navigation.navigate('home');
          }}
          style={{ marginLeft: 20 }}
        />
      ),

      headerRight: () => (
        <Pressable
            onPress={handlePost} 
            disabled={loading}>
          <ThemedText
            size='smaller'
            font='textMedium'
            color={loading ? 'gray' : 'default'}
            style={{ marginRight: 30 }}
          >
            {articleId ? 'Save' : 'Post'}
          </ThemedText>
        </Pressable>
      ),
      headerTitleAlign: 'center',
    });
  }, [navigation, handlePost, loading]);

  useEffect(() => {
    Promise.all(
      imgResults.map(
        img =>
          new Promise<number>(resolve => {
            let uri: string | undefined;
            if (typeof img === 'string') {
              uri = img;
            } else if (img && 'assets' in img && img.assets && img.assets[0]?.uri) {
              uri = img.assets[0].uri;
            }
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

  const handleHeights = async (height: number, idx: number) => {
    setInputHeights(prev => {
      const newHeights = [...prev];
      newHeights[idx] = height;
      return newHeights;
    });
  }

  const handleCurrentBody = async (text: string, idx: number) => {
    setBodies((prevBodies) =>
      prevBodies.map((body, i) => (i === idx ? text : body))
    );
  }

  const handleRemoveImg = async (idx: number) => {
    setImgResults(prevImgResults => prevImgResults.filter((_, i) => i !== idx))
    setBodies((prevBodies) => {
      if (prevBodies.length < 2 || idx < 0 || idx >= prevBodies.length - 1) return prevBodies;
      const mergedBody = prevBodies[idx] + (prevBodies[idx + 1].length > 0 ? "\n" + prevBodies[idx + 1] : '');
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
  
  const [fontsLoaded] = useFonts({
    textRegular: require('../../assets/fonts/SF-Pro-Text-Regular.otf'),
  });
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
      minHeight: 500,
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
      marginTop: 50,
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
      fontFamily: 'textRegular',
    },
    tagAreaContainer:{
      paddingHorizontal: 20,
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
      marginHorizontal:0,
      gap: 20,
    },
    marketPlaceSPWrapper: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    marketPlaceTextWrapper: {
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
                        removeOutline,
                        inputHeights[idx] > 0 ? { height: inputHeights[idx]+30 } : {},
                    ]}
                    underlineColorAndroid="transparent"
                    multiline
                    placeholder={isLastBlock ? "Continue writing..." : ""}
                    placeholderTextColor={place_holder_color}
                    value={bodyText}
                    onChangeText={(text) => {
                      handleCurrentBody(text, idx);
                    }}
                    textAlignVertical="top"
                    scrollEnabled={false} 
                    onKeyPress={({ nativeEvent }) => {
                      if (nativeEvent.key === 'Backspace' && bodyText === '' && idx > 0) {
                        handleRemoveImg(idx-1);
                      }
                    }}
                />
                <ThemedText
                  size='bigger'
                  style={{
                    position: 'absolute',
                    // top: 200,
                    // opacity: 0.1,
                    opacity: 0,
                    width: '100%',
                  }}
                  onLayout={(e) => {
                    const h = e.nativeEvent.layout.height;
                    handleHeights(h, idx);
                  }}
                >{bodyText}</ThemedText>
                {imgResults[idx] && typeof imgResults[idx] === 'string' ? (
                    <Pressable onPress={() => handleRemoveImg(idx)}>
                      <Image
                        source={{ uri: imgResults[idx] }}
                        style={[styles.img, { aspectRatio: ratios[idx] || 16 / 9 }]}
                      />
                    </Pressable>
                  ) : (
                    typeof imgResults[idx] !== 'string' && imgResults[idx]?.assets && imgResults[idx].assets[0]?.uri && (
                      <Pressable onPress={() => handleRemoveImg(idx)}>
                        <Image
                          source={{ uri: imgResults[idx].assets![0].uri }}
                          style={[styles.img, { aspectRatio: ratios[idx] || 16 / 9 }]}
                        />
                      </Pressable>
                    )
                )}
              </React.Fragment>
            );
          })}
        </View>
        <View style={styles.uniconContainer}>
            {postType === 'article' ? (
              <View style={styles.textWrapper}>
                <ThemedText  size='smaller' color='gray'>
                  By enabling the unicon option your post will be
                </ThemedText>
                <ThemedText  size='smaller' color='gray'>
                  visible to other supported university students
                </ThemedText>
              </View>
            ) : (
              <View style={styles.textWrapper}>
                <ThemedText size='smaller' color='gray'>
                  Please note: UNI.CON does not assume responsibility 
                </ThemedText>
                <ThemedText  size='smaller' color='gray'>
                  for any trade or transaction conducted through this platform.
                </ThemedText>
              </View>
            )}
          <ThemedButton
            type={'toggled'}
            onPress={() => handlePickImage()}
          >
            <Octicons
              name="diff-added" 
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
      </ThemedCard>
          {postType === 'marketplace' && (
            <ThemedCard style={styles.marketPlaceContainer} >
              <View style={[styles.marketPlaceTextWrapper,{zIndex:1000}]}>
                <ThemedText font='textMedium' color='gray'>Contact</ThemedText>
                <View style={{flexDirection:'row', gap:10, alignItems:'center'}}>
                  <ThemedDropdown
                    options={contactOptions}
                    selectedValue={contactType}
                    onValueChange={(v)=>{setContactType(v);}}
                    style={{width:120, zIndex:1000}}
                  />
                  <ThemedInput
                    placeholder={contactType === 'phone' ? "0400 000 000" : contactType === 'comment' ? "Leave a comment" : "Your contact"}
                    value={contactType === 'comment' ? '' : contact}
                    onChangeText={setContact}
                    keyboardType="default"
                    editable={contactType !== 'comment'}
                  />
                </View>
              </View>
              <View style={styles.marketPlaceSPWrapper}>
                <View style={styles.marketPlaceTextWrapper}>
                  <ThemedText  font='textMedium' color='gray'>Price</ThemedText>
                  <View style={{flexDirection:'row', gap:10, alignItems:'center'}}>
                  <ThemedInput
                    placeholder="12.33"
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                  />
                  <ThemedText font='textMedium' color='gray'>AUD</ThemedText>
                  </View>
                </View>
                <View style={[styles.marketPlaceTextWrapper,{flexDirection:'column', justifyContent:'space-between'}]}>
                  <ThemedText  font='textMedium' color='gray'>Status</ThemedText>
                  <ThemedDropdown
                    options={statusOptions}
                    selectedValue={status}
                    onValueChange={(v)=>{setStatus(v);}}
                    style={{width:100}}
                    editable={articleId ? true : false}
                  />
                </View>
              </View>
            
            </ThemedCard>
          )}
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

