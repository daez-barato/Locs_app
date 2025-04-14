import React from "react";
import { useThemeConfig } from "@/components/ui/use-theme-config";
import { StyleSheet, View, Text, Dimensions } from "react-native";



import { FlatList } from "react-native-gesture-handler";
import { RTCView } from "react-native-webrtc";
import { useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "@/components/custom-button";
import { useFocusEffect } from "expo-router";


// define stream object
interface streamItem {
  id: string,
  streamURL: string,
  streamTitle: string,
  streamDescription: string,
  streamBetOptions: string[],
}


const streamItemExample = {
  "id": "streamItemExample",
  "streamURL": "streamURL", 
  "streamTitle": "streamTitle", 
  "streamDescription": "streamDescription", 
  "streamBetOptions": ["option1", "option2"]
} as streamItem;

const streamItemExample2 = {
  "id": "streamItemExample2",
  "streamURL": "streamURL2",
  "streamTitle": "streamTitle2",
  "streamDescription": "streamDescription2",
  "streamBetOptions": ["option3", "option4"]
} as streamItem;

const streamItemExample3 = {
  "id": "streamItemExample3",
  "streamURL": "streamURL3",
  "streamTitle": "streamTitle3",
  "streamDescription": "streamDescription3",
  "streamBetOptions": ["option5", "option6"]
} as streamItem;

const streamItemExample4 = {
  "id": "streamItemExample4",
  "streamURL": "streamURL4",
  "streamTitle": "streamTitle4",
  "streamDescription": "streamDescription4",
  "streamBetOptions": ["option7", "option8"]
} as streamItem;

const serverStreams = [
  streamItemExample,
  streamItemExample2,
  streamItemExample3,
  streamItemExample4,
];


export default function Index() {
  const { colors } = useThemeConfig();
  const [ streamList, setStreamList ] = useState<streamItem[]>([]);


  const renderItem = ({ item }: { item: streamItem }) => {
    return (
      <RTCView
        streamURL={item.streamURL}
        style={{ width: "100%", height: "100%", flex: 1}}
        objectFit="cover"
      >
      </RTCView>
    );
  }

  const onViewableItemsChanged = useRef(({ viewableItems }: {viewableItems: any}) => {
    if (viewableItems.length > 0) {
      const currentStream = viewableItems[0].item;
      // Update the stream list with the current stream
      setStreamList((prevStreamList) => {
        const newStreamList = prevStreamList.filter((stream) => stream.id !== currentStream.id);
        return [currentStream, ...newStreamList];
      }
      );
    } else {
      // Reset the stream list if no items are visible
      setStreamList([]);
    }
  });

  useFocusEffect(() => {
    setStreamList([streamItemExample]);
  });


  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.void} ]}>
      <FlatList
        style={{flex: 1,}}
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