import { listPosts } from '$lib/blog/list';
import { toCards } from '$lib/blog/cards.server';
import { TOPICS } from '$content/topics.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const posts = listPosts();
  return {
    posts: toCards(posts),
    /** Only clusters with something in them; an empty pillar helps nobody. */
    topics: TOPICS.map((topic) => ({
      ...topic,
      count: posts.filter((post) => post.topic === topic.slug).length
    })).filter((topic) => topic.count > 0)
  };
};
