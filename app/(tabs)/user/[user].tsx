import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import { 
  View, 
  StyleSheet, 
  Image, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Modal,
  TextInput
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useCallback, useEffect, useState } from "react";
import { useCoins } from "@/api/context/coinContext";
import { useAuth } from "@/api/context/AuthContext";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { getFollowerCount, getFollowingCount, fetchUserData } from "@/api/profileFuntions";
import { FontAwesome } from "@expo/vector-icons";

const { width } = Dimensions.get('window');
const placeholderImage = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Vector_WikiAnswers_Orange_Avatar_Lady_Incognito.svg/960px-Vector_WikiAnswers_Orange_Avatar_Lady_Incognito.svg.png?20241130025355";

interface BetItem {
  id: string;
  title: string;
  description?: string;
  amount?: number;
  status?: string;
  createdAt?: string;
}

type ActiveList = "created" | "participated";

export default function Profile() {
  const theme = useThemeConfig();
  const { authState, onLogout } = useAuth();
  const { coins } = useCoins();
  const { user } = useLocalSearchParams();
  const router = useRouter();

  // State management
  const [activeList, setActiveList] = useState<ActiveList>("created");
  const [followers, setFollowers] = useState<number>(0);
  const [following, setFollowing] = useState<number>(0);
  const [owner, setOwner] = useState<boolean>(false);
  const [betsCreated, setBetsCreated] = useState<BetItem[]>([]);
  const [betsParticipated, setBetsParticipated] = useState<BetItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // Modal states
  const [settingsVisible, setSettingsVisible] = useState<boolean>(false);
  const [editProfileVisible, setEditProfileVisible] = useState<boolean>(false);
  
  // Edit profile states
  const [editedUsername, setEditedUsername] = useState<string>("");
  const [editedBio, setEditedBio] = useState<string>("");

  const profileImage = "";

  // Initialize edit profile data
  useEffect(() => {
    setEditedUsername(user as string || "");
  }, [user]);

  // Fetch data function
  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      // Check if current user is the profile owner
      if (user === authState?.userName) {
        setOwner(true);
      }

      // Fetch follower and following counts
      const [followerCount, followingCount, userData] = await Promise.all([
        getFollowerCount(),
        getFollowingCount(),
        fetchUserData(user as string)
      ]);
      
      setFollowers(followerCount || 0);
      setFollowing(followingCount || 0);

      if (userData) {
        setBetsCreated(userData.created || []);
        setBetsParticipated(userData.participated || []);
      } else {
        console.error("No user data found");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh handler
  const onRefresh = useCallback(() => {
    fetchData(true);
  }, [user, authState?.userName]);

  // Fetch data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [user, authState?.userName])
  );

  // Navigate to settings
  const handleSettingsPress = () => {
    setSettingsVisible(true);
  };

  // Navigate to edit profile
  const handleEditProfile = () => {
    setEditProfileVisible(true);
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              if (onLogout){
                await onLogout();
              }
              setSettingsVisible(false);
              router.replace('/(auth)'); // Navigate to login screen
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          }
        }
      ]
    );
  };

  // Handle save profile
  const handleSaveProfile = async () => {
    try {
      // Add your profile update logic here
      // await updateUserProfile({ username: editedUsername, bio: editedBio });
      
      Alert.alert("Success", "Profile updated successfully!");
      setEditProfileVisible(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Profile update error:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

  // Settings options
  const settingsOptions = [
    {
      title: "Notifications",
      icon: "bell",
      onPress: () => {
        setSettingsVisible(false);
        // Navigate to notifications settings
      }
    },
    {
      title: "Privacy",
      icon: "lock",
      onPress: () => {
        setSettingsVisible(false);
        // Navigate to privacy settings
      }
    },
    {
      title: "Account",
      icon: "user",
      onPress: () => {
        setSettingsVisible(false);
        // Navigate to account settings
      }
    },
    {
      title: "Help & Support",
      icon: "question-circle",
      onPress: () => {
        setSettingsVisible(false);
        // Navigate to help
      }
    },
    {
      title: "About",
      icon: "info-circle",
      onPress: () => {
        setSettingsVisible(false);
        // Navigate to about
      }
    },
    {
      title: "Logout",
      icon: "sign-out",
      onPress: handleLogout,
      isDestructive: true
    }
  ];

  // Render bet item
  const renderBetItem = ({ item }: { item: BetItem }) => (
    <TouchableOpacity 
      style={styles(theme).betContainer}
      onPress={() => router.push(`/event/${item.id}`)}
    >
      <View style={styles(theme).betContent}>
        <Text style={styles(theme).betTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.description && (
          <Text style={styles(theme).betDescription} numberOfLines={1}>
            {item.description}
          </Text>
        )}
        <View style={styles(theme).betFooter}>
          {item.amount && (
            <Text style={styles(theme).betAmount}>
              💰 ${item.amount}
            </Text>
          )}
          {item.status && (
            <Text style={[
              styles(theme).betStatus,
              item.status === 'active' && styles(theme).statusActive,
              item.status === 'completed' && styles(theme).statusCompleted,
            ]}>
              {item.status.toUpperCase()}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles(theme).container}>
        <View style={styles(theme).loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles(theme).loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
      >
        {/* Header with Settings */}
        <View style={styles(theme).header}>
          <TouchableOpacity 
            style={styles(theme).settingsButton} 
            onPress={handleSettingsPress}
          >
            <FontAwesome name="cog" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <View style={styles(theme).profileSection}>
          {/* Profile Image */}
          <View style={styles(theme).profileImageContainer}>
            <Image
              source={{ uri: profileImage || placeholderImage }}
              style={styles(theme).profileImage}
            />
          </View>

          {/* Username */}
          <Text style={styles(theme).username}>{user}</Text>

          {/* Stats Container */}
          <View style={styles(theme).statsContainer}>
            <View style={styles(theme).statItem}>
              <Text style={styles(theme).statNumber}>{followers}</Text>
              <Text style={styles(theme).statLabel}>Followers</Text>
            </View>
            
            <View style={styles(theme).statDivider} />
            
            <View style={styles(theme).statItem}>
              <Text style={styles(theme).statNumber}>{following}</Text>
              <Text style={styles(theme).statLabel}>Following</Text>
            </View>
            
            <View style={styles(theme).statDivider} />
            
            <View style={styles(theme).statItem}>
              <Text style={styles(theme).statNumber}>${coins}</Text>
              <Text style={styles(theme).statLabel}>Balance</Text>
            </View>
          </View>

          {/* Edit Profile Button */}
          {owner && (
            <TouchableOpacity
              style={styles(theme).editButton}
              onPress={handleEditProfile}
            >
              <Text style={styles(theme).editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs Section */}
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
              Created ({betsCreated.length})
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
              Participated ({betsParticipated.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bets List */}
        <View style={styles(theme).listContainer}>
          {(activeList === "created" ? betsCreated : betsParticipated).length === 0 ? (
            <View style={styles(theme).emptyContainer}>
              <Text style={styles(theme).emptyText}>
                No {activeList === "created" ? "created" : "participated"} events yet
              </Text>
            </View>
          ) : (
            (activeList === "created" ? betsCreated : betsParticipated).map((item) => (
              <View key={item.id}>
                {renderBetItem({ item })}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        visible={settingsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <SafeAreaView style={styles(theme).modalContainer}>
          <View style={styles(theme).modalHeader}>
            <Text style={styles(theme).modalTitle}>Settings</Text>
            <TouchableOpacity
              onPress={() => setSettingsVisible(false)}
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
                  name={"gear"}
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
                <FontAwesome
                  name="chevron-right"
                  size={16}
                  color={theme.void}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={editProfileVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditProfileVisible(false)}
      >
        <SafeAreaView style={styles(theme).modalContainer}>
          <View style={styles(theme).modalHeader}>
            <TouchableOpacity
              onPress={() => setEditProfileVisible(false)}
              style={styles(theme).closeButton}
            >
              <Text style={styles(theme).cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles(theme).modalTitle}>Edit Profile</Text>
            <TouchableOpacity
              onPress={handleSaveProfile}
              style={styles(theme).saveButton}
            >
              <Text style={styles(theme).saveText}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles(theme).editContent}>
            <View style={styles(theme).editImageContainer}>
              <Image
                source={{ uri: profileImage || placeholderImage }}
                style={styles(theme).editProfileImage}
              />
              <TouchableOpacity style={styles(theme).changePhotoButton}>
                <Text style={styles(theme).changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>

            <View style={styles(theme).inputContainer}>
              <Text style={styles(theme).inputLabel}>Username</Text>
              <TextInput
                style={styles(theme).textInput}
                value={editedUsername}
                onChangeText={setEditedUsername}
                placeholder="Enter username"
                placeholderTextColor={theme.void}
              />
            </View>

            <View style={styles(theme).inputContainer}>
              <Text style={styles(theme).inputLabel}>Bio</Text>
              <TextInput
                style={[styles(theme).textInput, styles(theme).bioInput]}
                value={editedBio}
                onChangeText={setEditedBio}
                placeholder="Tell us about yourself..."
                placeholderTextColor={theme.void}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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

  // Loading States
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
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  settingsButton: {
    padding: 8,
  },

  // Profile Section
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  profileImageContainer: {
    marginBottom: 12,
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: theme.primary,
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

  // Edit Button
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

  // List
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    minHeight: 200, // Ensure minimum height for content
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

  // Modal Styles
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

  // Settings Content
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
  destructiveItem: {
    // Additional styling for destructive items if needed
  },
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

  // Edit Profile Content
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
});