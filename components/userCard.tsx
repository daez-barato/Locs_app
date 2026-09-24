import { acceptFollowRequest, rejectFollowRequest, followRequest, unfollowRequest  } from "@/api/followers/followers";
import { SearchUser } from "@/types/interfaces";
import { useThemeConfig, Theme } from "@/components/ui/use-theme-config";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthContext } from "@/hooks/use-auth-context";
import React, { useState } from "react";
import AvatarImage from "@/components/ui/avatar-image";
import { resolveAvatarUrl } from "@/utils/avatar";
import { haptics } from "@/utils/haptics";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";

export default function UserCard({ user }: { user: SearchUser }) {
  const theme = useThemeConfig();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const currentUserId = useAuthContext().user?.id;
  const isSelf = !!currentUserId && currentUserId === user.id;

  const [followLabel, setFollowLabel] = useState<"Requested" | "Following" | "Follow" | "Follow back">((user.is_following) ? "Following" : (user.has_requested) ? "Requested" : "Follow");
  const [userState, setUser] = useState<SearchUser>(user);

  const handleFollowLabel = async () => {
    try {
      let result
      if (followLabel === "Follow" || followLabel === "Follow back"){
        result = await followRequest(user.id);
        if (result.error){
          throw new Error(result.message)
        }
        haptics.tap();
        if (result.following){
          setFollowLabel("Following")
        }else if (result.requested) {
          setFollowLabel("Requested")
        }
      }
      else {
        result = await unfollowRequest(user.id);
        if (result.error){
          throw new Error(result.message)
        }
        setFollowLabel("Follow");
      }

    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not follow/unfollow user");
    }
  };

  const handleAccept = async () => {
    try {
      const result = await acceptFollowRequest(user.id);
      if (result.error){
        throw new Error(result.message)
      }
      setUser(prev => ({
        ...prev,
        requester: undefined
      }))
      setFollowLabel(user.is_following ? "Following" : (user.has_requested) ? "Requested" : "Follow back")
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not accept request");
    }
  };

  const handleRefuse = async () => {
    try {
      const result = await rejectFollowRequest(user.id);
      if (result.error){
        throw new Error(result.message)
      }
      setUser(prev => ({
        ...prev,
        requester: undefined
      }))
      setFollowLabel(user.is_following ? "Following" : (user.has_requested) ? "Requested" : "Follow back")
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not reject request");
    }
  };

  return (
    <View style={styles.userCard}>
      <TouchableOpacity
        style={styles.userCardTouchable}
        // Profiles are looked up by username; the id sent every tap to
        // "User not found". navigate (not push) also closes the followers /
        // requests sheet this card may be sitting in.
        onPress={() => router.navigate({ pathname: "/user/[username]", params: { username: user.username } })}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        <View style={styles.avatarContainer}>
          <AvatarImage
            uri={resolveAvatarUrl(userState.avatar_url)}
            style={styles.avatar}
            contentFit="cover"
          />
        </View>

        <View style={styles.userInfo}>
          <View style={styles.userHeader}>
            <Text
              style={styles.username}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              @{userState.username}
            </Text>

            {/* --- Case 1: Follow requests --- */}
            {!isSelf && userState.requester !== undefined && (
              <View style={styles.requestActions}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Accept follow request from ${userState.username}`}
                  onPress={handleAccept}
                >
                  <Text style={styles.acceptText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.refuseButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Reject follow request from ${userState.username}`}
                  onPress={handleRefuse}
                >
                  <FontAwesome name="times" size={14} color={theme.destructiveLabel} />
                </TouchableOpacity>
              </View>
            )}
            {/* --- Case 3: Normal follow/following states --- */}
            {!isSelf && userState.requester === undefined && userState.is_following !== undefined && (
              <View style={styles.userFooter}>
                  <TouchableOpacity
                    onPress={handleFollowLabel}
                    accessibilityRole="button"
                    style={(followLabel === "Following" || followLabel === "Requested") ? styles.followingIndicator : styles.actionIndicator}
                  >
                    {(followLabel === "Following" || followLabel === "Requested") ?
                    <FontAwesome name="check" size={12} color={theme.cardTextSecondary} />
                    : <FontAwesome name="user-plus" size={12} color={theme.onPrimary} />}

                    <Text style={(followLabel === "Following" || followLabel === "Requested") ? styles.followingText : styles.actionText}>
                      {followLabel}
                    </Text>                    
                  </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
    userCard: {
        backgroundColor: theme.card,
        marginHorizontal: 16,
        marginVertical: 6,
        borderRadius: 18,
        borderCurve: 'continuous',
        boxShadow: "0 2px 16px rgba(0, 0, 0, 0.1)",
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.cardOutline,
    },
    userCardTouchable: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 14,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: theme.cardBorder,
        borderWidth: 2,
        borderColor: theme.primary,
    },
    userInfo: {
        flex: 1,
    },
    userHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    username: {
        color: theme.cardText,
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
        marginRight: 8,
    },
    requestActions: {
        flexDirection: 'row',
        gap: 8,
    },
    userFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    // Follow / Follow back is the action: a filled pill.
    actionIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: theme.primary,
    },
    actionText: {
        color: theme.onPrimary,
        fontSize: 13,
        fontWeight: '700',
    },
    // Following / Requested is a state (tap to undo): a quiet outline.
    followingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.cardDividerStrong,
    },
    followingText: {
        color: theme.cardTextSecondary,
        fontSize: 13,
        fontWeight: '600',
    },
    acceptButton: {
        backgroundColor: theme.primary,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    acceptText: {
        color: theme.onPrimary,
        fontSize: 13,
        fontWeight: '700',
    },
    refuseButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.cardDividerStrong,
    },

});