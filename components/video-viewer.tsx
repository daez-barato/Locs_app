import { useVideoPlayer, VideoView } from 'expo-video';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { View } from 'react-native';
import { StyleSheet } from 'react-native';
import { Dimensions } from 'react-native';


const {width, height} = Dimensions.get("window");

type Props = {
  videoSource: string;
  shouldPlay: boolean;
}

export default function VideoViewer( {videoSource, shouldPlay} : Props) {

  const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
    if (shouldPlay) {
      player.play();
    } else {
      player.pause();
    }
  });

  // Pause the video when the tab is unfocused
  useFocusEffect(
    useCallback(() => {
      // When the screen is focused, play the video
      if (shouldPlay){
        player.play();
      } else {
        player.pause();
      }
      return () => {
        // When the screen is unfocused, pause the video
        player.pause();
      };
    }, [player, shouldPlay])
  );

  return (
    <View style={styles.container}>
      <VideoView player= {player} style={styles.video} nativeControls={false}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: height,
    width: width,
  },
  video: {
    height: '100%',
    width: '100%',
  },
});