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

    const getTypeIcon = (type?: string) => {
        switch (type?.toLowerCase()) {
            case 'event':
                return 'calendar';
            case 'poll':
                return 'bar-chart';
            case 'survey':
                return 'clipboard';
            case 'quiz':
                return 'question-circle';
            default:
                return 'file-text';
        }
    };

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
                    {item.type && (
                        <View style={styles.typeOverlay}>
                            <FontAwesome 
                                name={getTypeIcon(item.type)} 
                                size={14} 
                                color={theme.onPrimary}
                            />
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
                        {item.type && (
                            <View style={styles.typeBadge}>
                                <Text style={styles.typeText}>
                                    {item.type}
                                </Text>
                            </View>
                        )}
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
                            <FontAwesome name="chevron-right" size={12} color={theme.primary} />
                            <Text style={styles.actionText}>Use Template</Text>
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
        marginVertical: 8,
        borderRadius: 16,
        boxShadow: "0 2px 16px rgba(0, 0, 0, 0.1)",
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.cardOutline,
    },
    cardTouchable: {
        flexDirection: 'row',
        padding: 16,
    },
    thumbnailPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.cardBorder,
    },
    thumbnailContainer: {
        position: 'relative',
        marginRight: 16,
    },
    thumbnail: {
        width: 70,
        height: 70,
        borderRadius: 14,
        backgroundColor: theme.cardBorder,
    },
    typeOverlay: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.card,
        backgroundColor: theme.primary,
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
    typeBadge: {
        backgroundColor: theme.primarySurface,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    typeText: {
        color: theme.primary,
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
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
        gap: 4,
    },
    actionText: {
        color: theme.primary,
        fontSize: 12,
        fontWeight: '600',
    },
});