
import { fetchFollowingPosts } from "@/services/events";
import { Event } from "@/types/interfaces";
import EventCard from "@/components/eventCard";
import CreateEventButton from "@/components/create-event-button";
import { useThemeConfig, Theme } from "@/components/ui/use-theme-config"
import { useThemedStyles } from "@/hooks/use-themed-styles";
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
  const styles = useThemedStyles(createStyles);
  const router = useRouter()
  const [followingPostsList, updateFollowingPostsList] = useState<Event[]>([]);
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
    <SafeAreaView style={styles.backgroundContainer}>
      {/* A plain title: the "Shop" half of the old two-tab header only
          opened the Shop tab that's already in the tab bar. */}
      <Text style={styles.title} accessibilityRole="header">Following</Text>
      <View style={styles.followingEventsContainer}>
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
          contentContainerStyle={styles.listContent}
          onEndReached={() => {if (!loadingMore && hasMore) {setLoadingMore(true); fetchData(offset);}}}
          onEndReachedThreshold={0.2}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : null
          }
          ListEmptyComponent={
            loadingMore || refresh ? null : (
              <View style={styles.emptyState}>
                <FontAwesome
                  name={errorMessage ? "exclamation-triangle" : "users"}
                  size={48}
                  color={errorMessage ? theme.destructiveLabel : theme.textFaint}
                />
                <Text style={styles.emptyTitle}>
                  {errorMessage ? "Something went wrong" : "Your feed is empty"}
                </Text>
                <Text style={styles.emptySubtext}>
                  {errorMessage
                    ? errorMessage
                    : "Follow people to see the events they create here."}
                </Text>
                <TouchableOpacity
                  style={styles.emptyAction}
                  onPress={() => (errorMessage ? activateRefresh(true) : router.push("/explore"))}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <FontAwesome
                    name={errorMessage ? "refresh" : "search"}
                    size={14}
                    color={theme.onPrimary}
                  />
                  <Text style={styles.emptyActionText}>
                    {errorMessage ? "Try again" : "Find people to follow"}
                  </Text>
                </TouchableOpacity>
              </View>
            )
          }
        />
      </View>
      <CreateEventButton />
    </SafeAreaView>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    backgroundColor: theme.background
  },
  title: {
    color: theme.text,
    fontSize: 28,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  listContent: {
    // Room for the create button, which floats over the end of the list.
    paddingBottom: 96,
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
    color: theme.textSecondary,
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
    color: theme.onPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
})