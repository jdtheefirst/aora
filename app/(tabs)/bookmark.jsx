import { useState, useEffect } from "react";
import {
  Text,
  FlatList,
  ActivityIndicator,
  View,
  Image,
  TouchableOpacity,
  RefreshControl, // Make sure RefreshControl is imported
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getBookmarks, handleRemoveBookmark } from "../../lib/appwrite"; // Import your function
import { useGlobalContext } from "../../context/GlobalProvider";
import { EmptyState, VideoCard } from "../../components";
import Icon from "react-native-vector-icons/FontAwesome";
import { images } from "../../constants";

const Bookmark = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // Add a refreshing state
  const { user } = useGlobalContext();

  useEffect(() => {
    fetchBookmarks();
  }, [user?.$id]);

  async function fetchBookmarks() {
    if (!user?.$id) return;
    setLoading(true);
    try {
      const userBookmarks = await getBookmarks(user.$id);
      setBookmarks(userBookmarks);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle refreshing
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookmarks(); // Fetch bookmarks again
    setRefreshing(false);
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#00ff00" />;
  }

  const icons = {
    bookmark: "bookmark",
    check: "check",
    plus: "plus",
  };

  const isBookmarked = (video) => {
    return video.bookmarks.includes(user?.$id);
  };

  return (
    <SafeAreaView className="px-4 my-6 bg-primary h-full">
      <Text className="text-2xl text-white font-psemibold">Bookmarks</Text>
      <FlatList
        data={bookmarks}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <View className="relative my-4">
            <VideoCard
              title={item.title}
              thumbnail={item.thumbnail}
              video={item.video}
              creator={item.creator.username}
              avatar={item.creator.avatar}
            />
            <TouchableOpacity
              style={{
                position: "absolute",
                bottom: 70, // Adjust as needed
                right: 10, // Adjust as needed
                backgroundColor: "white", // Optional: to give it a background
                borderRadius: 20, // Optional: to make it round
                padding: 10, // Optional: to add some space around the icon
              }}
              onPress={() => handleRemoveBookmark(user?.$id, item.$id)}
            >
              <Icon
                name={icons.bookmark}
                size={20}
                color={isBookmarked(item) ? "green" : "blue"}
              />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => (
          <EmptyState
            title="No Videos Found"
            subtitle="No bookmarks created yet"
          />
        )}
        ListHeaderComponent={() => (
          <View className="flex my-6 px-4 space-y-6">
            <View className="flex justify-between items-start flex-row mb-6">
              <View>
                <Text className="font-pmedium text-sm text-gray-100">
                  Your Saved Collection
                </Text>
                <Text className="text-2xl font-psemibold text-white">
                  Favorites
                </Text>
              </View>
              <View className="mt-1.5">
                <Image
                  source={images.logoSmall}
                  className="w-9 h-10"
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
};

export default Bookmark;
