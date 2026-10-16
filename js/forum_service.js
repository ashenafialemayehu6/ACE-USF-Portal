// js/forum_service.js

/**
 * Add a post to the signed-in student's Firestore forum.
 * The displayed author is taken from the signed-in account, not the form.
 */
export async function createPost(_authorName, textContent, category) {
  try {
    const user = firebase.auth().currentUser;

    if (!user) {
      throw new Error("Sign in to publish a forum post.");
    }

    const content = String(textContent || "").trim();

    if (!content || content.length > 3000) {
      throw new Error("Write a post between 1 and 3,000 characters.");
    }

    const allowedCategories = ["general", "prayer", "academic"];
    const postCategory = allowedCategories.includes(category)
      ? category
      : "general";

    const author = user.displayName?.trim() || user.email;

    if (!author) {
      throw new Error("Your account needs a name or email to publish.");
    }

    const docRef = await firebase.firestore().collection("forum_posts").add({
      authorUid: user.uid,
      author,
      content,
      category: postCategory,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    console.log("Post published with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding post:", error);
    alert("Error publishing post: " + error.message);
    return null;
  }
}

/**
 * Listen for real-time forum post updates.
 * A signed-in user is required; Firestore rules will enforce this.
 */
export function listenToForumFeed(renderCallback) {
  return firebase.firestore()
    .collection("forum_posts")
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (snapshot) => {
        const posts = [];

        snapshot.forEach((doc) => {
          const data = doc.data();

          posts.push({
            id: doc.id,
            ...data,
            timeAgo: data.createdAt
              ? formatTimeAgo(data.createdAt.toDate())
              : "Just now",
          });
        });

        renderCallback(posts);
      },
      (error) => {
        console.error("Error listening to forum feed:", error);
      }
    );
}

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