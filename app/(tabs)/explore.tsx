import { fetchTrending, search } from "@/api/exploreFunctions";
import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import TemplateCard from "@/components/templateCard";
import UserCard from "@/components/userCard";
import { FontAwesome } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { 
    StyleSheet, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    View, 
    RefreshControl,
    ActivityIndicator,
    FlatList
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EventCard from "@/components/eventCard";
import { SearchObject ,SearchUser, SearchTemplate, SearchEvent } from "@/types/interfaces";

export default function Explore() {
    const theme = useThemeConfig();
    const styles = useThemedStyles(createStyles);
    const [query, setQuery] = useState<string>("");
    const [activeTab, setActiveTab] = useState<'events' | 'templates' | 'users'>('events');
    const [events, setEvents] = useState<SearchEvent[]>([]);
    const [templates, setTemplates] = useState<SearchTemplate[]>([]);
    const [searchResults, setSearchResults] = useState<{
        events: SearchEvent[];
        templates: SearchTemplate[];
        users: SearchUser[];
    }>({ events: [], templates: [], users: [] });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [eventOffset, setEventOffset] = useState(0);
    const [templateOffset, setTemplateOffset] = useState(0);
    const [userOffset, setUserOffset] = useState(0);
    const [loadMoreEvents, setLoadMoreEvents] = useState(true);
    const [loadMoreTemplates, setLoadMoreTemplates] = useState(true);
    const [loadMoreUsers, setLoadMoreUsers] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    let typingTimeout: ReturnType<typeof setTimeout>;
    const handleQueryChange = (text: string) => {
        setQuery(text);

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            setLoadMoreEvents(true);
            setLoadMoreTemplates(true);
            setLoadMoreUsers(true);
            
            handleSearch();
        }, 400);
    };
    
    const fetchTrendingData = async () => {

        try {
            const trending = await fetchTrending();
            if (trending.error) throw new Error(trending.error);

            setEventOffset(trending.events?.length || 0);
            setTemplateOffset(trending.templates?.length || 0);

            setEvents(trending.events);
            setTemplates(trending.templates);
            setErrorMessage(null);

        } catch (error: any) {
            console.error('Error fetching trending events:', error);
            setErrorMessage("Couldn't load Explore. Check your connection and try again.");
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await fetchTrendingData();
            setIsLoading(false);
        };
        loadData();
    }, []);

    const onRefresh = async () => {
        setIsRefreshing(true);

        if (query.length > 0) {
            await handleSearch();
        } else {
            await fetchTrendingData();
        }
        
        setIsRefreshing(false);
    };

    const handleSearch = async () => {
        if (query.length === 0) return
        
        try {
            const results = await search(query);

            if (results.error) throw new Error(results.error);

            setEventOffset(results.events?.length || 0);
            setTemplateOffset(results.templates?.length || 0);
            setUserOffset(results.users?.length || 0);

            setSearchResults({
                events: results.events,
                templates: results.templates,
                users: results.users,
            });
            setErrorMessage(null);
        } catch (error: any) {
            console.error('Error searching:', error);
            setErrorMessage("Search failed. Check your connection and try again.");
        }
    };

    const isSearching = query.length > 0;
    const currentData = isSearching ? 
        (activeTab === 'events' ? searchResults.events as SearchObject[] :
         activeTab === 'templates' ? searchResults.templates as SearchObject[] :
         searchResults.users as SearchObject[]) :
        (activeTab === 'events' ? events as SearchObject[] : templates as SearchObject[]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.searchHeader}>
                <View style={styles.searchBar}>
                    <FontAwesome 
                        name="search"
                        size={18}
                        color={theme.text}
                        style={styles.searchIcon}
                    />
                    <TextInput
                        placeholder="Search for events, templates, users..."
                        placeholderTextColor={theme.placeholder}
                        value={query}
                        onChangeText={handleQueryChange}
                        style={styles.searchInput}
                        onSubmitEditing={handleSearch}
                    />
                    {query.length > 0 && (
                        <TouchableOpacity
                            onPress={() => setQuery("")}
                            style={styles.clearButton}
                        >
                            <FontAwesome name="times" size={16} color={theme.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.headerSection}>
                <Text style={styles.headerText}>
                    {isSearching ? 'Search Results' : 'Trending'}
                </Text>
                <View style={styles.tabs}>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'events' && styles.activeTab]}
                        onPress={() => setActiveTab('events')}
                    >
                        <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>
                            Events
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'templates' && styles.activeTab]}
                        onPress={() => setActiveTab('templates')}
                    >
                        <Text style={[styles.tabText, activeTab === 'templates' && styles.activeTabText]}>
                            Templates
                        </Text>
                    </TouchableOpacity>
                    {isSearching && (
                        <TouchableOpacity 
                            style={[styles.tab, activeTab === 'users' && styles.activeTab]}
                            onPress={() => setActiveTab('users')}
                        >
                            <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
                                Users
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <FlatList
            data={currentData}
            keyExtractor={(item) => `${activeTab}-${item.id}`}
            renderItem={({ item }) => {
                if (activeTab === 'events') {
                return <EventCard event={item as SearchEvent} />;
                } else if (activeTab === 'templates') {
                return <TemplateCard item={item as SearchTemplate}/>;
                } else if (activeTab === 'users') {
                return <UserCard user={item as SearchUser} />;
                } return null;
            }}
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
                        name={errorMessage ? "exclamation-triangle" : isSearching ? "search" : "compass"}
                        size={48}
                        color={errorMessage ? theme.destructive : theme.textFaint}
                        />
                        <Text style={styles.emptyText}>
                        {errorMessage ? "Something went wrong" : `No ${activeTab} found`}
                        </Text>
                        <Text style={styles.emptySubtext}>
                        {errorMessage
                            ? errorMessage
                            : isSearching
                            ? "Try adjusting your search terms"
                            : "Pull down to refresh"}
                        </Text>
                        {errorMessage && (
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={onRefresh}
                                activeOpacity={0.8}
                            >
                                <FontAwesome name="refresh" size={14} color={theme.buttonText} />
                                <Text style={styles.retryButtonText}>Try again</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    )}
                </>
            }
            refreshControl={
                <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor={theme.primary}
                colors={[theme.primary]}
                progressBackgroundColor={theme.card}
                />
            }
            onEndReachedThreshold={0.3}
            onEndReached={async () => {
                // prevent double triggers
                if 
                ((isLoading)
                || (activeTab === 'events' && !loadMoreEvents)
                || (activeTab === 'templates' && !loadMoreTemplates)
                || (activeTab === 'users' && !loadMoreUsers))
                return;

                setIsLoading(true);
                try {
                    if (isSearching) {
                        const moreResults = await search(query,
                        eventOffset,
                        templateOffset,
                        userOffset,
                        );

                        if (moreResults.error) throw new Error(moreResults.error);

                        setSearchResults((prev) => ({
                        events: [...prev.events, ...moreResults.events],
                        templates: [...prev.templates, ...moreResults.templates],
                        users: [...prev.users, ...moreResults.users],
                        }));

                        if (moreResults.events.length == 0) {
                            setLoadMoreEvents(false);
                        } else {
                            setEventOffset((prev) => prev + (moreResults.events?.length || 0));  
                        }
                        if (moreResults.templates.length == 0) {
                            setLoadMoreTemplates(false);
                        } else {
                            setTemplateOffset((prev) => prev + (moreResults.templates?.length || 0));  
                        }
                        if (moreResults.users.length == 0) {
                            setLoadMoreUsers(false);
                        } else {
                            setUserOffset((prev) => prev + (moreResults.users?.length || 0));  
                        }

                    } else {
                        // If trending mode
                        const moreTrending = await fetchTrending(eventOffset, templateOffset);
                        if (moreTrending.error) throw new Error(moreTrending.error);

                        setEvents((prev) => [...prev, ...moreTrending.events]);
                        setTemplates((prev) => [...prev, ...moreTrending.templates]);

                        if (moreTrending.events.length == 0) {
                            setLoadMoreEvents(false);
                        } else {
                            setEventOffset((prev) => prev + (moreTrending.events?.length || 0));  
                        }
                        if (moreTrending.templates.length == 0) {
                            setLoadMoreTemplates(false);
                        } else {
                            setTemplateOffset((prev) => prev + (moreTrending.templates?.length || 0));  
                        }

                    }
                } catch (err) {
                // Stop paginating on failure, otherwise every scroll-to-end retries
                // the same failing request and spams errors.
                console.error('Error fetching more:', err);
                setLoadMoreEvents(false);
                setLoadMoreTemplates(false);
                setLoadMoreUsers(false);
                } finally {
                setIsLoading(false);
                }
            }}
            contentContainerStyle={styles.scrollContent}
            />

        </SafeAreaView>
    );
}

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    searchHeader: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: theme.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.primaryBorder,
    },
    searchBar: {
        height: 44,
        backgroundColor: theme.card,
        borderRadius: 22,
        paddingHorizontal: 16,
        alignItems: "center",
        flexDirection: "row",
        shadowColor: theme.shadow,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    searchIcon: {
        marginRight: 12,
        opacity: 0.7,
    },
    searchInput: {
        flex: 1,
        color: theme.cardText,
        fontSize: 16,
        height: 44,
    },
    clearButton: {
        padding: 4,
        marginLeft: 8,
    },
    headerSection: {
        backgroundColor: theme.background,
        paddingBottom: 8,
    },
    headerText: {
        color: theme.primary,
        fontWeight: "700",
        fontSize: 22,
        textAlign: "center",
        marginVertical: 16,
    },
    tabs: {
        flexDirection: "row",
        marginHorizontal: 16,
        backgroundColor: theme.card,
        borderRadius: 12,
        padding: 4,
        shadowColor: theme.shadow,
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tab: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        height: 36,
        borderRadius: 8,
        marginHorizontal: 2,
    },
    activeTab: {
        backgroundColor: theme.primary,
        shadowColor: theme.primary,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    tabText: {
        color: theme.cardText,
        fontSize: 14,
        fontWeight: "600",
        textAlign: "center",
    },
    activeTabText: {
        color: theme.buttonText,
        fontWeight: "700",
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
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 20,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        backgroundColor: theme.primary,
    },
    retryButtonText: {
        color: theme.buttonText,
        fontSize: 15,
        fontWeight: '600',
    },
    emptyText: {
        color: theme.text,
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        color: theme.text,
        fontSize: 14,
        opacity: 0.6,
        textAlign: 'center',
    },
});