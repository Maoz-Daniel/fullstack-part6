import { apiClient } from './apiClient.js';

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

  return {
    data: data.map(normalizePost),
    nextPage,
  };
}

export async function createPost(payload) {
  const post = await apiClient('/posts', {
    method: 'POST',
    body: payload,
  });

  return normalizePost(post);
}

export async function updatePost(id, payload) {
  const post = await apiClient(`/posts/${id}`, {
    method: 'PUT',
    body: payload,
  });

  return normalizePost(post);
}

export function deletePost(id) {
  return apiClient(`/posts/${id}`, {
    method: 'DELETE',
  });
}

export async function getComments({ postId }) {
  const params = new URLSearchParams({ postId: String(postId) });
  const comments = await apiClient(`/comments?${params.toString()}`);
  return comments.map(normalizeComment);
}

export async function createComment(payload) {
  const comment = await apiClient('/comments', {
    method: 'POST',
    body: payload,
  });

  return normalizeComment(comment);
}

export async function updateComment(id, payload) {
  const comment = await apiClient(`/comments/${id}`, {
    method: 'PUT',
    body: payload,
  });

  return normalizeComment(comment);
}

export function deleteComment(id) {
  return apiClient(`/comments/${id}`, {
    method: 'DELETE',
  });
}
