import React, { useCallback } from "react";
import { useThemeConfig } from "@/components/ui/use-theme-config";
import { StyleSheet, View, Text} from "react-native";


import { FlatList } from "react-native-gesture-handler";
import { useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "@/components/custom-button";
import { useFocusEffect } from "expo-router";
import { Dimensions } from "react-native";
import VideoViewer from "@/components/video-viewer";


const {width, height} = Dimensions.get("window");

// define stream object
interface streamItem {
  id: string,
  streamURL: string,
  streamTitle: string,
  streamDescription: string,
  streamBetOptions: string[],
  shouldPlay: boolean,
}


const streamItemExample = {
  "id": "streamItemExample",
  "streamURL": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", 
  "streamTitle": "streamTitle", 
  "streamDescription": "streamDescription", 
  "streamBetOptions": ["option1", "option2"]
} as streamItem;

const streamItemExample2 = {
  "id": "streamItemExample2",
  "streamURL": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "streamTitle": "streamTitle2",
  "streamDescription": "streamDescription2",
  "streamBetOptions": ["option3", "option4"]
} as streamItem;

const streamItemExample3 = {
  "id": "streamItemExample3",
  "streamURL": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "streamTitle": "streamTitle3",
  "streamDescription": "streamDescription3",
  "streamBetOptions": ["option5", "option6"]
} as streamItem;

const streamItemExample4 = {
  "id": "streamItemExample4",
  "streamURL": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "streamTitle": "streamTitle4",
  "streamDescription": "streamDescription4",
  "streamBetOptions": ["option7", "option8"],
} as streamItem;

const serverStreams = [
{  ...streamItemExample, shouldPlay: false },
{  ...streamItemExample2, shouldPlay: false },
{  ...streamItemExample3, shouldPlay: false },
{  ...streamItemExample4, shouldPlay: false },
];


export default function Index() {
  const { colors } = useThemeConfig();
  const [ streamList, setStreamList ] = useState<streamItem[]>([]);




  const renderItem = ({ item }: { item: streamItem }) => {
    return (
      <VideoViewer
        videoSource= {item.streamURL}
        shouldPlay= {item.shouldPlay}
      />
    );
  }

  const onViewableItemsChanged = useRef(({ viewableItems }: {viewableItems: Array<{item: streamItem}>}) => {
    if (viewableItems.length > 0){
      setStreamList((prevStreamList) =>
        prevStreamList.map((item) => ({
          ...item,
          shouldPlay: viewableItems.some(
            (viewableItem) => viewableItem.item.id === item.id
          ),
        }))
      );
    }
  });

  useFocusEffect(
    useCallback( () => {
      setStreamList([serverStreams[0], serverStreams[1]]);
    },[])
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.void} ]}>
      <FlatList
        style={{flex: 1, backgroundColor: colors.void, width: "100%"}}
        data={streamList}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled={true}
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate={"fast"}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
      />   

      <CustomButton
        style={styles.betButton}
        label="Bet"
        shape="pill"
        color="primary"
      />
      <View style={[styles.currencyDisplay, {backgroundColor: colors.background}]}>
        <Text
          style={styles.currencyText}
        > 90 $$
        </Text>
      </View>
    </SafeAreaView>  
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    width: "100%",
  },
  betButton: {
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
    width: 100,
  },
  currencyDisplay: {
    flex: 1,
    position: "absolute",
    top: 80,
    right: 40,
    justifyContent: "space-between",
    alignItems: "center",
    padding: 5,
    width: 70,
    height: 30,
    borderRadius: 20,
  },
  currencyText: {
    flex:1 ,
  },
});