import React from "react";
import {
    Modal,
    View,
    Text,
    TextInput,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
} from "react-native";
import CustomButton from "./custom-button";
import { useThemeConfig } from "./ui/use-theme-config";
import { SafeAreaView } from "react-native-safe-area-context";

interface BetOptionModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (betName: string) => void;
    betName: string;
    setBetName: (name: string) => void;
}

const BetOptionModal: React.FC<BetOptionModalProps> = ({
    visible,
    onClose,
    onConfirm,
    betName,
    setBetName,
}) => {
    const { colors } = useThemeConfig();

    return (
        <Modal
            animationType="fade"
            visible={visible}
            onRequestClose={onClose}
            transparent={true}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <SafeAreaView style={styles.modalContent}>
                    <KeyboardAvoidingView
                        style={styles.keyboardAvoidingView}
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                    >
                        <View style={[styles.popupContainer, { backgroundColor: colors.background }]}>
                            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold" }}>
                                Add Bet Option
                            </Text>
                            <TextInput
                                style={{
                                    height: 40,
                                    borderColor: colors.primary,
                                    borderWidth: 1,
                                    width: 200,
                                    maxWidth: 200,
                                    marginTop: 10,
                                    paddingLeft: 10,
                                    color: colors.text,
                                }}
                                placeholder="Enter Bet Name"
                                placeholderTextColor={colors.text}
                                value={betName}
                                onChangeText={setBetName}
                                maxLength={50}
                                numberOfLines={3}
                                multiline={true}
                            />
                            <View style={{ flexDirection: "row", marginTop: 20 }}>
                                <CustomButton
                                    label="Cancel"
                                    onPress={onClose}
                                    style={{ backgroundColor: colors.destructive }}
                                />
                                <CustomButton
                                    label="Confirm"
                                    onPress={() => {
                                        onConfirm(betName);
                                        onClose();
                                    }}
                                    style={{ backgroundColor: colors.primary, marginLeft: 10 }}
                                />
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContent: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    keyboardAvoidingView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    popupContainer: {
        width: "80%",
        borderRadius: 10,
        padding: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
});

export default BetOptionModal;