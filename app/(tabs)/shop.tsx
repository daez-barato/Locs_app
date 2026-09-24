import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import AvatarImage from "@/components/ui/avatar-image";
import { CoinAmount, CoinIcon } from "@/components/ui/coin";
import RarityBadge, { rarityColor } from "@/components/ui/rarity-badge";
import { withAlpha } from "@/theme";
import { haptics } from "@/utils/haptics";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useCoinContext } from "@/hooks/use-coin-context";
import { useAuthContext } from "@/hooks/use-auth-context";
import { equipItem, getShopItems, purchaseItem } from "@/services/shop";
import { getMyCoins } from "@/services/users";
import { ShopItem } from "@/types/interfaces";
import { FontAwesome } from "@expo/vector-icons";
import { Tabs, useFocusEffect, useRouter } from "expo-router";
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

export default function Shop() {
  const theme = useThemeConfig();
  const styles = useThemedStyles(createStyles);
  const { coins, setCoinAmount } = useCoinContext();
  const { updateUser } = useAuthContext();
  const router = useRouter();

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
      haptics.tap();
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
      haptics.success();
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
          <CoinAmount prefix="Need" amount={item.price - coins} size={14} textStyle={styles.actionDisabledText} />
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
            <Text style={styles.buyButtonText}>Buy</Text>
            <CoinIcon size={16} />
            <Text style={styles.buyButtonText}>{item.price}</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: ShopItem }) => (
    <View
      style={[
        styles.card,
        // A soft edge in the tier's colour; the equipped card keeps its teal.
        { borderColor: withAlpha(rarityColor(theme, item.rarity), 0.45) },
        item.equipped && styles.cardEquipped,
      ]}
    >
      <TouchableOpacity
        style={styles.imageWrapper}
        onPress={() => router.push({ pathname: "/avatar", params: { path: item.imagePath } })}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`About ${item.name}, ${item.rarity} rarity`}
      >
        <AvatarImage uri={item.imageUrl} style={styles.image} contentFit="cover" />
        {item.equipped && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Equipped</Text>
          </View>
        )}
        <RarityBadge rarity={item.rarity} style={styles.rarityBadge} />
      </TouchableOpacity>
      <Text style={styles.name} numberOfLines={1}>
        {item.name}
      </Text>
      {item.owned || item.price === 0 ? (
        <Text style={styles.price}>{item.owned ? "Owned" : "Free"}</Text>
      ) : (
        <CoinAmount amount={item.price} size={14} textStyle={styles.price} style={styles.priceRow} />
      )}
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
    <View style={styles.container}>
      <Tabs.Screen
        options={{
          headerRight: () => (
            <View style={styles.balance} accessible accessibilityLabel={`Balance: ${coins} coins`}>
              <CoinIcon size={18} />
              <Text style={styles.balanceText}>{coins}</Text>
            </View>
          ),
        }}
      />
      {renderBody()}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    balance: {
      marginRight: 16,
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
      fontVariant: ['tabular-nums'],
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
    rarityBadge: {
      position: "absolute",
      top: 6,
      right: 6,
    },
    badgeText: {
      color: theme.onAccent,
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    name: {
      color: theme.cardText,
      fontSize: 15,
      fontWeight: "700",
    },
    price: {
      fontVariant: ['tabular-nums'],
      color: theme.muted,
      fontSize: 13,
      marginTop: 2,
      marginBottom: 8,
    },
    // CoinAmount is a row; the margins that sat on the old Text move to it.
    priceRow: {
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
