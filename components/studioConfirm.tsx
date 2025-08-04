import { postEvent } from "@/api/studioFunctions";
import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, ScrollView, Dimensions, Image } from "react-native";

const { height: screenHeight } = Dimensions.get('window');

type Props = {
  optionsDict: { [key: string]: string[] };
  visible: boolean;
  setVisible: (visible: boolean) => void;
  title: string | undefined;
  description?: string | undefined;
  image?: string | undefined;
}

export default function StudioConfirm({optionsDict, visible, setVisible, title, description, image}: Props) {
  const theme = useThemeConfig();
  const [privacy, setPrivacy] = useState("Private");
  const [time, setTime] = useState("1 hour");
  const [pickTimer, setPickTimer] = useState(false);
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const router = useRouter();

  const formatTime = (d: number, h: number, m: number) => {
    const parts = [];
    if (d > 0) parts.push(`${d} day${d > 1 ? 's' : ''}`);
    if (h > 0) parts.push(`${h} hour${h > 1 ? 's' : ''}`);
    if (m > 0) parts.push(`${m} minute${m > 1 ? 's' : ''}`);
    return parts.length > 0 ? parts.join(', ') : '0 minutes';
  };

  const handleTimerConfirm = () => {
    setTime(formatTime(days, hours, minutes));
    setPickTimer(false);
  };

  // Generate arrays for picker options
  const dayOptions = Array.from({ length: 100 }, (_, i) => i);
  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i);

  const renderScrollPicker = (
    options: number[],
    selectedValue: number,
    onValueChange: (value: number) => void,
    label: string
  ) => {
    return (
      <View style={styles(theme).scrollPickerContainer}>
        <Text style={styles(theme).scrollPickerLabel}>{label}</Text>
        <View style={styles(theme).scrollPickerWrapper}>
          <ScrollView 
            style={styles(theme).scrollPicker}
            contentContainerStyle={styles(theme).scrollPickerContent}
            showsVerticalScrollIndicator={false}
            snapToInterval={50}
            decelerationRate="fast"
          >
            {options.map((value, index) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles(theme).scrollPickerItem,
                  selectedValue === value && styles(theme).scrollPickerItemSelected
                ]}
                onPress={() => onValueChange(value)}
              >
                <Text style={[
                  styles(theme).scrollPickerItemText,
                  selectedValue === value && styles(theme).scrollPickerItemTextSelected
                ]}>
                  {value.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  const handlePostEvent = async () => {
    // Logic to handle posting the event
    const eventLink = await postEvent(optionsDict, title || "", description || "", image || "", privacy, time);
    if (eventLink.error) {
      console.error("Error posting event:", eventLink.msg);
      return;
    }
    setVisible(false);
    router.push(`/event/${eventLink}`); // Navigate to the studio page after posting
    return;
  };

  return (
    <Modal
        animationType="slide"
        visible={visible}
        presentationStyle="fullScreen"
        onRequestClose={() => { setVisible(false); }}
    >
        <View style={styles(theme).container}>
            {/* Image of the bet */}
            <View style={styles(theme).imageContainer}>
                  <FontAwesome name="camera" size={40} color={theme.background} />
            </View>

            {/* Title */}
            <Text style={styles(theme).titleContainer}>{title}</Text>
            <Text style={styles(theme).descriptionContainer}>{description}</Text>

            <View style={styles(theme).lowerContainer}>
                {/* First Row Buttons */}
                <View style={styles(theme).firstRow}>
                    <Text style={styles(theme).buttonLabel}> Privacy: </Text>
                    <TouchableOpacity
                        style={styles(theme).privacyButton}
                        onPress={() => {
                            if (privacy === "Private") {
                                setPrivacy("Public");
                            } else {
                                setPrivacy("Private");
                            }
                        }}
                    >
                        <Text style={{ fontFamily: "Roboto", fontWeight: "bold", color: "#ffffff" }}>
                            {privacy}
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles(theme).buttonLabel}> Time: </Text>
                    <TouchableOpacity
                        style={[styles(theme).privacyButton, { borderRadius: 5, minWidth: 120, maxWidth: 120 }]}
                        onPress={() => {
                            setPickTimer(true);
                        }}
                    >
                        <Text style={{ fontFamily: "Roboto", fontWeight: "bold", color: "#ffffff" }}>
                            {time}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Confirm Button */}
                <TouchableOpacity style={styles(theme).confirmButtonContainer}
                    onPress={handlePostEvent
                    }
                 >
                    <Text style={styles(theme).confirmButtonText}> Post Event </Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* Timer Picker Modal */}
        {pickTimer && (
            <Modal
                animationType="slide"
                transparent={true}
                visible={pickTimer}
                onRequestClose={() => setPickTimer(false)}
            >
                <View style={styles(theme).modalOverlay}>
                    <View style={styles(theme).timerModalContainer}>
                        <Text style={styles(theme).timerTitle}>Select Duration</Text>

                        <View style={styles(theme).pickerContainer}>
                            {renderScrollPicker(dayOptions, days, setDays, "Days")}
                            <View style={styles(theme).pickerDivider} />
                            {renderScrollPicker(hourOptions, hours, setHours, "Hours")}
                            <View style={styles(theme).pickerDivider} />
                            {renderScrollPicker(minuteOptions, minutes, setMinutes, "Min")}
                        </View>

                        <View style={styles(theme).timerButtonContainer}>
                            <TouchableOpacity
                                style={[styles(theme).timerButton, styles(theme).cancelButton]}
                                onPress={() => setPickTimer(false)}
                            >
                                <Text style={styles(theme).timerButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles(theme).timerButton, styles(theme).confirmButton]}
                                onPress={handleTimerConfirm}
                            >
                                <Text style={styles(theme).timerButtonText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        )}
    </Modal>
  );
}

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.button_darker_primary,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  imageContainer: {
    marginTop: 50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: theme.button_darker_primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  titleContainer: {
    fontFamily: "Roboto",
    fontWeight: "bold",
    fontSize: 30,
    color: "#ffffff",
    marginTop: 20, // Adjust spacing below the image
    marginBottom: 10, // Spacing below the title
    textAlign: "center",
  },
  descriptionContainer: {
    fontFamily: "Roboto",
    fontSize: 16,
    color: "#ffffff",
    marginTop: 10,
    textAlign: "center",
    marginBottom: 20, // Spacing below the title
  },
  lowerContainer: {
    flex: 1,
    justifyContent: "flex-end", // Align content at the bottom
    width: "100%",
    alignContent: "center",
    alignItems: "center",
  },
  firstRow: {
    flexDirection: "row",
    marginBottom: 180, // Position above the confirm button
    justifyContent: "center",
    alignSelf: "center",
  },
  privacyButton: {
    height: 40,
    backgroundColor: theme.primary,
    borderRadius: 20,
    minWidth: 60,
    maxWidth: 60,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonLabel: {
    fontFamily: "Roboto",
    fontWeight: "bold",
    color: "#ffffff",
    height: 40,
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerModalContainer: {
    backgroundColor: theme.button_darker_primary,
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: screenHeight * 0.7,
  },
  timerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: "Roboto",
  },
  pickerContainer: {
    flexDirection: 'row',
    height: 100,
    marginBottom: 20,
  },
  pickerDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 10,
  },
  scrollPickerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  scrollPickerLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    fontFamily: "Roboto",
  },
  scrollPickerWrapper: {
    flex: 1,
    width: '100%',
  },
  scrollPicker: {
    flex: 1,
  },
  scrollPickerContent: {
    paddingVertical: 0,
  },
  scrollPickerItem: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 8,
  },
  scrollPickerItemSelected: {
    backgroundColor: theme.primary,
  },
  scrollPickerItemText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: "Roboto",
    fontWeight: '500',
  },
  scrollPickerItemTextSelected: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  timerButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timerButton: {
    flex: 1,
    height: 45,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#666666',
  },
  confirmButton: {
    backgroundColor: theme.primary,
  },
  timerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: "Roboto",
  },
  confirmButtonContainer: {
    position: "absolute",
    width: "90%",
    height: 50,
    backgroundColor: theme.primary,
    borderRadius: 20,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    bottom: 20, // Adjust position at the bottom
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flex: 1,
    flexDirection: "row",
  },
  confirmButtonText: {
    fontFamily: "Roboto",
    fontWeight: "bold",
    color: "#ffffff",
    fontSize: 16,
  },    
});