import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { SafeAreaView } from "react-native-safe-area-context";
import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { LEGAL_EFFECTIVE_DATE, PRIVACY_POLICY, TERMS_OF_SERVICE } from "@/constants/legal";

/**
 * Renders the Terms of Service or Privacy Policy. Lives outside both
 * Stack.Protected groups in app/_layout.tsx so it opens from the logged-out
 * auth screen as well as from Settings/onboarding while signed in.
 */
export default function LegalScreen() {
    const { doc } = useLocalSearchParams<{ doc: string }>();
    const theme = useThemeConfig();
    const styles = useThemedStyles(createStyles);
    const router = useRouter();

    const legalDoc = doc === "privacy" ? PRIVACY_POLICY : TERMS_OF_SERVICE;

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
            <View style={styles.row}>
                <Text style={styles.title} accessibilityRole="header">{legalDoc.title}</Text>
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
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.effectiveDate}>Effective {LEGAL_EFFECTIVE_DATE}</Text>
                {legalDoc.sections.map((section) => (
                    <View key={section.heading} style={styles.section}>
                        <Text style={styles.heading}>{section.heading}</Text>
                        {section.paragraphs.map((paragraph, index) => (
                            <Text key={index} style={styles.paragraph}>{paragraph}</Text>
                        ))}
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (theme: Theme) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.background,
    },
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
    container: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    effectiveDate: {
        color: theme.cardTextFaint,
        fontSize: 13,
        marginBottom: 16,
    },
    section: {
        marginBottom: 20,
    },
    heading: {
        color: theme.cardText,
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 6,
    },
    paragraph: {
        color: theme.cardTextSecondary,
        fontSize: 14,
        lineHeight: 21,
        marginBottom: 8,
    },
});
