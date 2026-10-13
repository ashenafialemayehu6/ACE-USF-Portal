// js/forum_service.js

/**
 * Add a new post to the Firestore database
 * @param {string} authorName - Name or email handle of the student
 * @param {string} textContent - The message or post content
 * @param {string} category - Category tag (general, prayer, academic)
 */
export async function createPost(authorName, textContent, category) {
  try {
    const docRef = await firebase.firestore().collection("forum_posts").add({
      author: authorName || "Fellowship Member",
      content: textContent,
      category: category || "general",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log("Post published with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding post: ", error);
    alert("Error publishing post: " + error.message);
  }
}

/**
 * Listen for real-time forum post updates
 * @param {Function} renderCallback - Callback function to render updated posts in UI
 */
export function listenToForumFeed(renderCallback) {
  return firebase.firestore()
    .collection("forum_posts")
    .orderBy("createdAt", "desc")
    .onSnapshot((snapshot) => {
      const posts = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        posts.push({ 
          id: doc.id, 
          ...data,
          // Format Firestore timestamp safely for UI display
          timeAgo: data.createdAt ? formatTimeAgo(data.createdAt.toDate()) : "Just now"
        });
      });
      renderCallback(posts);
    }, (error) => {
      console.error("Error listening to forum feed: ", error);
    });
}

/**
 * Helper function to convert JavaScript Date to relative time string
 */
function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " mins ago";
  return "Just now";
}