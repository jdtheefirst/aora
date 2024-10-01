import { useState, useEffect } from "react";
import { Text, FlatList, ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getBookmarks } from "../../lib/appwrite"; // Import your function
import { useGlobalContext } from "../../context/GlobalProvider";

const Bookmark = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useGlobalContext();

  useEffect(() => {
    async function fetchBookmarks() {
      if (!user.$id) return; // Prevent fetching if userId is not available
      try {
        const userBookmarks = await getBookmarks(user.$id);
        setBookmarks(userBookmarks);
      } catch (error) {
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBookmarks();
  }, [user.$id]);

  if (loading) {
    return <ActivityIndicator size="large" color="#00ff00" />;
  }

  if (bookmarks.length === 0) {
    return (
      <SafeAreaView className="px-4 my-6 bg-primary h-full">
        <Text className="text-2xl text-white font-psemibold">
          No bookmarks found
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="px-4 my-6 bg-primary h-full">
      <Text className="text-2xl text-white font-psemibold">Bookmarks</Text>
      <FlatList
        data={bookmarks}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <View className="my-2">
            <Text className="text-white">{item.videoId}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default Bookmark;
