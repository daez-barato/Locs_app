import { Event } from "@/types/interfaces";
import { fetchUserLiveBets, fetchUserLiveEvents } from "@/api/parleyFunctions";
import EventCard from "@/components/eventCard";
import { useThemeConfig, Theme } from "@/components/ui/use-theme-config";
import { withAlpha } from "@/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useCoinContext } from "@/hooks/use-coin-context";
import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Text,
    View,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from "react-native";

const LOAD_ERROR_MESSAGE = "Couldn't load your parleys. Check your connection and try again.";

export default function Parleys() {
    const theme = useThemeConfig();
    const styles = useThemedStyles(createStyles);
    const router = useRouter()
    const { refreshCoins } = useCoinContext();
    const { user } = useAuthContext();
    const [activeTab, setActiveTab] = useState<'participating' | 'created'>('participating');
    const [participatingEvents, setParticipatingEvents] = useState<Event[]>([]);
    const [createdEvents, setCreatedEvents] = useState<Event[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    // The tab stays mounted, so useFocusEffect below is what picks up a bet
    // placed elsewhere; this tracks whether the initial load already
    // succeeded once, so a later failed background reload doesn't blank the
    // screen and a refocus right after mount doesn't double-load.
    const hasLoaded = useRef(false);

    const fetchUserEvents = useCallback(async (mode: "initial" | "refresh" | "silent") => {
        if (mode === "initial") setIsLoading(true);
        if (mode === "refresh") setIsRefreshing(true);

        const username = user?.username;

        if (!username) {
            // Not signed in yet (or the profile hasn't loaded) — show the
            // existing error state rather than calling the RPCs with no username.
            if (!hasLoaded.current) setErrorMessage(LOAD_ERROR_MESSAGE);
            setIsLoading(false);
            setIsRefreshing(false);
            return;
        }

        try {
            const [participating, created] = await Promise.all([
                fetchUserLiveBets(username),
                fetchUserLiveEvents(username),
            ]);

            setParticipatingEvents(participating);
            setCreatedEvents(created);
            setErrorMessage(null);
            hasLoaded.current = true;
        } catch (error) {
            console.error('Error fetching user events:', error);
            // A failed background reload keeps what's on screen; only an
            // empty screen (nothing loaded yet) gets the error state.
            if (!hasLoaded.current) setErrorMessage(LOAD_ERROR_MESSAGE);
        }

        setIsLoading(false);
        setIsRefreshing(false);
    }, [user?.username]);

    useEffect(() => {
        const load = async () => {
            await fetchUserEvents("initial");
        };
        load();
    }, [fetchUserEvents]);

    // Reload silently whenever the tab regains focus — e.g. after placing a
    // bet on an event opened from elsewhere — but not on the very first
    // focus, which the initial load above already covers.
    useFocusEffect(
        useCallback(() => {
            if (hasLoaded.current) {
                fetchUserEvents("silent");
            }
        }, [fetchUserEvents])
    );

    const onRefresh = async () => {
        await Promise.all([fetchUserEvents("refresh"), refreshCoins()]);
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