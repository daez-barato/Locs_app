import CameraViewer from "@/components/camera-viewer"
import { SafeAreaView } from "react-native-safe-area-context"
import { StyleSheet } from "react-native"

import { useThemeConfig } from "@/components/ui/use-theme-config"

export default function Studio(){
    const theme = useThemeConfig();

    return (
        <SafeAreaView style={[styles.container, {backgroundColor: theme.background }]}>
            
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
    },
})
