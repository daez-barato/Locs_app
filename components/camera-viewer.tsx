import React, { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { View, StyleSheet, Text, Button } from "react-native"
import { useThemeConfig } from "./ui/use-theme-config";
import CustomButton from "./custom-button";
import { useFocusEffect } from "expo-router";
import { useRouter } from "expo-router";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";

import { useCamera } from "./useCamera";
import { FlatList, TextInput } from "react-native-gesture-handler";
import BetOptionModal from "./bet-option-modal";

export default function CameraViewer() {
    const { colors } = useThemeConfig();
    const router = useRouter();
    const bottomMenuSnapPoints = ["3%", "50%"];
    const bottomMenuRef = useRef<BottomSheet>(null);
    const [betOptionList, setBetOptionList] = useState<(string | null )[]>([null]);
    const [isModalVisible, setIsModalVisible] = useState(false); // State to control modal visibility
    const [newBetName, setNewBetName] = useState<string>(""); // State for the new bet name


    const {
        stream,
        isFrontCamera,
        startCamera,
        stopCamera,
        rotateCamera,
    } = useCamera();

    const startCameraRef = useRef(startCamera);
    const stopCameraRef = useRef(stopCamera);

    useEffect(() => {
        startCameraRef.current = startCamera;
        stopCameraRef.current = stopCamera;
    }, [startCamera, stopCamera]);

    useFocusEffect(
        useCallback(() => {
            startCameraRef.current(); // Use the ref to call startCamera
            return () => {
                stopCameraRef.current(); // Use the ref to call stopCamera
            };
        }, []) // No dependencies to avoid re-triggering
    );

    // Connect to server and other logic
    function startStream() {
        console.log("Starting stream...");
    }

    const addBetOption = () => {
        setIsModalVisible(true); // Show the modal
    };

    // Confirm adding the bet
    const confirmAddBetOption = (betName: string) => {
        if (betName.trim()) {
            setBetOptionList((prevList) => [...prevList, betName]); // Add the new bet
            setNewBetName(""); // Clear the input
            setIsModalVisible(false); // Close the modal
        }
    };

    // Cancel adding the bet
    const cancelAddBetOption = () => {
        setNewBetName(""); // Clear the input
        setIsModalVisible(false); // Close the modal
    };

    const removeBetOption = (index: number) => {
        setBetOptionList((prevList) => prevList.filter((_, i) => i !== index));
    };

    const renderBetOption = useCallback(
            ({ item, index}: { item: string | null; index: number }) => (
            item ? (
                <View style={[styles.betOptionStyle, {
                backgroundColor: colors.background,
                borderColor: colors.void,
                position: "relative", // enable absolute children
                padding: 10,
                }]}>
                <Text style={{ 
                    color: colors.buttonText, 
                    height: 50, 
                    margin: 5, 
                    marginTop: -30,
                    textAlign: "left",
                    textAlignVertical: "top",
                }}
                    numberOfLines={3}
                    ellipsizeMode="tail"
                >
                    {item}
                </Text>
        
                <View style={{
                    position: "absolute",
                    bottom: 5,
                    right: 5,
                }}>
                    <CustomButton
                    icon="trash"
                    color="destructive"
                    size= "sm"
                    onPress={() => removeBetOption(index)}
                    />
                </View>
                </View>
            ) : (
                <View style={styles.betOptionStyle}>
                    <View style={{
                        justifyContent: "center",
                        alignItems: "center",
                        width: "100%",
                        height: "100%",
                        backgroundColor: colors.button_darker_primary,
                        borderRadius: 50,
                        padding: 5,
                    }}>
                        <CustomButton
                        color="transparent"
                        icon="plus"
                        layout= "centered"
                        iconSize={30}
                        onPress={addBetOption}
                        />
                    </View>
                </View>
            )
            ),
            [betOptionList]
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.primary }]}>
            <RTCView
                streamURL={stream?.toURL()}
                mirror={isFrontCamera}
                objectFit= "cover"
                style={[styles.rtc, { backgroundColor: colors.void }]}
            />
            <View style={styles.cameraTurnButtonContainer}>
                <CustomButton
                    color="transparent"
                    icon="rotate-right"
                    onPress={rotateCamera}
                    label="Rotate"
                />
            </View>
            <View style={styles.startButtonContainer}>
                <CustomButton
                    color="primary"
                    label="Start Stream"
                    size= "lg"
                    onPress={() => startStream()} 
                />
            </View>
            <View style={styles.returnContainer}>
                <CustomButton 
                    color="transparent" 
                    icon="angle-left"
                    iconSize={40}
                    onPress={() => { router.push("/(tabs)"); }}
                />
            </View> 
            {!isModalVisible && (<BottomSheet
                ref={bottomMenuRef}
                snapPoints= {bottomMenuSnapPoints}
                index = {1}
                backgroundStyle={{ backgroundColor: colors.background }}
                handleStyle={{ backgroundColor: colors.button_darker_primary }}
                keyboardBehavior= "interactive"
                enableHandlePanningGesture={true}
                enableContentPanningGesture={false}
            >
                <BottomSheetView style={styles.bottomMenuContainer}>
                    <View style={{ flexDirection: "row", 
                        width: "100%" ,
                        borderRadius: 10,
                        backgroundColor: colors.button_darker_primary,
                        padding: 5,
                        height: 30,
                        marginTop: -5,
                        }}>
                        <TextInput 
                            placeholder="Title" 
                            multiline={true}
                            style={{ height: 20, flex:1, width: "100%" }}
                            />
                    </View>
                    <View style={{ flexDirection: "row",
                        width: "100%" ,
                        borderRadius: 10,
                        backgroundColor: colors.button_darker_primary,
                        padding: 5,
                        height: 100,
                        marginTop: 10,
                        }}>
                        <TextInput 
                            placeholder="Description" 
                            multiline={true} 
                            numberOfLines={5}
                            textAlignVertical="top"
                            textAlign="left"
                            style={{ height: 90, flex:1, width: "100%"}}
                        />
                    </View>
                    <View style={styles.betTypeContainer}>
                        <Text style={{ 
                            color: colors.buttonText, 
                            fontSize: 16, 
                            marginRight: 10, 
                            marginTop: 10,
                        }}>
                            Bet Price:
                        </Text>
                            <TextInput 
                            style={[styles.typeContainer, {backgroundColor: colors.secondary}]}
                                placeholder="$$$"
                                multiline={false}
                                maxLength={4}
                                keyboardType= "numeric"
                                textAlign="center"
                            />
                        <Text style={{ 
                            color: colors.buttonText, 
                            fontSize: 16, 
                            marginRight: 10, 
                            marginTop: 10,
                            marginLeft: 90,
                        }}>
                            Timer:
                        </Text>
                            <TextInput 
                            style={[styles.typeContainer, {backgroundColor: colors.secondary}]}
                                placeholder="min"
                                multiline={false}
                                maxLength={4}
                                keyboardType="numeric"
                                textAlign="center"
                            />
                    </View>
                    <View style={[styles.betListStyle, {backgroundColor: colors.button_darker_primary}]}>
                        <FlatList
                            horizontal = {true}
                            data={betOptionList}
                            renderItem={renderBetOption}
                            keyExtractor={(_, index) => index.toString()}
                        />
                    </View>
                </BottomSheetView>
            </BottomSheet>)}

            {/* Bet Option Modal */}
            <BetOptionModal
                visible={isModalVisible}
                onClose={cancelAddBetOption}
                onConfirm={confirmAddBetOption}
                betName={newBetName}
                setBetName={setNewBetName}
            />
            
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
    },
    rtc: {
        flex: 1,
    },
    startButtonContainer: {
        position: "absolute",
        alignItems: "center",
        bottom: 100, // Position at the bottom
        alignSelf: "center", // Center horizontally
    },
    cameraTurnButtonContainer: {
        position: "absolute",
        alignItems: "center",
        top: 100, // Position at the top
        right: 20,
    },
    returnContainer:{
        position: "absolute",
        alignItems: "center",
        top: 50,
        left: 20,
    },
    bottomMenuContainer: {
        flex: 1,
        paddingTop: 20,
        paddingHorizontal: 10,
        alignItems: 'center',
    },
    betListStyle: {
        flexDirection: "row",
        width: "100%",
        borderRadius: 5,
        height: 110,
        marginTop: 10,
        borderWidth: 1,
        borderColor: "#000000",
    },
    betOptionStyle: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 10,
        margin: 5,
        width: 150,
        height: 100,
        justifyContent: "center",
    },
    betTypeContainer: {
        flexDirection: "row",
        width: "100%",
        height: 40, 
        marginTop: 10,
    },
    typeContainer: {
        width: 50,
        borderRadius: 50,
    }
});