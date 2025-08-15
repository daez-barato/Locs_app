import { fetchTrending, search } from "@/api/exploreFunctions";
import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import ExploreEventCard, { Event } from "@/components/eventCard";
import TemplateCard, { SearchObject } from "@/components/templateCard";
import UserCard from "@/components/userCard";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { 
    ScrollView, 
    StyleSheet, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    View, 
    RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EventCard from "@/components/eventCard";

const placeholderImage = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Vector_WikiAnswers_Orange_Avatar_Lady_Incognito.svg/960px-Vector_WikiAnswers_Orange_Avatar_Lady_Incognito.svg.png?20241130025355";

export default function Explore() {
    const theme = useThemeConfig();
    
    const [query, setQuery] = useState<string>("");
    const [activeTab, setActiveTab] = useState<'events' | 'templates' | 'users'>('events');
    const [events, setEvents] = useState<Event[]>([]);
    const [templates, setTemplates] = useState<SearchObject[]>([]);
    const [searchResults, setSearchResults] = useState<{
        events: Event[];
        templates: SearchObject[];
        users: SearchObject[];
    }>({ events: [], templates: [], users: [] });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const router = useRouter();
    let typingTimeout: NodeJS.Timeout;

    const handleQueryChange = (text: string) => {
        setQuery(text);

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            handleSearch();
        }, 400);
    };
    
    const fetchTrendingData = async () => {
        try {
            const trending = await fetchTrending();
            if (trending.error) throw new Error(trending.error);
            
            setEvents(trending.events || []);
            setTemplates(trending.templates || []);
        } catch (error) {
            console.error('Error fetching trending events:', error);
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
        await fetchTrendingData();
        // If there's a search query, refresh search results too
        if (query.length > 0) {
            await handleSearch();
        }
        setIsRefreshing(false);
    };

    const handleSearch = async () => {
        if (query.length === 0) return;
        
        try {
            const results = await search(query);

            if (results.error) throw new Error(results.error);

            setSearchResults({
                events: results.events || [],
                templates: results.templates || [],
                users: results.users || [],
            });
        } catch (error) {
            console.error('Error searching:', error);
        }
    };

    const isSearching = query.length > 0;
    const currentData = isSearching ? 
        (activeTab === 'events' ? searchResults.events :
         activeTab === 'templates' ? searchResults.templates :
         searchResults.users) :
        (activeTab === 'events' ? events : templates);

    return (
        <SafeAreaView style={styles(theme).container}>
            <View style={styles(theme).searchHeader}>
                <View style={styles(theme).searchBar}>
                    <FontAwesome 
                        name="search"
                        size={18}
                        color={theme.text}
                        style={styles(theme).searchIcon}
                    />
                    <TextInput
                        placeholder="Search for events, templates, users..."
                        placeholderTextColor={theme.text + '60'}
                        value={query}
                        onChangeText={handleQueryChange}
                        style={styles(theme).searchInput}
                        onSubmitEditing={handleSearch}
                    />
                    {query.length > 0 && (
                        <TouchableOpacity
                            onPress={() => setQuery("")}
                            style={styles(theme).clearButton}
                        >
                            <FontAwesome name="times" size={16} color={theme.text + '80'} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles(theme).headerSection}>
                <Text style={styles(theme).headerText}>
                    {isSearching ? 'Search Results' : 'Trending'}
                </Text>
                <View style={styles(theme).tabs}>
                    <TouchableOpacity 
                        style={[styles(theme).tab, activeTab === 'events' && styles(theme).activeTab]}
                        onPress={() => setActiveTab('events')}
                    >
                        <Text style={[styles(theme).tabText, activeTab === 'events' && styles(theme).activeTabText]}>
                            Events
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles(theme).tab, activeTab === 'templates' && styles(theme).activeTab]}
                        onPress={() => setActiveTab('templates')}
                    >
                        <Text style={[styles(theme).tabText, activeTab === 'templates' && styles(theme).activeTabText]}>
                            Templates
                        </Text>
                    </TouchableOpacity>
                    {isSearching && (
                        <TouchableOpacity 
                            style={[styles(theme).tab, activeTab === 'users' && styles(theme).activeTab]}
                            onPress={() => setActiveTab('users')}
                        >
                            <Text style={[styles(theme).tabText, activeTab === 'users' && styles(theme).activeTabText]}>
                                Users
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

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
                {activeTab === 'events' && currentData.map((item: Event | SearchObject, index) => 
                    <EventCard 
                        key={`event-${item.id}`}
                        event={item as Event}
                        isLoading={isLoading}
                    />
                )}
                {activeTab === 'templates' && currentData.map((item: SearchObject | Event, index) => 
                    <TemplateCard 
                        key={`template-${item.id}`}
                        item={item as SearchObject}
                        isLoading={isLoading}
                        placeholderImage={placeholderImage}
                    />
                )}
                {activeTab === 'users' && isSearching && currentData.map((user: SearchObject | Event, index) => 
                    <UserCard 
                        key={`user-${user.id}`}
                        user={user as SearchObject}
                        isLoading={isLoading}
                        placeholderImage={placeholderImage}
                    />
                )}
                
                {currentData.length === 0 && !isLoading && (
                    <View style={styles(theme).emptyState}>
                        <FontAwesome 
                            name={isSearching ? "search" : "exclamation-triangle"} 
                            size={48} 
                            color={theme.text + '40'} 
                        />
                        <Text style={styles(theme).emptyText}>
                            No {activeTab} found
                        </Text>
                        <Text style={styles(theme).emptySubtext}>
                            {isSearching 
                                ? "Try adjusting your search terms" 
                                : "Pull down to refresh"}
                        </Text>
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
    searchHeader: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: theme.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.cardBorder + '30',
    },
    searchBar: {
        height: 44,
        backgroundColor: theme.card,
        borderRadius: 22,
        paddingHorizontal: 16,
        alignItems: "center",
        flexDirection: "row",
        shadowColor: '#000',
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
        shadowColor: '#000',
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