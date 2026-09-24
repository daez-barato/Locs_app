import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import { useThemedStyles } from "@/hooks/use-themed-styles";

/**
 * The "+" that opens the studio. Rendered inside a tab screen rather than the
 * tab layout: a screen's content ends where the tab bar starts, so offsets
 * here are measured from the tab bar on every device. From the layout it
 * needed a guessed `bottom: 150` and showed on every tab, Shop and Profile
 * included.
 */
export default function CreateEventButton() {
    const theme = useThemeConfig();
    const styles = useThemedStyles(createStyles);
    const router = useRouter();

    return (
        <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/studio/create")}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Create an event"
        >
            <FontAwesome name="plus" size={24} color={theme.onPrimary} />
        </TouchableOpacity>
    );
}

const createStyles = (theme: Theme) => StyleSheet.create({
    button: {
        position: "absolute",
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.primary,
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.35)",
    },
});
