import { postEvent } from "@/api/studioFunctions";
import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, ScrollView, Dimensions, Image, Alert } from "react-native";

const { height: screenHeight } = Dimensions.get('window');

type Props = {
  optionsDict: { [key: string]: string[] };
  visible: boolean;
  setVisible: (visible: boolean) => void;
  title: string | undefined;
  description?: string | undefined;
  image?: string | undefined;
  templateId?: string;
}

export default function StudioConfirm({optionsDict, visible, setVisible, title, description, image, templateId}: Props) {
  const theme = useThemeConfig();
  const [privacy, setPrivacy] = useState("Private");
  const [time, setTime] = useState("1 hour");
  const [pickTimer, setPickTimer] = useState(false);
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [isPosting, setIsPosting] = useState(false);
  const router = useRouter();

  const formatTime = (d: number, h: number, m: number) => {
    const parts = [];
    if (d > 0) parts.push(`${d} day${d > 1 ? 's' : ''}`);
    if (h > 0) parts.push(`${h} hour${h > 1 ? 's' : ''}`);
    if (m > 0) parts.push(`${m} minute${m > 1 ? 's' : ''}`);
    return parts.length > 0 ? parts.join(', ') : '0 minutes';
  };

  const handleTimerConfirm = () => {
    const totalMinutes = days * 24 * 60 + hours * 60 + minutes;
    if (totalMinutes === 0) {
      Alert.alert("Invalid Duration", "Please select at least 1 minute.");
      return;
    }
    setTime(formatTime(days, hours, minutes));
    setPickTimer(false);
  };

  const handleQuickTime = (timeString: string, d: number, h: number, m: number) => {
    setTime(timeString);
    setDays(d);
    setHours(h);
    setMinutes(m);
  };

  // Generate arrays for picker options
  const dayOptions = Array.from({ length: 31 }, (_, i) => i);
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
            {options.map((value) => (
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
    if (!title?.trim()) {
      Alert.alert("Missing Title", "Please add a title to your event.");
      return;
    }

    if (Object.keys(optionsDict).length === 0) {
      Alert.alert("No Questions", "Please add at least one question with options.");
      return;
    }

    setIsPosting(true);
    try {
      const eventLink = await postEvent(optionsDict, title, description || "", image || "", privacy, time, templateId);
      if (eventLink.error) {
        Alert.alert("Error", eventLink.msg || "Failed to create event. Please try again.");
        return;
      }
      setVisible(false);
      router.push(`/event/${eventLink}`);
    } catch (error) {
      console.error("Error posting event:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const getQuestionCount = () => {
    return Object.keys(optionsDict).length;
  };

  const getTotalOptions = () => {
    return Object.values(optionsDict).reduce((total, options) => total + options.filter(opt => opt !== '+').length, 0);
  };

  return (
    <Modal
        animationType="slide"
        visible={visible}
        presentationStyle="fullScreen"
        onRequestClose={() => setVisible(false)}
    >
        <SafeAreaView style={styles(theme).container}>
            {/* Header with back button */}
            <View style={styles(theme).header}>
                <TouchableOpacity 
                    style={styles(theme).backButton}
                    onPress={() => setVisible(false)}
                >
                    <FontAwesome name="angle-left" size={28} color={theme.primary} />
                </TouchableOpacity>
                <Text style={styles(theme).headerTitle}>Event Preview</Text>
                <View style={styles(theme).headerSpacer} />
            </View>

            <ScrollView 
                style={styles(theme).scrollContainer}
                contentContainerStyle={styles(theme).scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Image Preview */}
                <View style={styles(theme).imageContainer}>
                    {image ? (
                        <Image 
                            source={{uri: image}}
                            style={styles(theme).imagePreview}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={styles(theme).placeholderImage}>
                            <FontAwesome name="image" size={50} color="rgba(255,255,255,0.3)" />
                            <Text style={styles(theme).placeholderText}>No image selected</Text>
                        </View>
                    )}
                </View>

                {/* Content Card */}
                <View style={styles(theme).contentCard}>
                    <Text style={styles(theme).title}>{title || "Untitled Event"}</Text>
                    {description && (
                        <Text style={styles(theme).description}>{description}</Text>
                    )}

                    {/* Event Stats */}
                    <View style={styles(theme).statsContainer}>
                        <View style={styles(theme).statItem}>
                            <FontAwesome name="question-circle" size={18} color={theme.primary} />
                            <Text style={styles(theme).statText}>{getQuestionCount()} Questions</Text>
                        </View>
                        <View style={styles(theme).statItem}>
                            <FontAwesome name="list" size={18} color={theme.primary} />
                            <Text style={styles(theme).statText}>{getTotalOptions()} Total Options</Text>
                        </View>
                    </View>

                    {/* Settings Section */}
                    <View style={styles(theme).settingsSection}>
                        <Text style={styles(theme).sectionTitle}>Event Settings</Text>
                        
                        {/* Privacy Setting */}
                        <View style={styles(theme).settingRow}>
                            <View style={styles(theme).settingInfo}>
                                <FontAwesome name={privacy === "Private" ? "lock" : "globe"} size={20} color={theme.primary} />
                                <Text style={styles(theme).settingLabel}>Privacy</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles(theme).settingButton, privacy === "Public" && styles(theme).settingButtonActive]}
                                onPress={() => setPrivacy(privacy === "Private" ? "Public" : "Private")}
                            >
                                <Text style={[styles(theme).settingButtonText, privacy === "Public" && styles(theme).settingButtonTextActive]}>
                                    {privacy}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Duration Setting */}
                        <View style={styles(theme).settingRow}>
                            <View style={styles(theme).settingInfo}>
                                <FontAwesome name="clock-o" size={20} color={theme.primary} />
                                <Text style={styles(theme).settingLabel}>Duration</Text>
                            </View>
                            <TouchableOpacity
                                style={styles(theme).settingButton}
                                onPress={() => setPickTimer(true)}
                            >
                                <Text style={styles(theme).settingButtonText}>{time}</Text>
                                <FontAwesome name="chevron-right" size={12} color="#ffffff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Quick Duration Buttons */}
                    <View style={styles(theme).quickTimeContainer}>
                        <Text style={styles(theme).quickTimeTitle}>Quick Select</Text>
                        <View style={styles(theme).quickTimeButtons}>
                            {[
                                { label: "30m", d: 0, h: 0, m: 30 },
                                { label: "1h", d: 0, h: 1, m: 0 },
                                { label: "6h", d: 0, h: 6, m: 0 },
                                { label: "1d", d: 1, h: 0, m: 0 },
                                { label: "1w", d: 7, h: 0, m: 0 },
                            ].map((timeOption) => (
                                <TouchableOpacity
                                    key={timeOption.label}
                                    style={[
                                        styles(theme).quickTimeButton,
                                        time === formatTime(timeOption.d, timeOption.h, timeOption.m) && styles(theme).quickTimeButtonActive
                                    ]}
                                    onPress={() => handleQuickTime(
                                        formatTime(timeOption.d, timeOption.h, timeOption.m),
                                        timeOption.d,
                                        timeOption.h,
                                        timeOption.m
                                    )}
                                >
                                    <Text style={[
                                        styles(theme).quickTimeButtonText,
                                        time === formatTime(timeOption.d, timeOption.h, timeOption.m) && styles(theme).quickTimeButtonTextActive
                                    ]}>
                                        {timeOption.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Action Button */}
            <View style={styles(theme).bottomContainer}>
                <TouchableOpacity 
                    style={[styles(theme).postButton, isPosting && styles(theme).postButtonDisabled]}
                    onPress={handlePostEvent}
                    disabled={isPosting}
                >
                    {isPosting ? (
                        <Text style={styles(theme).postButtonText}>Creating Event...</Text>
                    ) : (
                        <>
                            <FontAwesome name="rocket" size={20} color="#ffffff" />
                            <Text style={styles(theme).postButtonText}>Create Event</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Timer Picker Modal */}
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
                                style={[styles(theme).timerButton, styles(theme).timerCancelButton]}
                                onPress={() => setPickTimer(false)}
                            >
                                <Text style={styles(theme).timerButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles(theme).timerButton, styles(theme).timerConfirmButton]}
                                onPress={handleTimerConfirm}
                            >
                                <Text style={styles(theme).timerButtonText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    </Modal>
  );
}

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.button_darker_primary,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.button_darker_primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.primary,
    fontFamily: "Roboto",
  },
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    margin: 20,
    height: 200,
    borderRadius: 15,
    backgroundColor: theme.button_darker_primary,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: "Roboto",
    marginTop: 10,
  },
  contentCard: {
    backgroundColor: theme.button_darker_primary,
    margin: 20,
    marginTop: 0,
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: "Roboto",
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: "Roboto",
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 25,
    paddingVertical: 15,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  statText: {
    color: '#ffffff',
    fontFamily: "Roboto",
    fontWeight: '500',
    marginLeft: 8,
  },
  settingsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: "Roboto",
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: "Roboto",
    marginLeft: 12,
  },
  settingButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
    justifyContent: 'center',
  },
  settingButtonActive: {
    backgroundColor: theme.primary,
  },
  settingButtonText: {
    color: '#ffffff',
    fontFamily: "Roboto",
    fontWeight: '500',
    marginRight: 4,
  },
  settingButtonTextActive: {
    fontWeight: 'bold',
  },
  quickTimeContainer: {
    marginTop: 10,
  },
  quickTimeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: "Roboto",
    marginBottom: 12,
  },
  quickTimeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickTimeButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  quickTimeButtonActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  quickTimeButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: "Roboto",
    fontWeight: '500',
  },
  quickTimeButtonTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.background,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: theme.button_darker_primary,
  },
  postButton: {
    backgroundColor: theme.primary,
    height: 55,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  postButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  postButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: "Roboto",
    marginLeft: 8,
  },
  // Timer Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerModalContainer: {
    backgroundColor: theme.button_darker_primary,
    borderRadius: 20,
    padding: 25,
    width: '90%',
    maxHeight: screenHeight * 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  timerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 25,
    fontFamily: "Roboto",
  },
  pickerContainer: {
    flexDirection: 'row',
    height: 150,
    marginBottom: 25,
  },
  pickerDivider: {
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 10,
    borderRadius: 1,
  },
  scrollPickerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  scrollPickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
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
    marginVertical: 1,
    borderRadius: 12,
  },
  scrollPickerItemSelected: {
    backgroundColor: theme.primary,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollPickerItemText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: "Roboto",
    fontWeight: '500',
  },
  scrollPickerItemTextSelected: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  timerButtonContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  timerButton: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  timerCancelButton: {
    backgroundColor: '#666666',
  },
  timerConfirmButton: {
    backgroundColor: theme.primary,
  },
  timerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: "Roboto",
  },
});