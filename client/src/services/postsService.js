import { apiClient } from './apiClient.js';
import { deleteByPrefix, getCached, setCached } from './cacheStore.js';

function normalizePost(post) {
  return {
    ...post,
    id: Number(post.id),
    user_id: Number(post.user_id),
  };
}

function normalizeComment(comment) {
  return {
    ...comment,
    id: Number(comment.id),
    post_id: Number(comment.post_id),
    user_id: Number(comment.user_id),
  };
}

export async function getPosts({ userId } = {}) {
  const path =
    userId === undefined || userId === null
      ? '/posts'
      : `/posts?${new URLSearchParams({ userId: String(userId) }).toString()}`;

  const posts = await apiClient(path);
  return posts.map(normalizePost);
}

export async function getPostsPage({ userId, page = 1, limit = 5 } = {}) {
  const scopeKey = userId === undefined || userId === null ? 'all' : `user:${userId}`;
  const cacheKey = `posts:${scopeKey}:page:${page}:limit:${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (userId !== undefined && userId !== null) {
    params.set('userId', String(userId));
  }

  const { data, nextPage } = await apiClient(`/posts?${params.toString()}`, {
    withPagination: true,
  });

  const result = {
    data: data.map(normalizePost),
    nextPage,
  };
  setCached(cacheKey, result);
  return result;
}

export async function createPost(payload) {
  const post = await apiClient('/posts', {
    method: 'POST',
    body: payload,
  });

  deleteByPrefix('posts:');
  deleteByPrefix('posts-view:');
  return normalizePost(post);
}

export async function updatePost(id, payload) {
  const post = await apiClient(`/posts/${id}`, {
    method: 'PUT',
    body: payload,
  });

  deleteByPrefix('posts:');
  deleteByPrefix('posts-view:');
  return normalizePost(post);
}

export async function deletePost(id) {
  const deleted = await apiClient(`/posts/${id}`, {
    method: 'DELETE',
  });
  deleteByPrefix('posts:');
  deleteByPrefix('posts-view:');
  deleteByPrefix(`comments:post:${id}:`);
  return normalizePost(deleted);
}

export async function getComments({ postId }) {
  const cacheKey = `comments:post:${postId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({ postId: String(postId) });
  const comments = await apiClient(`/comments?${params.toString()}`);
  const result = comments.map(normalizeComment);
  setCached(cacheKey, result);
  return result;
}

export async function createComment(payload) {
  const comment = await apiClient('/comments', {
    method: 'POST',
    body: payload,
  });

  deleteByPrefix(`comments:post:${payload.post_id}`);
  return normalizeComment(comment);
}

export async function updateComment(id, payload) {
  const comment = await apiClient(`/comments/${id}`, {
    method: 'PUT',
    body: payload,
  });

  deleteByPrefix(`comments:post:${comment.post_id}`);
  return normalizeComment(comment);
}

export async function deleteComment(id) {
  const deleted = await apiClient(`/comments/${id}`, {
    method: 'DELETE',
  });
  deleteByPrefix(`comments:post:${deleted.post_id}`);
  return normalizeComment(deleted);
}
