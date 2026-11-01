export type AgentId = 'research' | 'creator' | 'scheduler' | 'analytics';

export type AgentRole = {
  id: AgentId;
  name: string;
  emoji: string;
  color: 'purple' | 'orange' | 'pink' | 'green';
  tagline: string;
  intro: string;
};

// Order matches the seat order in the office-studio JSON files.
export const agents: AgentRole[] = [
  { id: 'research', name: 'Research Agent', emoji: '🔎', color: 'purple', tagline: 'Trends & insights',
    intro: 'I dig into trends, hashtags, competitors and audience insights for your campaign.' },
  { id: 'creator', name: 'Creator Agent', emoji: '🎨', color: 'orange', tagline: 'Posts, captions & images',
    intro: 'I turn research into posts, captions, hashtags and visuals ready to publish.' },
  { id: 'scheduler', name: 'Scheduler Agent', emoji: '🗓️', color: 'pink', tagline: 'Best time to post',
    intro: 'I pick the best day and time for every post, in your audience’s timezone.' },
  { id: 'analytics', name: 'Analytics Agent', emoji: '📊', color: 'green', tagline: 'Performance insights',
    intro: 'I explain how your published posts perform and what to do next.' },
];

export const agentById = (id: AgentId) => agents.find((a) => a.id === id)!;
