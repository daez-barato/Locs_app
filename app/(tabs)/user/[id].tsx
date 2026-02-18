import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import { 
  View, 
  StyleSheet, 
  Image, 
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
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/api/context/AuthContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { fetchUserCreatedEvents, fetchUserParticipatedEvents } from "@/api/profileFuntions";
import { FontAwesome } from "@expo/vector-icons";
import EventCard from "@/components/eventCard";
import { changePrivacy, getUserProfile } from "@/api/user/userInfo";
import { SearchUser, UserProfile } from "@/api/interfaces/objects";
import UserCard from "@/components/userCard";
import { followRequest, getFollowersList, getFollowingList, unfollowRequest, updateRequests } from "@/api/followers/followers";

type ActiveList = "created" | "participated";
type ModalType = "settings" | "followers" | "following" | "requests" | null;

export default function Profile() {
  const [followersOffset, setFollowersOffset] = useState(0);
  const [followingOffset, setFollowingOffset] = useState(0);
  const [hasMoreFollowers, setHasMoreFollowers] = useState(true);
  const [hasMoreFollowing, setHasMoreFollowing] = useState(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(true);

  const [createdOffset, setCreatedOffset] = useState(0);
  const [participatedOffset, setParticipatedOffset] = useState(0);
  const [hasMoreCreated, setHasMoreCreated] = useState(true);
  const [hasMoreParticipated, setHasMoreParticipated] = useState(true);
  const [loadingMoreEvents, setLoadingMoreEvents] = useState<boolean>(true);

  const theme = useThemeConfig();
  const { authState, onLogout } = useAuth();
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [activeList, setActiveList] = useState<ActiveList>("created");
  const [loading, setLoading] = useState<boolean>(true);
  
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile>();
  
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  
  const [followersList, setFollowersList] = useState<SearchUser[]>([]);
  const [followingList, setFollowingList] = useState<SearchUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true)

      console.log("Fetching user profile for ID:", id, "Auth user:", authState?.id);
      const userData = await getUserProfile(id as string);

      if (userData.error) {
        throw new Error(userData.msg);
      };

      setUser(userData.user);
      setCreatedOffset(userData.user.created.length);
      setParticipatedOffset(userData.user.participated.length);
      
    } catch (err) {
      console.error("Error fetching data:", err);
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
        ? await getFollowersList(id as string, followersOffset)
        : await getFollowingList(id as string, followingOffset);

      if (users.error) {
        throw new Error(users.msg);
      }
      
      setTimeout(() => {
        if (type === "followers") {
          setFollowersList(
            prev => {
              const merged = [...prev, ...users.list];
              const unique = Array.from(
                new Map(merged.map(e => [e.id, e])).values()
              );
              return unique;
            }
          );
          if (followersList.length > 0){
            setFollowersOffset(prev => prev + users.list.length);
          } else {
            setHasMoreFollowers(false);
          }
          
        } else {
          setFollowingList(
            prev => {
              const merged = [...prev, ...users.list];
              const unique = Array.from(
                new Map(merged.map(e => [e.id, e])).values()
              );
              return unique;
            }
          );
          if (followingList.length > 0){
            setFollowingOffset(prev => prev + users.list.length);
          } else {
            setHasMoreFollowing(false);
          }
        }
        setLoadingUsers(false);
        setLoadingMore(false);
      }, 1000);

    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
    }
  };

  const onRefresh = useCallback(() => {
    setLoadingUsers(true);
    setHasMoreFollowers(true);
    setHasMoreFollowing(true);
    setFollowersOffset(0);
    setFollowingOffset(0);
    setFollowersList([]);
    setFollowingList([]);
    setHasMoreCreated(true);
    setHasMoreParticipated(true);
    setCreatedOffset(0);
    setParticipatedOffset(0);
    fetchData(true);
  }, [id, authState?.userName]);

  const handleFollowToggle = async () => {
    try {
      if (user?.is_following || user?.has_requested) {
        await unfollowRequest(id as string);
        setUser(prev => prev ? {...prev, is_following: false, has_requested: false} : prev);
      } else {
        const result = await followRequest(id as string);
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
              if (onLogout) {
                await onLogout();
              }
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
      onRefresh();
      setActiveModal(null);
    }, [id, authState?.userName]
  );

  const handlePrivacy = async () => {
    try {
      const response = await changePrivacy();

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
            <SafeAreaView style={styles(theme).modalContainer}>
              <View style={styles(theme).modalHeader}>
                <Text style={styles(theme).modalTitle}>Settings</Text>
                <TouchableOpacity
                  onPress={() => setActiveModal(null)}
                  style={styles(theme).closeButton}
                >
                  <FontAwesome name="times" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles(theme).settingsContent}>
                {settingsOptions.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles(theme).settingItem,
                      option.isDestructive && styles(theme).destructiveItem
                    ]}
                    onPress={option.onPress}
                  >
                    <FontAwesome
                      name="gear"
                      size={20}
                      color={option.isDestructive ? '#FF3B30' : theme.text}
                      style={styles(theme).settingIcon}
                    />
                    <Text
                      style={[
                        styles(theme).settingText,
                        option.isDestructive && styles(theme).destructiveText
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
            <SafeAreaView style={styles(theme).modalContainer}>
              <View style={styles(theme).modalHeader}>
                <TouchableOpacity
                  onPress={() => setActiveModal(null)}
                  style={styles(theme).closeButton}
                >
                  <FontAwesome name="times" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles(theme).modalTitle}>{title}</Text>
                <View style={styles(theme).closeButton} />
              </View>
              
              {loadingUsers ? (
                <View style={styles(theme).loadingContainer}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={styles(theme).loadingText}>Loading {title.toLowerCase()}...</Text>
                </View>
              ) : userList.length === 0 ? (
                <View style={styles(theme).emptyContainer}>
                  <Text style={styles(theme).emptyText}>
                    No {title.toLowerCase()} yet
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={userList}
                  renderItem={({ item }) => <UserCard user={item} />}
                  keyExtractor={(item) => item.id}
                  style={styles(theme).userList}
                  showsVerticalScrollIndicator={false}
                  onEndReached={() => {
                    if (!loadingMore 
                      && ((activeModal === "followers" && hasMoreFollowers) || (activeModal === "following" && hasMoreFollowing))){
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
            <SafeAreaView style={styles(theme).modalContainer}>
              <View style={styles(theme).modalHeader}>
                <Text style={styles(theme).modalTitle}>Follow Requests</Text>
                <TouchableOpacity
                  onPress={async () => {
                    setActiveModal(null);
                    try {
                      const result = await updateRequests(user?.id as string);

                      if (result.error){
                        throw new Error(result.msg)
                      }
                      
                      setUser(prev => prev ? {...prev, requests: result.requests} : prev)

                    }catch (error) {
                      console.error(`Error updating requestList:`, error);
                    }
                  }}
                  style={styles(theme).closeButton}
                >
                  <FontAwesome name="times" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              {user?.requests.length === 0 ? (
                <View style={styles(theme).emptyContainer}>
                  <Text style={styles(theme).emptyText}>No pending requests</Text>
                </View>
              ) : (
                <FlatList
                  data={user?.requests}
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
      <SafeAreaView style={styles(theme).container}>
        <View style={styles(theme).loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles(theme).loadingText}>Loading profile...</Text>
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
      (activeList === "created" && hasMoreCreated) 
      || (activeList === "participated" && hasMoreParticipated)
    ) {
      setLoadingMoreEvents(true);
      try {
        let events;

        if (activeList === "created") {
          events = await fetchUserCreatedEvents(id as string, createdOffset);
        } else {
          events = await fetchUserParticipatedEvents(id as string, participatedOffset);
        }
        
        if (events.error) {
          throw new Error(events.msg);
        }

        setTimeout(() => {
          if (activeList === "created") {
            setUser(prev => {
              if (prev) {
                const merged = [...prev.created, ...events.events];
                const unique = Array.from(
                  new Map(merged.map(e => [e.id, e])).values()
                );
                return {...prev, created: unique};
              } else {
                return prev;
              };
            });
            if (events.events.length > 0) {
              setCreatedOffset(prev => prev + events.events.length);
            } else {
              setHasMoreCreated(false);
            }
          } else {
            setUser(prev => {
              if (prev) {
                const merged = [...prev.participated, ...events.events];
                const unique = Array.from(
                  new Map(merged.map(e => [e.id, e])).values()
                );
                return {...prev, participated: unique};
              } else {
                return prev;
              };
            });
            if (events.events.length > 0){
              setParticipatedOffset(prev => prev + events.events.length);
            } else {
              setHasMoreParticipated(false);
            }
          }
          setLoadingMoreEvents(false);
        }, 1000);

      } catch (error) {
        console.error("Error loading more events:", error);
      }
    }
  };

  const currentBetList = (user?.public || user?.is_following || user?.owner) ? (activeList === "created") ? user?.created : user?.participated : undefined;

  return (
    <SafeAreaView style={styles(theme).container}>
      <ScrollView 
        style={styles(theme).scrollContainer}
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
          <View style={styles(theme).header}>
            <TouchableOpacity style={styles(theme).requestsButton} onPress={() => openModal("requests")}>
              <FontAwesome name="inbox" size={24} color={theme.text} />
              <View style={styles(theme).alert}>
                <Text style={styles(theme).alertNumber}>{user.requests.length}</Text>   
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles(theme).settingsButton} 
              onPress={() => openModal("settings")}
            >
              <FontAwesome name="cog" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
        )}

        {/* Profile Section */}
        <View style={styles(theme).profileSection}>
          <View style={styles(theme).profileImageContainer}>
            <Image
              source={{ uri: user?.profile_image }}
              style={styles(theme).profileImage}
            />
          </View>

          <Text style={styles(theme).username}>{user?.username}</Text>

          {/* Stats Container */}
          <View style={styles(theme).statsContainer}>
            <TouchableOpacity 
              style={styles(theme).statItem} 
              onPress={() => openModal("followers")}
            >
              <Text style={styles(theme).statNumber}>{user?.follower_count}</Text>
              <Text style={styles(theme).statLabel}>Followers</Text>
            </TouchableOpacity>
            
            <View style={styles(theme).statDivider} />
            
            <TouchableOpacity 
              style={styles(theme).statItem} 
              onPress={() => openModal("following")}
            >
              <Text style={styles(theme).statNumber}>{user?.following_count}</Text>
              <Text style={styles(theme).statLabel}>Following</Text>
            </TouchableOpacity>
              <View style={styles(theme).statDivider} />
              <View style={styles(theme).statItem}>
                <Text style={styles(theme).statNumber}>${user?.coins}</Text>
                <Text style={styles(theme).statLabel}>Balance</Text>
              </View>
          </View>

          {/* Action Button */}
          {!user?.owner && (
            <TouchableOpacity
              style={[
                styles(theme).followButton,
                (user?.is_following || user?.has_requested) && styles(theme).followingButton
              ]}
              onPress={handleFollowToggle}
            >
              <Text style={[
                styles(theme).followButtonText,
                (user?.is_following || user?.has_requested) && styles(theme).followingButtonText
              ]}>
                {user?.is_following ? 'Following' : (user?.has_requested) ? "Requested" : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs Section */}
        {currentBetList ? (
        <>
          <View style={styles(theme).tabsContainer}>
            <TouchableOpacity
              style={[
                styles(theme).tab,
                activeList === "created" && styles(theme).activeTab,
              ]}
              onPress={() => setActiveList("created")}
            >
              <Text
                style={[
                  styles(theme).tabText,
                  activeList === "created" && styles(theme).activeTabText,
                ]}
              >
                Created
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles(theme).tab,
                activeList === "participated" && styles(theme).activeTab,
              ]}
              onPress={() => setActiveList("participated")}
            >
              <Text
                style={[
                  styles(theme).tabText,
                  activeList === "participated" && styles(theme).activeTabText,
                ]}
              >
                Participated
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bets List */}
          <View style={styles(theme).listContainer}>
            {currentBetList.length === 0 ? (
              <View style={styles(theme).emptyContainer}>
                <Text style={styles(theme).emptyText}>
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
          <View style={styles(theme).emptyContainer}>
            <Text style={styles(theme).emptyText}>
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

const styles = (theme: Theme) => StyleSheet.create({
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
    marginBottom: 12,    borderRadius: 70,
  },
  profileImage: {
    width: 226,
    height: 140,
    borderWidth: 1,
    borderColor: theme.primary,
    elevation: 10
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
    shadowColor: '#000',
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
  editButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 120,
  },
  editButtonText: {
    color: theme.buttonText,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
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
  betContainer: {
    backgroundColor: theme.button_darker_primary,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  betContent: {
    padding: 14,
  },
  betTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 6,
  },
  betDescription: {
    fontSize: 14,
    color: theme.buttonText,
    marginBottom: 10,
  },
  betFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  betAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.primary,
  },
  betStatus: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: theme.cardBorder,
    color: theme.secondary,
  },
  statusActive: {
    backgroundColor: '#E8F5E8',
    color: '#2E7D32',
  },
  statusCompleted: {
    backgroundColor: '#E3F2FD',
    color: '#1976D2',
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
  cancelText: {
    fontSize: 16,
    color: theme.void,
  },
  saveButton: {
    padding: 4,
  },
  saveText: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: '600',
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

  // Edit Profile Modal
  editContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  editImageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  editProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: theme.primary,
    marginBottom: 12,
  },
  changePhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  changePhotoText: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: theme.button_darker_primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  userList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.button_darker_primary,
    borderRadius: 8,
    marginBottom: 8,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.primary,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  userDisplayName: {
    fontSize: 14,
    color: theme.void,
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