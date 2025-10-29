import { SafeAreaView } from "react-native-safe-area-context"
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform, Image, Pressable, KeyboardAvoidingView } from "react-native"

import { useThemeConfig, Theme } from "@/components/ui/use-theme-config"
import { useEffect, useState } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useLocalSearchParams, useRouter } from "expo-router";
import StudioConfirm from "@/components/studioConfirm";
import { deleteSavedTemplate, fetchSavedTemplates, fetchTemplate } from "@/api/studioFunctions";
import { FlatList } from "react-native-gesture-handler";
import TemplateCard from "@/components/templateCard";
import { saveTemplate } from "@/api/eventFunctions";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { SearchTemplate } from "@/api/interfaces/objects";

export default function Studio(){
    const params = useLocalSearchParams();
    const studio = (params.studio && params.studio !== "create") ? params.studio as string : undefined;
    const isTemplate = Boolean(studio);
    const theme = useThemeConfig();
    const [question, setQuestion] = useState("+");
    const [questionMenu, expandQuestionMenu] = useState(false);
    const [questionModal, setQuestionModal] = useState(false);
    const [optionModal, setOptionModal] = useState(false);
    const [newQuestion, setNewQuestion] = useState("");
    const [newOption, setNewOption] = useState("");
    const [optionsDict, setOptionsDict] = useState<{ [key: string]: string[] }>({});
    const [studioConfirmModal, setStudioConfirmModal] = useState(false);
    const [title, setTitle] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [currentInputValue, setCurrentInputValue] = useState<string>("");
    const [inputType, setInputType] = useState<string>("");
    const [tempInputValue, setTempInputValue] = useState<string>("");
    const [questions, setQuestionList] = useState(["+"]);
    const [savedTemplatesModal, setSavedTemplatesModal] = useState(false);
    const [savedTemplates, setSavedTemplates] = useState<SearchTemplate[]>([]);
    const [bookmarks, setBookmarks] = useState<{ [id: string]: boolean }>({});
    const [image, setImage] = useState<string | undefined>(undefined);
    const [status, requestPermission] = MediaLibrary.usePermissions();
    const [showMenu, setShowMenu] = useState(false);

    const router = useRouter();

    if (status === null){
      requestPermission();
    }

    useEffect(() => {
      
      if (studio && studio.trim() !== "" && studio !== "create") {
        const fetchTemplateData = async () => {
          try {
            const templateInfo = await fetchTemplate(studio);

            if (templateInfo.error) {
              throw new Error(templateInfo.msg);
            }

            setTitle(templateInfo.template.title || "");
            setDescription(templateInfo.template.description || "");
            setOptionsDict(templateInfo.questions || {});
            setQuestion(templateInfo.questions ? Object.keys(templateInfo.questions)[0] || "+" : "+");
            setNewQuestion("");
            setNewOption("");
            setQuestionList(Object.keys(templateInfo.questions));
            setImage(templateInfo.template.image || undefined);

            setQuestion(Object.keys(templateInfo.questions)[0] || "+");

          } catch (err: any) {
            console.error("Erro ao buscar template:", err.message);
          }
        };
        fetchTemplateData();
      }
      else {
        setTitle("");
        setDescription("");
        setOptionsDict({});
        setQuestion("+");
        setNewQuestion("");
        setNewOption("");
        setQuestionList(["+"]);
        setImage(undefined); 
      };

      const fetchData = async () => {
        try{
          const templates = await fetchSavedTemplates()

          if (templates.error) {
              throw new Error(templates.msg);
          };
          setSavedTemplates(templates);
          setBookmarks(() => Object.fromEntries(templates.map((t: SearchTemplate)=> [t.id, true])));
        } catch (err: any){
          console.log("Error fetching templates:", err.message)
        }
      };
      setSavedTemplatesModal(false)
      fetchData()
      
    }, [studio]);

    const pickImageAsync = async () => {
      try {
        // Request permissions
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (permissionResult.granted === false) {
          alert("Permission to access camera roll is required!");
          return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [16, 9], // Square aspect ratio for profile-like images
          quality: 0.8, // Slightly compressed for better performance
        });

        if (!result.canceled) {
          setImage(result.assets[0].uri);
        }
      } catch (error) {
        console.error("Error picking image:", error);
        alert("Error selecting image. Please try again.");
      }
    };

    const takePhotoAsync = async () => {
      try {
        // Request camera permissions
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        
        if (permissionResult.granted === false) {
          alert("Permission to access camera is required!");
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [16, 9], // Square aspect ratio
          quality: 0.8,
        });

        if (!result.canceled) {
          setImage(result.assets[0].uri);
        }
      } catch (error) {
        console.error("Error taking photo:", error);
        alert("Error taking photo. Please try again.");
      }
    };

    const removeImage = () => {
      setImage(undefined);
      setShowMenu(false);
    };

    const selectQuestion = (question: string) => {
      setQuestion(question);
      expandQuestionMenu(false);
    }

    const handleNextPress = () => {
      if (questions.length <= 1 && !isTemplate) {
        alert("Please add at least one question before proceeding.");
        return;
      } else if (title.trim() === "" && !isTemplate) {
        alert("Please enter a title for your event.");
        return;
      };
      for (const key in optionsDict) {
        if (optionsDict[key].length <= 2 && !isTemplate) {
          alert(`Please add at least two options for the question: ${key}`);
          return;
        };
      };
      setStudioConfirmModal(true);
    }

    const handleInputFocus = (type: string, value: string, fromModal = false) => {
      if (Platform.OS === 'web' && fromModal) return;
      setIsInputFocused(true);
      setInputType(type);
      setCurrentInputValue(value);
      setTempInputValue(value);
    }

    const handleInputBlur = () => {
      setIsInputFocused(false);
      setInputType("");
      setCurrentInputValue("");
      setTempInputValue("");
    }

    const handleInputCancel = () => {
      setTempInputValue(currentInputValue);
      handleInputBlur();
    }

    const handleInputConfirm = () => {
      if (inputType === "title") {
        setTitle(tempInputValue);
      } else if (inputType === "description") {
        setDescription(tempInputValue);
      }
      handleInputBlur();
    }

    return (
        <SafeAreaView style={styles(theme).backgroundContainer}>
          {/* Enhanced Input Overlay */}
          {isInputFocused && (
            <View style={styles(theme).inputOverlay}>
              <View style={styles(theme).overlayContent}>
                <Text style={styles(theme).overlayTitle}>
                  {inputType === "title" ? "Enter Title" : 
                   inputType === "description" ? "Enter Description" : 
                   inputType === "question" ? "Enter Question" : 
                   "Enter Option"}
                </Text>
                
                <TextInput
                  style={styles(theme).overlayInput}
                  value={tempInputValue}
                  onChangeText={setTempInputValue}
                  placeholder={inputType === "title" ? "Enter title..." : "Enter description..."}
                  placeholderTextColor={theme.cardText}
                  multiline={inputType === "description"}
                  numberOfLines={inputType === "description" ? 4 : 1}
                  maxLength={inputType === "title" ? 50 : 200}
                  autoFocus={true}
                />

                <View style={styles(theme).overlayButtons}>
                  <TouchableOpacity
                    style={styles(theme).overlayCancelButton}
                    onPress={handleInputCancel}
                  >
                    <FontAwesome name="times" size={16} color="#ffffff" />
                    <Text style={styles(theme).overlayCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles(theme).overlayConfirmButton}
                    onPress={handleInputConfirm}
                  >
                    <FontAwesome name="check" size={16} color="#ffffff" />
                    <Text style={styles(theme).overlayConfirmButtonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          
          {/* Header Buttons */}
          <View style={styles(theme).headerContainer}>
            <TouchableOpacity 
              style={styles(theme).backButton}
              onPress={() => router.back()}
            >
              <FontAwesome
                name="angle-left"
                size={28}
                color={theme.primary}
              />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles(theme).nextButton}
              onPress={handleNextPress}
            >
              <Text style={styles(theme).nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
          {/*Extra buttons */}
          <TouchableOpacity style={styles(theme).savedTemplates}
            onPress= {() => {setSavedTemplatesModal(true)}}
          >
            <FontAwesome name= "bookmark" size={30} style={styles(theme).savedTemplatesIcon}/>
          </TouchableOpacity>
          {isTemplate && <FontAwesome
            name={studio && bookmarks[studio] ? "bookmark" : "bookmark-o"}
            size= {40}
            style={styles(theme).saveTemplateIcon}
            onPress={async () => {
              try {
                if(!studio)
                  return
                let result: any;
                if (bookmarks[studio]){
                  result = deleteSavedTemplate(studio);
                } else {
                  result = saveTemplate(studio);
                };

                if (result.error) {
                  throw new Error(result.msg);
                };
                
                setBookmarks(prev => ({
                  ...prev,
                  [studio]: !prev[studio],
                }));
              }catch(err: any){
                console.log("Error with templates:", err.message)
              }
            }}
          />}
          {/* Main Content */}
          <View 
            style={styles(theme).keyboardContainer}
          >
            <ScrollView contentContainerStyle={styles(theme).scrollContainer}>             
              {/* Upper Section */}
              <View style={styles(theme).upperContainer}>
                <TouchableOpacity 
                  style={styles(theme).imageContainer} 
                  onPress={() => !isTemplate ? setShowMenu(true) : null}
                  disabled={isTemplate}
                >
                  {image ? (
                    <Image 
                      source={{uri: image}}
                      style={styles(theme).imagePreview}
                      resizeMode="cover"
                    />
                  ) : (
                    <FontAwesome name="camera" size={40} color={theme.background} />
                  )}
                </TouchableOpacity>
          
                <TouchableOpacity 
                  style={styles(theme).titleContainer}
                  onPress={() => !isTemplate ? handleInputFocus("title", title) : null}
                >
                  <Text style={[
                    styles(theme).titleText,
                    !title && styles(theme).placeholderText
                  ]}>
                    {title || "Enter title..."}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles(theme).descriptionContainer}
                  onPress={() => !isTemplate ? handleInputFocus("description", description) : null}
                >
                  <Text style={[
                    styles(theme).descriptionText,
                    !description && styles(theme).placeholderText
                  ]}>
                    {description || "Enter description..."}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Lower Section */}
              <View style={styles(theme).lowerContainer}>
                <Text style={styles(theme).sectionTitle}>Questions</Text>
                
                <TouchableOpacity 
                  style={styles(theme).questionButton}
                  onPress={() => {
                    if (questions.length === 1 && !isTemplate) setQuestionModal(true);
                    else expandQuestionMenu(!questionMenu);
                  }}
                >
                  <View style={styles(theme).questionButtonContent}>
                    <Text style={styles(theme).questionButtonText} numberOfLines={1}>
                      {question === "+" ? "Add your first question" : question}
                    </Text>
                    <FontAwesome
                      name={questionMenu ? "angle-up" : "angle-down"}
                      size={16}
                      color={theme.background}
                    />
                  </View>
                </TouchableOpacity>

                {questionMenu && (
                  <View style={styles(theme).questionDropdown}>
                    <ScrollView style={styles(theme).questionScrollView}>
                      {questions.map((item, index) => (
                        <View key={index}>
                          {(index !== questions.length - 1 || isTemplate) ? (
                            <TouchableOpacity 
                              onPress={() => selectQuestion(item)}
                              style={styles(theme).questionOptionButton}
                            >
                              <Text style={styles(theme).questionOptionText} numberOfLines={2}>
                                {item}
                              </Text>
                              {!isTemplate && (
                              <TouchableOpacity
                                onPress={() => {
                                  const updatedQuestions = questions.filter((_, i) => i !== index);
                                  setQuestionList(updatedQuestions);
                                  setOptionsDict(prev => {
                                    const newDict = { ...prev };
                                    delete newDict[item];
                                    return newDict;
                                  });
                                  setQuestion(updatedQuestions[0]);
                                  if (updatedQuestions.length <= 1) {
                                    expandQuestionMenu(false);
                                  }
                                }}
                                style={styles(theme).deleteButton}
                              >
                                <FontAwesome name="trash" size={14} color={theme.destructive} />
                              </TouchableOpacity>)}
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity 
                              onPress={() => setQuestionModal(true)}
                              style={styles(theme).addQuestionButton}
                            >
                              <FontAwesome name="plus" size={16} color={theme.primary} />
                              <Text style={styles(theme).addQuestionText}>Add Question</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Options Section */}
                {question !== "+" && (
                  <>
                    <View style={styles(theme).optionsContainer}>
                      <ScrollView 
                        horizontal={true}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles(theme).optionsList}
                      >
                        {(optionsDict[question] || []).map((item, index) => (
                          <View key={index}>
                            {(index !== (optionsDict[question]?.length || 0) - 1) || isTemplate ? (
                              <View style={styles(theme).optionContainer}>
                                <Text style={styles(theme).optionText} numberOfLines={3}>
                                  {item}
                                </Text>
                                {!isTemplate && (
                                <TouchableOpacity 
                                  style={styles(theme).optionTrashButton}
                                  onPress={() => {
                                    setOptionsDict((prev) => {
                                      const newDict = { ...prev };
                                      const updatedOptions = newDict[question].filter((_, i) => i !== index);
                                      newDict[question] = updatedOptions;
                                      return newDict;
                                    });
                                  }}
                                >
                                  <FontAwesome name="trash" size={16} color="#ffffff" />
                                </TouchableOpacity>)}
                              </View>
                            ) : (
                              <TouchableOpacity
                                onPress={() => setOptionModal(true)}
                                style={styles(theme).addOptionButton}
                              >
                                <FontAwesome name="plus" size={30} color={theme.primary} />
                                <Text style={styles(theme).addOptionText}>Add Option</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  </>
                )}
              </View>
            </ScrollView>
          </View>

          {/* Question Modal */}
          <Modal visible={questionModal} transparent animationType="slide">
            <View style={styles(theme).modalOverlay}>
              <View style={styles(theme).modalContainer}>
                <Text style={styles(theme).modalTitle}>Add New Question</Text>
                
                <TextInput
                  placeholder="Enter your question..."
                  value={newQuestion}
                  onChangeText={(text) => {
                    setNewQuestion(text);
                    setCurrentInputValue(text);
                  }}
                  style={styles(theme).modalInput}
                  multiline={true}
                  numberOfLines={3}
                  onFocus={() => handleInputFocus("question", newQuestion, true)}
                  onBlur={handleInputBlur}
                />

                <View style={styles(theme).modalButtons}>
                  <TouchableOpacity
                    onPress={() => {
                      setQuestionModal(false);
                      setNewQuestion("");
                      expandQuestionMenu(false);
                      handleInputBlur();
                    }}
                    style={styles(theme).cancelButton}
                  >
                    <Text style={styles(theme).cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      if (newQuestion.trim() !== "") {
                        if (questions.includes(newQuestion)) {
                          alert("Question already exists!");
                          return;
                        }
                        const updated = [...questions];
                        updated.splice(questions.length - 1, 0, newQuestion.trim());
                        setQuestionList(updated);
                        setQuestion(newQuestion.trim());
                        setOptionsDict(prev => ({
                          ...prev, 
                          [newQuestion.trim()]: ["+"],
                        }));
                        setNewQuestion("");
                        setQuestionModal(false);
                        expandQuestionMenu(false);
                        handleInputBlur();
                      }
                    }}
                    style={styles(theme).addButton}
                  >
                    <Text style={styles(theme).addButtonText}>Add Question</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Option Modal */}
          <Modal visible={optionModal} transparent animationType="slide">
            <View style={styles(theme).modalOverlay}>
              <View style={styles(theme).modalContainer}>
                <Text style={styles(theme).modalTitle}>Add New Option</Text>

                <TextInput
                  placeholder="Enter option..."
                  value={newOption}
                  onChangeText={(text) => {
                    setNewOption(text);
                    setCurrentInputValue(text);
                  }}
                  style={styles(theme).modalInput}
                  multiline={true}
                  numberOfLines={2}
                  onFocus={() => handleInputFocus("option", newOption, true)}
                  onBlur={handleInputBlur}
                />

                <View style={styles(theme).modalButtons}>
                  <TouchableOpacity
                    onPress={() => {
                      setOptionModal(false);
                      setNewOption("");
                      handleInputBlur();
                    }}
                    style={styles(theme).cancelButton}
                  >
                    <Text style={styles(theme).cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      if (newOption.trim() !== ""){
                        if (optionsDict[question]?.includes(newOption.trim())) {
                          alert("Option already exists!");
                          return;
                        };
                        const updated = [...(optionsDict[question] || [])];
                        updated.splice(updated.length - 1, 0, newOption.trim());
                        setOptionsDict(prev => ({
                          ...prev, 
                          [question]: updated,
                        }));
                        setNewOption("");
                        setOptionModal(false);
                        handleInputBlur();
                      }
                    }}
                    style={styles(theme).addButton}
                  >
                    <Text style={styles(theme).addButtonText}>Add Option</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/*Saved Templates Modal*/}
          <Modal visible={savedTemplatesModal} transparent animationType="slide" onRequestClose={() => {setSavedTemplatesModal(false)}}>
              <View style={styles(theme).modalOverlay}>
                  <View style={styles(theme).templatesModalContainer}>
                    <View>
                      <FlatList style={{height: '75%', borderBottomWidth: 2, borderColor: theme.button_darker_primary}}
                        data={savedTemplates}
                        renderItem={({item}) =>
                          <View style= {{flexDirection: "row", alignItems:"center"}}>
                            <View style= {{flex:1}}>
                              <TemplateCard item={item}/>
                            </View>
                            <FontAwesome
                              style={{width: 30, color: (bookmarks[item.id] ? theme.primary : theme.button_darker_primary)}}
                              name= "bookmark"
                              size={20}
                              onPress={async () => {
                                try {
                                  let result: any;
                                  if (bookmarks[item.id]){
                                    result = deleteSavedTemplate(item.id);
                                  } else {
                                    result = saveTemplate(item.id);
                                  };
                                  if (result.error) {
                                    throw new Error(result.msg);
                                  };
                                  setBookmarks(prev => ({
                                    ...prev,
                                    [item.id]: !prev[item.id],
                                  }));
                                }catch(err: any){
                                  console.log("Error with templates:", err.message)
                                }
                              }}
                            />
                          </View>
                          }
                      />
                    </View>
                    <TouchableOpacity style= {styles(theme).cleanButton}
                      onPress={() => {
                        router.push(`/studio/create`)
                        setSavedTemplatesModal(false);
                      }}
                    >
                      <Text style= {styles(theme).cleanButtonText}> Clean Template</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style= {styles(theme).cancelTemplateButton}
                      onPress={() => {
                        setSavedTemplatesModal(false);
                      }}
                    >
                      <Text style= {styles(theme).cancelTemplateButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
              </View>
          </Modal>
          {/*Studio Confirm Modal*/}
          <StudioConfirm 
            optionsDict={optionsDict} 
            visible={studioConfirmModal} 
            setVisible={setStudioConfirmModal} 
            title={title}
            description={description}
            image={image || ""} // Pass the actual image URI
            templateId={studio}
          />
          
          {/*Image picker Modal */}
          <Modal
            visible={showMenu}
            transparent
            animationType="slide"
            onRequestClose={() => setShowMenu(false)}
          >
            <Pressable 
              style={styles(theme).imageModalOverlay} 
              onPress={() => setShowMenu(false)} 
            />
            <View style={styles(theme).imageModalContainer}>
              <TouchableOpacity 
                style={styles(theme).imageMenuOption} 
                onPress={() => { setShowMenu(false); takePhotoAsync(); }}
              >
                <FontAwesome name="camera" size={20} color={theme.primary} />
                <Text style={styles(theme).imageMenuText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles(theme).imageMenuOption} 
                onPress={() => { setShowMenu(false); pickImageAsync(); }}
              >
                <FontAwesome name="image" size={20} color={theme.primary} />
                <Text style={styles(theme).imageMenuText}>Choose from Gallery</Text>
              </TouchableOpacity>

              {image && (
                <TouchableOpacity 
                  style={styles(theme).imageMenuOption} 
                  onPress={removeImage}
                >
                  <FontAwesome name="trash" size={20} color={theme.destructive} />
                  <Text style={[styles(theme).imageMenuText, {color: theme.destructive}]}>Remove Image</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={[styles(theme).imageMenuOption, styles(theme).imageMenuCancel]} 
                onPress={() => setShowMenu(false)}
              >
                <Text style={[styles(theme).imageMenuText, {color: theme.destructive}]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Modal>

        </SafeAreaView>
    )
}

const styles = (theme: Theme) => StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  inputOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    backgroundColor: theme.background,
    padding: 25,
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  overlayTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: "Roboto",
  },
  overlayInput: {
    borderWidth: 2,
    borderColor: theme.primary,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    fontFamily: "Roboto",
    color: theme.cardText,
    backgroundColor: theme.button_darker_primary,
    marginBottom: 20,
    textAlignVertical: 'top',
    minHeight: 50,
  },
  overlayButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  overlayCancelButton: {
    flex: 1,
    backgroundColor: theme.destructive,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  overlayCancelButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
    fontFamily: "Roboto",
  },
  overlayConfirmButton: {
    flex: 1,
    backgroundColor: theme.primary,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  overlayConfirmButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
    fontFamily: "Roboto",
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    backgroundColor: theme.background,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButton: {
    backgroundColor: theme.primary,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButtonText: {
    fontFamily: "Roboto",
    fontWeight: "bold",
    color: "#ffffff",
    fontSize: 16,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  upperContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 16/9,
    borderRadius: 15,
    backgroundColor: theme.button_darker_primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden', // Ensures image fits within rounded container
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    width: '100%',
    height: 55,
    borderRadius: 15,
    backgroundColor: theme.button_darker_primary,
    paddingHorizontal: 15,
    marginBottom: 15,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Roboto",
    color: "#ffffff",
  },
  descriptionContainer: {
    width: '100%',
    height: 120,
    borderRadius: 15,
    backgroundColor: theme.button_darker_primary,
    paddingHorizontal: 15,
    paddingTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  descriptionText: {
    fontFamily: "Roboto",
    color: "#ffffff",
    fontSize: 16,
    lineHeight: 22,
  },
  placeholderText: {
    color: "rgba(255,255,255,0.7)",
  },
  lowerContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 15,
    fontFamily: "Roboto",
  },
  questionButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionButtonText: {
    fontFamily: "Roboto",
    fontWeight: "600",
    color: theme.background,
    fontSize: 16,
    flex: 1,
    marginRight: 10,
  },
  questionDropdown: {
    backgroundColor: theme.background,
    borderRadius: 12,
    marginBottom: 20,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionScrollView: {
    maxHeight: 200,
  },
  questionOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.button_darker_primary,
  },
  questionOptionText: {
    fontFamily: "Roboto",
    fontWeight: "500",
    color: theme.primary,
    fontSize: 16,
    flex: 1,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 10,
  },
  addQuestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: theme.background,
    borderRadius: 12,
  },
  addQuestionText: {
    fontFamily: "Roboto",
    fontWeight: "600",
    color: theme.primary,
    fontSize: 16,
    marginLeft: 8,
  },
  optionsHeader: {
    backgroundColor: theme.button_darker_primary,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  optionsContainer: {
    borderRadius: 12,
    backgroundColor: theme.background,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionsList: {
    paddingVertical: 10,
  },
  optionContainer: {
    width: 180,
    height: 120,
    backgroundColor: theme.button_darker_primary,
    borderRadius: 15,
    marginRight: 15,
    padding: 15,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionText: {
    color: "#ffffff",
    fontFamily: "Roboto",
    fontWeight: "500",
    fontSize: 16,
    flex: 1,
  },
  optionTrashButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: theme.destructive,
    height: 32,
    width: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addOptionButton: {
    width: 180,
    height: 120,
    backgroundColor: theme.background,
    borderRadius: 15,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.primary,
    borderStyle: 'dashed',
  },
  addOptionText: {
    fontFamily: "Roboto",
    fontWeight: "600",
    color: theme.primary,
    fontSize: 16,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: theme.background,
    padding: 25,
    borderRadius: 15,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    color: theme.primary,
    textAlign: 'center',
    fontFamily: "Roboto",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.button_darker_primary,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    fontFamily: "Roboto",
    textAlignVertical: 'top',
    color: theme.primary,
    minHeight: 60,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.destructive,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
    fontFamily: "Roboto",
  },
  addButton: {
    flex: 1,
    backgroundColor: theme.primary,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
    fontFamily: "Roboto",
  },
  savedTemplates: {
    position: "absolute",
    right: 30,
    top: 100,
    backgroundColor: theme.primary,
    borderRadius: 360,
    width: 50,
    height: 50,
    alignContent: "center",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  savedTemplatesIcon: {
    color: theme.cardText,
  },
  templatesModalContainer: {
    backgroundColor: theme.background,
    paddingVertical: 10,
    borderRadius: 15,
    width: '95%',
    maxWidth: 400,
    height: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cleanButton: {
    backgroundColor: theme.primary,
    borderRadius: 10,
    marginVertical: 10,
    width: '80%',
    height: 40,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cleanButtonText: {
    color: theme.cardText,
    fontWeight: "bold",
  },
  cancelTemplateButton: {
    backgroundColor: theme.destructive,
    borderRadius: 10,
    marginVertical: 5,
    width: '80%',
    height: 40,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cancelTemplateButtonText: {
    color: theme.destructiveText,
    fontWeight: "bold",
  },
  saveTemplateIcon: {
    position: "absolute",
    right: 40,
    top: 160,
    zIndex: 2,
    color: theme.primary
  },
  // Image Modal Styles
  imageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  imageModalContainer: {
    backgroundColor: theme.background,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: "absolute",
    bottom: 0,
    width: "100%",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  imageMenuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.button_darker_primary,
  },
  imageMenuText: {
    fontSize: 16,
    fontFamily: "Roboto",
    fontWeight: "500",
    color: theme.primary,
    marginLeft: 15,
  },
  imageMenuCancel: {
    borderBottomWidth: 0,
    borderTopWidth: 0,
    borderTopColor: theme.button_darker_primary,
    marginTop: 10,
    paddingTop: 20,
    justifyContent: 'center',
  },
})