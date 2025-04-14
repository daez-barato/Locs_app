import { useVideoPlayer, VideoView } from 'expo-video';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { View } from 'react-native';
import { StyleSheet } from 'react-native';



type Props = {
  videoSource: string;
}

export default function VideoViewer( {videoSource} : Props) {

  const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
    player.play();
  });

  // Pause the video when the tab is unfocused
  useFocusEffect(
    useCallback(() => {
      // When the screen is focused, play the video
      player.play();

      return () => {
        // When the screen is unfocused, pause the video
        player.pause();
      };
    }, [player])
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
    height: '100%',
    width: '100%',
  },
  video: {
    height: '100%',
    width: '100%',
  },
});