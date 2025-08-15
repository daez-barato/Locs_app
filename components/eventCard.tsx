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

export interface Event {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    expire_date: string;
    created_at: string;
    participants_count: number;
    locked: boolean;
    category?: string;
    is_creator: boolean;
}

interface EventCardProps {
    event: Event;
    isCreated?: boolean;
    isLoading?: boolean;
}

export default function EventCard({ event, isCreated = false, isLoading = false }: EventCardProps) {
    const theme = useThemeConfig();
    const router = useRouter();

    const getStatusColor = (locked: boolean) => {
        return locked ? '#FF6B6B' : theme.primary;
    };

    const getStatusText = (locked: boolean) => {
        return locked ? 'Locked' : 'Open';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays > 0) return `${diffDays} days left`;
        return 'Expired';
    };

    return (
        <Animated.View
            style={[
                styles(theme).eventCard,
                { 
                    opacity: isLoading ? 0.5 : 1,
                    transform: [{ scale: isLoading ? 0.95 : 1 }]
                }
            ]}
        >
            <TouchableOpacity
                style={styles(theme).cardTouchable}
                onPress={() => router.push(`/event/${event.id}`)}
                activeOpacity={0.8}
            >
                <Image 
                    source={{ uri: event.thumbnail }} 
                    style={styles(theme).eventImage} 
                />
                <View style={styles(theme).eventContent}>
                    <View style={styles(theme).eventHeader}>
                        <Text style={styles(theme).eventTitle} numberOfLines={2}>
                            {event.title}
                        </Text>
                        <View style={[styles(theme).statusBadge, { backgroundColor: getStatusColor(event.locked) }]}>
                            <Text style={styles(theme).statusText}>
                                {getStatusText(event.locked)}
                            </Text>
                        </View>
                    </View>
                    
                    <Text style={styles(theme).eventDescription} numberOfLines={2}>
                        {event.description}
                    </Text>
                    
                    <View style={styles(theme).eventMeta}>
                        <View style={styles(theme).metaItem}>
                            <FontAwesome name="users" size={14} color={theme.primary} />
                            <Text style={styles(theme).metaText}>
                                {event.participants_count} participants
                            </Text>
                        </View>
                        
                        <View style={styles(theme).metaItem}>
                            <FontAwesome name="calendar" size={14} color={theme.primary} />
                            <Text style={styles(theme).metaText}>
                                {formatDate(event.expire_date)}
                            </Text>
                        </View>
                    </View>
                    
                    <View style={styles(theme).eventFooter}>
                        {event.category && (
                            <View style={styles(theme).categoryTag}>
                                <Text style={styles(theme).categoryText}>{event.category}</Text>
                            </View>
                        )}
                        
                        {event.is_creator && (
                            <View style={styles(theme).creatorBadge}>
                                <FontAwesome name="user" size={16} color={theme.buttonText} />
                                <Text style={styles(theme).creatorText}>Creator</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = (theme: Theme) => StyleSheet.create({
    eventCard: {
        backgroundColor: theme.card,
        marginHorizontal: 20,
        marginVertical: 6,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
        overflow: 'hidden',
    },
    cardTouchable: {
        flexDirection: 'row',
        padding: 16,
    },
    eventImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        marginRight: 16,
        backgroundColor: theme.cardBorder,
    },
    eventContent: {
        flex: 1,
    },
    eventHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.cardText,
        flex: 1,
        marginRight: 12,
        lineHeight: 20,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
        color: 'white',
    },
    eventDescription: {
        fontSize: 13,
        color: theme.cardText,
        opacity: 0.8,
        lineHeight: 16,
        marginBottom: 12,
    },
    eventMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 12,
        color: theme.cardText,
        opacity: 0.8,
    },
    eventFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    categoryTag: {
        backgroundColor: theme.primary + '20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryText: {
        fontSize: 11,
        color: theme.primary,
        fontWeight: '600',
    },
    creatorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
    },
    creatorText: {
        fontSize: 12,
        color: theme.buttonText,
        fontWeight: '600',
    },
});