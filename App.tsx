import React, { useState } from 'react';
import {
  View,
  Button,
  PermissionsAndroid,
  Platform,
  TextInput,
  StyleSheet,
} from 'react-native';
import RNFS from 'react-native-fs';
import { FFmpegKit } from 'ffmpeg-kit-react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import GalleryManager from 'react-native-gallery-manager';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const VideoEditor: React.FC = () => {
  const [videoUri, setVideoUri] = useState<string | null>(null); // Updated to include null
  const [backgroundColor, setBackgroundColor] = useState<string>('black');
  const [text, setText] = useState<string>(''); 
  const [scale, setScale] = useState<number>(0.69); 
  const [textPosition, setTextPosition] = useState<number>(50);

  // Request permissions on Android
  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ]);
      if (
        granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] !==
          PermissionsAndroid.RESULTS.GRANTED ||
        granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] !==
          PermissionsAndroid.RESULTS.GRANTED
      ) {
        console.log('Storage permission denied');
      }
    }
  };

  // Request permissions on iOS
  const requestIosPermission = async () => {
    if (Platform.OS === 'ios') {
      const result = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
      if (result !== RESULTS.GRANTED) {
        console.log('iOS Photo Library permission denied');
      }
    }
  };

  // Function to pick video from the gallery
  const pickVideo = async () => {
    try {
      await requestStoragePermission();
      await requestIosPermission();

      const result = await launchImageLibrary({ mediaType: 'video' });
      if (result.assets && result.assets.length > 0) {
        setVideoUri(result.assets[0].uri); // Update state with video URI
      }
    } catch (err) {
      console.error('Error picking video:', err); // Improved error handling
    }
  };

  // Function to get output file path based on platform
  const getOutputPath = () => {
    const dir =
      Platform.OS === 'ios' ? RNFS.DocumentDirectoryPath : RNFS.ExternalDirectoryPath;
    return `${dir}/output_video.mp4`;
  };

  // Function to export the video with background color and text overlay
  const exportVideo = async () => {
    if (!videoUri) {
      console.log('No video URI found'); // Log if no video is selected
      return;
    }

    const outputPath = getOutputPath();
    const ffmpegCommand = `-i "${videoUri}" -vf "scale=iw*${scale}:ih*${scale},format=yuv420p,drawbox=x=0:y=0:w=iw:h=ih:color=${backgroundColor}:t=fill,drawtext=text='${text}':fontcolor=white:x=(w-text_w)/2:y=${textPosition}" -c:a copy "${outputPath}"`;

    const session = await FFmpegKit.execute(ffmpegCommand);
    const returnCode = await session.getReturnCode();

    if (FFmpegKit.isSuccess(returnCode)) {
      console.log('Video exported successfully to:', outputPath);
      saveVideoToGallery(outputPath); // Save the video to gallery
    } else {
      console.log('Error exporting video');
    }
  };

  // Function to save the exported video to the device gallery
  const saveVideoToGallery = async (path: string) => {
    try {
      const result = await GalleryManager.saveVideo(path);
      console.log('Video saved to gallery:', result);
    } catch (error) {
      console.error('Error saving video to gallery:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Pick Video" onPress={pickVideo} />
      <TextInput
        placeholder="Enter text to overlay"
        value={text}
        onChangeText={setText}
        style={styles.input}
      />
      <Button title="Export Video" onPress={exportVideo} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginVertical: 20,
    paddingHorizontal: 10,
  },
});

export default VideoEditor;
