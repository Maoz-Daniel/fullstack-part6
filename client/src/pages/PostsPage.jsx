import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { usePaginatedItems } from '../hooks/usePaginatedItems.js';
import { getCached, setCached } from '../services/cacheStore.js';
import {
  createComment,
  createPost,
  deleteComment,
  deletePost,
  getComments,
  getPostsPage,
  updateComment,
  updatePost,
} from '../services/postsService.js';

const EMPTY_POST_FORM = { title: '', body: '' };
const POST_VIEW_MODES = [
  { value: 'mine', label: 'My posts' },
  { value: 'all', label: 'All posts' },
];

function sortById(items) {
  return [...items].sort((first, second) => first.id - second.id);
}

function updateById(items, updatedItem) {
  return sortById(items.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
}

function getUserDisplayName(item, activeUser) {
  if (item.user_email) return item.user_email;
  if (item.user_id === activeUser.id && activeUser.email) return activeUser.email;
  return `User ${item.user_id}`;
}

export function PostsPage() {
  const { user } = useOutletContext();
  const {
    items: posts,
    setItems: setPosts,
    nextPage,
    setNextPage,
    isLoadingMore,
    loadMore,
    replaceFirstPage,
  } = usePaginatedItems([], null);
  const [postViewMode, setPostViewMode] = useState('mine');
  const [postForm, setPostForm] = useState(EMPTY_POST_FORM);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editPostForm, setEditPostForm] = useState(EMPTY_POST_FORM);
  const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
  const [commentsByPostId, setCommentsByPostId] = useState({});
  const [commentForms, setCommentForms] = useState({});
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentBody, setEditCommentBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingKey, setPendingKey] = useState('');
  const [error, setError] = useState('');

  function viewCacheKey(currentMode = postViewMode) {
    return `posts-view:user:${user.id}:mode:${currentMode}`;
  }

  useEffect(() => {
    let ignore = false;

    async function loadPosts() {
      setLoading(true);
      setError('');

      try {
        const cachedView = getCached(viewCacheKey(postViewMode));
        if (cachedView) {
          setPosts(cachedView.items);
          setNextPage(cachedView.nextPage);
          setLoading(false);
          return;
        }

        const pageData = await getPostsPage({ userId: postViewMode === 'mine' ? user.id : undefined });
        if (!ignore) {
          replaceFirstPage(pageData);
          setCached(viewCacheKey(postViewMode), { items: pageData.data, nextPage: pageData.nextPage });
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadPosts();

    return () => {
      ignore = true;
    };
  }, [postViewMode, replaceFirstPage, setNextPage, setPosts, user.id]);

  function handleLoadMore() {
    setError('');
    loadMore(
      (page) =>
        getPostsPage({
          userId: postViewMode === 'mine' ? user.id : undefined,
          page,
        }),
      (mergedItems, mergedNextPage) => {
        setCached(viewCacheKey(), { items: mergedItems, nextPage: mergedNextPage });
      }
    ).catch((err) => setError(err.message));
  }

  function resetPostInteractionState() {
    setEditingPostId(null);
    setEditPostForm(EMPTY_POST_FORM);
    setOpenCommentsPostId(null);
    setCommentsByPostId({});
    setCommentForms({});
    setEditingCommentId(null);
    setEditCommentBody('');
  }

  function handlePostViewModeChange(nextMode) {
    if (nextMode === postViewMode) return;

    setPostViewMode(nextMode);
    resetPostInteractionState();
    setError('');
  }

  function handlePostFormChange(event) {
    const { name, value } = event.target;
    setPostForm((current) => ({ ...current, [name]: value }));
    if (error) setError('');
  }

  function handleEditPostFormChange(event) {
    const { name, value } = event.target;
    setEditPostForm((current) => ({ ...current, [name]: value }));
    if (error) setError('');
  }

  async function handleCreatePost(event) {
    event.preventDefault();
    const title = postForm.title.trim();
    const body = postForm.body.trim();

    if (!title || !body) {
      setError('Post title and body are required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const created = await createPost({ title, body });
      setPosts((currentPosts) => {
        const nextPosts = sortById([...currentPosts, created]);
        setCached(viewCacheKey(), { items: nextPosts, nextPage });
        return nextPosts;
      });
      setPostForm(EMPTY_POST_FORM);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEditingPost(post) {
    setEditingPostId(post.id);
    setEditPostForm({ title: post.title, body: post.body });
    setError('');
  }

  function cancelEditingPost() {
    setEditingPostId(null);
    setEditPostForm(EMPTY_POST_FORM);
  }

  async function handleUpdatePost(event, post) {
    event.preventDefault();
    const title = editPostForm.title.trim();
    const body = editPostForm.body.trim();

    if (!title || !body) {
      setError('Post title and body are required.');
      return;
    }

    setPendingKey(`post:${post.id}`);
    setError('');

    try {
      const updated = await updatePost(post.id, { title, body });
      setPosts((currentPosts) => {
        const nextPosts = updateById(currentPosts, updated);
        setCached(viewCacheKey(), { items: nextPosts, nextPage });
        return nextPosts;
      });
      cancelEditingPost();
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingKey('');
    }
  }

  async function handleDeletePost(post) {
    setPendingKey(`post:${post.id}`);
    setError('');

    try {
      await deletePost(post.id);
      setPosts((currentPosts) => {
        const nextPosts = currentPosts.filter((item) => item.id !== post.id);
        setCached(viewCacheKey(), { items: nextPosts, nextPage });
        return nextPosts;
      });
      setCommentsByPostId((current) => {
        const next = { ...current };
        delete next[post.id];
        return next;
      });
      if (openCommentsPostId === post.id) {
        setOpenCommentsPostId(null);
      }
      if (editingPostId === post.id) {
        cancelEditingPost();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingKey('');
    }
  }

  async function toggleComments(post) {
    if (openCommentsPostId === post.id) {
      setOpenCommentsPostId(null);
      return;
    }

    setOpenCommentsPostId(post.id);
    setError('');

    if (commentsByPostId[post.id]) return;

    setPendingKey(`comments:${post.id}`);
    try {
      const comments = await getComments({ postId: post.id });
      setCommentsByPostId((current) => ({ ...current, [post.id]: comments }));
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingKey('');
    }
  }

  function handleCommentFormChange(postId, value) {
    setCommentForms((current) => ({ ...current, [postId]: value }));
    if (error) setError('');
  }

  async function handleCreateComment(event, post) {
    event.preventDefault();
    const body = (commentForms[post.id] || '').trim();

    if (!body) {
      setError('Comment body is required.');
      return;
    }

    setPendingKey(`new-comment:${post.id}`);
    setError('');

    try {
      const created = await createComment({ post_id: post.id, body });
      setCommentsByPostId((current) => ({
        ...current,
        [post.id]: sortById([...(current[post.id] || []), created]),
      }));
      setCommentForms((current) => ({ ...current, [post.id]: '' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingKey('');
    }
  }

  function startEditingComment(comment) {
    setEditingCommentId(comment.id);
    setEditCommentBody(comment.body);
    setError('');
  }

  function cancelEditingComment() {
    setEditingCommentId(null);
    setEditCommentBody('');
  }

  async function handleUpdateComment(event, comment) {
    event.preventDefault();
    const body = editCommentBody.trim();

    if (!body) {
      setError('Comment body is required.');
      return;
    }

    setPendingKey(`comment:${comment.id}`);
    setError('');

    try {
      const updated = await updateComment(comment.id, { body });
      setCommentsByPostId((current) => ({
        ...current,
        [updated.post_id]: updateById(current[updated.post_id] || [], updated),
      }));
      cancelEditingComment();
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingKey('');
    }
  }

  async function handleDeleteComment(comment) {
    setPendingKey(`comment:${comment.id}`);
    setError('');

    try {
      await deleteComment(comment.id);
      setCommentsByPostId((current) => ({
        ...current,
        [comment.post_id]: (current[comment.post_id] || []).filter((item) => item.id !== comment.id),
      }));
      if (editingCommentId === comment.id) {
        cancelEditingComment();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingKey('');
    }
  }

  return (
    <section className="content-panel posts-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Posts</p>
          <h2>{postViewMode === 'mine' ? `${user.username}'s posts` : 'All posts'}</h2>
        </div>
        <p className="todo-count">{posts.length} shown</p>
      </div>

      <div className="todo-filters" aria-label="Post filters">
        {POST_VIEW_MODES.map((mode) => (
          <button
            className={`filter-button${postViewMode === mode.value ? ' filter-button--active' : ''}`}
            type="button"
            key={mode.value}
            onClick={() => handlePostViewModeChange(mode.value)}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <form className="post-create-form" onSubmit={handleCreatePost}>
        <label className="form-field">
          <span>Title</span>
          <input name="title" value={postForm.title} onChange={handlePostFormChange} />
        </label>
        <label className="form-field">
          <span>Body</span>
          <textarea name="body" value={postForm.body} onChange={handlePostFormChange} />
        </label>
        <button className="button" type="submit" disabled={saving}>
          {saving ? 'Publishing...' : 'Add post'}
        </button>
      </form>

      {error ? <p className="form-error">{error}</p> : null}

      {loading ? <p className="panel-copy">Loading posts...</p> : null}

      {!loading && posts.length === 0 ? <p className="empty-state">No posts yet.</p> : null}

      {!loading && posts.length > 0 ? (
        <ul className="post-list">
          {posts.map((post) => {
            const isEditingPost = editingPostId === post.id;
            const isPostPending = pendingKey === `post:${post.id}`;
            const isCommentsOpen = openCommentsPostId === post.id;
            const comments = commentsByPostId[post.id] || [];
            const canManagePost = post.user_id === user.id;

            return (
              <li className="post-item" key={post.id}>
                <div className="post-item__header">
                  <div className="post-item__meta">
                    <span className="post-id">#{post.id}</span>
                    <span>{getUserDisplayName(post, user)}</span>
                  </div>
                  <div className="post-actions">
                    <button
                      className="button button--secondary"
                      type="button"
                      onClick={() => toggleComments(post)}
                      disabled={pendingKey === `comments:${post.id}`}
                    >
                      {isCommentsOpen ? 'Hide comments' : 'Comments'}
                    </button>
                    {canManagePost ? (
                      <>
                        <button
                          className="button button--secondary"
                          type="button"
                          onClick={() => startEditingPost(post)}
                          disabled={isPostPending}
                        >
                          Edit
                        </button>
                        <button
                          className="button button--danger"
                          type="button"
                          onClick={() => handleDeletePost(post)}
                          disabled={isPostPending}
                        >
                          Delete
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>

                {isEditingPost ? (
                  <form className="post-edit-form" onSubmit={(event) => handleUpdatePost(event, post)}>
                    <label className="form-field">
                      <span>Title</span>
                      <input name="title" value={editPostForm.title} onChange={handleEditPostFormChange} />
                    </label>
                    <label className="form-field">
                      <span>Body</span>
                      <textarea name="body" value={editPostForm.body} onChange={handleEditPostFormChange} />
                    </label>
                    <div className="post-actions">
                      <button className="button" type="submit" disabled={isPostPending}>
                        Save
                      </button>
                      <button
                        className="button button--secondary"
                        type="button"
                        onClick={cancelEditingPost}
                        disabled={isPostPending}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h3>{post.title}</h3>
                    <p className="post-body">{post.body}</p>
                  </>
                )}

                {isCommentsOpen ? (
                  <div className="comments-panel">
                    <form className="comment-create-form" onSubmit={(event) => handleCreateComment(event, post)}>
                      <label className="form-field">
                        <span>New comment</span>
                        <textarea
                          value={commentForms[post.id] || ''}
                          onChange={(event) => handleCommentFormChange(post.id, event.target.value)}
                        />
                      </label>
                      <button className="button" type="submit" disabled={pendingKey === `new-comment:${post.id}`}>
                        Add comment
                      </button>
                    </form>

                    {pendingKey === `comments:${post.id}` ? <p className="panel-copy">Loading comments...</p> : null}

                    {pendingKey !== `comments:${post.id}` && comments.length === 0 ? (
                      <p className="empty-state empty-state--compact">No comments for this post.</p>
                    ) : null}

                    {comments.length > 0 ? (
                      <ul className="comment-list">
                        {comments.map((comment) => {
                          const canManageComment = comment.user_id === user.id;
                          const isEditingComment = editingCommentId === comment.id;
                          const isCommentPending = pendingKey === `comment:${comment.id}`;

                          return (
                            <li className="comment-item" key={comment.id}>
                              <div className="comment-item__meta">
                                <span>#{comment.id}</span>
                                <span>{getUserDisplayName(comment, user)}</span>
                              </div>

                              {isEditingComment ? (
                                <form
                                  className="comment-edit-form"
                                  onSubmit={(event) => handleUpdateComment(event, comment)}
                                >
                                  <textarea
                                    autoFocus
                                    value={editCommentBody}
                                    onChange={(event) => setEditCommentBody(event.target.value)}
                                  />
                                  <div className="post-actions">
                                    <button className="button" type="submit" disabled={isCommentPending}>
                                      Save
                                    </button>
                                    <button
                                      className="button button--secondary"
                                      type="button"
                                      onClick={cancelEditingComment}
                                      disabled={isCommentPending}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <>
                                  <p>{comment.body}</p>
                                  {canManageComment ? (
                                    <div className="post-actions">
                                      <button
                                        className="button button--secondary"
                                        type="button"
                                        onClick={() => startEditingComment(comment)}
                                        disabled={isCommentPending}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        className="button button--danger"
                                        type="button"
                                        onClick={() => handleDeleteComment(comment)}
                                        disabled={isCommentPending}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  ) : null}
                                </>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {!loading && nextPage ? (
        <div className="load-more">
          <button
            className="button button--secondary"
            type="button"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? 'Loading...' : 'Load more'}
          </button>
        </div>
      ) : null}
    </section>
  );
}
