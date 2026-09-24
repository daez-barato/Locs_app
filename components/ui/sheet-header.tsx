import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import { useThemedStyles } from "@/hooks/use-themed-styles";

/** Title row for the form-sheet routes; swiping down or tapping ✕ dismisses. */
export default function SheetHeader({ title }: { title: string }) {
    const theme = useThemeConfig();
    const styles = useThemedStyles(createStyles);
    const router = useRouter();

    return (
        <View style={styles.row}>
            <Text style={styles.title} accessibilityRole="header">{title}</Text>
            <TouchableOpacity
                onPress={() => router.back()}
                style={styles.close}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close"
            >
                <FontAwesome name="times" size={18} color={theme.cardText} />
            </TouchableOpacity>
        </View>
    );
}

const createStyles = (theme: Theme) => StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 12,
    },
    title: {
        color: theme.text,
        fontSize: 22,
        fontWeight: "700",
    },
    close: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.cardChip,
        alignItems: "center",
        justifyContent: "center",
    },
});
