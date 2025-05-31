import { Recommendation } from "@/api/fyFunctions";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Theme, useThemeConfig } from "./ui/use-theme-config";
import { useRouter } from "expo-router";

type Props = {
    item: Recommendation
}

export default function RecommendationItem({item}: Props){
    const theme = useThemeConfig();
    const router = useRouter();

    function goToBet(){
        router.push(`/event/${item.id}`);
    }

    return(
    <TouchableOpacity style={styles(theme).container} onPress={goToBet}>
        <Text style={styles(theme).recommendationTitle}> {item.title}</Text>
        <Text style={styles(theme).recommendationDescription}> {item.description} </Text>
    </TouchableOpacity>
)}

const styles = (theme: Theme) => StyleSheet.create({
    container:{
        flex: 1,
        height: 100,
        backgroundColor: theme.cardBackground,
        borderColor: theme.cardBorder,
        borderWidth: 1,
    },
    recommendationTitle:{
        flex: 1,
        maxHeight: 40,
        fontSize: 20,
        fontWeight: "bold",
        paddingTop: 10,
        paddingLeft: 2,
    },
    recommendationDescription:{
        flex:1,
        paddingLeft: 2,
        textAlign: "left",
    }
})