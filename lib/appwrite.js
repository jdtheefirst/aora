import Toast from "react-native-toast-message";
import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  Query,
  Storage,
} from "react-native-appwrite";

export const appwriteConfig = {
  endpoint: "https://cloud.appwrite.io/v1",
  platform: "com.intimates_plus.aora",
  projectId: "66f7d8700002eacd7e1a",
  storageId: "66f7dda9002a7746ffbf",
  databaseId: "66f7db350021c2d0b3e2",
  userCollectionId: "66f7db6000393ce87342",
  videoCollectionId: "66f7db9700126ecc8d39",
};

const client = new Client();

client
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId)
  .setPlatform(appwriteConfig.platform);

const account = new Account(client);
const storage = new Storage(client);
const avatars = new Avatars(client);
const databases = new Databases(client);

//Added bookmark
export async function handleAddBookmark(userId, videoId) {
  if (!userId || !videoId) return;
  try {
    const video = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      videoId
    );

    const isAlreadyBookmarked = video.bookmarks.includes(userId);

    if (isAlreadyBookmarked) {
      Toast.show({
        type: "info",
        text1: "Info",
        text2: "You have already bookmarked this video.",
      });
      return;
    }

    const updatedBookmarks = [...video.bookmarks, userId];

    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      videoId,
      { bookmarks: updatedBookmarks }
    );

    // Show toast on success
    Toast.show({
      type: "success",
      text1: "Success",
      text2: "Video added to bookmarks!",
    });
  } catch (error) {
    console.error(error.message);
    // Show error toast
    Toast.show({
      type: "error",
      text1: "Error",
      text2: "An error occurred while adding the bookmark.",
    });
  }
}

//Remove bookmark
export async function handleRemoveBookmark(userId, videoId) {
  if (!userId || !videoId) return;

  try {
    const video = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      videoId
    );

    const isBookmarked = video.bookmarks.includes(userId);

    if (!isBookmarked) {
      Toast.show({
        type: "info",
        text1: "Info",
        text2: "This video is not in your bookmarks.",
      });
      return;
    }

    // Remove userId from bookmarks array
    const updatedBookmarks = video.bookmarks.filter((id) => id !== userId);

    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      videoId,
      { bookmarks: updatedBookmarks }
    );

    // Show toast on success
    Toast.show({
      type: "success",
      text1: "Success",
      text2: "Video removed from bookmarks!",
    });
  } catch (error) {
    console.error(error.message);
    // Show error toast
    Toast.show({
      type: "error",
      text1: "Error",
      text2: "An error occurred while removing the bookmark.",
    });
  }
}

// Function to fetch bookmarks for a user
export async function getBookmarks(userId) {
  try {
    const bookmarkedVideos = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.equal("bookmarks", userId)]
    );

    return bookmarkedVideos.documents || []; // Ensure it returns an array
  } catch (error) {
    console.error(error.message);
    throw new Error("Failed to fetch bookmarks."); // Re-throw to handle in the caller
  }
}

//deleteSessions
export const deleteSessions = async () => {
  try {
    const sessions = await account.listSessions(); // Get all active sessions
    await Promise.all(
      sessions.sessions.map(async (session) => {
        await account.deleteSession(session.$id); // Delete each session
      })
    );
  } catch (error) {
    console.error("Error deleting sessions:", error.message);
    throw error;
  }
};

export async function createUser(email, password, username) {
  try {
    // First, check for an active session
    const currentAccount = await getAccount();

    // If there's an active session, log out the user before creating a new one
    if (currentAccount) {
      await account.deleteSession("current"); // Log out current session
    }

    // Create a new account
    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      username
    );

    if (!newAccount) throw new Error("Failed to create account");

    const avatarUrl = avatars.getInitials(username);

    // Sign in the newly created user
    await signIn(email, password);

    // Create a document in the user collection
    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      {
        accountId: newAccount.$id,
        email: email,
        username: username,
        avatar: avatarUrl,
      }
    );

    return newUser;
  } catch (error) {
    throw new Error(error.message || "Error creating user");
  }
}

//check session
export const checkActiveSession = async () => {
  try {
    const session = await account.getSession("current"); // Check if there's an active session
    return session !== null; // Return true if an active session exists
  } catch (error) {
    if (error.code === 401) {
      // 401: No active session
      return false;
    }
    throw error;
  }
};

// Sign In
export async function signIn(email, password) {
  try {
    const session = await account.createEmailSession(email, password);

    return session;
  } catch (error) {
    throw new Error(error);
  }
}

// Get Account
export async function getAccount() {
  try {
    const currentAccount = await account.get();

    return currentAccount;
  } catch (error) {
    throw new Error(error);
  }
}

// Get Current User
export async function getCurrentUser() {
  try {
    // Step 1: Get the current account using the Appwrite Account API
    const currentAccount = await getAccount(); // Retrieves account details
    if (!currentAccount) throw new Error("No active account found");

    // Step 2: Query the Appwrite database for the user document matching this account
    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)] // Look for user with matching accountId
    );

    if (!currentUser.documents || currentUser.documents.length === 0) {
      throw new Error("No user document found");
    }

    // Return the user document
    return currentUser.documents[0];
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

// Sign Out
export async function signOut() {
  try {
    const session = await account.deleteSession("current");

    return session;
  } catch (error) {
    throw new Error(error);
  }
}

// Upload File
export async function uploadFile(file, type) {
  if (!file) return;

  const { mimeType, ...rest } = file;
  const asset = { type: mimeType, ...rest };

  try {
    const uploadedFile = await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      asset
    );

    const fileUrl = await getFilePreview(uploadedFile.$id, type);
    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}

// Get File Preview
export async function getFilePreview(fileId, type) {
  let fileUrl;

  try {
    if (type === "video") {
      fileUrl = storage.getFileView(appwriteConfig.storageId, fileId);
    } else if (type === "image") {
      fileUrl = storage.getFilePreview(
        appwriteConfig.storageId,
        fileId,
        2000,
        2000,
        "top",
        100
      );
    } else {
      throw new Error("Invalid file type");
    }

    if (!fileUrl) throw Error;

    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}

// Create Video Post
export async function createVideoPost(form) {
  try {
    const [thumbnailUrl, videoUrl] = await Promise.all([
      uploadFile(form.thumbnail, "image"),
      uploadFile(form.video, "video"),
    ]);

    const newPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      ID.unique(),
      {
        title: form.title,
        thumbnail: thumbnailUrl,
        video: videoUrl,
        prompt: form.prompt,
        creator: form.userId,
      }
    );

    return newPost;
  } catch (error) {
    throw new Error(error);
  }
}

// Get all video Posts
export async function getAllPosts() {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get video posts created by user
export async function getUserPosts(userId) {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.equal("creator", userId)]
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get video posts that matches search query
export async function searchPosts(query) {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.search("title", query)]
    );

    if (!posts) throw new Error("Something went wrong");

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get latest created video posts
export async function getLatestPosts() {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(7)]
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}
