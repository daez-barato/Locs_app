import { Event } from "@/types/interfaces";
import { fetchUserLiveBets, fetchUserLiveEvents } from "@/api/parleyFunctions";
import EventCard from "@/components/eventCard";
import { useThemeConfig, Theme } from "@/components/ui/use-theme-config";
import { withAlpha } from "@/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useCoinContext } from "@/hooks/use-coin-context";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { 
    Text, 
    View, 
    FlatList, 
    StyleSheet, 
    TouchableOpacity, 
    RefreshControl,
    ActivityIndicator,
} from "react-native";

export default function Parleys() {
    const theme = useThemeConfig();
    const styles = useThemedStyles(createStyles);
    const router = useRouter()
    const { refreshCoins } = useCoinContext();
    const [activeTab, setActiveTab] = useState<'participating' | 'created'>('participating');
    const [participatingEvents, setParticipatingEvents] = useState<Event[]>([]);
    const [createdEvents, setCreatedEvents] = useState<Event[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fetchUserEvents = async () => {
        try {
            const participating = await fetchUserLiveBets();
            const created = await fetchUserLiveEvents(); 
            
            if (!Array.isArray(participating) || !Array.isArray(created)) {
                console.error('Invalid data format received from API');
                return;
            }

            setParticipatingEvents(participating);
            setCreatedEvents(created);
            setErrorMessage(null);
        } catch (error) {
            console.error('Error fetching user events:', error);
            setErrorMessage("Couldn't load your parleys. Check your connection and try again.");
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await fetchUserEvents();
            setIsLoading(false);
        };
        loadData();
    }, []);

    const onRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([fetchUserEvents(), refreshCoins()]);
        setIsRefreshing(false);
    };

    const currentEvents = activeTab === 'participating' ? participatingEvents : createdEvents;

    return (
        <View style={styles.container}>

            {/* Stats Overview */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{participatingEvents.length}</Text>
                    <Text style={styles.statLabel}>Participating</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{createdEvents.length}</Text>
                    <Text style={styles.statLabel}>Created</Text>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'participating' && styles.activeTab]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: activeTab === 'participating' }}
                    onPress={() => setActiveTab('participating')}
                >
                    <FontAwesome 
                        name="calendar-check-o" 
                        size={16} 
                        color={activeTab === 'participating' ? theme.onPrimary : theme.cardText} 
                    />
                    <Text style={[
                        styles.tabText, 
                        activeTab === 'participating' && styles.activeTabText
                    ]}>
                        Participating
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'created' && styles.activeTab]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: activeTab === 'created' }}
                    onPress={() => setActiveTab('created')}
                >
                    <FontAwesome 
                        name="star" 
                        size={16} 
                        color={activeTab === 'created' ? theme.onPrimary : theme.cardText} 
                    />
                    <Text style={[
                        styles.tabText, 
                        activeTab === 'created' && styles.activeTabText
                    ]}>
                        My Events
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Events List */}
            <FlatList
                data={currentEvents}
                keyExtractor={(event) => `event-${event.id}-${activeTab}`}
                renderItem={({ item }) => <EventCard event={item} />}
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.primary}
                        colors={[theme.primary]}
                        progressBackgroundColor={theme.card}
                    />
                }
                contentContainerStyle={styles.scrollContent}
                ListEmptyComponent={
                    <>
                        {isLoading && (
                            <View style={styles.emptyState}>
                                <ActivityIndicator size="large" color={theme.primary} />
                            </View>
                        )}

                        {!isLoading && (
                            <View style={styles.emptyState}>
                                <FontAwesome 
                                    name={errorMessage ? "exclamation-triangle" : activeTab === 'participating' ? "calendar-o" : "star-o"} 
                                    size={48} 
                                    color={errorMessage ? theme.destructiveLabel : theme.textFaint} 
                                />
                                <Text style={styles.emptyTitle}>
                                    {errorMessage
                                        ? "Something went wrong"
                                        : `No ${activeTab === 'participating' ? 'events joined' : 'events created'} yet`}
                                </Text>
                                <Text style={styles.emptySubtext}>
                                    {errorMessage
                                        ? errorMessage
                                        : activeTab === 'participating'
                                        ? "Discover and join exciting events in the Explore tab"
                                        : "Create your first event and bring people together"}
                                </Text>
                                <TouchableOpacity style={styles.emptyButton}
                                    accessibilityRole="button"
                                    activeOpacity={0.8}
                                    onPress={() => {
                                        if (errorMessage){
                                            onRefresh();
                                        } else if (activeTab === "created"){
                                            router.push("/studio/create");
                                        } else if (activeTab === "participating"){
                                            router.push("/(tabs)/explore");
                                        }
                                    }}
                                >
                                    <Text style={styles.emptyButtonText}>
                                        {errorMessage
                                            ? 'Try again'
                                            : activeTab === 'participating' ? 'Explore Events' : 'Create Event'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
                }
            />
        </View>
    );
}

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: theme.card,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.1)",
    },
    statNumber: {
      fontVariant: ['tabular-nums'],
        fontSize: 20,
        fontWeight: '700',
        color: theme.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: theme.cardText,
        opacity: 0.8,
    },
    tabsContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 16,
        backgroundColor: theme.card,
        borderRadius: 12,
        padding: 4,
        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.1)",
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 8,
    },
    activeTab: {
        backgroundColor: theme.primary,
        boxShadow: `0 2px 8px ${withAlpha(theme.primary, 0.3)}`,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.cardText,
    },
    activeTabText: {
        color: theme.onPrimary,
        fontWeight: '700',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        // Room for the create button, which floats over the end of the list.
        paddingBottom: 96,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.text,
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: theme.textSecondary,
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
    },
    emptyButton: {
        marginTop: 20,
        backgroundColor: theme.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    emptyButtonText: {
        color: theme.onPrimary,
        fontSize: 15,
        fontWeight: '600',
    },
});