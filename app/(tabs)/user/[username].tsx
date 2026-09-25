import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import { blend, withAlpha } from "@/theme";
import { LinearGradient } from "expo-linear-gradient";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Tabs, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import EventCard from "@/components/eventCard";
import { haptics } from "@/utils/haptics";
import { getUserProfile, fetchUserCreatedEvents, fetchUserParticipatedEvents } from "@/services/users";
import { Event, Rarity, UserProfile } from "@/types/interfaces";
import { getAvatarItem } from "@/services/shop";
import { rarityColor } from "@/components/ui/rarity-badge";
import { followRequest, unfollowRequest} from "@/api/followers/followers";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useCoinContext } from "@/hooks/use-coin-context";
import AvatarImage from "@/components/ui/avatar-image";
import { CoinAmount, CoinIcon } from "@/components/ui/coin";
import { resolveAvatarUrl } from "@/utils/avatar";

type ActiveList = "created" | "participated";

export default function Profile() {
  const [userImage, setUserImage] = useState<string | null>(null);
  // Tier of the equipped avatar, for the frame's highlight; null until known.
  const [avatarRarity, setAvatarRarity] = useState<Rarity | null>(null);
  
  const [createdOffset, setCreatedOffset] = useState(0);
  const [participatedOffset, setParticipatedOffset] = useState(0);
  const [createdEvents, setCreatedEvents] = useState<Event[]>([]);
  const [participatedEvents, setParticipatedEvents] = useState<Event[]>([]);
  const [loadingMoreEvents, setLoadingMoreEvents] = useState<boolean>(true);
  const hero = useAuthContext().user;
  const { coins: myCoins, refreshCoins } = useCoinContext();

  const theme = useThemeConfig();
  const styles = useThemedStyles(createStyles);
  const { username } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

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

  useEffect(() => {
    if (loading) return;
    let active = true;
    getAvatarItem(userImage).then((result) => {
      if (active) setAvatarRarity(!result.error && result.item ? result.item.rarity : null);
    });
    return () => {
      active = false;
    };
  }, [userImage, loading]);

  const onRefresh = useCallback(() => {
    setCreatedOffset(0);
    setParticipatedOffset(0);
    fetchData(true);
    refreshCoins();
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

      // Someone else deciding an event you bet on pays out while you're
      // elsewhere in the app; pick that up when the profile comes back.
      refreshCoins();

      let active = true;
      getUserProfile(username).then((profile) => {
        if (!active || !profile) return;
        setUser(profile);
        setUserImage(profile.avatar_url);
      });
      return () => {
        active = false;
      };
    }, [username, refreshCoins])
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
        <Tabs.Screen options={{ headerShown: false }} />
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
      {/* No navigation header: the avatar runs to the top of the screen, and
          your own profile's actions float over it instead. */}
      <Tabs.Screen options={{ headerShown: false }} />
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
        {/* Hero: the equipped avatar fills the top of the page as a
            background, with the username and stats card overlaid. */}
        <View style={styles.hero}>
          <TouchableOpacity
            style={styles.heroImageWrap}
            onPress={() => router.push("/shop")}
            disabled={!user?.owner}
            activeOpacity={0.8}
            accessibilityRole={user?.owner ? "button" : undefined}
            accessibilityLabel={user?.owner ? "Change avatar in the shop" : undefined}
          >
            <AvatarImage
              uri={resolveAvatarUrl(userImage)}
              style={styles.heroImage}
              contentFit="cover"
            />
          </TouchableOpacity>
          {/* The gradient carries the tier's hue and darkens for legibility
              before fading into the page background; the rarity-coloured
              line sits on top, marking the hero's bottom edge. */}
          <LinearGradient
            colors={
              avatarRarity
                ? [
                    "transparent",
                    withAlpha(rarityHue(theme, avatarRarity), 0.55),
                    theme.background,
                  ]
                : ["transparent", withAlpha(theme.void, 0.45), theme.background]
            }
            locations={[0, 0.6, 1]}
            style={styles.heroFade}
            pointerEvents="none"
          />
          {user?.owner && (
            <View style={[styles.headerActions, { top: insets.top + 8 }]}>
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
          )}
          {avatarRarity && (
            <View style={[styles.rarityEdge, rarityEdgeGlow(theme, avatarRarity)]} />
          )}

          {/* Profile Section, overlaid on the hero's lower part */}
          <View style={styles.profileSection}>
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
                {/* Your own balance comes from the shared coin state, so a bet or
                    purchase elsewhere shows here without a profile refetch. */}
                <CoinAmount amount={(user?.owner ? myCoins : user?.coins) ?? 0} size={20} textStyle={styles.statNumber} />
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

// The hero takes the equipped avatar's tier colour, leaning in harder for
// higher tiers: faint for grey, strongest for gold.
const GLOW: Record<Rarity, { hue: number }> = {
  grey: { hue: 0.1 },
  bronze: { hue: 0.16 },
  silver: { hue: 0.16 },
  gold: { hue: 0.22 },
};

/** The hero's tint: the background leaning towards the avatar's tier. */
function rarityHue(theme: Theme, rarity: Rarity) {
  return blend(theme.background, rarityColor(theme, rarity), GLOW[rarity].hue);
}

// Grey barely glows; gold glows hardest — same ladder the frame used to draw.
const EDGE_GLOW: Record<Rarity, number> = { grey: 0.35, bronze: 0.5, silver: 0.6, gold: 0.85 };

/** The hero's bottom-edge line: solid tier colour with a matching glow. */
function rarityEdgeGlow(theme: Theme, rarity: Rarity) {
  const color = rarityColor(theme, rarity);
  return {
    backgroundColor: color,
    boxShadow: `0 0 10px ${withAlpha(color, EDGE_GLOW[rarity])}`,
  };
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

  // Requests and settings, floating over the top of the hero. Each sits on a
  // dark disc so it reads over any avatar.
  headerActions: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: withAlpha(theme.void, 0.45),
    alignItems: "center",
    justifyContent: "center",
  },
  // Hero: the equipped avatar as a full-width background for the top of
  // the page. Children stack (image, fade, content) rather than absolute
  // positioning the content, so the profile section sits at its bottom.
  hero: {
    minHeight: 460,
    justifyContent: 'flex-end',
  },
  heroImageWrap: {
    ...StyleSheet.absoluteFill,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  // Fades the image into the page background, carrying a hint of the
  // avatar's tier and darkening enough for the username to read over it.
  heroFade: {
    ...StyleSheet.absoluteFill,
  },
  // A thin glowing line at the hero's bottom edge; rarityEdgeGlow fills in
  // the tier's colour and glow strength.
  rarityEdge: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
  },
  // Profile Section
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.cardText,
    marginBottom: 12,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
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