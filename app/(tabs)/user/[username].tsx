import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
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
  Modal,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import EventCard from "@/components/eventCard";
import { getUserProfile, fetchUserCreatedEvents, fetchUserParticipatedEvents,
  getFollowersList, getFollowingList, getRequestsList, changePrivacy
} from "@/services/users";
import { Event, SearchUser, UserProfile } from "@/types/interfaces";
import UserCard from "@/components/userCard";
import { followRequest, unfollowRequest} from "@/api/followers/followers";
import { useAuthContext } from "@/hooks/use-auth-context";
import { supabase } from "@/lib/supabase";
import AvatarImage from "@/components/ui/avatar-image";
import { resolveAvatarUrl } from "@/utils/avatar";

type ActiveList = "created" | "participated";
type ModalType = "settings" | "followers" | "following" | "requests" | null;

export default function Profile() {
  const [followersOffset, setFollowersOffset] = useState(0);
  const [followingOffset, setFollowingOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState<boolean>(true);
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
  
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  
  const [requestsList, setRequestsList] = useState<SearchUser[]>([]);
  const [followersList, setFollowersList] = useState<SearchUser[]>([]);
  const [followingList, setFollowingList] = useState<SearchUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);

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

  const fetchUserList = async (type: "followers" | "following") => {
    try {
      const users = type === "followers" 
        ? await getFollowersList(username as string, followersOffset)
        : await getFollowingList(username as string, followingOffset);
      
      setTimeout(() => {
        if (type === "followers") {
          setFollowersList(
            prev => {
              const merged = [...prev, ...users];
              const unique = Array.from(
                new Map(merged.map(e => [e.id, e])).values()
              );
              return unique;
            }
          );
          setFollowersOffset(prev => prev + users.length);
          
        } else {
          setFollowingList(
            prev => {
              const merged = [...prev, ...users];
              const unique = Array.from(
                new Map(merged.map(e => [e.id, e])).values()
              );
              return unique;
            }
          );
          setFollowingOffset(prev => prev + users.length);
        }
        setLoadingUsers(false);
        setLoadingMore(false);
      }, 1000);

    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      // Without this the spinner stays up forever on a failed fetch.
      setLoadingUsers(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = useCallback(() => {
    setLoadingUsers(true);
    setFollowersOffset(0);
    setFollowingOffset(0);
    setFollowersList([]);
    setFollowingList([]);
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

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              setActiveModal(null);
              router.replace('/(auth)');
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          }
        }
      ]
    );
  };

  const openModal = (type: ModalType) => {
    setActiveModal(type);
    if (type === "followers" || type === "following") {
      setLoadingUsers(true);
      fetchUserList(type);
    }
  };

  useEffect(() => {
      if (!username || Array.isArray(username)) return;

      onRefresh();
      setActiveModal(null);
    }, [username, hero?.username]
  );

  const handlePrivacy = async () => {
    try {
      const response = await changePrivacy(!user?.public);

      if (response.error){
        throw new Error(response.msg)
      }

      setUser(prev => prev ? { ...prev, public: response.public } : prev);

      Alert.alert(
        "Privacy Updated",
        response.public
          ? "Your account is now public."
          : "Your account is now private."
      );
    } catch (error) {
      console.error("Privacy update error:", error);
      Alert.alert("Error", "Unable to change privacy settings. Please try again.");
    }
  };

  const settingsOptions = [
    {title: user?.public ? "Switch to Private" : "Switch to Public", icon: "lock", onPress: handlePrivacy},
    { title: "Logout", icon: "sign-out", onPress: handleLogout, isDestructive: true },
  ];

  const renderModal = () => {
    const modalProps = {
      visible: activeModal !== null,
      animationType: "slide" as const,
      presentationStyle: "pageSheet" as const,
      onRequestClose: () => setActiveModal(null)
    };

    switch (activeModal) {
      case "settings":
        return (
          <Modal {...modalProps}>
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Settings</Text>
                <TouchableOpacity
                  onPress={() => setActiveModal(null)}
                  style={styles.closeButton}
                >
                  <FontAwesome name="times" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.settingsContent}>
                {settingsOptions.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.settingItem,
                      option.isDestructive && styles.destructiveItem
                    ]}
                    onPress={option.onPress}
                  >
                    <FontAwesome
                      name="gear"
                      size={20}
                      color={option.isDestructive ? '#FF3B30' : theme.text}
                      style={styles.settingIcon}
                    />
                    <Text
                      style={[
                        styles.settingText,
                        option.isDestructive && styles.destructiveText
                      ]}
                    >
                      {option.title}
                    </Text>
                    <FontAwesome name="chevron-right" size={16} color={theme.void} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </SafeAreaView>
          </Modal>
        );
      case "followers":
      case "following":
        const userList = activeModal === "followers" ? followersList : followingList;
        const title = activeModal === "followers" ? "Followers" : "Following";
        
        return (
          <Modal {...modalProps}>
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setActiveModal(null)}
                  style={styles.closeButton}
                >
                  <FontAwesome name="times" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{title}</Text>
                <View style={styles.closeButton} />
              </View>
              
              {loadingUsers ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={styles.loadingText}>Loading {title.toLowerCase()}...</Text>
                </View>
              ) : userList.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    No {title.toLowerCase()} yet
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={userList}
                  renderItem={({ item }) => <UserCard user={item} />}
                  keyExtractor={(item) => item.id}
                  style={styles.userList}
                  showsVerticalScrollIndicator={false}
                  onEndReached={() => {
                    if (!loadingMore 
                      && ((activeModal === "followers" && user && user?.follower_count > followersList.length) 
                      || (activeModal === "following" && user && user?.following_count > followingList.length))){
                      setLoadingMore(true);
                      fetchUserList(activeModal)
                    }}}
                  onEndReachedThreshold={0.2}
                  ListFooterComponent={
                    loadingMore ? (
                      <ActivityIndicator size="small" color={theme.primary} />
                    ) : null
                  }
                />
              )}
            </SafeAreaView>
          </Modal>
        );
      case "requests":
        return (
          <Modal
            visible={activeModal === "requests"}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setActiveModal(null)}
          >
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Follow Requests</Text>
                <TouchableOpacity
                  onPress={async () => {
                    setActiveModal(null);
                    try {
                      const result = await getRequestsList(user?.username as string);

                      setRequestsList(result);

                    }catch (error) {
                      console.error(`Error updating requestList:`, error);
                    }
                  }}
                  style={styles.closeButton}
                >
                  <FontAwesome name="times" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              {requestsList.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No pending requests</Text>
                </View>
              ) : (
                <FlatList
                  data={requestsList}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => <UserCard user={item}/>}
                  contentContainerStyle={{ padding: 16 }}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </SafeAreaView>
          </Modal>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
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

        setTimeout(() => {
          if (activeList === "created") {
            setCreatedEvents(prev => {
              const merged = [...prev, ...events];
              const unique = Array.from(
                new Map(merged.map(e => [e.id, e])).values()
              );
              return unique;
            });
            setCreatedOffset(prev => prev + events.length);
          } else {
            setParticipatedEvents(prev => {
              const merged = [...prev, ...events];
              const unique = Array.from(
                new Map(merged.map(e => [e.id, e])).values()
              );
              return {...prev, participated: unique};
            });
            setParticipatedOffset(prev => prev + events.length);
          }
          setLoadingMoreEvents(false);
        }, 1000);

      } catch (error) {
        console.error("Error loading more events:", error);
      }
    }
  };

  const currentBetList = (user?.public || user?.is_following || user?.owner) ? (activeList === "created") ? createdEvents : participatedEvents : undefined;

  return (
    <SafeAreaView style={styles.container}>
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
        {/* Header with Settings */}
        {user?.owner && (
          <View style={styles.header}>
            <TouchableOpacity style={styles.requestsButton} onPress={() => openModal("requests")}>
              <FontAwesome name="inbox" size={24} color={theme.text} />
              <View style={styles.alert}>
                <Text style={styles.alertNumber}>{user.requests}</Text>   
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingsButton} 
              onPress={() => openModal("settings")}
            >
              <FontAwesome name="cog" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
        )}

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
              onPress={() => openModal("followers")}
            >
              <Text style={styles.statNumber}>{user?.follower_count}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            
            <View style={styles.statDivider} />
            
            <TouchableOpacity 
              style={styles.statItem} 
              onPress={() => openModal("following")}
            >
              <Text style={styles.statNumber}>{user?.following_count}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>${user?.coins}</Text>
                <Text style={styles.statLabel}>Balance</Text>
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

      {/* Render Active Modal */}
      {renderModal()}
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  settingsButton: {
    padding: 8,
  },
  requestsButton: {
    padding: 8,
    alignContent: "center",
    justifyContent:"center",
    alignItems: "center"
  },
  // Profile Section
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  profileImageContainer: {
    marginBottom: 12,
    borderRadius: 70,
    shadowRadius: 10,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    elevation: 10,
  },
  profileImage: {
    width: 226,
    height: 140,
    borderWidth: 1,
    borderColor: theme.primary,
    elevation: 10,
    opacity: 0.95,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
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
    elevation: 2,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
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
    backgroundColor: theme.void,
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
    color: theme.buttonText,
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
    color: theme.void,
  },
  activeTabText: {
    color: theme.buttonText,
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
  modalContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.cardBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  closeButton: {
    padding: 4,
    minWidth: 32,
  },

  // Settings Modal
  settingsContent: {
    flex: 1,
    paddingTop: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.cardBorder,
  },
  destructiveItem: {},
  settingIcon: {
    marginRight: 16,
    width: 20,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: theme.text,
  },
  destructiveText: {
    color: '#FF3B30',
  },

  // Followers / following list
  userList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
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
    fontWeight: "bold",
    textAlign: "center",
    position: "absolute",
  }
});