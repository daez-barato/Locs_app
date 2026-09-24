import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import AvatarImage from "@/components/ui/avatar-image";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useCoinContext } from "@/hooks/use-coin-context";
import { useAuthContext } from "@/hooks/use-auth-context";
import { equipItem, getShopItems, purchaseItem } from "@/services/shop";
import { getMyCoins } from "@/services/users";
import { ShopItem } from "@/types/interfaces";
import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Shop() {
  const theme = useThemeConfig();
  const styles = useThemedStyles(createStyles);
  const { coins, setCoinAmount } = useCoinContext();
  const { updateUser } = useAuthContext();

  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  // State updates are async, so a fast double tap could get past a
  // state-based check; the ref is the real guard, `busy` drives the UI.
  const busyRef = useRef<Set<string>>(new Set());
  const hasLoaded = useRef(false);
  // Bumped on every local mutation, so a load that started before a purchase
  // or equip can't land afterwards and overwrite the newer local state.
  const mutationSeq = useRef(0);

  const load = useCallback(async (mode: "initial" | "refresh" | "silent") => {
    if (mode === "initial") setLoading(true);
    if (mode === "refresh") setRefreshing(true);
    const seq = mutationSeq.current;

    const [result, balance] = await Promise.all([getShopItems(), getMyCoins()]);

    if (seq === mutationSeq.current) {
      if (result.error) {
        // A failed background refresh keeps what's on screen; only an empty
        // screen gets the error state.
        if (!hasLoaded.current) setErrorMessage(result.msg);
      } else {
        setItems(result.items);
        setErrorMessage(null);
        hasLoaded.current = true;
      }
      if (balance !== null) setCoinAmount(balance);
    }

    setLoading(false);
    setRefreshing(false);
  }, [setCoinAmount]);

  // Reload whenever the tab gains focus, so ownership and balance stay current
  // after betting elsewhere or equipping from another device.
  useFocusEffect(
    useCallback(() => {
      load(hasLoaded.current ? "silent" : "initial");
    }, [load])
  );

  const setItemBusy = (id: string, value: boolean) => {
    if (value) busyRef.current.add(id);
    else busyRef.current.delete(id);
    setBusy((prev) => ({ ...prev, [id]: value }));
  };

  const handleEquip = async (item: ShopItem) => {
    if (busyRef.current.has(item.id)) return;
    setItemBusy(item.id, true);
    try {
      const result = await equipItem(item.id);
      if (result.error) {
        Alert.alert("Couldn't equip", result.msg);
        return;
      }
      mutationSeq.current += 1;
      setItems((prev) =>
        prev.map((i) => (i.kind === item.kind ? { ...i, equipped: i.id === item.id } : i))
      );
      updateUser({ avatar_url: result.avatarPath });
    } finally {
      setItemBusy(item.id, false);
    }
  };

  const doPurchase = async (item: ShopItem) => {
    if (busyRef.current.has(item.id)) return;
    setItemBusy(item.id, true);
    let purchased = false;
    try {
      const result = await purchaseItem(item.id);
      if (result.error) {
        Alert.alert("Purchase failed", result.msg);
        return;
      }
      mutationSeq.current += 1;
      setCoinAmount(result.coins);
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, owned: true } : i)));
      purchased = true;
    } finally {
      setItemBusy(item.id, false);
    }

    if (purchased) {
      Alert.alert("Purchased!", `Equip ${item.name} now?`, [
        { text: "Not now", style: "cancel" },
        { text: "Equip", onPress: () => handleEquip({ ...item, owned: true }) },
      ]);
    }
  };

  const handleBuy = (item: ShopItem) => {
    if (busyRef.current.has(item.id)) return;
    Alert.alert("Confirm purchase", `Buy ${item.name} for ${item.price} coins?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Buy", onPress: () => doPurchase(item) },
    ]);
  };

  const renderAction = (item: ShopItem) => {
    const isBusy = !!busy[item.id];

    if (item.equipped) {
      return (
        <View style={[styles.actionButton, styles.actionDisabled]}>
          <FontAwesome name="check" size={12} color={theme.muted} />
          <Text style={styles.actionDisabledText}>Equipped</Text>
        </View>
      );
    }

    if (item.owned) {
      return (
        <TouchableOpacity
          style={[styles.actionButton, styles.equipButton]}
          onPress={() => handleEquip(item)}
          disabled={isBusy}
          accessibilityRole="button"
          accessibilityLabel={`Equip ${item.name}`}
        >
          {isBusy ? (
            <ActivityIndicator size="small" color={theme.buttonText} />
          ) : (
            <Text style={styles.equipButtonText}>Equip</Text>
          )}
        </TouchableOpacity>
      );
    }

    if (item.price > coins) {
      return (
        <View style={[styles.actionButton, styles.actionDisabled]}>
          <Text style={styles.actionDisabledText}>Need {item.price - coins} more</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.actionButton, styles.buyButton]}
        onPress={() => handleBuy(item)}
        disabled={isBusy}
        accessibilityRole="button"
        accessibilityLabel={`Buy ${item.name} for ${item.price} coins`}
      >
        {isBusy ? (
          <ActivityIndicator size="small" color={theme.void} />
        ) : (
          <>
            <FontAwesome name="money" size={12} color={theme.void} />
            <Text style={styles.buyButtonText}>Buy · {item.price}</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: ShopItem }) => (
    <View style={[styles.card, item.equipped && styles.cardEquipped]}>
      <View style={styles.imageWrapper}>
        <AvatarImage uri={item.imageUrl} style={styles.image} resizeMode="cover" />
        {item.equipped && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Equipped</Text>
          </View>
        )}
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.price}>
        {item.owned ? "Owned" : item.price === 0 ? "Free" : `${item.price} coins`}
      </Text>
      {renderAction(item)}
    </View>
  );

  const renderBody = () => {
    if (loading && !hasLoaded.current) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.stateText}>Loading shop...</Text>
        </View>
      );
    }

    if (errorMessage && items.length === 0) {
      return (
        <View style={styles.centered}>
          <FontAwesome name="exclamation-circle" size={40} color={theme.primary} />
          <Text style={styles.stateText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => load("initial")}>
            <FontAwesome name="refresh" size={14} color={theme.buttonText} />
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        extraData={{ busy, coins }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load("refresh")}
            tintColor={theme.primary}
            colors={[theme.primary]}
            progressBackgroundColor={theme.card}
          />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.stateText}>Nothing for sale right now.</Text>
          </View>
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shop</Text>
        <View style={styles.balance} accessibilityLabel={`Balance: ${coins} coins`}>
          <FontAwesome name="money" size={16} color={theme.primary} />
          <Text style={styles.balanceText}>{coins}</Text>
        </View>
      </View>
      {renderBody()}
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.text,
    },
    balance: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    balanceText: {
      color: theme.cardText,
      fontSize: 16,
      fontWeight: "700",
    },
    listContent: {
      padding: 12,
      paddingBottom: 32,
      flexGrow: 1,
    },
    column: {
      justifyContent: "space-between",
    },
    card: {
      width: "48%",
      marginBottom: 12,
      padding: 10,
      borderRadius: 16,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    cardEquipped: {
      borderColor: theme.primary,
      borderWidth: 2,
    },
    imageWrapper: {
      width: "100%",
      aspectRatio: 1,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: theme.cardBorder,
      marginBottom: 8,
    },
    image: {
      width: "100%",
      height: "100%",
    },
    badge: {
      position: "absolute",
      top: 6,
      left: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: theme.success,
    },
    badgeText: {
      color: theme.onAccent,
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    name: {
      color: theme.cardText,
      fontSize: 15,
      fontWeight: "700",
    },
    price: {
      color: theme.muted,
      fontSize: 13,
      marginTop: 2,
      marginBottom: 8,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      minHeight: 34,
      borderRadius: 10,
      paddingHorizontal: 8,
    },
    buyButton: {
      backgroundColor: theme.primary,
    },
    buyButtonText: {
      color: theme.void,
      fontWeight: "700",
    },
    equipButton: {
      backgroundColor: theme.button,
    },
    equipButtonText: {
      color: theme.buttonText,
      fontWeight: "700",
    },
    actionDisabled: {
      backgroundColor: theme.cardBorder,
    },
    actionDisabledText: {
      color: theme.muted,
      fontWeight: "600",
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      gap: 12,
    },
    stateText: {
      color: theme.text,
      fontSize: 16,
      textAlign: "center",
    },
    retryButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: theme.button,
    },
    retryText: {
      color: theme.buttonText,
      fontWeight: "600",
    },
  });
