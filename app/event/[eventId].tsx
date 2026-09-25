import { ActivityIndicator, Text, StyleSheet, View, ScrollView, TouchableOpacity, useWindowDimensions, TextInput, RefreshControl, Modal, Alert, Share } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Theme, useThemeConfig } from '@/components/ui/use-theme-config';
import { withAlpha } from "@/theme";
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { useEffect, useState } from 'react';
import { deleteEvent, endEvent, eventInformation, fetchEventBets, getEventWinners, lockEvent, placeBet, postTemplate, saveTemplate, setEventPublic } from '@/api/eventFunctions';
import { eventUrl } from '@/constants/links';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { followRequest } from '@/api/followers/followers';
import { useAuthContext } from '@/hooks/use-auth-context';
import { useCoinContext } from '@/hooks/use-coin-context';
import { CoinAmount, CoinIcon } from "@/components/ui/coin";
import { haptics } from "@/utils/haptics";
import { Bet } from '@/types/interfaces';
import { EventDetails } from '@/types/rpc';


export default function eventScreen() {
  const { eventId } = useLocalSearchParams() as { eventId: string };
  const { coins, refreshCoins } = useCoinContext();
  const [refreshing, setRefreshing] = useState(false);
  const theme = useThemeConfig();
  // Read per render so cards resize on rotation and iPad split view; the old
  // module-level Dimensions.get froze the launch-time width.
  const { width: windowWidth } = useWindowDimensions();
  const styles = useThemedStyles(createStyles);
  const [eventInfo, setEventInfo] = useState<EventDetails | null>(null);
  const [betInfos, setBetInfos] = useState<Record<string, Bet>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showEndEventModal, setShowEndEventModal] = useState(false);
  const [pendingBet, setPendingBet] = useState<{question: string, option: string, isIncrease: boolean} | null>(null);
  const [modalBetAmount, setModalBetAmount] = useState<string>('10');
  const [winningOptions, setWinningOptions] = useState<Record<string, string>>({});
  // question title -> winning option title, for decided events.
  const [winners, setWinners] = useState<Record<string, string>>({});
  // Distinct people with a stake, for the "who's betting" button.
  const [bettorCount, setBettorCount] = useState(0);
  const [postTemplateModal, setPostTemplateModal] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const userName = useAuthContext().user?.username || '';
  // An https link rather than the app scheme: it opens the app when installed
  // and the website (then the app store) when not.
  const url = eventUrl(eventId);

  const isEventCreator = eventInfo?.is_creator;
  // Locked but not yet decided: the creator action is End, on a red fill.
  const endable = !!eventInfo?.locked && !eventInfo?.decided;

  async function fetchData() {
    try {
      const event = await eventInformation(eventId);

      // Explicit return type means no implicit optional-prop merging, so
      // narrow the union with `in` rather than a truthiness check.
      if ("error" in event) {
        throw new Error(event.msg);
      }

      setEventInfo(event);
      setLoadError(null);

      if (event.is_creator && event.decided && !event.template_posted) {
          setPostTemplateModal(true);
      };

      if (event.decided) {
        const winnersResult = await getEventWinners(eventId);
        if (Array.isArray(winnersResult)) {
          setWinners(Object.fromEntries(winnersResult.map((w) => [w.question, w.option])));
        } else {
          console.error('Failed to fetch winners:', winnersResult.msg);
        }
      } else {
        setWinners({});
      }

      const bets = await fetchEventBets(eventId);

      if (!Array.isArray(bets)) {
        console.error('Failed to fetch bets:', bets.msg);
        return;
      }

      const bet_infos: Record<string, Bet> = {};
      const questions = event.questions as Record<string, string[]>;

      for (const [question, options] of Object.entries(questions)) {
        bet_infos[question] = {
          totalPot: 0,
          optionPots: Object.fromEntries(
            options.map((option: string) => [option, 0])
          )
        };
      }

      for (const bet of bets) {
        const question = bet.question;
        const option = bet.option;
        const amount = bet.amount;

        if (bet_infos[question]) {
          bet_infos[question].totalPot += amount;
          bet_infos[question].optionPots[option] += amount;

          if (bet.username === userName) {
            bet_infos[question].userBet = {
              options: {
                ...bet_infos[question].userBet?.options,
                [option]: bet?.payout != null ? bet.payout : amount
              }
            };
          }
        }
      }

      setBetInfos(bet_infos);
      setBettorCount(new Set(bets.map((b) => b.user_id)).size);

    } catch (err: any) {
      console.error('Failed to fetch data', err);
      setLoadError(
        "We couldn't load this event. It may have been removed, or you may be offline."
      );
    }
  }

  useEffect(() => {
    fetchData();
    // The bet modal shows the balance; start from the current one.
    refreshCoins();
  }, [eventId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), refreshCoins()]);
    setRefreshing(false);
  };

  const handleShareEvent = async () => {
    try {
      const eventTitle = eventInfo?.title || 'a prediction event';
      // Private events are excluded from search and trending, so the link is the
      // only way in — say so, otherwise people assume the recipient can find it.
      const invite = eventInfo?.public
        ? `Join "${eventTitle}" on Locs:\n${url}`
        : `You're invited to "${eventTitle}" on Locs. This event is private — only people with this link can join:\n${url}`;

      await Share.share({
        message: invite,
        url: url,
        title: eventTitle,
      });
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share event');
    }
  };

  const handleLockEvent = () => {
    setShowLockModal(true);
  };

  const handleToggleVisibility = () => {
    if (!eventInfo) return;
    const next = !eventInfo.public;

    Alert.alert(
      next ? 'Make event public?' : 'Make event private?',
      next
        ? "Public events appear in your followers' feeds and in Explore."
        : 'Private events are hidden from feeds and Explore; only people with the link can open it.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: next ? 'Make public' : 'Make private', onPress: () => confirmToggleVisibility(next) },
      ]
    );
  };

  const confirmToggleVisibility = async (next: boolean) => {
    const previous = eventInfo?.public;
    // Flip immediately so the pill tracks the tap; undo on failure.
    setEventInfo(prev => prev ? { ...prev, public: next } : prev);

    try {
      const result = await setEventPublic(eventId, next);

      if (result.error) {
        throw new Error(result.msg);
      }

      setEventInfo(prev => prev ? { ...prev, public: result.public } : prev);
      haptics.success();
    } catch (error) {
      console.error('Error updating event visibility:', error);
      setEventInfo(prev => prev ? { ...prev, public: previous ?? prev.public } : prev);
      Alert.alert('Error', 'Failed to update event visibility');
    }
  };

  const confirmDeleteEvent = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteEvent(eventId);

      if (result.error) {
        Alert.alert('Error', result.msg);
        return;
      }

      setShowDeleteModal(false);
      // Refunds may include the creator's own stakes.
      refreshCoins();
      Alert.alert(
        'Event deleted',
        result.refundedUsers
          ? `${result.refundedCoins} coins were returned to ${result.refundedUsers} ${result.refundedUsers === 1 ? 'person' : 'people'}.`
          : 'No bets had been placed, so there was nothing to refund.'
      );
      router.back();
    } catch (error) {
      console.error('Error deleting event:', error);
      Alert.alert('Error', 'Failed to delete event');
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmLockEvent = async () => {
    try {
      const result = await lockEvent(eventId);

      if (result.error){
        Alert.alert('Error', result.msg);
        return;
      };
      
      setEventInfo(prev => prev ? { ...prev, locked: true } : null);
      setShowLockModal(false);
      haptics.success();
      Alert.alert('Success', 'Event has been locked. No more bets can be placed.');
    } catch (error) {
      console.error('Error locking event:', error);
      Alert.alert('Error', 'Failed to lock event');
    }
  };

  const handleEndEvent = () => {
    if (!eventInfo?.questions) return;
    
    const initialWinners: Record<string, string> = {};
    Object.keys(eventInfo.questions).forEach(question => {
      initialWinners[question] = '';
    });
    setWinningOptions(initialWinners);
    setShowEndEventModal(true);
  };

  const confirmEndEvent = async () => {
    const allQuestionsAnswered = Object.keys(eventInfo?.questions || {}).every(
      question => winningOptions[question] && winningOptions[question].trim() !== ''
    );

    if (!allQuestionsAnswered) {
      Alert.alert('Incomplete', 'Please select a winning option for all questions');
      return;
    }

    try {
      const result = await endEvent(eventId, winningOptions);

      if (result.error){
        Alert.alert('Error', result.msg);
        return;
      };
      
      setEventInfo(prev => prev ? { ...prev, decided: true } : null);
      // The chosen winners are already known here, so highlight them without
      // a round trip to get_event_winners.
      setWinners(winningOptions);
      setShowEndEventModal(false);
      haptics.success();
      // Deciding pays out winners, the creator included if they bet.
      refreshCoins();
      if (!eventInfo?.template_posted){
        setPostTemplateModal(true);
      }
        
    } catch (error) {
      console.error('Error ending event:', error);
      Alert.alert('Error', 'Failed to end event');
    }
  };

  const showBetConfirmation = (question: string, option: string, isIncrease: boolean = false) => {
    setPendingBet({ question, option, isIncrease });
    
    if (isIncrease) {
      const currentBet = betInfos[question]?.userBet?.options[option] || 0;
      setModalBetAmount((currentBet).toString());
    } else {
      setModalBetAmount('10');
    }
    
    setShowConfirmModal(true);
  };

  const confirmBet = async () => {
    if (pendingBet) {
      const betAmount = parseFloat(modalBetAmount) || 0;
      if (betAmount <= 0) {
        Alert.alert('Invalid amount', 'Please enter a valid bet amount');
        return;
      }

      if (pendingBet.isIncrease && betInfos[pendingBet.question]?.userBet?.options[pendingBet.option] !== undefined) {
        const currentBetAmount = betInfos[pendingBet.question].userBet?.options[pendingBet.option] || 0;
        if (betAmount <= currentBetAmount) {
          Alert.alert('Invalid amount', 'Increase amount must be greater than current bet');
          return;
        }
      }

      // Catch the common failure before the round trip, with a clearer message
      // than the server's "insufficient coins". An increase only costs the
      // difference over the existing stake.
      const currentStake = betInfos[pendingBet.question]?.userBet?.options[pendingBet.option] || 0;
      const cost = pendingBet.isIncrease ? betAmount - currentStake : betAmount;
      if (cost > coins) {
        Alert.alert('Not enough coins', `This bet needs ${cost} coins and you have ${coins}.`);
        return;
      }

      const bet = await placeBet(eventId , pendingBet.question, pendingBet.option, betAmount);

      if (bet.error){
        Alert.alert('Error', bet.msg);
        return;
      }
      haptics.success();
      // add_bet returns nothing, so read the new balance back.
      refreshCoins();
      // A first stake anywhere on the event makes you one more bettor.
      if (!Object.values(betInfos).some((info) => info.userBet)) {
        setBettorCount((count) => count + 1);
      }
      
      setBetInfos(prevBetInfos => {
        const newBetInfos = { ...prevBetInfos };
        const questionBetInfo = newBetInfos[pendingBet.question];
        
        if (questionBetInfo) {
          const oldUserBetAmount = questionBetInfo.userBet?.options[pendingBet.option] || 0;
          const additionalAmount = pendingBet.isIncrease ? betAmount - oldUserBetAmount : betAmount;
          
          const newOptionBets = { ...questionBetInfo.optionPots };
          newOptionBets[pendingBet.option] = (newOptionBets[pendingBet.option] || 0) + additionalAmount;
          
          const newTotalPot = Object.values(newOptionBets).reduce((sum, amount) => sum + amount, 0);
          
          newBetInfos[pendingBet.question] = {
            ...questionBetInfo,
            totalPot: newTotalPot,
            userBet: {
              options: {
                ...questionBetInfo.userBet?.options,
                [pendingBet.option]: (questionBetInfo.userBet?.options[pendingBet.option] || 0) + additionalAmount
              }
            },
            optionPots: newOptionBets
          };
        }
        
        return newBetInfos;
      });
    }
    setShowConfirmModal(false);
    setPendingBet(null);
  };

  const cancelBet = () => {
    setShowConfirmModal(false);
    setPendingBet(null);
  };

  // A render function rather than a component defined inside this one: an
  // inline component gets a new identity every render, so React unmounted and
  // remounted every option card on each keystroke in the bet input.
  const renderOptionCard = (option: string, question: string, betInfo: Bet) => {
    const optionBetAmount = betInfo.optionPots[option];
    const betPercentage = betInfo.totalPot > 0 ? ((optionBetAmount / betInfo.totalPot) * 100) : 0;
    const hasUserBet = betInfo.userBet?.options[option] !== undefined;
    const isLocked = eventInfo?.locked || eventInfo?.decided;
    const isWinner = !!eventInfo?.decided && winners[question] === option;
    // Only dim siblings once we actually know who won this question.
    const isNonWinner = !!eventInfo?.decided && !!winners[question] && !isWinner;

    return (
      <View key={option} style={[
        styles.optionCard,
        { width: windowWidth * 0.75 },
        hasUserBet && styles.userBetCard,
        isWinner && styles.winnerCard,
        isNonWinner && styles.nonWinnerCard
      ]}>
        {isWinner && (
          <View style={styles.winnerBadge}>
            <FontAwesome5 name="trophy" size={12} color={theme.onPrimary} />
            <Text style={styles.winnerBadgeText}>Winner</Text>
          </View>
        )}
        <View style={styles.optionHeader}>
          <Text style={styles.optionTitle} numberOfLines={3}>
            {option}
          </Text>
          {hasUserBet && (
            <View style={styles.userBetBadge}>
              <FontAwesome5 name="star" size={12} color={theme.onAccent} />
            </View>
          )}
        </View>

        <View style={styles.betStats}>
          <View style={styles.statRow}>
            <Text style={styles.statPercentage}>{betPercentage.toFixed(1)}%</Text>
            <CoinAmount amount={optionBetAmount} size={16} textStyle={styles.optionBetAmount} />
          </View>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${betPercentage}%` }
              ]} 
            />
          </View>
        </View>

        {isLocked ? (
          <View style={[
            styles.lockedBetInfo,
            eventInfo?.decided && styles.decidedBetInfo
          ]}>
            <FontAwesome5
              name={eventInfo?.decided ? "trophy" : "lock"} 
              size={16} 
              color={eventInfo?.decided ? theme.warning : theme.neutral} 
            />
            <CoinAmount
              prefix={eventInfo?.decided ? "Payout:" : "Locked:"}
              amount={betInfo.userBet?.options[option] ?? 0}
              size={16}
              textStyle={styles.lockedBetText}
            />
          </View>
        ) : hasUserBet ? (
          <View style={styles.userBetInfo}>
            <CoinAmount
              prefix="Your bet:"
              amount={betInfo.userBet!.options[option]}
              size={18}
              textStyle={styles.userBetAmount}
              style={styles.centeredRow}
            />
            <TouchableOpacity
              style={styles.increaseBetButton}
              onPress={() => showBetConfirmation(question, option, true)}
            >
              <FontAwesome5 name="plus" size={14} color={theme.onAccent} />
              <Text style={styles.increaseBetButtonText}>Increase</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.betButton}
            onPress={() => showBetConfirmation(question, option, false)}
          >
            <FontAwesome5 name="chart-line" size={16} color={theme.onPrimary} />
            <Text style={styles.betButtonText}>Place Bet</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loadError) {
    return (
      <View style={styles.container}>
        <View style={styles.loadErrorContainer}>
          <FontAwesome5 name="exclamation-triangle" size={48} color={theme.destructiveLabel} />
          <Text style={styles.loadErrorTitle}>Event unavailable</Text>
          <Text style={styles.loadErrorText}>{loadError}</Text>
          <TouchableOpacity
            style={styles.loadErrorButton}
            onPress={onRefresh}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="redo" size={14} color={theme.onPrimary} />
            <Text style={styles.loadErrorButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!eventInfo) {
    return (
      <View style={styles.container}>
        <View style={styles.loadErrorContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading event...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* The native header supplies back navigation (and Android's predictive
          back); the event's own actions sit on its right. */}
      <Stack.Screen
        options={{
          headerRight: () => (
              <View style={styles.headerActions}>
                
                {(isEventCreator || eventInfo?.public) && (
                  <TouchableOpacity 
                    style={styles.shareButton}
                    accessibilityRole="button"
                    accessibilityLabel="Share event"
                    onPress={handleShareEvent}
                  >
                    <FontAwesome5 name="share" size={16} color={theme.primary} />
                    <Text style={styles.shareButtonText}>Share</Text>
                  </TouchableOpacity>
                )}
                
                {isEventCreator && !eventInfo?.decided && (
                  <TouchableOpacity
                    style={styles.deleteEventButton}
                    accessibilityRole="button"
                    accessibilityLabel="Delete event"
                    onPress={() => setShowDeleteModal(true)}
                  >
                    <FontAwesome5 name="trash" size={14} color={theme.destructiveText} />
                  </TouchableOpacity>
                )}

                {isEventCreator && (
                  <>
                    {(!eventInfo?.template_posted || !eventInfo.decided) && (
                      <TouchableOpacity 
                        style={[
                          styles.actionButton,
                          endable && styles.endButton,
                          eventInfo?.decided && styles.postTemplateButton
                        ]}
                        onPress={() => {
                          if (eventInfo?.locked) {
                            eventInfo?.decided ? setPostTemplateModal(true) : handleEndEvent()
                          } else {
                            handleLockEvent()
                          }
                        }}
                      >
                        <FontAwesome5 
                          name={eventInfo?.locked ? (eventInfo?.decided ? "upload" : "flag-checkered") : "lock"} 
                          size={14} 
                          color={endable ? theme.onAccent : theme.onPrimary} 
                        />
                        <Text style={[styles.actionButtonText, !endable && styles.actionButtonTextDark]}>
                          {eventInfo?.locked ? (eventInfo?.decided ? 'Post' : 'End') : 'Lock'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
          ),
        }}
      />

      <ScrollView 
        style={styles.mainScrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* Enhanced Event Header */}
        <View style={styles.eventHeader}>
          {/* 16:9 Event Image */}
          <View style={styles.eventImageContainer}>
            {eventInfo?.thumbnail_url ? (
              <Image 
                source={{ uri: eventInfo.thumbnail_url }}
                style={styles.eventImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <FontAwesome5 name="image" size={40} color={theme.textFaint} />
                <Text style={styles.placeholderText}>No Image</Text>
              </View>
            )}
            
            {/* Gradient Overlay for better text readability */}
            <LinearGradient
              colors={['transparent', theme.scrim]}
              style={styles.imageOverlay}
            />
            
            {/* Status badges overlay */}
            <View style={styles.statusOverlay}>
              {eventInfo?.expire_date && (
                <View style={styles.expiryBadge}>
                  <FontAwesome5 name="clock" size={12} color={theme.onAccent} />
                  <Text style={styles.expiryText}>
                    {new Date(eventInfo.expire_date).toLocaleDateString()}
                  </Text>
                </View>
              )}
              
              {(eventInfo?.locked || eventInfo?.decided) && (
                <View style={[
                  styles.statusBadge,
                  eventInfo?.decided && styles.decidedBadge
                ]}>
                  <FontAwesome5 
                    name={eventInfo?.decided ? "flag-checkered" : "lock"} 
                    size={12} 
                    color={theme.onAccent} 
                  />
                  <Text style={styles.statusBadgeText}>
                    {eventInfo?.decided ? 'ENDED' : 'LOCKED'}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Event Info */}
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle} numberOfLines={3}>
              {eventInfo?.title}
            </Text>
            {eventInfo?.description && (
              <Text style={styles.eventDescription} numberOfLines={4}>
                {eventInfo.description}
              </Text>
            )}
            
            {/* Creator badge */}
            <View style={styles.creatorRow}>
              <View style={styles.creatorLeftRow}>
                <TouchableOpacity
                  style={styles.creatorBadge}
                  accessibilityRole="link"
                  accessibilityLabel={`View ${eventInfo?.creator?.username}'s profile`}
                  onPress={() => router.push(`/(tabs)/user/${eventInfo?.creator?.username}`)}
                >
                  <FontAwesome5 name="user" size={12} color={theme.primary} />
                  <Text style={styles.creatorText}>by {eventInfo?.creator?.username}</Text>
                </TouchableOpacity>

                {/* Only the creator can flip visibility; the RPC rejects anyone else. */}
                {isEventCreator && (
                  <TouchableOpacity
                    style={styles.visibilityBadge}
                    accessibilityRole="button"
                    accessibilityLabel={eventInfo?.public ? 'Make event private' : 'Make event public'}
                    onPress={handleToggleVisibility}
                  >
                    <FontAwesome5
                      name={eventInfo?.public ? 'globe-americas' : 'lock'}
                      size={12}
                      color={theme.primary}
                    />
                    <Text style={styles.creatorText}>{eventInfo?.public ? 'Public' : 'Private'}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.creatorActions}>
                {/* Follow button */}
                {/* Following yourself is rejected by the RPC, so don't offer it. */}
                {!isEventCreator && !eventInfo?.creator?.is_following && !eventInfo?.creator?.has_requested && (
                  <TouchableOpacity
                    style={styles.creatorActionButton}
                    accessibilityRole="button"
                    accessibilityLabel="Follow this creator"
                    onPress={async () => {
                      const result = await followRequest(eventInfo?.creator?.id as string);

                      if (result.error) {
                        Alert.alert('Error', result.message || 'Could not follow this user');
                        return;
                      }

                      setEventInfo(prev =>
                        prev
                          ? {
                              ...prev,
                              creator: {
                                ...prev.creator,
                                is_following: !!result.following,
                                has_requested: !!result.requested,
                              },
                            }
                          : prev
                      );
                    }}
                  >
                    <FontAwesome5 name="user-plus" size={14} color={theme.primary} />
                  </TouchableOpacity>
                )}

                {/* Save Template button */}
                {eventInfo?.template_posted && !eventInfo.template_saved && (
                  <TouchableOpacity
                    style={styles.creatorActionButton}
                    accessibilityRole="button"
                    accessibilityLabel="Save template"
                    onPress={async () => {
                      try {
                        const save = await saveTemplate(eventInfo?.template_id as string);
                        if (save.error) throw Error(save.msg);
                        setEventInfo(prev => prev ? { ...prev, template_saved: true } : prev);
                        Alert.alert('Template saved', `Template "${eventInfo?.title}" has been saved to your collection`);
                      } catch (err: any) {
                        Alert.alert('Error', err.message || 'Template not saved');
                      }
                    }}
                  >
                    <FontAwesome5 name="bookmark" size={14} color={theme.success} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={styles.bettorsButton}
              onPress={() => router.push({ pathname: '/bettors/[eventId]', params: { eventId } })}
              accessibilityRole="button"
              accessibilityLabel={`See who's betting: ${bettorCount} ${bettorCount === 1 ? 'bettor' : 'bettors'}`}
            >
              <FontAwesome5 name="users" size={14} color={theme.primary} />
              <Text style={styles.bettorsButtonText}>
                {bettorCount === 0 ? 'No bets yet' : `${bettorCount} ${bettorCount === 1 ? 'bettor' : 'bettors'}`}
              </Text>
              <Text style={styles.bettorsButtonAction}>See who&apos;s betting</Text>
              <FontAwesome5 name="chevron-right" size={12} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Enhanced Questions Section */}
        <View style={styles.questionsContainer}>
          {eventInfo?.questions && Object.entries(eventInfo.questions).map(([question, options], questionIndex) => {
            const betInfo = betInfos[question];
            if (!betInfo) return null;

            return (
              <View key={question} style={styles.questionContainer}>
                <View style={styles.questionHeader}>
                  <View style={styles.questionTitleRow}>
                    <View style={styles.questionNumber}>
                      <Text style={styles.questionNumberText}>Q{questionIndex + 1}</Text>
                    </View>
                    <Text style={styles.questionTitle}>{question}</Text>
                  </View>
                  
                  <View style={styles.totalPotContainer}>
                    <CoinIcon size={36} />
                    <View style={styles.potInfo}>
                      <Text style={styles.totalPotLabel}>Total pool</Text>
                      <Text style={styles.totalPotAmount}>
                        {betInfo.totalPot.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>

                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.optionsScrollView}
                  contentContainerStyle={styles.optionsScrollContent}
                >
                  {options.map((option) => renderOptionCard(option, question, betInfo))}
                </ScrollView>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Enhanced Bet Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="slide"
        onRequestClose={cancelBet}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <FontAwesome5 
                name={pendingBet?.isIncrease ? "arrow-up" : "chart-line"} 
                size={24} 
                color={theme.primary} 
              />
              <Text style={styles.modalTitle}>
                {pendingBet?.isIncrease ? 'Increase Bet' : 'Place Bet'}
              </Text>
            </View>
            
            <View style={styles.modalOption}>
              <Text style={styles.modalOptionText}>"{pendingBet?.option}"</Text>
            </View>
            
            <View style={styles.balanceContainer}>
              <CoinAmount prefix="Balance:" amount={coins} size={18} textStyle={styles.balanceText} />
            </View>
            
            <View style={styles.betAmountContainer}>
              <Text style={styles.betAmountLabel}>Bet Amount:</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.betAmountInput}
                  value={modalBetAmount}
                  onChangeText={(text) => {
                    if (text === '') {
                      setModalBetAmount('');
                      return;
                    }
                    
                    const numericValue = text.replace(/[^0-9.]/g, '');
                    const parts = numericValue.split('.');
                    
                    if (parts.length <= 2) {
                      if (parts.length === 2) {
                        parts[1] = parts[1].substring(0, 2);
                      }
                      const finalValue = parts.join('.');
                      setModalBetAmount(finalValue);
                    }
                  }}
                  placeholder="0.00"
                  placeholderTextColor={theme.placeholder}
                  keyboardType="numeric"
                  autoFocus={true}
                />
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={cancelBet}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalConfirmButton}
                onPress={confirmBet}
              >
                <FontAwesome5 name="check" size={16} color={theme.onPrimary} />
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Event Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <FontAwesome5 name="trash" size={24} color={theme.destructiveLabel} />
              <Text style={styles.modalTitle}>Delete Event</Text>
            </View>
            <Text style={styles.modalText}>
              This permanently deletes the event. Everyone who bet gets back exactly
              what they staked, and this can't be undone.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalConfirmButton, styles.modalDeleteButton]}
                onPress={confirmDeleteEvent}
                disabled={isDeleting}
              >
                <FontAwesome5 name="trash" size={16} color={theme.destructiveText} />
                <Text style={[styles.modalConfirmText, styles.modalDeleteText]}>
                  {isDeleting ? 'Deleting...' : 'Delete & refund'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Lock Event Confirmation Modal */}
      <Modal
        visible={showLockModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLockModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <FontAwesome5 name="lock" size={24} color={theme.warning} />
              <Text style={styles.modalTitle}>Lock Event</Text>
            </View>
            <Text style={styles.modalText}>
              Are you sure you want to lock this event? This action cannot be undone and will prevent any new bets from being placed.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowLockModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalConfirmButton}
                onPress={confirmLockEvent}
              >
                <FontAwesome5 name="lock" size={16} color={theme.onPrimary} />
                <Text style={styles.modalConfirmText}>Lock Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* End Event Modal */}
      <Modal
        visible={showEndEventModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEndEventModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.endEventModalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <FontAwesome5 name="flag-checkered" size={24} color={theme.ended} />
                <Text style={styles.modalTitle}>End Event</Text>
              </View>
              <Text style={styles.modalText}>
                Select the winning option for each question:
              </Text>
              
              {eventInfo?.questions && Object.entries(eventInfo.questions).map(([question, options], index) => (
                <View key={question} style={styles.questionSelection}>
                  <Text style={styles.questionSelectionTitle}>
                    Q{index + 1}: {question}
                  </Text>
                  
                  {options.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.optionSelectionButton,
                        winningOptions[question] === option && styles.selectedOptionButton
                      ]}
                      onPress={() => setWinningOptions(prev => ({
                        ...prev,
                        [question]: option
                      }))}
                    >
                      <Text style={[
                        styles.optionSelectionText,
                        winningOptions[question] === option && styles.selectedOptionText
                      ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.modalCancelButton}
                  onPress={() => setShowEndEventModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.modalConfirmButton}
                  onPress={confirmEndEvent}
                >
                  <FontAwesome5 name="flag-checkered" size={16} color={theme.onPrimary} />
                  <Text style={styles.modalConfirmText}>End Event</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Post Template Modal */}
      <Modal
        visible={postTemplateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPostTemplateModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPostTemplateModal(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={styles.modalInner}
            >
              <View style={styles.modalHeader}>
                <FontAwesome5 name="upload" size={24} color={theme.primary} />
                <Text style={styles.modalTitle}>Post Template</Text>
              </View>
              <Text style={styles.modalText}>
                You can now post this template for others to use.
              </Text>
              <Text style={styles.modalText}>
                Are you sure you want to post this template?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.modalCancelButton}
                  onPress={() => setPostTemplateModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.modalConfirmButton}
                  onPress={async () => {
                    const result = await postTemplate(eventInfo?.template_id as string);
                    if (result.error) {
                      Alert.alert('Error', result.msg);
                    } else {
                      Alert.alert('Success', 'Template has been posted to your studio');
                      setEventInfo(prev => prev ? { ...prev, template_posted: true } : prev);
                      setPostTemplateModal(false);
                    }
                  }}
                >
                  <FontAwesome5 name="upload" size={16} color={theme.onPrimary} />
                  <Text style={styles.modalConfirmText}>Post Template</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  deleteEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: theme.destructive,
  },
  modalDeleteButton: {
    backgroundColor: theme.destructive,
  },
  modalDeleteText: {
    color: theme.destructiveText,
  },
  loadErrorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    color: theme.text,
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  loadErrorTitle: {
    color: theme.text,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  loadErrorText: {
    color: theme.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
  },
  loadErrorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    backgroundColor: theme.primary,
  },
  loadErrorButtonText: {
    color: theme.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Enhanced Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    boxShadow: "0 1px 6px rgba(0, 0, 0, 0.1)",
  },
  
  backButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.primarySurface,
  },
  
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: theme.primarySurface,
    borderWidth: 1,
    borderColor: theme.primaryBorder,
  },

  shareButtonText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: theme.locked,
  },

  endButton: {
    backgroundColor: theme.ended,
  },

  postTemplateButton: {
    backgroundColor: theme.primary,
  },

  // Lock (orange) and Post (teal) are light fills and take dark text; End is
  // red and keeps white.
  actionButtonTextDark: {
    color: theme.onPrimary,
  },
  actionButtonText: {
    color: theme.onAccent,
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Enhanced Event Header
  eventHeader: {
    backgroundColor: theme.background,
  },
  
  eventImageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16/9, // 16:9 aspect ratio
    backgroundColor: theme.card,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
  },
  
  eventImage: {
    width: '100%',
    height: '100%',
  },
  
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.card,
  },
  
  placeholderText: {
    color: theme.placeholder,
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
  },
  
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  
  statusOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 8,
  },
  
  expiryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: theme.scrim,
  },
  
  expiryText: {
    color: theme.onAccent,
    fontSize: 12,
    fontWeight: '600',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: theme.lockedBadge,
  },

  decidedBadge: {
    backgroundColor: theme.endedBadge,
  },

  statusBadgeText: {
    color: theme.onAccent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  eventInfo: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 5,
  },
  
  eventTitle: {
    color: theme.text,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  
  eventDescription: {
    color: theme.textSecondary,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
    fontWeight: '400',
  },

  creatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: theme.primarySurface,
    borderWidth: 1,
    borderColor: theme.primaryBorder,
  },

  creatorText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Enhanced Questions Section
  questionsContainer: {
    padding: 16,
    gap: 24,
  },
  
  questionContainer: {
    backgroundColor: theme.card,
    borderRadius: 24,
    overflow: 'hidden',
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
    borderWidth: 1,
    borderColor: theme.border,
  },
  
  questionHeader: {
    padding: 20,
    backgroundColor: theme.background,
    borderBottomWidth: 2,
    borderBottomColor: theme.primaryBorder,
  },
  
  questionTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  
  questionNumber: {
    backgroundColor: theme.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    minWidth: 48,
    alignItems: 'center',
    boxShadow: `0 2px 8px ${withAlpha(theme.primary, 0.3)}`,
  },
  
  questionNumberText: {
    color: theme.onPrimary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  
  questionTitle: {
    flex: 1,
    color: theme.text,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  
  totalPotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: withAlpha(theme.coinFace, 0.35),
  },
  
  potInfo: {
    flex: 1,
  },
  
  totalPotLabel: {
    color: theme.cardTextSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  
  totalPotAmount: {
  
    fontVariant: ['tabular-nums'],
    color: theme.coinFace,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  
  // Enhanced Option Cards
  optionsScrollView: {
    paddingLeft: 20,
    paddingVertical: 20,
  },
  
  optionsScrollContent: {
    paddingRight: 20,
    gap: 16,
  },
  
  optionCard: {
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: theme.border,
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
  },
  
  // Keeps the card's purple: the pale mint it used to switch to left the
  // teal title and percentage, written for purple, near-unreadable.
  userBetCard: {
    borderColor: theme.success,
    boxShadow: `0 0 6px ${withAlpha(theme.success, 0.2)}`,
  },

  // Gold border for the decided winner, distinct from the green "you bet
  // here" ring above so both can't be confused on a card the viewer backed.
  winnerCard: {
    borderColor: theme.warning,
    boxShadow: `0 0 8px ${withAlpha(theme.warning, 0.3)}`,
  },

  // Once a question is decided, fade the losing options so the winner reads
  // first in the horizontal scroll.
  nonWinnerCard: {
    opacity: 0.6,
  },

  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: theme.warning,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 12,
  },

  winnerBadgeText: {
    color: theme.onPrimary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  
  optionTitle: {
    flex: 1,
    color: theme.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    marginRight: 12,
  },
  
  userBetBadge: {
    backgroundColor: theme.success,
    padding: 8,
    borderRadius: 12,
    boxShadow: `0 2px 8px ${withAlpha(theme.success, 0.3)}`,
  },
  
  betStats: {
    marginBottom: 16,
  },
  
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  statPercentage: {
    color: theme.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  
  optionBetAmount: {
    color: theme.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // The track was theme.border, the same teal as the fill, so every bar read
  // as full.
  progressBarContainer: {
    height: 8,
    backgroundColor: theme.insetFill,
    borderRadius: 4,
    overflow: 'hidden',
  },
  
  progressBar: {
    height: '100%',
    backgroundColor: theme.primary,
    borderRadius: 4,
    minWidth: 4,
  },
  
  // Enhanced Buttons
  betButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.primary,
    paddingVertical: 16,
    borderRadius: 16,
    boxShadow: `0 4px 16px ${withAlpha(theme.primary, 0.3)}`,
  },
  
  betButtonText: {
    color: theme.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  
  lockedBetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.neutralSurface,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.neutralBorder,
  },

  decidedBetInfo: {
    backgroundColor: theme.warningSurface,
    borderColor: theme.warning,
  },

  lockedBetText: {

    fontVariant: ['tabular-nums'],
    color: theme.neutral,
    fontSize: 15,
    fontWeight: '600',
  },
  
  centeredRow: {
    justifyContent: 'center',
  },
  userBetInfo: {
    gap: 12,
  },
  
  userBetAmount: {
  
    fontVariant: ['tabular-nums'],
    color: theme.successLabel,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },

  increaseBetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.successText,
    paddingVertical: 14,
    borderRadius: 14,
    boxShadow: `0 3px 12px ${withAlpha(theme.successText, 0.3)}`,
  },
  
  increaseBetButtonText: {
    color: theme.onAccent,
    fontSize: 15,
    fontWeight: '600',
  },

  mainScrollView: {
    flex: 1,
  },

  // Enhanced Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalContent: {
    backgroundColor: theme.background,
    borderRadius: 24,
    padding: 24,
    margin: 20,
    // Percentages of the full-screen overlay, i.e. of the window.
    maxWidth: '90%',
    minWidth: '80%',
    boxShadow: "0 12px 48px rgba(0, 0, 0, 0.3)",
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  
  modalTitle: {
    color: theme.text,
    fontSize: 22,
    fontWeight: '800',
  },
  
  modalText: {
    color: theme.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  
  modalOption: {
    backgroundColor: theme.primarySurface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.primaryBorder,
  },

  modalOptionText: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    padding: 12,
    backgroundColor: theme.primarySurface,
    borderRadius: 12,
  },

  balanceText: {

    fontVariant: ['tabular-nums'],
    color: theme.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  
  betAmountContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  
  betAmountLabel: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: theme.primary,
    minWidth: 150,
  },

  currencySymbol: {
    color: theme.primary,
    fontSize: 20,
    fontWeight: '700',
    marginRight: 8,
  },
  
  betAmountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    textAlign: 'center',
    padding: 0,
  },
  
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  
  modalCancelButton: {
    flex: 1,
    backgroundColor: theme.border,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  
  modalCancelText: {
    color: theme.background,
    fontSize: 16,
    fontWeight: '600',
  },
  
  modalConfirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.primary,
    paddingVertical: 16,
    borderRadius: 16,
    boxShadow: `0 4px 16px ${withAlpha(theme.primary, 0.3)}`,
  },
  
  modalConfirmText: {
    color: theme.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },

  // End Event Modal
  // No horizontal padding: modalContent already has a 20pt margin, and adding
  // 20 more here needed 80% of the screen + 80pt, wider than phones < 400pt.
  endEventModalContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },

  questionSelection: {
    marginBottom: 24,
    width: '100%',
  },

  questionSelectionTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },

  optionSelectionButton: {
    backgroundColor: theme.card,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: theme.border,
  },

  selectedOptionButton: {
    backgroundColor: theme.primarySurface,
    borderColor: theme.primary,
  },

  optionSelectionText: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },

  selectedOptionText: {
    color: theme.primary,
    fontWeight: '700',
  },

  modalInner: {
    // This prevents the tap from propagating to the overlay
  },

  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },

  // Opens the sheet listing everyone with a stake on this event.
  bettorsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: theme.primarySurface,
    borderWidth: 1,
    borderColor: theme.primaryBorder,
  },
  bettorsButtonText: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '700',
  },
  bettorsButtonAction: {
    flex: 1,
    textAlign: 'right',
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },

  creatorLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    flexWrap: 'wrap',
  },

  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: theme.primarySurface,
    borderWidth: 1,
    borderColor: theme.primaryBorder,
  },

  creatorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  creatorActionButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: theme.subtleFill,
  },

});