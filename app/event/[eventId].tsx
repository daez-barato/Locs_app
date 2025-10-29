import { Text, StyleSheet, View, ScrollView, TouchableOpacity, Dimensions, TextInput, RefreshControl, Modal, Alert, Share, Image } from 'react-native';
import { useLocalSearchParams, router} from 'expo-router';
import { Theme, useThemeConfig } from '@/components/ui/use-theme-config';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { endEvent, eventInformation, fetchEventBets, lockEvent, placeBet, postTemplate, saveTemplate } from '@/api/eventFunctions';
import { useAuth } from '@/api/context/AuthContext';
import * as Linking from 'expo-linking';
import { FontAwesome5 } from '@expo/vector-icons';
import { useCoins } from '@/api/context/coinContext';
import { LinearGradient } from 'expo-linear-gradient';
import { followRequest } from '@/api/followers/followers';

const { width } = Dimensions.get('window');

type EventInfoType = {
  questions: Record<string, string[]>;
  expire_date: string;
  locked: boolean;
  decided: boolean;
  public: boolean;
  event_creator_id: string;
  event_creator: string;
  template_id: string;
  title: string;
  description: string;
  template_creator_id: string;
  template_posted?: boolean | undefined;
  image_url?: string | undefined; 
  template_saved: boolean;
  is_following: boolean;
  has_requested: boolean;
};

type BetInfo = {
  totalPot: number;
  userBet?: {
    options: Record<string, number>;
  };
  optionPots: Record<string, number>;
};

