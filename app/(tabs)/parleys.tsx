import { Event } from "@/api/interfaces/objects";
import { fetchUserLiveBets, fetchUserLiveEvents } from "@/api/parleyFunctions";
import EventCard from "@/components/eventCard";
import { useThemeConfig, Theme } from "@/components/ui/use-theme-config";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { 
    Text, 
    View, 
    ScrollView, 
    StyleSheet, 
    TouchableOpacity, 
    RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Parleys() {
    const theme = useThemeConfig();
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'participating' | 'created'>('participating');
    const [participatingEvents, setParticipatingEvents] = useState<Event[]>([]);
    const [createdEvents, setCreatedEvents] = useState<Event[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

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
        } catch (error) {
            console.error('Error fetching user events:', error);
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
        await fetchUserEvents();
        setIsRefreshing(false);
    };

    const currentEvents = activeTab === 'participating' ? participatingEvents : createdEvents;

    return (
        <SafeAreaView style={styles(theme).container}>
            {/* Header */}
            <View style={styles(theme).header}>
                <Text style={styles(theme).headerTitle}>My Parleys</Text>
            </View>

            {/* Stats Overview */}
            <View style={styles(theme).statsContainer}>
                <View style={styles(theme).statCard}>
                    <Text style={styles(theme).statNumber}>{participatingEvents.length}</Text>
                    <Text style={styles(theme).statLabel}>Participating</Text>
                </View>
                <View style={styles(theme).statCard}>
                    <Text style={styles(theme).statNumber}>{createdEvents.length}</Text>
                    <Text style={styles(theme).statLabel}>Created</Text>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles(theme).tabsContainer}>
                <TouchableOpacity 
                    style={[styles(theme).tab, activeTab === 'participating' && styles(theme).activeTab]}
                    onPress={() => setActiveTab('participating')}
                >
                    <FontAwesome 
                        name="calendar-check-o" 
                        size={16} 
                        color={activeTab === 'participating' ? theme.buttonText : theme.cardText} 
                    />
                    <Text style={[
                        styles(theme).tabText, 
                        activeTab === 'participating' && styles(theme).activeTabText
                    ]}>
                        Participating
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles(theme).tab, activeTab === 'created' && styles(theme).activeTab]}
                    onPress={() => setActiveTab('created')}
                >
                    <FontAwesome 
                        name="star" 
                        size={16} 
                        color={activeTab === 'created' ? theme.buttonText : theme.cardText} 
                    />
                    <Text style={[
                        styles(theme).tabText, 
                        activeTab === 'created' && styles(theme).activeTabText
                    ]}>
                        My Events
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Events List */}
            <ScrollView 
                style={styles(theme).scrollView}
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
                contentContainerStyle={styles(theme).scrollContent}
            >
                {currentEvents.map(event => (
                    <EventCard
                        key={`event-${event.id}-${activeTab}`}
                        event={event}
                    />
                ))}
                
                {currentEvents.length === 0 && !isLoading && (
                    <View style={styles(theme).emptyState}>
                        <FontAwesome 
                            name={activeTab === 'participating' ? "calendar-o" : "star-o"} 
                            size={48} 
                            color={theme.text + '40'} 
                        />
                        <Text style={styles(theme).emptyTitle}>
                            No {activeTab === 'participating' ? 'events joined' : 'events created'} yet
                        </Text>
                        <Text style={styles(theme).emptySubtext}>
                            {activeTab === 'participating' 
                                ? "Discover and join exciting events in the Explore tab" 
                                : "Create your first event and bring people together"}
                        </Text>
                        <TouchableOpacity style={styles(theme).emptyButton}
                            onPress={() => {
                                if (activeTab === "created"){
                                    router.push("/studio/create");
                                } else if (activeTab === "participating"){
                                    router.push("/(tabs)/explore");
                                }
                            }}
                        >
                            <Text style={styles(theme).emptyButtonText}>
                                {activeTab === 'participating' ? 'Explore Events' : 'Create Event'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.cardBorder + '30',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.text,
    },
    addButton: {
        backgroundColor: theme.primary,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    statNumber: {
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
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
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.cardText,
    },
    activeTabText: {
        color: theme.buttonText,
        fontWeight: '700',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
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
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: theme.text,
        opacity: 0.6,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    emptyButton: {
        backgroundColor: theme.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    emptyButtonText: {
        color: theme.buttonText,
        fontSize: 14,
        fontWeight: '600',
    },
});