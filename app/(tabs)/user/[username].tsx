import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import { withAlpha } from "@/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Tabs, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import EventCard from "@/components/eventCard";
import { haptics } from "@/utils/haptics";
import { getUserProfile, fetchUserCreatedEvents, fetchUserParticipatedEvents } from "@/services/users";
import { Event, UserProfile } from "@/types/interfaces";
import { followRequest, unfollowRequest} from "@/api/followers/followers";
import { useAuthContext } from "@/hooks/use-auth-context";
import AvatarImage from "@/components/ui/avatar-image";
import { CoinAmount, CoinIcon } from "@/components/ui/coin";
import { resolveAvatarUrl } from "@/utils/avatar";

type ActiveList = "created" | "participated";

export default function Profile() {
  const [userImage, setUserImage] = useState<string | null>(null);
  
  const [createdOffset, setCreatedOffset] = useState(0);
  const [participatedOffset, setParticipatedOffset] = useState(0);
  const [createdEvents, setCreatedEvents] = useState<Event[]>([]);
  const [participatedEvents, setParticipatedEvents] = useState<Event[]>([]);
  const [loadingMoreEvents, setLoadingMoreEvents] = useState<boolean>(true);
  const hero = useAuthContext().user;

  const theme = useThemeConfig();
  const styles = useThemedStyles(createStyles);
  const { username } = useLocalSearchParams();
  const router = useRouter();

  const [activeList, setActiveList] = useState<ActiveList>("created");
  const [loading, setLoading] = useState<boolean>(true);
  
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile>();
  

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true)

      const user = await getUserProfile(username as string);

      if (!user) {
        throw new Error("User not found");
      }

      setUser(user);

      if (user.owner || user.is_following || user.public) {
        const created = await fetchUserCreatedEvents(username as string, 0);
        const participated = await fetchUserParticipatedEvents(username as string, 0);
        
        setCreatedEvents(created);
        setParticipatedEvents(participated);
        setCreatedOffset(created.length);
        setParticipatedOffset(participated.length);
      }
      
      setUserImage(user.avatar_url);
      
    } catch (err) {
      console.error("Error fetching data:", err);
      Alert.alert(
        "Couldn't load profile",
        "This profile couldn't be opened. It may no longer exist, or you may be offline."
      );
      router.back();
    } finally {
      setLoading(false);
      setLoadingMoreEvents(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setCreatedOffset(0);
    setParticipatedOffset(0);
    fetchData(true);
  }, [username, hero?.username]);

  // Tabs stay mounted, so coming back from the shop wouldn't refetch and the
  // old avatar would linger. Refresh just the profile row on re-focus; the
  // first focus is covered by the initial load above.
  const hasFocused = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!hasFocused.current) {
        hasFocused.current = true;
        return;
      }
      if (!username || Array.isArray(username)) return;

      let active = true;
      getUserProfile(username).then((profile) => {
        if (!active || !profile) return;
        setUser(profile);
        setUserImage(profile.avatar_url);
      });
      return () => {
        active = false;
      };
    }, [username])
  );

  const handleFollowToggle = async () => {
    try {
      if (!user?.id) return;

      if (user?.is_following || user?.has_requested) {
        const result = await unfollowRequest(user.id);
        if (result.error) throw new Error(result.message);
        setUser(prev => prev ? {...prev, is_following: false, has_requested: false} : prev);
      } else {
        const result = await followRequest(user.id);
        if (result.error) throw new Error(result.message);
        haptics.tap();
        if (result.following){
          setUser(prev => prev ? {...prev, is_following: true, has_requested: false} : prev);
        } else {
          setUser(prev => prev ? {...prev, is_following: false, has_requested: true} : prev);
        }
      }

    } catch (error) {
      console.error("Follow toggle error:", error);
      Alert.alert("Error", "Failed to update follow status. Please try again.");
    }
  };

  useEffect(() => {
      if (!username || Array.isArray(username)) return;

      onRefresh();
    }, [username, hero?.username]
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  };

  const handleScroll = async ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;

    const isNearBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - contentSize.height / 5;

    if (!isNearBottom || loadingMoreEvents) return;

    if (
      (activeList === "created" && user && user?.owner && user?.created > createdEvents.length) 
      || (activeList === "participated" && user && user?.participated > participatedEvents.length)
    ) {
      setLoadingMoreEvents(true);
      try {
        let events;

        if (activeList === "created") {
          events = await fetchUserCreatedEvents(username as string, createdOffset);
        } else {
          events = await fetchUserParticipatedEvents(username as string, participatedOffset);
        }

        const mergeUnique = (prev: Event[]) =>
          Array.from(new Map([...prev, ...events].map(e => [e.id, e])).values());

        if (activeList === "created") {
          setCreatedEvents(mergeUnique);
          setCreatedOffset(prev => prev + events.length);
        } else {
          setParticipatedEvents(mergeUnique);
          setParticipatedOffset(prev => prev + events.length);
        }

      } catch (error) {
        console.error("Error loading more events:", error);
      } finally {
        setLoadingMoreEvents(false);
      }
    }
  };

  const currentBetList = (user?.public || user?.is_following || user?.owner) ? (activeList === "created") ? createdEvents : participatedEvents : undefined;

  const openSheet = (pathname: "/settings" | "/requests" | "/connections", kind?: "followers" | "following") =>
    router.push(kind ? { pathname, params: { username: username as string, kind } } : pathname);

  return (
    <View style={styles.container}>
      {/* The name is already large under the avatar, so the header carries
          only actions: requests and settings on your own profile. */}
      <Tabs.Screen
        options={{
          headerTitle: "",
          headerRight: user?.owner
            ? () => (
                <View style={styles.headerActions}>
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => openSheet("/requests")}
                    accessibilityRole="button"
                    accessibilityLabel={`Follow requests: ${user.requests}`}
                  >
                    <FontAwesome name="inbox" size={22} color={theme.text} />
                    {/* Only when there's something to act on; it used to show "0". */}
                    {user.requests > 0 && (
                      <View style={styles.alert}>
                        <Text style={styles.alertNumber}>{user.requests}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => openSheet("/settings")}
                    accessibilityRole="button"
                    accessibilityLabel="Settings"
                  >
                    <FontAwesome name="cog" size={22} color={theme.text} />
                  </TouchableOpacity>
                </View>
              )
            : undefined,
        }}
      />
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
          />
        }
        onMomentumScrollEnd={handleScroll}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            style={styles.profileImageContainer}
            onPress={() => router.push("/shop")}
            disabled={!user?.owner}
            activeOpacity={0.8}
            accessibilityRole={user?.owner ? "button" : undefined}
            accessibilityLabel={user?.owner ? "Change avatar in the shop" : undefined}
          >
            <AvatarImage uri={resolveAvatarUrl(userImage)} style={styles.profileImage} />
          </TouchableOpacity>

          <Text style={styles.username}>{user?.username}</Text>

          {/* Stats Container */}
          <View style={styles.statsContainer}>
            <TouchableOpacity 
              style={styles.statItem} 
              onPress={() => openSheet("/connections", "followers")}
              accessibilityRole="button"
              accessibilityLabel={`${user?.follower_count ?? 0} followers`}
            >
              <Text style={styles.statNumber}>{user?.follower_count}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            
            <View style={styles.statDivider} />
            
            <TouchableOpacity 
              style={styles.statItem} 
              onPress={() => openSheet("/connections", "following")}
              accessibilityRole="button"
              accessibilityLabel={`${user?.following_count ?? 0} following`}
            >
              <Text style={styles.statNumber}>{user?.following_count}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <CoinAmount amount={user?.coins ?? 0} size={20} textStyle={styles.statNumber} />
                <Text style={styles.statLabel}>Coins</Text>
              </View>
          </View>

          {/* Action Button */}
          {!user?.owner && (
            <TouchableOpacity
              style={[
                styles.followButton,
                (user?.is_following || user?.has_requested) && styles.followingButton
              ]}
              onPress={handleFollowToggle}
              accessibilityRole="button"
            >
              <Text style={[
                styles.followButtonText,
                (user?.is_following || user?.has_requested) && styles.followingButtonText
              ]}>
                {user?.is_following ? 'Following' : (user?.has_requested) ? "Requested" : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs Section */}
        {currentBetList ? (
        <>
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeList === "created" && styles.activeTab,
              ]}
              onPress={() => setActiveList("created")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeList === "created" && styles.activeTabText,
                ]}
              >
                Created
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.tab,
                activeList === "participated" && styles.activeTab,
              ]}
              onPress={() => setActiveList("participated")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeList === "participated" && styles.activeTabText,
                ]}
              >
                Participated
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bets List */}
          <View style={styles.listContainer}>
            {currentBetList.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No {activeList === "created" ? "created" : "participated"} events yet
                </Text>
              </View>
            ) : (
              <>
                {currentBetList.map((item) => (
                  <EventCard event={item} key={`event-${item.id}`}/>
                ))}
                {loadingMoreEvents && (
                  <ActivityIndicator size="small" color={theme.primary} />
                )}
              </>
            )}
          </View>
        </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Follow this user to see their events
            </Text>
          </View>
        )
        }
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  
  scrollContainer: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.text,
  },

  // Header
  headerActions: {
    flexDirection: 'row',
    gap: 4,
    marginRight: 8,
  },
  headerButton: {
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  // Profile Section
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  // A circle: the image used to be a 226x140 rectangle that cropped the
  // square avatars, under a halo shaped for a circle.
  profileImageContainer: {
    marginBottom: 12,
    borderRadius: 70,
    boxShadow: `0 4px 20px ${withAlpha(theme.glow, 0.35)}`,
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: theme.primary,
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 12,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.button_darker_primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontVariant: ['tabular-nums'],
    fontSize: 18,
    fontWeight: '700',
    color: theme.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.buttonText,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.cardDividerStrong,
    marginHorizontal: 16,
  },

  // Buttons
  followButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 120,
  },
  followingButton: {
    backgroundColor: theme.button_darker_primary,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  followButtonText: {
    color: theme.onPrimary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  followingButtonText: {
    color: theme.primary,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.button_darker_primary,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: theme.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    // Was theme.void: near-black on the purple track.
    color: theme.cardText,
  },
  activeTabText: {
    color: theme.onPrimary,
  },

  // Bet List
  listContainer: {
    paddingHorizontal: 0,
    paddingBottom: 20,
    minHeight: 200,
  },

  // Empty State
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: theme.void,
    textAlign: 'center',
  },

  // Modal Base

  // Settings Modal

  // Followers / following list
  // UserCard brings its own 16pt side margin, so the lists add none.
  alert: {
    position: "absolute",
    zIndex: 1,
    right: 4,
    bottom: 4,
    backgroundColor: theme.destructive,
    borderRadius: 9999,
    width: 15,
    height: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  alertNumber: {
    color: theme.cardText,
    fontWeight: "700",
    textAlign: "center",
    position: "absolute",
  }
});