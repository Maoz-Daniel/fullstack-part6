import { useOutletContext } from 'react-router-dom';

export function PostsPage() {
  const { user } = useOutletContext();

  return (
    <section className="content-panel">
      <p className="eyebrow">Posts</p>
      <h2>{user.username}'s posts area</h2>
      <p className="panel-copy">
        This route is ready for the posts feature. Full post and comment operations belong to
        the next project stage.
      </p>
    </section>
  );
}
