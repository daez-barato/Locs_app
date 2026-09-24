import { Event } from "@/types/interfaces";
import { useThemeConfig, Theme } from "@/components/ui/use-theme-config";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { 
    Text, 
    View, 
    StyleSheet, 
    TouchableOpacity, 
    Image
} from "react-native";

export default function EventCard({event}: {event: Event}) {
    const theme = useThemeConfig();
    const styles = useThemedStyles(createStyles);
    const router = useRouter();

    const getStatusColor = (locked: boolean, decided: boolean) => {
        if (decided) return theme.destructive;
        return locked ? theme.secondary : theme.primary;
    };

    const getStatusText = (locked: boolean, decided: boolean) => {
        if (decided) return 'Decided';
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
        <View style={styles.eventCard}>
            <TouchableOpacity
                style={styles.cardTouchable}
                onPress={() => router.push(`/event/${event.id}`)}
                activeOpacity={0.8}
                accessibilityRole="button"
            >
                <Image 
                    source={{ uri: event.thumbnail_url }} 
                    style={styles.eventImage}
                    resizeMode="cover"
                />
                <View style={styles.eventContent}>
                    <View style={styles.eventHeader}>
                        <Text style={styles.eventTitle} numberOfLines={2}>
                            {event.title}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(event.locked, event.decided) }]}>
                            <Text style={styles.statusText}>
                                {getStatusText(event.locked, event.decided)}
                            </Text>
                        </View>
                    </View>
                    
                    <Text style={styles.eventDescription} numberOfLines={2}>
                        {event.description}
                    </Text>
                    
                    <View style={styles.eventMeta}>
                        <View style={styles.metaItem}>
                            <FontAwesome name="users" size={14} color={theme.primary} />
                            <Text style={styles.metaText}>
                                {event.participants_count} participants
                            </Text>
                        </View>
                        
                        <View style={styles.metaItem}>
                            <FontAwesome name="calendar" size={14} color={theme.primary} />
                            <Text style={styles.metaText}>
                                {formatDate(event.expire_date)}
                            </Text>
                        </View>
                    </View>
                    
                    {/* Rendered only when it has content, so the spacing above
                        it doesn't leave an empty strip at the bottom of the card. */}
                    {event.is_creator && (
                        <View style={styles.eventFooter}>
                            <View style={styles.creatorBadge}>
                                <FontAwesome name="user" size={16} color={theme.buttonText} />
                                <Text style={styles.creatorText}>Creator</Text>
                            </View>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </View>
    );
}

const createStyles = (theme: Theme) => StyleSheet.create({
    eventCard: {
        backgroundColor: theme.card,
        marginHorizontal: 20,
        marginVertical: 6,
        borderRadius: 16,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.cardOutline,
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
        color: theme.onAccent,
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
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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