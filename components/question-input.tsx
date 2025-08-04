import { Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useThemeConfig } from "./ui/use-theme-config";


type Props = {
    visible : boolean,
    newQuestion : string,

}


export default function QuestionInput({visible, newQuestion}: Props){
    const theme = useThemeConfig();

    return(
    <Modal visible={visible} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
        <View style={{ backgroundColor: theme.background, padding: 20, borderRadius: 10, width: "80%" }}>
            <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 10 }}>New Question</Text>

            <TextInput
            placeholder="Question"
            value={newQuestion}
            onChangeText={setNewQuestion}
            style={{
                borderWidth: 1,
                borderColor: theme.button_darker_primary,
                padding: 10,
                borderRadius: 5,
                marginBottom: 10,
            }}
            />

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <TouchableOpacity
                onPress={() => {
                setQuestionModal(false);
                setNewQuestion("");
                expandQuestionMenu(false);
                }}
            >
                <Text style={{ color: "red" }}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => {
                if (newQuestion.trim() !== "") {
                    const updated = [...questions];
                    updated.splice(questions.length - 1, 0, newQuestion.trim()); // add before "New Question"
                    setQuestionList(updated);
                    setNewQuestion("");
                    setQuestionModal(false);
                }
                }}
            >
                <Text style={{ color: theme.primary }}>Add</Text>
            </TouchableOpacity>
            </View>
        </View>
        </View>
    </Modal>
)}