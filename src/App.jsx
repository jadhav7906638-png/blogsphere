import { useEffect, useState } from "react";
import API from "./api";
import Login from "./pages/login";
import Register from "./pages/register";
import "./App.css";

function App() {
  const [page, setPage] = useState("home");

  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  const [currentUser, setCurrentUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "null")
  );

  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const [commentText, setCommentText] = useState({});

  // =========================
  // FETCH POSTS
  // =========================
  const fetchPosts = async () => {
    try {
      const response = await API.get("/posts");

      const formattedPosts = response.data.map((post) => ({
        ...post,
        authorId: post.author?._id || post.author || null,
        authorName: post.author?.name || "Unknown",
      }));

      setPosts(formattedPosts);

      formattedPosts.forEach((post) => {
        fetchComments(post._id);
      });
    } catch (error) {
      console.error("Fetch posts error:", error);
    }
  };

  // =========================
  // FETCH COMMENTS
  // =========================
  const fetchComments = async (postId) => {
    try {
      const response = await API.get(`/comments/${postId}`);

      setComments((prev) => ({
        ...prev,
        [postId]: response.data,
      }));
    } catch (error) {
      console.error("Fetch comments error:", error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // =========================
  // CREATE POST
  // =========================
  const createPost = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      alert("Please login first.");
      setPage("login");
      return;
    }

    if (!title.trim() || !content.trim()) {
      alert("Please enter title and content.");
      return;
    }

    try {
      const response = await API.post("/posts", {
        title,
        content,
      });

      const post = response.data.post;

      const newPost = {
        ...post,
        authorId:
          post.author?._id ||
          post.author ||
          currentUser?.id ||
          null,
        authorName:
          post.author?.name ||
          currentUser?.name ||
          "Unknown",
      };

      setPosts((prev) => [newPost, ...prev]);

      setTitle("");
      setContent("");

      alert("Post created successfully! 🎉");
      setPage("blogs");
    } catch (error) {
      console.error("Create post error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to create post."
      );
    }
  };

  // =========================
  // START EDIT
  // =========================
  const startEdit = (post) => {
    if (!isLoggedIn) {
      alert("Please login first.");
      setPage("login");
      return;
    }

    const isOwner =
      currentUser?.id &&
      post.authorId &&
      post.authorId.toString() === currentUser.id.toString();

    if (!isOwner) {
      alert("You can only edit your own posts.");
      return;
    }

    setEditingId(post._id);
    setEditTitle(post.title);
    setEditContent(post.content);
  };

  // =========================
  // SAVE EDIT
  // =========================
  const saveEdit = async (id) => {
    if (!editTitle.trim() || !editContent.trim()) {
      alert("Title and content cannot be empty.");
      return;
    }

    try {
      const response = await API.put(`/posts/${id}`, {
        title: editTitle,
        content: editContent,
      });

      const updatedPost = response.data.post;

      setPosts((prev) =>
        prev.map((post) =>
          post._id === id
            ? {
                ...updatedPost,
                authorId:
                  updatedPost.author?._id ||
                  updatedPost.author ||
                  currentUser?.id ||
                  null,
                authorName:
                  updatedPost.author?.name ||
                  currentUser?.name ||
                  "Unknown",
              }
            : post
        )
      );

      setEditingId(null);
      setEditTitle("");
      setEditContent("");

      alert("Post updated successfully! ✅");
    } catch (error) {
      console.error("Update post error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to update post."
      );
    }
  };

  // =========================
  // DELETE POST
  // =========================
  const deletePost = async (id) => {
    const post = posts.find((p) => p._id === id);

    if (!post) return;

    const isOwner =
      currentUser?.id &&
      post.authorId &&
      post.authorId.toString() === currentUser.id.toString();

    if (!isOwner) {
      alert("You can only delete your own posts.");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this post?"
    );

    if (!confirmDelete) return;

    try {
      await API.delete(`/posts/${id}`);

      setPosts((prev) =>
        prev.filter((post) => post._id !== id)
      );

      setComments((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });

      alert("Post deleted successfully! 🗑️");
    } catch (error) {
      console.error("Delete post error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to delete post."
      );
    }
  };

  // =========================
  // ADD COMMENT
  // =========================
  const addComment = async (postId) => {
    if (!isLoggedIn) {
      alert("Please login to comment.");
      setPage("login");
      return;
    }

    const text = commentText[postId]?.trim();

    if (!text) {
      alert("Please write a comment.");
      return;
    }

    try {
      const response = await API.post("/comments", {
        text,
        post: postId,
      });

      setComments((prev) => ({
        ...prev,
        [postId]: [
          response.data.comment,
          ...(prev[postId] || []),
        ],
      }));

      setCommentText((prev) => ({
        ...prev,
        [postId]: "",
      }));
    } catch (error) {
      console.error("Add comment error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to add comment."
      );
    }
  };

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setIsLoggedIn(false);
    setCurrentUser(null);
    setPage("home");

    alert("Logged out successfully!");
  };

  // =========================
  // LOGIN SUCCESS
  // =========================
  const handleLoginSuccess = () => {
    const user = JSON.parse(
      localStorage.getItem("user") || "null"
    );

    setCurrentUser(user);
    setIsLoggedIn(true);
    setPage("home");
  };

  // =========================
  // AUTH PAGES
  // =========================
  if (page === "login") {
    return (
      <Login
        onLogin={handleLoginSuccess}
        onRegister={() => setPage("register")}
      />
    );
  }

  if (page === "register") {
    return (
      <Register
        onRegister={() => setPage("login")}
        onLogin={() => setPage("login")}
      />
    );
  }

  // =========================
  // MAIN UI
  // =========================
  return (
    <div className="app">

      {/* NAVBAR */}
      <nav className="navbar">
        <div
          className="logo"
          onClick={() => setPage("home")}
        >
          BlogSphere
        </div>

        <div className="nav-links">
          <button onClick={() => setPage("home")}>
            Home
          </button>

          <button onClick={() => setPage("blogs")}>
            Blogs
          </button>

          {isLoggedIn && (
            <button onClick={() => setPage("create")}>
              Create
            </button>
          )}

          {isLoggedIn ? (
            <button onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <button onClick={() => setPage("login")}>
              Login
            </button>
          )}
        </div>
      </nav>

      {/* HOME */}
      {page === "home" && (
        <main>
          <section className="hero">
            <p className="tag">WELCOME TO BLOGSPHERE</p>

            <h1>
              Share your <span>stories.</span>
            </h1>

            <p>
              A simple and beautiful platform where
              everyone can write, share and discuss
              ideas.
            </p>

            <div className="hero-buttons">
              <button
                onClick={() => setPage("blogs")}
              >
                Explore Blogs →
              </button>

              {isLoggedIn && (
                <button
                  onClick={() => setPage("create")}
                >
                  Write a Blog
                </button>
              )}
            </div>
          </section>
        </main>
      )}

      {/* BLOGS */}
      {page === "blogs" && (
        <main className="blogs-page">

          <div className="section-heading">
            <p className="tag">COMMUNITY STORIES</p>

            <h1>Latest Blogs</h1>

            <p>
              Discover stories and ideas shared by
              our community.
            </p>
          </div>

          {posts.length === 0 ? (
            <div className="empty-state">
              <h2>No blogs yet</h2>

              <p>
                Be the first person to publish a blog.
              </p>

              {isLoggedIn && (
                <button
                  onClick={() => setPage("create")}
                >
                  Create First Blog
                </button>
              )}
            </div>
          ) : (
            <div className="posts-container">

              {posts.map((post) => {

                const isOwner =
                  currentUser?.id &&
                  post.authorId &&
                  post.authorId.toString() ===
                    currentUser.id.toString();

                return (
                  <article
                    className="blog-card"
                    key={post._id}
                  >

                    {editingId === post._id ? (
                      <div className="edit-box">

                        <input
                          value={editTitle}
                          onChange={(e) =>
                            setEditTitle(e.target.value)
                          }
                          placeholder="Blog title"
                        />

                        <textarea
                          value={editContent}
                          onChange={(e) =>
                            setEditContent(e.target.value)
                          }
                          placeholder="Blog content"
                          rows="8"
                        />

                        <div className="post-actions">

                          <button
                            onClick={() =>
                              saveEdit(post._id)
                            }
                          >
                            Save Changes
                          </button>

                          <button
                            onClick={() =>
                              setEditingId(null)
                            }
                          >
                            Cancel
                          </button>

                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="blog-author">
                          ✍️ {post.authorName}
                        </p>

                        <h2>{post.title}</h2>

                        <p className="blog-content">
                          {post.content}
                        </p>

                        <div className="post-meta">
                          {post.createdAt
                            ? new Date(
                                post.createdAt
                              ).toLocaleDateString()
                            : ""}
                        </div>

                        {/* EDIT / DELETE
                            ONLY FOR OWNER */}
                        {isOwner && (
                          <div className="post-actions">

                            <button
                              onClick={() =>
                                startEdit(post)
                              }
                            >
                              ✏️ Edit
                            </button>

                            <button
                              onClick={() =>
                                deletePost(post._id)
                              }
                            >
                              🗑️ Delete
                            </button>

                          </div>
                        )}

                        {/* COMMENTS */}
                        <div className="comments-section">

                          <h3>
                            Comments (
                            {comments[post._id]?.length ||
                              0}
                            )
                          </h3>

                          <div className="comment-input">

                            <input
                              type="text"
                              placeholder={
                                isLoggedIn
                                  ? "Write a comment..."
                                  : "Login to comment..."
                              }
                              value={
                                commentText[post._id] ||
                                ""
                              }
                              disabled={!isLoggedIn}
                              onChange={(e) =>
                                setCommentText(
                                  (prev) => ({
                                    ...prev,
                                    [post._id]:
                                      e.target.value,
                                  })
                                )
                              }
                            />

                            <button
                              onClick={() =>
                                addComment(post._id)
                              }
                            >
                              Comment
                            </button>

                          </div>

                          <div className="comments-list">

                            {comments[post._id]?.map(
                              (comment) => (
                                <div
                                  className="comment"
                                  key={comment._id}
                                >
                                  <strong>
                                    {comment.author
                                      ?.name ||
                                      "User"}
                                  </strong>

                                  <p>
                                    {comment.text}
                                  </p>
                                </div>
                              )
                            )}

                          </div>
                        </div>
                      </>
                    )}

                  </article>
                );
              })}

            </div>
          )}

        </main>
      )}

      {/* CREATE */}
      {page === "create" && (
        <main className="create-page">

          <div className="section-heading">
            <p className="tag">CREATE</p>

            <h1>Write a New Blog</h1>

            <p>
              Share your thoughts with the BlogSphere
              community.
            </p>
          </div>

          <form
            className="create-form"
            onSubmit={createPost}
          >

            <label>Blog Title</label>

            <input
              type="text"
              placeholder="Enter your blog title"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
            />

            <label>Content</label>

            <textarea
              rows="12"
              placeholder="Write your story..."
              value={content}
              onChange={(e) =>
                setContent(e.target.value)
              }
            />

            <button type="submit">
              Publish Blog →
            </button>

          </form>

        </main>
      )}

      {/* FOOTER */}
      <footer>
        <h3>BlogSphere</h3>

        <p>Share. Connect. Inspire.</p>

        <p>
          © 2026 BlogSphere. All rights reserved.
        </p>
      </footer>

    </div>
  );
}

export default App;