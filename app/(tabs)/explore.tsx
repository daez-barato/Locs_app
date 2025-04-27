
import { useThemeConfig } from "@/components/ui/use-theme-config";
import { Text, View } from "react-native";




export default function Explore(){
    const { colors } = useThemeConfig();


    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Text>Explore</Text>
        </View>
    );
}