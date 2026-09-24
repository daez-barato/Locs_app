import FontAwesome from "@expo/vector-icons/FontAwesome";
import { usePathname, useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { haptics } from "@/utils/haptics";

// Tabs where creating an event is the natural next step; Shop and Profile
// have their own actions.
const SHOWN_ON = new Set(["/", "/explore", "/parleys"]);

/**
 * The "+" that opens the studio, floating over the tab screens. Rendered by the
 * tab layout, so its offsets are from the bottom of the screen: the spot the
 * app has always used, clear of the tab bar and the end of the lists.
 */
export default function CreateEventButton() {
    const theme = useThemeConfig();
    const styles = useThemedStyles(createStyles);
    const router = useRouter();
    const pathname = usePathname();

    if (!SHOWN_ON.has(pathname)) return null;

    return (
        <TouchableOpacity
            style={styles.button}
            onPress={() => {
                haptics.tap();
                router.push("/studio/create");
            }}
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
        right: 40,
        bottom: 150,
        zIndex: 1,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.primary,
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.35)",
    },
});
