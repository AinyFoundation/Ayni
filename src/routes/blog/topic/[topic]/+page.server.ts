import { error } from '@sveltejs/kit';
import { listPostsByTopic } from '$lib/blog/list';
import { toCards } from '$lib/blog/cards.server';
import { TOPIC_BY_SLUG, TOPIC_SLUGS } from '$content/topics.js';
import type { EntryGenerator, PageServerLoad } from './$types';

/**
 * Prerender one pillar per cluster.
 *
 * Every cluster gets a page even when empty, because the pillar is the hub
 * posts link back to — it has to exist before the first post in that cluster
 * does, or that post ships a dead link.
 */
export const entries: EntryGenerator = () => TOPIC_SLUGS.map((topic) => ({ topic }));

export const load: PageServerLoad = async ({ params }) => {
  const topic = TOPIC_BY_SLUG.get(params.topic);
  if (!topic) error(404, `No such topic: ${params.topic}`);

  return { topic, posts: toCards(listPostsByTopic(params.topic)) };
};
