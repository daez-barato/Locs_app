import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import { useThemedStyles } from "@/hooks/use-themed-styles";

/**
 * Required "I agree to the Terms of Service and Privacy Policy" checkbox,
 * shared by the register form and onboarding — both need the same tappable
 * links and the same acceptance state before continuing.
 */
export default function LegalAgreement({
    accepted,
    onToggle,
}: {
    accepted: boolean;
    onToggle: (next: boolean) => void;
}) {
    const theme = useThemeConfig();
    const styles = useThemedStyles(createStyles);
    const router = useRouter();

    return (
        <TouchableOpacity
            style={styles.row}
            onPress={() => onToggle(!accepted)}
            activeOpacity={0.8}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: accepted }}
            accessibilityLabel="I am 18 or older and agree to the Terms of Service and Privacy Policy"
        >
            <FontAwesome
                name={accepted ? "check-square" : "square-o"}
                size={20}
                color={accepted ? theme.primary : theme.cardTextFaint}
                style={styles.checkbox}
            />
            <Text style={styles.text}>
                I am 18 or older and agree to the{" "}
                <Text
                    style={styles.link}
                    onPress={() => router.push(`/legal/terms`)}
                    accessibilityRole="link"
                >
                    Terms of Service
                </Text>{" "}
                and{" "}
                <Text
                    style={styles.link}
                    onPress={() => router.push(`/legal/privacy`)}
                    accessibilityRole="link"
                >
                    Privacy Policy
                </Text>
            </Text>
        </TouchableOpacity>
    );
}

const createStyles = (theme: Theme) => StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        width: "100%",
        marginVertical: 8,
    },
    checkbox: {
        marginTop: 2,
    },
    text: {
        flex: 1,
        color: theme.cardTextSecondary,
        fontSize: 14,
        lineHeight: 20,
    },
    link: {
        color: theme.text,
        fontWeight: "600",
        textDecorationLine: "underline",
    },
});
