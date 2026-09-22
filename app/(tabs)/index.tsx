
import { fetchFollowingPosts } from "@/services/events";
import { Event } from "@/types/interfaces";
import EventCard from "@/components/eventCard";
import { useThemeConfig, Theme } from "@/components/ui/use-theme-config"
import { FontAwesome } from "@expo/vector-icons";
import { useEffect, useState } from "react"
import { useRouter } from "expo-router"
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"



export default function Home(){
  const [refresh, activateRefresh] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(true);
  const theme = useThemeConfig()
  const router = useRouter()
  const [followingPostsList, updateFollowingPostsList] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<'Following' | 'Shop'>('Following');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function fetchData(currentOffset = 0) {
    try {
      const posts = await fetchFollowingPosts(currentOffset);

      updateFollowingPostsList(prev => {
        const merged = [...prev, ...posts];
        const unique = Array.from(
          new Map(merged.map(e => [e.id, e])).values()
        );
        return unique;
      });

      if (posts.length > 0) {
        setOffset(currentOffset + posts.length);
      } else {
        setHasMore(false);
      }
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage("Couldn't load your feed. Check your connection and try again.");
      setHasMore(false);
    } finally {
      setLoadingMore(false);
      activateRefresh(false);
    }
  }

  useEffect( () =>{
    if (!refresh) return;
    updateFollowingPostsList([]);
    setLoadingMore(true);
    setHasMore(true);
    setOffset(0);
    fetchData(0);
  }, [refresh])

  return (
    <SafeAreaView style={styles(theme).backgroundContainer}>
      <View style= {[styles(theme).topTabs]}>
        <TouchableOpacity
          style={[styles(theme).tabButton, activeTab === 'Following' && styles(theme).selectedTabButton]}
          onPress={() => setActiveTab('Following')}
        >
          <Text style={[styles(theme).tabText, activeTab === 'Following' && styles(theme).selectedTabText]}>
            Following
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles(theme).tabButton, activeTab === 'Shop' && styles(theme).selectedTabButton]}
          onPress={() => setActiveTab('Shop')}
        >
          <Text style={[styles(theme).tabText, activeTab === 'Shop' && styles(theme).selectedTabText]}>
            Shop
          </Text>
        </TouchableOpacity>
      </View>
      { activeTab === 'Following' ? (
        <View style={styles(theme).followingEventsContainer}>
          <FlatList
            data={followingPostsList}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <EventCard
                event={item}
              />
            )}
            refreshing={refresh}
            onRefresh={() => {activateRefresh(true)}}
            contentContainerStyle={{ paddingBottom: 20 }}
            onEndReached={() => {if (!loadingMore && hasMore) {setLoadingMore(true); fetchData(offset);}}}
            onEndReachedThreshold={0.2}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : null
            }
            ListEmptyComponent={
              loadingMore || refresh ? null : (
                <View style={styles(theme).emptyState}>
                  <FontAwesome
                    name={errorMessage ? "exclamation-triangle" : "users"}
                    size={48}
                    color={errorMessage ? theme.destructive : theme.text + '40'}
                  />
                  <Text style={styles(theme).emptyTitle}>
                    {errorMessage ? "Something went wrong" : "Your feed is empty"}
                  </Text>
                  <Text style={styles(theme).emptySubtext}>
                    {errorMessage
                      ? errorMessage
                      : "Follow people to see the events they create here."}
                  </Text>
                  <TouchableOpacity
                    style={styles(theme).emptyAction}
                    onPress={() => (errorMessage ? activateRefresh(true) : router.push("/explore"))}
                    activeOpacity={0.8}
                  >
                    <FontAwesome
                      name={errorMessage ? "refresh" : "search"}
                      size={14}
                      color={theme.buttonText}
                    />
                    <Text style={styles(theme).emptyActionText}>
                      {errorMessage ? "Try again" : "Find people to follow"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )
            }
          />
        </View>
      ) : (
        <View style={styles(theme).shopContainer}>
          <FontAwesome name="shopping-cart" size={50} color={theme.primary} />
          <Text style={styles(theme).shopText}>
            Shop coming soon!
          </Text>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = (theme: Theme) => StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    backgroundColor: theme.background
  },
  topTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',

  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    borderColor: theme.border,
  },
  selectedTabButton: {
    borderBottomWidth: 2,

  },
  tabText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedTabText: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  shopContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopText: {
    color: theme.text,
    fontSize: 18,
    fontWeight: 'bold', 
  },
  followingEventsContainer: {
    flex: 1,
    paddingTop: 10,
    backgroundColor: theme.background,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    color: theme.text + '80',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: theme.primary,
  },
  emptyActionText: {
    color: theme.buttonText,
    fontSize: 15,
    fontWeight: '600',
  },
})