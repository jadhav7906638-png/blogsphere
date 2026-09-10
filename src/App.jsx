import { useEffect, useState } from "react";
import API from "./api";
import Login from "./pages/login";
import Register from "./pages/register";
import "./App.css";

function App() {
  const [page, setPage] = useState("home");
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [currentUser, setCurrentUser] = useState(null);

  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [editingPost, setEditingPost] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const [commentText, setCommentText] = useState({});

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }

    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);

      const response = await API.get("/posts");

      const postData = Array.isArray(response.data)
        ? response.data
        : response.data.posts || [];

      setPosts(postData);

      postData.forEach((post) => {
        fetchComments(post._id);
      });
    } catch (error) {
      console.error("Fetch posts error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId) => {
    try {
      const response = await API.get(`/comments/${postId}`);

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.comments || [];

      setComments((prev) => ({
        ...prev,
        [postId]: data,
      }));
    } catch (error) {
      console.error("Fetch comments error:", error);
    }
  };

  const handleLogin = () => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    setPage("home");
    fetchPosts();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setCurrentUser(null);
    setPage("home");

    alert("Logged out successfully 👋");
  };

  const handleRegister = () => {
    setPage("register");
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      alert("Please login first.");
      return;
    }

    if (!title.trim() || !content.trim()) {
      alert("Please enter title and content.");
      return;
    }

    try {
      await API.post("/posts", {
        title: title.trim(),
        content: content.trim(),
      });

      setTitle("");
      setContent("");
      setPage("home");

      alert("Post created successfully! 🎉");

      await fetchPosts();
    } catch (error) {
      console.error("Create post error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to create post."
      );
    }
  };

  const startEditPost = (post) => {
    setEditingPost(post._id);
    setEditTitle(post.title);
    setEditContent(post.content);
  };

  const cancelEdit = () => {
    setEditingPost(null);
    setEditTitle("");
    setEditContent("");
  };

  const updatePost = async (postId) => {
    if (!editTitle.trim() || !editContent.trim()) {
      alert("Title and content cannot be empty.");
      return;
    }

    try {
      await API.put(`/posts/${postId}`, {
        title: editTitle.trim(),
        content: editContent.trim(),
      });

      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? {
                ...post,
                title: editTitle.trim(),
                content: editContent.trim(),
              }
            : post
        )
      );

      cancelEdit();

      alert("Post updated successfully! ✨");
    } catch (error) {
      console.error("Update post error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to update post."
      );
    }
  };

  const deletePost = async (postId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this post?"
    );

    if (!confirmed) return;

    try {
      await API.delete(`/posts/${postId}`);

      setPosts((prev) =>
        prev.filter((post) => post._id !== postId)
      );

      setComments((prev) => {
        const updated = { ...prev };
        delete updated[postId];
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

  const addComment = async (postId) => {
    if (!currentUser) {
      alert("Please login first.");
      return;
    }

    const text = commentText[postId]?.trim();

    if (!text) {
      alert("Please write a comment.");
      return;
    }

    try {
      const response = await API.post("/comments", {
        postId,
        content: text,
      });

      const newComment =
        response.data.comment || response.data;

      setComments((prev) => ({
        ...prev,
        [postId]: [
          ...(prev[postId] || []),
          newComment,
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

  const deleteComment = async (commentId, postId) => {
    if (!currentUser) {
      alert("Please login first.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this comment?"
    );

    if (!confirmed) return;

    try {
      await API.delete(`/comments/${commentId}`);

      setComments((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter(
          (comment) => comment._id !== commentId
        ),
      }));

      alert("Comment deleted successfully! 🗑️");
    } catch (error) {
      console.error("Delete comment error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to delete comment."
      );
    }
  };

  const getAuthorName = (post) => {
    if (post.author?.name) {
      return post.author.name;
    }

    if (post.author?.email) {
      return post.author.email;
    }

    return "BlogSphere Author";
  };

  const isPostOwner = (post) => {
    if (!currentUser) return false;

    const authorId =
      post.author?._id ||
      post.author ||
      post.user?._id ||
      post.user ||
      null;

    return String(authorId) === String(currentUser.id);
  };

  const isCommentOwner = (comment) => {
    if (!currentUser) return false;

    const authorId =
      comment.author?._id ||
      comment.author ||
      comment.user?._id ||
      comment.user ||
      null;

    return String(authorId) === String(currentUser.id);
  };

  const formatDate = (date) => {
    if (!date) return "Recently";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (page === "login") {
    return (
      <Login
        onLogin={handleLogin}
        onRegister={handleRegister}
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

  return (
    <div className="app-shell">

      {/* NAVBAR */}
      <nav className="navbar">

        <div
          className="brand"
          onClick={() => setPage("home")}
        >
          <div className="brand-logo">B</div>

          <div>
            <div className="brand-name">
              BlogSphere
            </div>

            <div className="brand-subtitle">
              Share • Create • Inspire
            </div>
          </div>
        </div>

        <div className="nav-links">

          <button
            className={
              page === "home"
                ? "nav-link active"
                : "nav-link"
            }
            onClick={() => setPage("home")}
          >
            Home
          </button>

          {currentUser && (
            <button
              className="nav-link"
              onClick={() => setPage("create")}
            >
              + Create Post
            </button>
          )}

        </div>

        <div className="nav-user">

          {currentUser ? (
            <>
              <div className="user-pill">

                <div className="user-avatar">
                  {(currentUser.name || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <span>
                  {currentUser.name || "User"}
                </span>

              </div>

              <button
                className="logout-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                className="login-nav-btn"
                onClick={() => setPage("login")}
              >
                Login
              </button>

              <button
                className="signup-nav-btn"
                onClick={() => setPage("register")}
              >
                Get Started
              </button>
            </>
          )}

        </div>
      </nav>

      {/* HOME */}
      {page === "home" && (
        <>

          {/* HERO */}
          <section className="hero">

            <div className="hero-glow glow-one"></div>
            <div className="hero-glow glow-two"></div>

            <div className="hero-content">

              <div className="hero-badge">
                ✦ WELCOME TO BLOGSPHERE
              </div>

              <h1>
                Your ideas.
                <br />
                <span>Your story.</span>
              </h1>

              <p>
                A modern space to write, share and
                connect with people through meaningful
                stories.
              </p>

              <div className="hero-actions">

                {currentUser ? (
                  <button
                    className="hero-primary"
                    onClick={() => setPage("create")}
                  >
                    Start Writing →
                  </button>
                ) : (
                  <button
                    className="hero-primary"
                    onClick={() => setPage("register")}
                  >
                    Join BlogSphere →
                  </button>
                )}

                <button
                  className="hero-secondary"
                  onClick={() => {
                    document
                      .getElementById("posts")
                      ?.scrollIntoView({
                        behavior: "smooth",
                      });
                  }}
                >
                  Explore Posts
                </button>

              </div>
            </div>

            <div className="hero-decoration">

              <div className="floating-card card-one">
                <span>✍️</span>

                <div>
                  <strong>Create</strong>
                  <small>Share your ideas</small>
                </div>
              </div>

              <div className="floating-card card-two">
                <span>💬</span>

                <div>
                  <strong>Connect</strong>
                  <small>Join the conversation</small>
                </div>
              </div>

              <div className="floating-card card-three">
                <span>🚀</span>

                <div>
                  <strong>Inspire</strong>
                  <small>Make an impact</small>
                </div>
              </div>

            </div>
          </section>

          {/* POSTS */}
          <section
            className="posts-section"
            id="posts"
          >

            <div className="section-heading">

              <div>

                <span className="section-label">
                  COMMUNITY STORIES
                </span>

                <h2>Latest Posts</h2>

                <p>
                  Discover stories and ideas from the
                  BlogSphere community.
                </p>

              </div>

              {currentUser && (
                <button
                  className="create-small-btn"
                  onClick={() => setPage("create")}
                >
                  + Write a Post
                </button>
              )}

            </div>

            {loading ? (
              <div className="loading-box">

                <div className="loader"></div>

                <p>
                  Loading stories...
                </p>

              </div>
            ) : posts.length === 0 ? (

              <div className="empty-state">

                <div className="empty-icon">
                  📝
                </div>

                <h3>No posts yet</h3>

                <p>
                  Be the first person to share a story
                  with the community.
                </p>

                {currentUser && (
                  <button
                    className="hero-primary"
                    onClick={() => setPage("create")}
                  >
                    Create First Post
                  </button>
                )}

              </div>

            ) : (

              <div className="posts-grid">

                {posts.map((post) => (

                  <article
                    className="post-card"
                    key={post._id}
                  >

                    <div className="post-card-top"></div>

                    <div className="post-card-body">

                      {/* POST META */}
                      <div className="post-meta">

                        <div className="author-info">

                          <div className="author-avatar">
                            {getAuthorName(post)
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>

                            <strong>
                              {getAuthorName(post)}
                            </strong>

                            <span>
                              {formatDate(
                                post.createdAt
                              )}
                            </span>

                          </div>

                        </div>

                        <div className="post-tag">
                          BLOG
                        </div>

                      </div>

                      {/* EDIT / VIEW */}
                      {editingPost === post._id ? (

                        <div className="edit-box">

                          <input
                            value={editTitle}
                            onChange={(e) =>
                              setEditTitle(
                                e.target.value
                              )
                            }
                            placeholder="Post title"
                          />

                          <textarea
                            value={editContent}
                            onChange={(e) =>
                              setEditContent(
                                e.target.value
                              )
                            }
                            placeholder="Post content"
                            rows="7"
                          />

                          <div className="edit-actions">

                            <button
                              className="save-btn"
                              onClick={() =>
                                updatePost(post._id)
                              }
                            >
                              Save Changes
                            </button>

                            <button
                              className="cancel-btn"
                              onClick={cancelEdit}
                            >
                              Cancel
                            </button>

                          </div>

                        </div>

                      ) : (

                        <>

                          <h3 className="post-title">
                            {post.title}
                          </h3>

                          <p className="post-content">
                            {post.content}
                          </p>

                          {isPostOwner(post) && (
                            <div className="post-owner-actions">

                              <button
                                className="edit-post-btn"
                                onClick={() =>
                                  startEditPost(post)
                                }
                              >
                                ✏️ Edit
                              </button>

                              <button
                                className="delete-post-btn"
                                onClick={() =>
                                  deletePost(
                                    post._id
                                  )
                                }
                              >
                                🗑️ Delete
                              </button>

                            </div>
                          )}

                        </>

                      )}

                      {/* COMMENTS */}
                      <div className="comments-section">

                        <div className="comments-title">

                          <span>
                            💬 Comments
                          </span>

                          <span className="comment-count">
                            {(comments[post._id] || [])
                              .length}
                          </span>

                        </div>

                        {currentUser && (
                          <div className="comment-form">

                            <input
                              type="text"
                              placeholder="Write a thoughtful comment..."
                              value={
                                commentText[
                                  post._id
                                ] || ""
                              }
                              onChange={(e) =>
                                setCommentText(
                                  (prev) => ({
                                    ...prev,
                                    [post._id]:
                                      e.target.value,
                                  })
                                )
                              }
                              onKeyDown={(e) => {

                                if (
                                  e.key === "Enter"
                                ) {
                                  addComment(
                                    post._id
                                  );
                                }

                              }}
                            />

                            <button
                              onClick={() =>
                                addComment(post._id)
                              }
                            >
                              Send
                            </button>

                          </div>
                        )}

                        {!currentUser && (
                          <div className="login-comment-note">

                            <span>
                              🔐 Login to join the
                              conversation.
                            </span>

                            <button
                              onClick={() =>
                                setPage("login")
                              }
                            >
                              Login
                            </button>

                          </div>
                        )}

                        {/* COMMENT LIST */}
                        <div className="comments-list">

                          {(comments[post._id] || [])
                            .length === 0 ? (

                            <p className="no-comments">
                              No comments yet. Be the
                              first to comment!
                            </p>

                          ) : (

                            (
                              comments[post._id] || []
                            ).map((comment) => (

                              <div
                                className="comment-item"
                                key={comment._id}
                              >

                                <div className="comment-avatar">
                                  {(
                                    comment.author
                                      ?.name ||
                                    "U"
                                  )
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                                <div className="comment-main">

                                  <div className="comment-header">

                                    <div>

                                      <strong>
                                        {comment.author
                                          ?.name ||
                                          "User"}
                                      </strong>

                                      <span>
                                        {formatDate(
                                          comment.createdAt
                                        )}
                                      </span>

                                    </div>

                                    {isCommentOwner(
                                      comment
                                    ) && (

                                      <button
                                        className="delete-comment-btn"
                                        onClick={() =>
                                          deleteComment(
                                            comment._id,
                                            post._id
                                          )
                                        }
                                        title="Delete your comment"
                                      >
                                        🗑️ Delete
                                      </button>

                                    )}

                                  </div>

                                  <p>
                                    {comment.content}
                                  </p>

                                </div>

                              </div>

                            ))

                          )}

                        </div>

                      </div>

                    </div>
                  </article>

                ))}

              </div>

            )}

          </section>

          {/* FOOTER */}
          <footer className="footer">

            <div>

              <strong>BlogSphere</strong>

              <span>
                Write. Share. Inspire.
              </span>

            </div>

            <p>
              © 2026 BlogSphere. Built with React,
              Node.js & MongoDB.
            </p>

          </footer>

        </>
      )}

      {/* CREATE POST */}
      {page === "create" && (

        <section className="create-page">

          <div className="create-wrapper">

            <div className="create-header">

              <span className="section-label">
                CREATE SOMETHING GREAT
              </span>

              <h1>
                Write a New Story
              </h1>

              <p>
                Turn your thoughts into a story that
                people can discover.
              </p>

            </div>

            <form
              className="create-form"
              onSubmit={handleCreatePost}
            >

              <label>
                Post Title
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                placeholder="Give your story a great title..."
              />

              <label>
                Story Content
              </label>

              <textarea
                rows="14"
                value={content}
                onChange={(e) =>
                  setContent(e.target.value)
                }
                placeholder="Start writing your story..."
              />

              <div className="form-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setPage("home")}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="publish-btn"
                >
                  Publish Story →
                </button>

              </div>

            </form>

          </div>

        </section>

      )}

    </div>
  );
}

export default App;