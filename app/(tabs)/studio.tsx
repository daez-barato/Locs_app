import CameraViewer from "@/components/camera-viewer"
import { SafeAreaView, StyleSheet } from "react-native"

import { useThemeConfig } from "@/components/ui/use-theme-config"

export default function Studio(){
    const {colors} = useThemeConfig();

    return (
        <SafeAreaView style={[styles.container, {backgroundColor: colors.void }]}>
            <CameraViewer/>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
    },
})
