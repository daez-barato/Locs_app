import { SearchTemplate } from "@/types/interfaces";
import { useThemeConfig, Theme } from "@/components/ui/use-theme-config";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { 
    Text, 
    View, 
    StyleSheet, 
    TouchableOpacity
} from "react-native";
import { Image } from "expo-image";


export default function TemplateCard({ item }: {item: SearchTemplate}) {
    const theme = useThemeConfig();
    const styles = useThemedStyles(createStyles);
    const router = useRouter();

    return (
        <View style={styles.card}>
            <TouchableOpacity
                style={styles.cardTouchable}
                onPress={() => router.push(`/studio/${item.id}`)}
                activeOpacity={0.8}
                accessibilityRole="button"
            >
                <View style={styles.thumbnailContainer}>
                    {item.thumbnail ? (
                        <Image
                            source={{ uri: item.thumbnail }}
                            style={styles.thumbnail}
                            contentFit="cover"
                        />
                    ) : (
                        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                            <FontAwesome name="clone" size={28} color={theme.cardTextFaint} />
                        </View>
                    )}
                </View>
                
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <Text 
                            style={styles.cardTitle}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {item.title}
                        </Text>
                    </View>
                    
                    {item.description && (
                        <Text 
                            style={styles.cardDescription}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                        >
                            {item.description}
                        </Text>
                    )}
                    
                    <View style={styles.cardFooter}>
                        <View style={styles.actionIndicator}>
                            <Text style={styles.actionText}>Use template</Text>
                            <FontAwesome name="chevron-right" size={10} color={theme.primary} />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
}

const createStyles = (theme: Theme) => StyleSheet.create({
    card: {
        backgroundColor: theme.card,
        marginHorizontal: 16,
        marginVertical: 6,
        borderRadius: 18,
        borderCurve: 'continuous',
        boxShadow: "0 2px 16px rgba(0, 0, 0, 0.1)",
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.cardOutline,
    },
    cardTouchable: {
        flexDirection: 'row',
        gap: 14,
        padding: 14,
    },
    thumbnailPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.cardBorder,
    },
    thumbnailContainer: {
        position: 'relative',
    },
    thumbnail: {
        width: 80,
        height: 80,
        borderRadius: 14,
        borderCurve: 'continuous',
        backgroundColor: theme.cardBorder,
    },
    cardContent: {
        flex: 1,
        justifyContent: 'center',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    cardTitle: {
        color: theme.cardText,
        fontSize: 16,
        fontWeight: '700',
        lineHeight: 20,
        flex: 1,
        marginRight: 8,
    },
    cardDescription: {
        color: theme.cardText,
        fontSize: 13,
        opacity: 0.8,
        lineHeight: 16,
        marginBottom: 8,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    actionIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        backgroundColor: theme.primarySurface,
        borderWidth: 1,
        borderColor: theme.primaryBorder,
    },
    actionText: {
        color: theme.primary,
        fontSize: 12,
        fontWeight: '600',
    },
});