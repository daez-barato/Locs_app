import { useThemeConfig } from "@/components/ui/use-theme-config";
import { Text, View } from "react-native";

export default function Parleys() {
    //Simple screen with a text
    const { colors } = useThemeConfig();
    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Text>Parleys</Text>
        </View>
    );
}