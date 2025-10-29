import { SearchTemplate } from "@/api/interfaces/objects";
import { useThemeConfig, Theme } from "@/components/ui/use-theme-config";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    Text,
    View,
    StyleSheet,
    TouchableOpacity,
    Image,
    Animated
} from "react-native";


export default function TemplateCard({ item }: {item: SearchTemplate}) {
    const theme = useThemeConfig();
    const router = useRouter();

    const getTypeColor = (type?: string) => {
        switch (type?.toLowerCase()) {
            case 'event':
                return '#FF6B6B';
            case 'poll':
                return '#4ECDC4';
            case 'survey':
                return '#45B7D1';
            case 'quiz':
                return '#96CEB4';
            default:
                return theme.primary;
        }
    };

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
        <Animated.View
            style={[
                styles(theme).card,
                {
                    opacity: 1,
                    transform: [{ scale: 1 }]
                }
            ]}
        >
            <TouchableOpacity
                style={styles(theme).cardTouchable}
                onPress={() => router.push(`/studio/${item.id}`)}
                activeOpacity={0.8}
            >
                <View style={styles(theme).thumbnailContainer}>
                    <Image
                        source={{ uri: item.thumbnail }}
                        style={styles(theme).thumbnail}
                        resizeMode="cover"
                    />
                    {item.type && (
                        <View style={[
                            styles(theme).typeOverlay,
                            { backgroundColor: getTypeColor(item.type) }
                        ]}>
                            <FontAwesome 
                                name={getTypeIcon(item.type)} 
                                size={14} 
                                color="white" 
                            />
                        </View>
                    )}
                </View>
                
                <View style={styles(theme).cardContent}>
                    <View style={styles(theme).cardHeader}>
                        <Text 
                            style={styles(theme).cardTitle}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {item.title}
                        </Text>
                        {item.type && (
                            <View style={[
                                styles(theme).typeBadge,
                                { backgroundColor: getTypeColor(item.type) + '20' }
                            ]}>
                                <Text style={[
                                    styles(theme).typeText,
                                    { color: getTypeColor(item.type) }
                                ]}>
                                    {item.type}
                                </Text>
                            </View>
                        )}
                    </View>
                    
                    {item.description && (
                        <Text 
                            style={styles(theme).cardDescription}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                        >
                            {item.description}
                        </Text>
                    )}
                    
                    <View style={styles(theme).cardFooter}>
                        <View style={styles(theme).actionIndicator}>
                            <FontAwesome name="chevron-right" size={12} color={theme.primary} />
                            <Text style={styles(theme).actionText}>Use Template</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = (theme: Theme) => StyleSheet.create({
    card: {
        backgroundColor: theme.card,
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.cardBorder + '40',
    },
    cardTouchable: {
        flexDirection: 'row',
        padding: 16,
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
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    typeText: {
        fontSize: 10,
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