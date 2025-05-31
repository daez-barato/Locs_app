
import { useThemeConfig } from "@/components/ui/use-theme-config";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";




export default function Explore(){
    const theme = useThemeConfig();


    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
            <Text>Explore</Text>
        </SafeAreaView>
    );
}