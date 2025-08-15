
import { fetchFollowingPosts } from "@/api/fyFunctions";
import EventCard, { Event } from "@/components/eventCard";
import { useThemeConfig, Theme } from "@/components/ui/use-theme-config"
import { FontAwesome } from "@expo/vector-icons";
import { useEffect, useState } from "react"
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"



export default function Home(){
  const [refresh, activateRefresh] = useState(false);
  const theme = useThemeConfig()
  const [followingPostsList, updateFollowingPostsList] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<'Following' | 'Shop'>('Following');

  useEffect( () =>{
    async function fetchData(){
      try {
        const posts = await fetchFollowingPosts();

        if (posts) {
          updateFollowingPostsList(posts);
        } else {
          console.warn('No posts found');
        }
      } catch(err){
        console.error('Failed to fetch data', err);
      } finally {
        activateRefresh(false);
      }
    }
    
    fetchData();

  }, [refresh])


  
  return (
    <SafeAreaView style={styles(theme).backgroundContainer}>
      <View style= {[styles(theme).topTabs]}>
        <TouchableOpacity
          style={[styles(theme).tabButton, activeTab === 'Following' && styles(theme).selectedTabButton]}
          onPress={() => setActiveTab('Following')}
        >
          <Text style={[styles(theme).tabText, activeTab === 'Following' && styles(theme).selectedTabText]}>
            Following
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles(theme).tabButton, activeTab === 'Shop' && styles(theme).selectedTabButton]}
          onPress={() => setActiveTab('Shop')}
        >
          <Text style={[styles(theme).tabText, activeTab === 'Shop' && styles(theme).selectedTabText]}>
            Shop
          </Text>
        </TouchableOpacity>
      </View>
      { activeTab === 'Following' ? (
        <View style={styles(theme).followingEventsContainer}>
          <FlatList
            data={followingPostsList}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <EventCard
                event={item}
              />
            )}
            refreshing={refresh}
            onRefresh={() => activateRefresh(!refresh)}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>
      ) : (
        <View style={styles(theme).shopContainer}>
          <FontAwesome name="shopping-cart" size={50} color={theme.primary} />
          <Text style={styles(theme).shopText}>
            Shop coming soon!
          </Text>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = (theme: Theme) => StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    backgroundColor: theme.background
  },
  topTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',

  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    borderColor: theme.border,
  },
  selectedTabButton: {
    borderBottomWidth: 2,

  },
  tabText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedTabText: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  shopContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopText: {
    color: theme.text,
    fontSize: 18,
    fontWeight: 'bold', 
  },
  followingEventsContainer: {
    flex: 1,
    paddingTop: 10,
    backgroundColor: theme.background,
  },
})