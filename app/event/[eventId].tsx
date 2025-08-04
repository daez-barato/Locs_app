import { Text, StyleSheet, View, FlatList, ScrollView, TouchableOpacity, Dimensions, TextInput, RefreshControl, Modal, Alert, Share } from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { Theme, useThemeConfig } from '@/components/ui/use-theme-config';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { endEvent, eventInformation, fetchEventBets, lockEvent, placeBet } from '@/api/eventFunctions';
import { useAuth } from '@/api/context/AuthContext';
import * as Linking from 'expo-linking';

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
  const { authState } = useAuth();
  const userName = authState?.userName;
  const url = Linking.createURL(`event/${eventId}`);


  // Check if current user is the event creator
  const isEventCreator = eventInfo?.event_creator === userName;

  const onRefresh = async () => {
    setRefreshing(true);
    setRefresh(prev => !prev);
    // Add small delay to show refresh animation
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const event = await eventInformation(eventId);
        setEventInfo(event);

        const bets = await fetchEventBets(eventId);

        if (bets.error) {
          console.error('Failed to fetch bets:', bets.msg);
          return;
        }

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
      // Add your lock event API call here
      const result = await lockEvent(eventId);

      if (result.error){
        Alert.alert('Error', result.msg);
        return;
      };
      
      // For now, we'll simulate the lock
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
    
    // Initialize winning options with empty values
    const initialWinners: Record<string, string> = {};
    Object.keys(eventInfo.questions).forEach(question => {
      initialWinners[question] = '';
    });
    setWinningOptions(initialWinners);
    setShowEndEventModal(true);
  };

  const confirmEndEvent = async () => {
    // Validate that all questions have winning options selected
    const allQuestionsAnswered = Object.keys(eventInfo?.questions || {}).every(
      question => winningOptions[question] && winningOptions[question].trim() !== ''
    );

    if (!allQuestionsAnswered) {
      Alert.alert('Incomplete', 'Please select a winning option for all questions');
      return;
    }

    try {
      // Add your end event API call here
      const result = await endEvent(eventId, winningOptions);

      if (result.error){
        Alert.alert('Error', result.msg);
        return;
      };
      
      // For now, we'll simulate ending the event
      setEventInfo(prev => prev ? { ...prev, decided: true } : null);
      setShowEndEventModal(false);
      Alert.alert('Success', 'Event has been ended and winners have been selected.');
    } catch (error) {
      console.error('Error ending event:', error);
      Alert.alert('Error', 'Failed to end event');
    }
  };

  const showBetConfirmation = (question: string, option: string, isIncrease: boolean = false) => {
    setPendingBet({ question, option, isIncrease });
    
    // Set default amount based on whether it's a new bet or increase
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
          
          // Update option bets
          const newOptionBets = { ...questionBetInfo.optionPots };
          newOptionBets[pendingBet.option] = (newOptionBets[pendingBet.option] || 0) + additionalAmount;
          
          // Calculate new total pot
          const newTotalPot = Object.values(newOptionBets).reduce((sum, amount) => sum + amount, 0);
          
          // Update bet info
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
              <Text style={styles(theme).userBetBadgeText}>YOUR BET</Text>
            </View>
          )}
        </View>

        <View style={styles(theme).betStats}>
          <View style={styles(theme).statItem}>
            <Text style={styles(theme).statPercentage}>{betPercentage.toFixed(1)}%</Text>
          </View>
          <View 
            style={[
              styles(theme).progressBar, 
              { width: `${betPercentage}%` }
            ]} 
          />
        </View>

        {isLocked ? (
          <View style={styles(theme).lockedBetInfo}>
            <Text style={styles(theme).lockedBetText}>
              {eventInfo?.decided ? `Payout $${betInfo.userBet?.options[option] ?? 0}` : `Locked at $${betInfo.userBet?.options[option] ?? 0}`}
            </Text>
          </View>
        ) : hasUserBet ? (
          <View style={styles(theme).userBetInfo}>
            <View style={styles(theme).userBetDetails}>
              <Text style={styles(theme).userBetAmount}>
                {betInfo.userBet!.options[option]}$
              </Text>
            </View>
            <TouchableOpacity
              style={styles(theme).increaseBetButton}
              onPress={() => showBetConfirmation(question, option, true)}
            >
              <Text style={styles(theme).increaseBetButtonText}>
                Increase Bet
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles(theme).betButton}
            onPress={() => showBetConfirmation(question, option, false)}
          >
            <Text style={styles(theme).betButtonText}>
              Place Bet
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles(theme).container}>
      {/* Header */}
      <View style={styles(theme).header}>
        <TouchableOpacity 
          style={styles(theme).backButton}
          onPress={() => router.back()}
        >
          <Text style={styles(theme).backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        {isEventCreator && (
          <View style={styles(theme).headerButtons}>
            <TouchableOpacity 
              style={styles(theme).shareButton}
              onPress={handleShareEvent}
            >
              <Text style={styles(theme).shareButtonText}>Share</Text>
            </TouchableOpacity>
            
            {!eventInfo?.decided && (
              <TouchableOpacity 
                style={[
                  styles(theme).lockButton,
                  eventInfo?.locked && styles(theme).endButton
                ]}
                onPress={eventInfo?.locked ? handleEndEvent : handleLockEvent}
              >
                <Text style={styles(theme).lockButtonText}>
                  {eventInfo?.locked ? 'End Event' : 'Lock Event'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
        {/* Event Header Section */}
        <View style={styles(theme).headerContainer}>
          {/* Event Image */}
          <View style={styles(theme).eventImageContainer}>
            <Text style={styles(theme).imagePlaceholder}>Event Image</Text>
          </View>
          
          <Text style={styles(theme).eventTitle}>
            {eventInfo?.title}
          </Text>
          <Text style={styles(theme).eventDescription}>
            {eventInfo?.description}
          </Text>
          
          <View style={styles(theme).statusContainer}>
            {eventInfo?.expire_date && (
              <View style={styles(theme).expiryBadge}>
                <Text style={styles(theme).expiryText}>
                  Expires: {new Date(eventInfo.expire_date).toLocaleDateString()}
                </Text>
              </View>
            )}
            
            {(eventInfo?.locked || eventInfo?.decided) && (
              <View style={[
                styles(theme).lockedBadge,
                eventInfo?.decided && styles(theme).decidedBadge
              ]}>
                <Text style={styles(theme).lockedBadgeText}>
                  {eventInfo?.decided ? '🏁 ENDED' : '🔒 LOCKED'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Questions Section */}
        <View style={styles(theme).questionsContainer}>
          {eventInfo?.questions && Object.entries(eventInfo.questions).map(([question, options], questionIndex) => {
            const betInfo = betInfos[question];
            if (!betInfo) return null;

            return (
              <View key={questionIndex} style={styles(theme).questionContainer}>
                <View style={styles(theme).questionHeader}>
                  <View style={styles(theme).questionTitleContainer}>
                    <Text style={styles(theme).questionNumber}>Q{questionIndex + 1}</Text>
                    <Text style={styles(theme).questionTitle}>{question}</Text>
                  </View>
                  <View style={styles(theme).totalPotContainer}>
                    <Text style={styles(theme).totalPotLabel}>Total Pool</Text>
                    <Text style={styles(theme).totalPotAmount}>
                      {betInfo.totalPot.toLocaleString()} $
                    </Text>
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

      {/* Bet Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelBet}
      >
        <View style={styles(theme).modalOverlay}>
          <View style={styles(theme).modalContent}>
            <Text style={styles(theme).modalTitle}>
              {pendingBet?.isIncrease ? 'Increase Bet' : 'Place Bet'}
            </Text>
            <Text style={styles(theme).modalOption}>"{pendingBet?.option}"</Text>
            
            {pendingBet?.isIncrease && (
              <Text style={styles(theme).currentBetText}>
                Current bet: {betInfos[pendingBet.question]?.userBet?.options[pendingBet?.option]} $
              </Text>
            )}
            
            <View style={styles(theme).betAmountContainer}>
              <Text style={styles(theme).betAmountLabel}>
                Bet amount:
              </Text>
              <TextInput
                style={styles(theme).betAmountInput}
                value={modalBetAmount}
                onChangeText={(text) => {
                  // Allow empty string for clearing
                  if (text === '') {
                    setModalBetAmount('');
                    return;
                  }
                  
                  // Only allow numbers and one decimal point
                  const numericValue = text.replace(/[^0-9.]/g, '');
                  const parts = numericValue.split('.');
                  
                  // Limit to one decimal point
                  if (parts.length <= 2) {
                    // Limit decimal places to 2
                    if (parts.length === 2) {
                      parts[1] = parts[1].substring(0, 2);
                    }
                    const finalValue = parts.join('.');
                    setModalBetAmount(finalValue);
                  }
                }}
                placeholder="Amount"
                placeholderTextColor={theme.text + '60'}
                keyboardType="numeric"
                autoFocus={true}
              />
              <Text style={styles(theme).unitText}>$</Text>
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
                <Text style={styles(theme).modalConfirmText}>
                  {pendingBet?.isIncrease ? 'Increase Bet' : 'Confirm Bet'}
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
        <View style={styles(theme).modalOverlay}>
          <View style={styles(theme).modalContent}>
            <Text style={styles(theme).modalTitle}>Lock Event</Text>
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
              <Text style={styles(theme).modalTitle}>End Event</Text>
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
                  <Text style={styles(theme).modalConfirmText}>End Event</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.border || '#E5E5E5',
  },
  
  backButton: {
    padding: 8,
  },
  
  backButtonText: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: '600',
  },

  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },

  shareButton: {
    backgroundColor: theme.primary + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.primary,
  },

  shareButtonText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  lockButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },

  endButton: {
    backgroundColor: '#DC2626',
  },

  lockButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  
  eventImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.button_darker_primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  
  imagePlaceholder: {
    color: theme.text,
    fontSize: 14,
    opacity: 0.6,
  },
  
  headerContainer: {
    paddingVertical: 24,
    backgroundColor: theme.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.border || '#E5E5E5',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  eventTitle: {
    color: theme.text,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  
  eventDescription: {
    color: theme.text,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.8,
    marginBottom: 16,
  },

  statusContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  
  expiryBadge: {
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  
  expiryText: {
    color: theme.background,
    fontSize: 14,
    fontWeight: '600',
  },

  lockedBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },

  decidedBadge: {
    backgroundColor: '#DC2626',
  },

  lockedBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  
  questionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  
  questionContainer: {
    backgroundColor: theme.card || '#FFFFFF',
    marginBottom: 32,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.border || '#E5E5E5',
    overflow: 'hidden',
  },
  
  questionHeader: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: theme.background,
    borderBottomWidth: 2,
    borderBottomColor: theme.primary + '20',
  },
  
  questionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  
  questionNumber: {
    backgroundColor: theme.primary,
    color: theme.background,
    fontSize: 14,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
    textAlign: 'center',
    minWidth: 36,
    overflow: 'hidden',
  },
  
  questionTitle: {
    color: theme.text,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    flex: 1,
    letterSpacing: -0.3,
  },
  
  totalPotContainer: {
    backgroundColor: theme.primary + '15',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.primary + '30',
  },
  
  totalPotLabel: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.8,
  },
  
  totalPotAmount: {
    color: theme.primary,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  
  optionsScrollView: {
    paddingLeft: 24,
    paddingVertical: 16,
    backgroundColor: theme.background,
  },
  
  optionsScrollContent: {
    paddingRight: 24,
  },
  
  optionCard: {
    width: width * 0.72,
    backgroundColor: theme.card || '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 2,
    borderColor: theme.border || '#E5E5E5',
  },
  
  userBetCard: {
    borderColor: '#10B981',
    borderWidth: 3,
    backgroundColor: '#F0FDF4',
  },
  
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  
  optionTitle: {
    color: theme.text,
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  
  userBetBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  
  userBetBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  
  betStats: {
    marginBottom: 16,
  },
  
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  
  statLabel: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  
  statValue: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '700',
  },
  
  statPercentage: {
    color: theme.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  
  progressBar: {
    height: 8,
    width: '1%', // Will be set dynamically
    backgroundColor: theme.primary,
    borderRadius: 4,
  },
  
  betButton: {
    backgroundColor: theme.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  betButtonText: {
    color: theme.background,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  
  lockedBetInfo: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },

  lockedBetText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
  },
  
  userBetInfo: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#10B981',
    alignItems: 'center',
  },
  
  userBetDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  userBetAmount: {
    color: '#059669',
    fontSize: 15,
    fontWeight: '700',
  },
  
  potentialWinnings: {
    color: '#059669',
    fontSize: 15,
    fontWeight: '800',
  },

  increaseBetButton: {
    backgroundColor: '#059669',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  
  increaseBetButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
  },

  mainScrollView: {
    flex: 1,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalContent: {
    backgroundColor: theme.background,
    borderRadius: 20,
    padding: 24,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
    minWidth: width * 0.8,
  },
  
  modalTitle: {
    color: theme.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  
  modalText: {
    color: theme.text,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
    lineHeight: 22,
  },
  
  modalOption: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.primary + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.primary + '30',
  },
  
  currentBetText: {
    color: theme.text,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  
  betAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    backgroundColor: theme.card || '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border || '#E5E5E5',
  },
  
  betAmountLabel: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
  },
  
  betAmountInput: {
    backgroundColor: theme.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 18,
    fontWeight: '700',
    color: theme.primary,
    borderWidth: 2,
    borderColor: theme.primary,
    textAlign: 'center',
    minWidth: 100,
    maxWidth: 100,
    maxHeight: 50,
    minHeight: 50,
    marginRight: 8,
  },
  
  unitText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.7,
  },
  
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  
  modalCancelButton: {
    flex: 1,
    backgroundColor: theme.border || '#E5E5E5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  
  modalCancelText: {
    color: theme.background,
    fontSize: 16,
    fontWeight: '600',
  },
  
  modalConfirmButton: {
    flex: 1,
    backgroundColor: theme.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  
  modalConfirmText: {
    color: theme.background,
    fontSize: 16,
    fontWeight: '700',
  },

  // End Event Modal styles
  endEventModalContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    textAlign: 'left',
  },

  optionSelectionButton: {
    backgroundColor: theme.card || '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: theme.border || '#E5E5E5',
  },

  selectedOptionButton: {
    backgroundColor: theme.primary + '20',
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
});