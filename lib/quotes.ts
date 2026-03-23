export interface Quote {
  text: string;
  author?: string;
}

export const QUOTES: Quote[] = [
  // --- Marcus Aurelius ---
  {
    text: "The impediment to action advances action. What stands in the way becomes the way.",
    author: "Marcus Aurelius",
  },
  {
    text: "You have power over your mind, not outside events. Realize this, and you will find strength.",
    author: "Marcus Aurelius",
  },
  {
    text: "Waste no more time arguing what a good man should be. Be one.",
    author: "Marcus Aurelius",
  },
  {
    text: "Be tolerant with others and strict with yourself.",
    author: "Marcus Aurelius",
  },
  {
    text: "If it is not right, do not do it. If it is not true, do not say it.",
    author: "Marcus Aurelius",
  },
  {
    text: "Confine yourself to the present.",
    author: "Marcus Aurelius",
  },
  {
    text: "What we do now echoes in eternity.",
    author: "Marcus Aurelius",
  },
  {
    text: "Never let the future disturb you. You will meet it with the same tools you have now.",
    author: "Marcus Aurelius",
  },
  {
    text: "Receive without pride, relinquish without struggle.",
    author: "Marcus Aurelius",
  },
  {
    text: "Do not indulge in dreams of what you do not have, but count the blessings you actually possess.",
    author: "Marcus Aurelius",
  },
  // --- Seneca ---
  {
    text: "We suffer more in imagination than in reality.",
    author: "Seneca",
  },
  {
    text: "Luck is what happens when preparation meets opportunity.",
    author: "Seneca",
  },
  {
    text: "Difficulties strengthen the mind, as labor does the body.",
    author: "Seneca",
  },
  {
    text: "The whole future lies in uncertainty. Live immediately.",
    author: "Seneca",
  },
  {
    text: "It is not that I am brave. It is just that I am busy.",
    author: "Seneca",
  },
  {
    text: "A gem cannot be polished without friction, nor a man perfected without trials.",
    author: "Seneca",
  },
  {
    text: "Associate with people who are likely to improve you.",
    author: "Seneca",
  },
  {
    text: "If you really want to escape the things that harass you, what you need is not to be in a different place but to be a different person.",
    author: "Seneca",
  },
  {
    text: "Begin at once to live, and count each separate day as a separate life.",
    author: "Seneca",
  },
  // --- Epictetus ---
  {
    text: "No man is free who is not master of himself.",
    author: "Epictetus",
  },
  {
    text: "Make the best use of what is in your power, and take the rest as it happens.",
    author: "Epictetus",
  },
  {
    text: "First say to yourself what you would be, and then do what you have to do.",
    author: "Epictetus",
  },
  {
    text: "How long are you going to wait before you demand the best for yourself?",
    author: "Epictetus",
  },
  {
    text: "Seek not that the things which happen should happen as you wish; but wish the things which happen to be as they are, and you will have a tranquil flow of life.",
    author: "Epictetus",
  },
  {
    text: "It's not what happens to you, but how you react to it that matters.",
    author: "Epictetus",
  },
  {
    text: "Don't explain your philosophy. Embody it.",
    author: "Epictetus",
  },
  {
    text: "We cannot choose our external circumstances, but we can always choose how we respond to them.",
    author: "Epictetus",
  },
  // --- Modern stoic-inspired, trades-grounded ---
  {
    text: "No shortcuts in the foundation. No shortcuts in the work. No shortcuts in the man.",
  },
  {
    text: "Every great structure was once a hole in the ground. Start digging.",
  },
  {
    text: "You don't control the weather, the material costs, or the client. You control your hands and your mind.",
  },
  {
    text: "The level doesn't negotiate. Neither should your standards.",
  },
  {
    text: "A craftsman isn't made in a day. He's made in a thousand days of showing up.",
  },
  {
    text: "What you do when no one is watching is who you actually are.",
  },
  {
    text: "The work doesn't lie. The finished product is your character made visible.",
  },
  {
    text: "You don't need to be the loudest person on site. Let the finished work speak.",
  },
  {
    text: "A man who blames his tools hasn't mastered his craft yet.",
  },
  {
    text: "The obstacle in the trench is not a reason to quit. It's the reason you were hired.",
  },
  {
    text: "Fatigue is an opinion. The job still needs doing.",
  },
  {
    text: "Your reputation is built one pour, one weld, one day at a time.",
  },
  {
    text: "Comfort is the enemy of progress. Lean into the hard days.",
  },
  {
    text: "The man who shows up on the worst days earns the trust that carries him on the good ones.",
  },
  {
    text: "Discipline is not a punishment. It is the price of freedom.",
  },
  {
    text: "You do not rise to the occasion. You fall to the level of your preparation.",
  },
  {
    text: "Every callus is a receipt. Every sore muscle is a proof of work.",
  },
  {
    text: "The job will test your patience before it tests your skill. Hold both.",
  },
  {
    text: "Build the kind of life that doesn't need an escape from.",
  },
  {
    text: "Control what you can. Accept what you cannot. Know the difference.",
  },
  {
    text: "A man at peace with himself is dangerous to no one and useful to everyone.",
  },
  {
    text: "Hard ground is still ground. You can build on it.",
  },
  {
    text: "The load is heavy. That is why they called you.",
  },
  {
    text: "Waste nothing — not time, not material, not effort.",
  },
  {
    text: "Check your work twice. Your name is on it long after the job closes.",
  },
];

export function todayQuote(): Quote {
  const day = Math.floor(Date.now() / 86400000);
  return QUOTES[day % QUOTES.length];
}