export default function eventScreen() {
  const { eventId } = useLocalSearchParams() as { eventId: string };
  const { coins, fetchCoins } = useCoins();
  const [refresh, setRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useThemeConfig();
  const [eventInfo, setEventInfo] = useState<EventInfoType | null>(null);
  const [betInfos, setBetInfos] = useState<Record<string, BetInfo>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showEndEventModal, setShowEndEventModal] = useState(false);
  const [pendingBet, setPendingBet] = useState<{question: string, option: string, isIncrease: boolean} | null>(null);
  const [modalBetAmount, setModalBetAmount] = useState<string>('10');
  const [winningOptions, setWinningOptions] = useState<Record<string, string>>({});
  const [postTemplateModal, setPostTemplateModal] = useState(false);
  const { authState } = useAuth();
  const userName = authState?.userName;
  const url = Linking.createURL(`event/${eventId}`);

  // Check if current user is the event creator
  const isEventCreator = eventInfo?.event_creator === userName;

  const onRefresh = async () => {
    setRefreshing(true);
    setRefresh(prev => !prev);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const event = await eventInformation(eventId);
        setEventInfo(event);

        if (isEventCreator && event.decided && !event.template_posted) {
            setPostTemplateModal(true);
        };

        const bets = await fetchEventBets(eventId);

        if (bets.error) {
          console.error('Failed to fetch bets:', bets.msg);
          return;
        }

        fetchCoins();

        const bet_infos: Record<string, BetInfo> = {};
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
          const amount = parseInt(bet.amount);

          if (bet_infos[question]) {
            bet_infos[question].totalPot += amount;
            bet_infos[question].optionPots[option] += amount;

            if (bet.username === userName) {
              bet_infos[question].userBet = {
                options: {
                  ...bet_infos[question].userBet?.options,
                  [option]: bet?.payout != null ? parseInt(bet.payout) : amount
                }
              };
            }
          }
        }

        setBetInfos(bet_infos);

      } catch (err) {
        console.error('Failed to fetch data', err);
      }
    }
    fetchData();
  
  }, [refresh]);

  const handleShareEvent = async () => {
    try {
      const result = await Share.share({
        message: `${url}`,
        url: url,
        title: eventInfo?.title || 'Prediction Event',
      });
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share event');
    }
  };

  const handleLockEvent = () => {
    setShowLockModal(true);
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
      setShowEndEventModal(false);
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
        Alert.alert('Invalid Amount', 'Please enter a valid bet amount');
        return;
      }

      if (pendingBet.isIncrease && betInfos[pendingBet.question]?.userBet?.options[pendingBet.option] !== undefined) {
        const currentBetAmount = betInfos[pendingBet.question].userBet?.options[pendingBet.option] || 0;
        if (betAmount <= currentBetAmount) {
          Alert.alert('Invalid Amount', 'Increase amount must be greater than current bet');
          return;
        }
      }

      const bet = await placeBet(eventId , pendingBet.question, pendingBet.option, betAmount);

      if (bet.error){
        Alert.alert('Error', bet.msg);
        return;
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

  const OptionCard = ({ option, question, betInfo }: { 
    option: string, 
    question: string, 
    betInfo: BetInfo 
  }) => {
    const optionBetAmount = betInfo.optionPots[option];
    const betPercentage = betInfo.totalPot > 0 ? ((optionBetAmount / betInfo.totalPot) * 100) : 0;
    const hasUserBet = betInfo.userBet?.options[option] !== undefined;
    const isLocked = eventInfo?.locked || eventInfo?.decided;

    return (
      <View style={[
        styles(theme).optionCard,
        hasUserBet && styles(theme).userBetCard
      ]}>
        <View style={styles(theme).optionHeader}>
          <Text style={styles(theme).optionTitle} numberOfLines={3}>
            {option}
          </Text>
          {hasUserBet && (
            <View style={styles(theme).userBetBadge}>
              <FontAwesome5 name="star" size={12} color="#ffffff" />
            </View>
          )}
        </View>

        <View style={styles(theme).betStats}>
          <View style={styles(theme).statRow}>
            <Text style={styles(theme).statPercentage}>{betPercentage.toFixed(1)}%</Text>
            <Text style={styles(theme).optionBetAmount}>
              ${optionBetAmount.toLocaleString()}
            </Text>
          </View>
          <View style={styles(theme).progressBarContainer}>
            <View 
              style={[
                styles(theme).progressBar, 
                { width: `${betPercentage}%` }
              ]} 
            />
          </View>
        </View>

        {isLocked ? (
          <View style={[
            styles(theme).lockedBetInfo,
            eventInfo?.decided && styles(theme).decidedBetInfo
          ]}>
            <FontAwesome5
              name={eventInfo?.decided ? "trophy" : "lock"} 
              size={16} 
              color={eventInfo?.decided ? "#F59E0B" : "#6B7280"} 
            />
            <Text style={styles(theme).lockedBetText}>
              {eventInfo?.decided ? `Payout: $${betInfo.userBet?.options[option] ?? 0}` : `Locked: $${betInfo.userBet?.options[option] ?? 0}`}
            </Text>
          </View>
        ) : hasUserBet ? (
          <View style={styles(theme).userBetInfo}>
            <Text style={styles(theme).userBetAmount}>
              Your Bet: ${betInfo.userBet!.options[option]}
            </Text>
            <TouchableOpacity
              style={styles(theme).increaseBetButton}
              onPress={() => showBetConfirmation(question, option, true)}
            >
              <FontAwesome5 name="plus" size={14} color="#ffffff" />
              <Text style={styles(theme).increaseBetButtonText}>Increase</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles(theme).betButton}
            onPress={() => showBetConfirmation(question, option, false)}
          >
            <FontAwesome5 name="chart-line" size={16} color="#ffffff" />
            <Text style={styles(theme).betButtonText}>Place Bet</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles(theme).container}>
      {/* Enhanced Header */}
      <View style={styles(theme).header}>
        <TouchableOpacity 
          style={styles(theme).backButton}
          onPress={() => router.back()}
        >
          <FontAwesome5 name="arrow-left" size={18} color={theme.primary} />
        </TouchableOpacity>
        
        <View style={styles(theme).headerActions}>
          
          {(isEventCreator || eventInfo?.public) && (
            <TouchableOpacity 
              style={styles(theme).shareButton}
              onPress={handleShareEvent}
            >
              <FontAwesome5 name="share" size={16} color={theme.primary} />
              <Text style={styles(theme).shareButtonText}>Share</Text>
            </TouchableOpacity>
          )}
          
          {isEventCreator && (
            <>
              {(!eventInfo?.template_posted || !eventInfo.decided) && (
                <TouchableOpacity 
                  style={[
                    styles(theme).actionButton,
                    eventInfo?.locked && !eventInfo?.decided && styles(theme).endButton,
                    eventInfo?.decided && styles(theme).postTemplateButton
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
                    color="#ffffff" 
                  />
                  <Text style={styles(theme).actionButtonText}>
                    {eventInfo?.locked ? (eventInfo?.decided ? 'Post' : 'End') : 'Lock'}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles(theme).mainScrollView} 
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
        <View style={styles(theme).eventHeader}>
          {/* 16:9 Event Image */}
          <View style={styles(theme).eventImageContainer}>
            {eventInfo?.image_url ? (
              <Image 
                source={{ uri: eventInfo.image_url }}
                style={styles(theme).eventImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles(theme).placeholderImage}>
                <FontAwesome5 name="image" size={40} color={theme.primary + '40'} />
                <Text style={styles(theme).placeholderText}>No Image</Text>
              </View>
            )}
            
            {/* Gradient Overlay for better text readability */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles(theme).imageOverlay}
            />
            
            {/* Status badges overlay */}
            <View style={styles(theme).statusOverlay}>
              {eventInfo?.expire_date && (
                <View style={styles(theme).expiryBadge}>
                  <FontAwesome5 name="clock" size={12} color="#ffffff" />
                  <Text style={styles(theme).expiryText}>
                    {new Date(eventInfo.expire_date).toLocaleDateString()}
                  </Text>
                </View>
              )}
              
              {(eventInfo?.locked || eventInfo?.decided) && (
                <View style={[
                  styles(theme).statusBadge,
                  eventInfo?.decided && styles(theme).decidedBadge
                ]}>
                  <FontAwesome5 
                    name={eventInfo?.decided ? "flag-checkered" : "lock"} 
                    size={12} 
                    color="#ffffff" 
                  />
                  <Text style={styles(theme).statusBadgeText}>
                    {eventInfo?.decided ? 'ENDED' : 'LOCKED'}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Event Info */}
          <View style={styles(theme).eventInfo}>
            <Text style={styles(theme).eventTitle} numberOfLines={3}>
              {eventInfo?.title}
            </Text>
            {eventInfo?.description && (
              <Text style={styles(theme).eventDescription} numberOfLines={4}>
                {eventInfo.description}
              </Text>
            )}
            
            {/* Creator badge */}
            <View style={styles(theme).creatorRow}>
              <TouchableOpacity
                style={styles(theme).creatorBadge}
                onPress={() => router.push(`/(tabs)/user/${eventInfo?.event_creator_id}`)}
              >
                <FontAwesome5 name="user" size={12} color={theme.primary} />
                <Text style={styles(theme).creatorText}>by {eventInfo?.event_creator}</Text>
              </TouchableOpacity>

              <View style={styles(theme).creatorActions}>
                {/* Follow button */}
                {(!eventInfo?.is_following && !eventInfo?.has_requested) && 
                  <TouchableOpacity
                    style={styles(theme).creatorActionButton}
                    onPress={async () => {
                      await followRequest(eventInfo?.event_creator_id as string);
                    }}
                  >
                    <FontAwesome5 name="user-plus" size={14} color={theme.primary} />
                  </TouchableOpacity>
                }

                {/* Save Template button */}
                {eventInfo?.template_posted && !eventInfo.template_saved && (
                  <TouchableOpacity
                    style={styles(theme).creatorActionButton}
                    onPress={async () => {
                      try {
                        const save = await saveTemplate(eventInfo?.template_id as string);
                        if (save.error) throw Error(save.msg);
                        Alert.alert('Template Saved', `Template "${eventInfo?.title}" has been saved to your collection`);
                      } catch (err: any) {
                        Alert.alert('Error', err.msg || 'Template not saved');
                      }
                    }}
                  >
                    <FontAwesome5 name="bookmark" size={14} color="#10B981" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Enhanced Questions Section */}
        <View style={styles(theme).questionsContainer}>
          {eventInfo?.questions && Object.entries(eventInfo.questions).map(([question, options], questionIndex) => {
            const betInfo = betInfos[question];
            if (!betInfo) return null;

            return (
              <View key={questionIndex} style={styles(theme).questionContainer}>
                <View style={styles(theme).questionHeader}>
                  <View style={styles(theme).questionTitleRow}>
                    <View style={styles(theme).questionNumber}>
                      <Text style={styles(theme).questionNumberText}>Q{questionIndex + 1}</Text>
                    </View>
                    <Text style={styles(theme).questionTitle}>{question}</Text>
                  </View>
                  
                  <View style={styles(theme).totalPotContainer}>
                    <FontAwesome5 name="trophy" size={16} color="#F59E0B" />
                    <View style={styles(theme).potInfo}>
                      <Text style={styles(theme).totalPotLabel}>Total Pool</Text>
                      <Text style={styles(theme).totalPotAmount}>
                        ${betInfo.totalPot.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>

                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles(theme).optionsScrollView}
                  contentContainerStyle={styles(theme).optionsScrollContent}
                >
                  {options.map((option, optionIndex) => (
                    <OptionCard
                      key={optionIndex}
                      option={option}
                      question={question}
                      betInfo={betInfo}
                    />
                  ))}
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
        <View style={styles(theme).modalOverlay}>
          <View style={styles(theme).modalContent}>
            <View style={styles(theme).modalHeader}>
              <FontAwesome5 
                name={pendingBet?.isIncrease ? "arrow-up" : "chart-line"} 
                size={24} 
                color={theme.primary} 
              />
              <Text style={styles(theme).modalTitle}>
                {pendingBet?.isIncrease ? 'Increase Bet' : 'Place Bet'}
              </Text>
            </View>
            
            <View style={styles(theme).modalOption}>
              <Text style={styles(theme).modalOptionText}>"{pendingBet?.option}"</Text>
            </View>
            
            <View style={styles(theme).balanceContainer}>
              <FontAwesome5 name="wallet" size={16} color={theme.primary} />
              <Text style={styles(theme).balanceText}>Balance: ${coins}</Text>
            </View>
            
            <View style={styles(theme).betAmountContainer}>
              <Text style={styles(theme).betAmountLabel}>Bet Amount:</Text>
              <View style={styles(theme).inputContainer}>
                <Text style={styles(theme).currencySymbol}>$</Text>
                <TextInput
                  style={styles(theme).betAmountInput}
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
                  placeholderTextColor={theme.text + '60'}
                  keyboardType="numeric"
                  autoFocus={true}
                />
              </View>
            </View>
            
            <View style={styles(theme).modalButtons}>
              <TouchableOpacity 
                style={styles(theme).modalCancelButton}
                onPress={cancelBet}
              >
                <Text style={styles(theme).modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles(theme).modalConfirmButton}
                onPress={confirmBet}
              >
                <FontAwesome5 name="check" size={16} color="#ffffff" />
                <Text style={styles(theme).modalConfirmText}>Confirm</Text>
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
        <View style={styles(theme).modalOverlay}>
          <View style={styles(theme).modalContent}>
            <View style={styles(theme).modalHeader}>
              <FontAwesome5 name="lock" size={24} color="#F59E0B" />
              <Text style={styles(theme).modalTitle}>Lock Event</Text>
            </View>
            <Text style={styles(theme).modalText}>
              Are you sure you want to lock this event? This action cannot be undone and will prevent any new bets from being placed.
            </Text>
            
            <View style={styles(theme).modalButtons}>
              <TouchableOpacity 
                style={styles(theme).modalCancelButton}
                onPress={() => setShowLockModal(false)}
              >
                <Text style={styles(theme).modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles(theme).modalConfirmButton}
                onPress={confirmLockEvent}
              >
                <FontAwesome5 name="lock" size={16} color="#ffffff" />
                <Text style={styles(theme).modalConfirmText}>Lock Event</Text>
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
        <View style={styles(theme).modalOverlay}>
          <ScrollView contentContainerStyle={styles(theme).endEventModalContainer}>
            <View style={styles(theme).modalContent}>
              <View style={styles(theme).modalHeader}>
                <FontAwesome5 name="flag-checkered" size={24} color="#DC2626" />
                <Text style={styles(theme).modalTitle}>End Event</Text>
              </View>
              <Text style={styles(theme).modalText}>
                Select the winning option for each question:
              </Text>
              
              {eventInfo?.questions && Object.entries(eventInfo.questions).map(([question, options], index) => (
                <View key={index} style={styles(theme).questionSelection}>
                  <Text style={styles(theme).questionSelectionTitle}>
                    Q{index + 1}: {question}
                  </Text>
                  
                  {options.map((option, optionIndex) => (
                    <TouchableOpacity
                      key={optionIndex}
                      style={[
                        styles(theme).optionSelectionButton,
                        winningOptions[question] === option && styles(theme).selectedOptionButton
                      ]}
                      onPress={() => setWinningOptions(prev => ({
                        ...prev,
                        [question]: option
                      }))}
                    >
                      <Text style={[
                        styles(theme).optionSelectionText,
                        winningOptions[question] === option && styles(theme).selectedOptionText
                      ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
              
              <View style={styles(theme).modalButtons}>
                <TouchableOpacity 
                  style={styles(theme).modalCancelButton}
                  onPress={() => setShowEndEventModal(false)}
                >
                  <Text style={styles(theme).modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles(theme).modalConfirmButton}
                  onPress={confirmEndEvent}
                >
                  <FontAwesome5 name="flag-checkered" size={16} color="#ffffff" />
                  <Text style={styles(theme).modalConfirmText}>End Event</Text>
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
          style={styles(theme).modalOverlay}
          activeOpacity={1}
          onPress={() => setPostTemplateModal(false)}
        >
          <View style={styles(theme).modalContent}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={styles(theme).modalInner}
            >
              <View style={styles(theme).modalHeader}>
                <FontAwesome5 name="upload" size={24} color={theme.primary} />
                <Text style={styles(theme).modalTitle}>Post Template</Text>
              </View>
              <Text style={styles(theme).modalText}>
                You can now post this template for others to use.
              </Text>
              <Text style={styles(theme).modalText}>
                Are you sure you want to post this template?
              </Text>
              <View style={styles(theme).modalButtons}>
                <TouchableOpacity 
                  style={styles(theme).modalCancelButton}
                  onPress={() => setPostTemplateModal(false)}
                >
                  <Text style={styles(theme).modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles(theme).modalConfirmButton}
                  onPress={async () => {
                    const result = await postTemplate(eventInfo?.template_id as string);
                    if (result.error) {
                      Alert.alert('Error', result.msg);
                    } else {
                      Alert.alert('Success', 'Template has been posted to your studio');
                      eventInfo!.template_posted = true;
                      setEventInfo(eventInfo);
                      setPostTemplateModal(false);
                    }
                  }}
                >
                  <FontAwesome5 name="upload" size={16} color="#ffffff" />
                  <Text style={styles(theme).modalConfirmText}>Post Template</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
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
    borderBottomColor: theme.border || '#E5E5E5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  
  backButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.primary + '10',
  },
  
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  infoButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.primary + '10',
  },

  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: theme.primary + '15',
    borderWidth: 1,
    borderColor: theme.primary + '30',
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
    backgroundColor: '#FF6B35',
  },

  endButton: {
    backgroundColor: '#DC2626',
  },

  postTemplateButton: {
    backgroundColor: theme.primary,
  },

  actionButtonText: {
    color: '#ffffff',
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
    backgroundColor: theme.card || '#F8F9FA',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  
  eventImage: {
    width: '100%',
    height: '100%',
  },
  
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.card || '#F8F9FA',
  },
  
  placeholderText: {
    color: theme.text + '60',
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(10px)',
  },
  
  expiryText: {
    color: '#ffffff',
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
    backgroundColor: 'rgba(255, 107, 53, 0.9)',
  },

  decidedBadge: {
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
  },

  statusBadgeText: {
    color: '#ffffff',
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
    color: theme.text + '80',
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
    backgroundColor: theme.primary + '15',
    borderWidth: 1,
    borderColor: theme.primary + '30',
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
    backgroundColor: theme.card || '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: theme.border || '#E5E5E5',
  },
  
  questionHeader: {
    padding: 20,
    backgroundColor: theme.background,
    borderBottomWidth: 2,
    borderBottomColor: theme.primary + '20',
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
    elevation: 2,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  
  questionNumberText: {
    color: '#ffffff',
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
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B' + '30',
  },
  
  potInfo: {
    flex: 1,
  },
  
  totalPotLabel: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  
  totalPotAmount: {
    color: '#92400E',
    fontSize: 22,
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
    width: width * 0.75,
    backgroundColor: theme.card || '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: theme.border || '#E5E5E5',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  
  userBetCard: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
    elevation: 8,
    shadowColor: '#10B981',
    shadowOpacity: 0.2,
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
    backgroundColor: '#10B981',
    padding: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
    color: theme.text + '80',
    fontSize: 16,
    fontWeight: '600',
  },
  
  progressBarContainer: {
    height: 8,
    backgroundColor: theme.border || '#E5E5E5',
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
    elevation: 4,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  
  betButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  
  lockedBetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },

  decidedBetInfo: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },

  lockedBetText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
  },
  
  userBetInfo: {
    gap: 12,
  },
  
  userBetAmount: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },

  increaseBetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  
  increaseBetButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },

  mainScrollView: {
    flex: 1,
  },

  // Enhanced Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalContent: {
    backgroundColor: theme.background,
    borderRadius: 24,
    padding: 24,
    margin: 20,
    maxWidth: width * 0.9,
    minWidth: width * 0.8,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
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
    color: theme.text + '90',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  
  modalOption: {
    backgroundColor: theme.primary + '15',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.primary + '30',
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
    backgroundColor: theme.primary + '10',
    borderRadius: 12,
  },

  balanceText: {
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
    backgroundColor: theme.card || '#F8F9FA',
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
    backgroundColor: theme.border || '#E5E5E5',
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
    elevation: 4,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  
  modalConfirmText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },

  // End Event Modal
  endEventModalContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    backgroundColor: theme.card || '#F8F9FA',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: theme.border || '#E5E5E5',
  },

  selectedOptionButton: {
    backgroundColor: theme.primary + '15',
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

  // Info Modal Specific Styles
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card || '#F8F9FA',
    borderWidth: 2,
    borderColor: theme.primary + '30',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  templateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card || '#F8F9FA',
    borderWidth: 2,
    borderColor: theme.primary + '30',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  creatorMainArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  templateMainArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  userImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: theme.primary + '30',
  },

  templateImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: theme.primary + '30',
  },

  creatorTextArea: {
    flex: 1,
  },

  templateTextArea: {
    flex: 1,
  },

  sectionLabel: {
    color: theme.text + '70',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },

  creatorName: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '700',
  },

  templateName: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '700',
  },

  followButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.primary + '15',
    borderWidth: 1,
    borderColor: theme.primary,
  },

  saveButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#10B981' + '15',
    borderWidth: 1,
    borderColor: '#10B981',
  },

  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },

  creatorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  creatorActionButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },

});