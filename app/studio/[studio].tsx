import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform, Image, Pressable, FlatList, Alert } from "react-native"

import { useThemeConfig, Theme } from "@/components/ui/use-theme-config"
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useEffect, useState } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useLocalSearchParams, useRouter } from "expo-router";
import StudioConfirm from "@/components/studioConfirm";
import { deleteSavedTemplate, fetchSavedTemplates, fetchTemplate } from "@/api/studioFunctions";
import TemplateCard from "@/components/templateCard";
import { saveTemplate } from "@/api/eventFunctions";
import * as ImagePicker from "expo-image-picker";
import { SearchTemplate } from "@/types/interfaces";

export default function Studio(){
    const params = useLocalSearchParams();
    const studio = (params.studio && params.studio !== "create") ? params.studio as string : undefined;
    const isTemplate = Boolean(studio);
    const theme = useThemeConfig();
    const styles = useThemedStyles(createStyles);
    const insets = useSafeAreaInsets();
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
    const [showMenu, setShowMenu] = useState(false);
    const [editTarget, setEditTarget] = useState<
      { kind: "question"; title: string } | { kind: "option"; index: number } | null
    >(null);
    const [editText, setEditText] = useState("");

    const router = useRouter();

    // studio is undefined for every "create" visit, so the effect below (keyed on
    // studio) never re-runs between two creates and the previous draft's
    // questions carried over into the new event. Reset explicitly after posting.
    const resetDraft = () => {
      setTitle("");
      setDescription("");
      setOptionsDict({});
      setQuestion("+");
      setNewQuestion("");
      setNewOption("");
      setQuestionList(["+"]);
      setImage(undefined);
      setEditTarget(null);
      setEditText("");
    };

    const startEditQuestion = (title: string) => {
      setEditTarget({ kind: "question", title });
      setEditText(title);
    };

    const startEditOption = (index: number) => {
      setEditTarget({ kind: "option", index });
      setEditText(optionsDict[question]?.[index] ?? "");
    };

    const cancelEdit = () => {
      setEditTarget(null);
      setEditText("");
      handleInputBlur();
    };

    const confirmEdit = () => {
      const trimmed = editText.trim();
      if (!editTarget || trimmed === "") return;

      if (editTarget.kind === "question") {
        const oldTitle = editTarget.title;
        if (trimmed !== oldTitle) {
          if (questions.includes(trimmed)) {
            alert("A question with that name already exists.");
            return;
          }
          setQuestionList(prev => prev.map(q => (q === oldTitle ? trimmed : q)));
          // Rebuild rather than delete+add so the questions keep their order.
          setOptionsDict(prev => {
            const next: { [key: string]: string[] } = {};
            for (const [key, value] of Object.entries(prev)) {
              next[key === oldTitle ? trimmed : key] = value;
            }
            return next;
          });
          setQuestion(cur => (cur === oldTitle ? trimmed : cur));
        }
      } else {
        const current = optionsDict[question] || [];
        if (current.some((opt, i) => i !== editTarget.index && opt === trimmed)) {
          alert("That option already exists.");
          return;
        }
        setOptionsDict(prev => {
          const next = { ...prev };
          const opts = [...(next[question] || [])];
          opts[editTarget.index] = trimmed;
          next[question] = opts;
          return next;
        });
      }

      cancelEdit();
    };

    useEffect(() => {
      
      if (studio && studio.trim() !== "" && studio !== "create") {
        const fetchTemplateData = async () => {
          try {
            const templateInfo = await fetchTemplate(studio);

            if (templateInfo.error || !templateInfo.template) {
              throw new Error(templateInfo.msg || "Template not found");
            }

            const loadedQuestions = templateInfo.questions ?? {};

            setTitle(templateInfo.template.title || "");
            setDescription(templateInfo.template.description || "");
            setOptionsDict(loadedQuestions);
            setNewQuestion("");
            setNewOption("");
            setQuestionList(Object.keys(loadedQuestions));
            setImage(templateInfo.template.image || undefined);
            setQuestion(Object.keys(loadedQuestions)[0] || "+");

          } catch (err: any) {
            console.error("Error loading template:", err.message);
            Alert.alert(
              "Couldn't load template",
              "This template couldn't be opened. It may have been removed, or you may be offline."
            );
            router.back();
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

          if (!Array.isArray(templates)) {
              throw new Error((templates as any).msg);
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
        <SafeAreaView style={styles.backgroundContainer}>
          {/* Enhanced Input Overlay */}
          {isInputFocused && (
            <View style={styles.inputOverlay}>
              <View style={styles.overlayContent}>
                <Text style={styles.overlayTitle}>
                  {inputType === "title" ? "Enter Title" : 
                   inputType === "description" ? "Enter Description" : 
                   inputType === "question" ? "Enter Question" : 
                   "Enter Option"}
                </Text>
                
                <TextInput
                  style={styles.overlayInput}
                  value={tempInputValue}
                  onChangeText={setTempInputValue}
                  placeholder={inputType === "title" ? "Enter title..." : "Enter description..."}
                  placeholderTextColor={theme.cardText}
                  multiline={inputType === "description"}
                  numberOfLines={inputType === "description" ? 4 : 1}
                  maxLength={inputType === "title" ? 50 : 200}
                  autoFocus={true}
                />

                <View style={styles.overlayButtons}>
                  <TouchableOpacity
                    style={styles.overlayCancelButton}
                    onPress={handleInputCancel}
                  >
                    <FontAwesome name="times" size={16} color={theme.destructiveText} />
                    <Text style={styles.overlayCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.overlayConfirmButton}
                    onPress={handleInputConfirm}
                  >
                    <FontAwesome name="check" size={16} color={theme.onAccent} />
                    <Text style={styles.overlayConfirmButtonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          
          {/* Header Buttons */}
          <View style={styles.headerContainer}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <FontAwesome
                name="angle-left"
                size={28}
                color={theme.primary}
              />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.nextButton}
              onPress={handleNextPress}
              accessibilityRole="button"
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
          {/*Extra buttons */}
          <TouchableOpacity style={styles.savedTemplates}
            onPress= {() => {setSavedTemplatesModal(true)}}
            accessibilityRole="button"
            accessibilityLabel="Saved templates"
          >
            <FontAwesome name= "bookmark" size={30} style={styles.savedTemplatesIcon}/>
          </TouchableOpacity>
          {isTemplate && <FontAwesome
            name={studio && bookmarks[studio] ? "bookmark" : "bookmark-o"}
            size= {40}
            style={styles.saveTemplateIcon}
            accessibilityRole="button"
            accessibilityLabel={studio && bookmarks[studio] ? "Remove template from saved" : "Save template"}
            onPress={async () => {
              try {
                if(!studio)
                  return
                let result: any;
                if (bookmarks[studio]){
                  result = await deleteSavedTemplate(studio);
                } else {
                  result = await saveTemplate(studio);
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
            style={styles.keyboardContainer}
          >
            <ScrollView contentContainerStyle={styles.scrollContainer}>             
              {/* Upper Section */}
              <View style={styles.upperContainer}>
                <TouchableOpacity 
                  style={styles.imageContainer} 
                  onPress={() => !isTemplate ? setShowMenu(true) : null}
                  disabled={isTemplate}
                  accessibilityRole="button"
                  accessibilityLabel={image ? "Change event image" : "Add event image"}
                >
                  {image ? (
                    <Image 
                      source={{uri: image}}
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                  ) : (
                    <FontAwesome name="camera" size={40} color={theme.background} />
                  )}
                </TouchableOpacity>
          
                <TouchableOpacity 
                  style={styles.titleContainer}
                  onPress={() => !isTemplate ? handleInputFocus("title", title) : null}
                >
                  <Text style={[
                    styles.titleText,
                    !title && styles.placeholderText
                  ]}>
                    {title || "Enter title..."}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.descriptionContainer}
                  onPress={() => !isTemplate ? handleInputFocus("description", description) : null}
                >
                  <Text style={[
                    styles.descriptionText,
                    !description && styles.placeholderText
                  ]}>
                    {description || "Enter description..."}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Lower Section */}
              <View style={styles.lowerContainer}>
                <Text style={styles.sectionTitle}>Questions</Text>
                
                <TouchableOpacity 
                  style={styles.questionButton}
                  onPress={() => {
                    if (questions.length === 1 && !isTemplate) setQuestionModal(true);
                    else expandQuestionMenu(!questionMenu);
                  }}
                >
                  <View style={styles.questionButtonContent}>
                    <Text style={styles.questionButtonText} numberOfLines={1}>
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
                  <View style={styles.questionDropdown}>
                    <ScrollView style={styles.questionScrollView}>
                      {questions.map((item, index) => (
                        <View key={index}>
                          {(index !== questions.length - 1 || isTemplate) ? (
                            <TouchableOpacity 
                              onPress={() => selectQuestion(item)}
                              style={styles.questionOptionButton}
                            >
                              <Text style={styles.questionOptionText} numberOfLines={2}>
                                {item}
                              </Text>
                              {!isTemplate && (
                              <TouchableOpacity
                                onPress={() => startEditQuestion(item)}
                                accessibilityRole="button"
                                accessibilityLabel={`Edit question: ${item}`}
                                style={styles.editButton}
                              >
                                <FontAwesome name="pencil" size={14} color={theme.primary} />
                              </TouchableOpacity>)}
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
                                style={styles.deleteButton}
                                accessibilityRole="button"
                                accessibilityLabel={`Delete question: ${item}`}
                              >
                                <FontAwesome name="trash" size={14} color={theme.destructive} />
                              </TouchableOpacity>)}
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity 
                              onPress={() => setQuestionModal(true)}
                              style={styles.addQuestionButton}
                            >
                              <FontAwesome name="plus" size={16} color={theme.primary} />
                              <Text style={styles.addQuestionText}>Add Question</Text>
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
                    <View style={styles.optionsContainer}>
                      <ScrollView 
                        horizontal={true}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.optionsList}
                      >
                        {(optionsDict[question] || []).map((item, index) => (
                          <View key={index}>
                            {(index !== (optionsDict[question]?.length || 0) - 1) || isTemplate ? (
                              <View style={styles.optionContainer}>
                                <Text style={styles.optionText} numberOfLines={3}>
                                  {item}
                                </Text>
                                {!isTemplate && (
                                <TouchableOpacity
                                  style={styles.optionEditButton}
                                  accessibilityRole="button"
                                  accessibilityLabel={`Edit option: ${item}`}
                                  onPress={() => startEditOption(index)}
                                >
                                  <FontAwesome name="pencil" size={14} color={theme.buttonText} />
                                </TouchableOpacity>)}
                                {!isTemplate && (
                                <TouchableOpacity
                                  style={styles.optionTrashButton}
                                  accessibilityRole="button"
                                  accessibilityLabel={`Delete option: ${item}`}
                                  onPress={() => {
                                    setOptionsDict((prev) => {
                                      const newDict = { ...prev };
                                      const updatedOptions = newDict[question].filter((_, i) => i !== index);
                                      newDict[question] = updatedOptions;
                                      return newDict;
                                    });
                                  }}
                                >
                                  <FontAwesome name="trash" size={16} color={theme.destructiveText} />
                                </TouchableOpacity>)}
                              </View>
                            ) : (
                              <TouchableOpacity
                                onPress={() => setOptionModal(true)}
                                style={styles.addOptionButton}
                              >
                                <FontAwesome name="plus" size={30} color={theme.primary} />
                                <Text style={styles.addOptionText}>Add Option</Text>
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
          {/* Edit Question / Option Modal */}
          <Modal visible={editTarget !== null} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>
                  {editTarget?.kind === "question" ? "Edit Question" : "Edit Option"}
                </Text>

                <TextInput
                  placeholder={
                    editTarget?.kind === "question" ? "Enter your question..." : "Enter your option..."
                  }
                  value={editText}
                  onChangeText={(text) => {
                    setEditText(text);
                    setCurrentInputValue(text);
                  }}
                  style={styles.modalInput}
                  multiline={true}
                  numberOfLines={3}
                  autoFocus={true}
                  onFocus={() => handleInputFocus(editTarget?.kind ?? "question", editText, true)}
                  onBlur={handleInputBlur}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity onPress={cancelEdit} style={styles.cancelButton}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={confirmEdit} style={styles.addButton}>
                    <Text style={styles.addButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Modal visible={questionModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Add New Question</Text>
                
                <TextInput
                  placeholder="Enter your question..."
                  value={newQuestion}
                  onChangeText={(text) => {
                    setNewQuestion(text);
                    setCurrentInputValue(text);
                  }}
                  style={styles.modalInput}
                  multiline={true}
                  numberOfLines={3}
                  onFocus={() => handleInputFocus("question", newQuestion, true)}
                  onBlur={handleInputBlur}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    onPress={() => {
                      setQuestionModal(false);
                      setNewQuestion("");
                      expandQuestionMenu(false);
                      handleInputBlur();
                    }}
                    style={styles.cancelButton}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
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
                    style={styles.addButton}
                  >
                    <Text style={styles.addButtonText}>Add Question</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Option Modal */}
          <Modal visible={optionModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Add New Option</Text>

                <TextInput
                  placeholder="Enter option..."
                  value={newOption}
                  onChangeText={(text) => {
                    setNewOption(text);
                    setCurrentInputValue(text);
                  }}
                  style={styles.modalInput}
                  multiline={true}
                  numberOfLines={2}
                  onFocus={() => handleInputFocus("option", newOption, true)}
                  onBlur={handleInputBlur}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    onPress={() => {
                      setOptionModal(false);
                      setNewOption("");
                      handleInputBlur();
                    }}
                    style={styles.cancelButton}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
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
                    style={styles.addButton}
                  >
                    <Text style={styles.addButtonText}>Add Option</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/*Saved Templates Modal*/}
          <Modal visible={savedTemplatesModal} transparent animationType="slide" onRequestClose={() => {setSavedTemplatesModal(false)}}>
              <View style={styles.modalOverlay}>
                  <View style={styles.templatesModalContainer}>
                    <View>
                      <FlatList style={styles.templatesList}
                        data={savedTemplates}
                        keyExtractor={(item) => item.id}
                        renderItem={({item}) =>
                          <View style={styles.templateRow}>
                            <View style={styles.templateRowCard}>
                              <TemplateCard item={item}/>
                            </View>
                            <FontAwesome
                              style={styles.templateBookmark}
                              name= "bookmark"
                              size={20}
                              color={bookmarks[item.id] ? theme.primary : theme.button_darker_primary}
                              accessibilityRole="button"
                              accessibilityLabel={bookmarks[item.id] ? `Remove ${item.title} from saved` : `Save ${item.title}`}
                              onPress={async () => {
                                try {
                                  let result: any;
                                  if (bookmarks[item.id]){
                                    result = await deleteSavedTemplate(item.id);
                                  } else {
                                    result = await saveTemplate(item.id);
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
                        ListEmptyComponent={
                          <View style={styles.emptyTemplates}>
                            <FontAwesome name="bookmark-o" size={40} color={theme.textFaint} />
                            <Text style={styles.emptyTemplatesTitle}>No saved templates</Text>
                            <Text style={styles.emptyTemplatesText}>
                              Templates you bookmark from events will show up here.
                            </Text>
                          </View>
                        }
                      />
                    </View>
                    <TouchableOpacity style= {styles.cleanButton}
                      onPress={() => {
                        router.push(`/studio/create`)
                        setSavedTemplatesModal(false);
                      }}
                    >
                      <Text style= {styles.cleanButtonText}> Clean Template</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style= {styles.cancelTemplateButton}
                      onPress={() => {
                        setSavedTemplatesModal(false);
                      }}
                    >
                      <Text style= {styles.cancelTemplateButtonText}>Cancel</Text>
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
            onPosted={resetDraft}
          />
          
          {/*Image picker Modal */}
          <Modal
            visible={showMenu}
            transparent
            animationType="slide"
            onRequestClose={() => setShowMenu(false)}
          >
            <Pressable 
              style={styles.imageModalOverlay} 
              onPress={() => setShowMenu(false)} 
            />
            {/* Pinned to the bottom of the screen, so it has to clear the home
                indicator / Android navigation bar itself: 20 is its own padding. */}
            <View style={[styles.imageModalContainer, { paddingBottom: 20 + insets.bottom }]}>
              <TouchableOpacity 
                style={styles.imageMenuOption} 
                onPress={() => { setShowMenu(false); takePhotoAsync(); }}
              >
                <FontAwesome name="camera" size={20} color={theme.primary} />
                <Text style={styles.imageMenuText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.imageMenuOption} 
                onPress={() => { setShowMenu(false); pickImageAsync(); }}
              >
                <FontAwesome name="image" size={20} color={theme.primary} />
                <Text style={styles.imageMenuText}>Choose from Gallery</Text>
              </TouchableOpacity>

              {image && (
                <TouchableOpacity 
                  style={styles.imageMenuOption} 
                  onPress={removeImage}
                >
                  <FontAwesome name="trash" size={20} color={theme.destructive} />
                  <Text style={[styles.imageMenuText, styles.imageMenuTextDestructive]}>Remove Image</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={[styles.imageMenuOption, styles.imageMenuCancel]} 
                onPress={() => setShowMenu(false)}
              >
                <Text style={[styles.imageMenuText, styles.imageMenuTextDestructive]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Modal>

        </SafeAreaView>
    )
}

const createStyles = (theme: Theme) => StyleSheet.create({
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
    backgroundColor: theme.scrim,
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
    shadowColor: theme.shadow,
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
    color: theme.destructiveText,
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
    color: theme.onAccent,
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
    shadowColor: theme.shadow,
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
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButtonText: {
    fontFamily: "Roboto",
    fontWeight: "bold",
    color: theme.onAccent,
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
    shadowColor: theme.shadow,
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
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Roboto",
    color: theme.cardText,
  },
  descriptionContainer: {
    width: '100%',
    height: 120,
    borderRadius: 15,
    backgroundColor: theme.button_darker_primary,
    paddingHorizontal: 15,
    paddingTop: 15,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  descriptionText: {
    fontFamily: "Roboto",
    color: theme.cardText,
    fontSize: 16,
    lineHeight: 22,
  },
  placeholderText: {
    color: theme.cardTextMuted,
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
    shadowColor: theme.shadow,
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
    shadowColor: theme.shadow,
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
  editButton: {
    padding: 8,
    marginLeft: 4,
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
  optionsContainer: {
    borderRadius: 12,
    backgroundColor: theme.background,
    padding: 10,
    shadowColor: theme.shadow,
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
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionText: {
    color: theme.cardText,
    fontFamily: "Roboto",
    fontWeight: "500",
    fontSize: 16,
    flex: 1,
  },
  optionEditButton: {
    position: "absolute",
    bottom: 10,
    right: 50,
    backgroundColor: theme.button,
    height: 32,
    width: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: theme.overlay,
  },
  modalContainer: {
    backgroundColor: theme.background,
    padding: 25,
    borderRadius: 15,
    width: '85%',
    maxWidth: 400,
    shadowColor: theme.shadow,
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
    color: theme.destructiveText,
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
    color: theme.onAccent,
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
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  templatesList: {
    height: '75%',
    borderBottomWidth: 2,
    borderColor: theme.button_darker_primary,
  },
  templateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  templateRowCard: {
    flex: 1,
  },
  templateBookmark: {
    width: 30,
  },
  emptyTemplates: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTemplatesTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyTemplatesText: {
    color: theme.textSecondary,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
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
    backgroundColor: theme.overlay,
  },
  imageModalContainer: {
    backgroundColor: theme.background,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: "absolute",
    bottom: 0,
    width: "100%",
    shadowColor: theme.shadow,
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
  imageMenuTextDestructive: {
    color: theme.destructive,
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