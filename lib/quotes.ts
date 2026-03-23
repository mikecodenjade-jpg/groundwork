export interface Quote {
  text: string;
  author?: string;
}

export const QUOTES: Quote[] = [
  // --- Original Groundwork quotes ---
  {
    text: "The foundation doesn't get credit. It just holds everything up. Be the foundation.",
  },
  {
    text: "Every structure ever built started with someone showing up on day one when no one was watching.",
  },
  {
    text: "You don't get to decide how hard the job is. You only get to decide how hard you work.",
  },
  {
    text: "Iron sharpens iron. Surround yourself with people who make you better or get off the site.",
  },
  {
    text: "Nobody ever built anything worth a damn from the couch.",
  },
  {
    text: "Your crew is watching. Lead like it matters, because it does.",
  },
  {
    text: "The guy who shows up early and stays late doesn't need to talk about his work ethic. Everybody already knows.",
  },
  {
    text: "Blueprints don't build buildings. People do. Be the person who gets it done.",
  },
  {
    text: "A wall doesn't go up all at once. It goes up one block at a time. So do you.",
  },
  {
    text: "Tough days on site don't make you weak. Quitting on tough days makes you weak.",
  },
  {
    text: "The trades built the world. Act like you know that.",
  },
  {
    text: "You're not grinding for a pat on the back. You're grinding because that's who you are.",
  },
  {
    text: "If your foundation is off by an inch, your whole building is crooked. Get the basics right first.",
  },
  {
    text: "Asking for help doesn't mean you're soft. It means you're smart enough to know one man can't frame a house alone.",
  },
  {
    text: "Nobody remembers the days you coasted. They remember the days you carried the crew.",
  },
  {
    text: "Mental toughness isn't ignoring the pain. It's showing up anyway.",
  },
  {
    text: "You don't rise to the level of your goals. You fall to the level of your habits.",
  },
  {
    text: "The site doesn't care about your excuses. Neither does the schedule.",
  },
  {
    text: "A foreman who won't pick up a shovel isn't a leader. He's a spectator.",
  },
  {
    text: "Rest when you need to. But don't you dare confuse rest with giving up.",
  },
  {
    text: "The hardest part of any pour is the first truck. After that, you just keep moving.",
  },
  {
    text: "Every callus on your hands is a receipt for work that got done.",
  },
  {
    text: "Complaining about the weather doesn't change the weather. Grab your gear and get after it.",
  },
  {
    text: "The building doesn't know if you felt like showing up. It only knows if you did.",
  },
  {
    text: "Talking about what you're going to build is easy. Pouring the slab is the hard part.",
  },
  {
    text: "If you're the smartest guy on the site, you're on the wrong site.",
  },
  {
    text: "Check on your guys. The toughest dude on your crew might be fighting the hardest battle off the clock.",
  },
  {
    text: "You weren't built for comfort. You were built for work that matters.",
  },
  {
    text: "Discipline on Monday is worth more than motivation on Friday.",
  },
  {
    text: "A level doesn't lie and neither should you. Hold yourself to the standard.",
  },
  {
    text: "When the load gets heavy, you don't drop it. You call for another set of hands. That's not weakness. That's how buildings go up.",
  },
  {
    text: "Your body is a tool. Maintain it like you'd maintain any piece of equipment that keeps the job moving.",
  },
  {
    text: "Punch the clock. Do the work. Go home better than you came in.",
  },
  {
    text: "Nobody handed you these skills. You earned them in the dirt, the cold, and the heat.",
  },
  {
    text: "Build something today that'll still be standing when you're gone. That's legacy.",
  },
  // --- Attributed quotes ---
  {
    text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Aristotle",
  },
  {
    text: "The more you sweat in training, the less you bleed in combat.",
    author: "Richard Marcinko",
  },
  {
    text: "Hard work beats talent when talent doesn't work hard.",
    author: "Tim Notke",
  },
  {
    text: "Suffer the pain of discipline or suffer the pain of regret.",
    author: "Jim Rohn",
  },
  {
    text: "It's not the size of the dog in the fight. It's the size of the fight in the dog.",
    author: "Mark Twain",
  },
  {
    text: "Do your job.",
    author: "Bill Belichick",
  },
  {
    text: "The only easy day was yesterday.",
    author: "US Navy SEALs",
  },
  {
    text: "You can't build a reputation on what you're going to do.",
    author: "Henry Ford",
  },
  {
    text: "Strength does not come from winning. Your struggles develop your strengths.",
    author: "Arnold Schwarzenegger",
  },
  {
    text: "The impediment to action advances action. What stands in the way becomes the way.",
    author: "Marcus Aurelius",
  },
  {
    text: "I fear not the man who has practiced 10,000 kicks once, but the man who has practiced one kick 10,000 times.",
    author: "Bruce Lee",
  },
  {
    text: "Everybody has a plan until they get punched in the mouth.",
    author: "Mike Tyson",
  },
  {
    text: "If it doesn't challenge you, it doesn't change you.",
    author: "Fred DeVito",
  },
  {
    text: "The best time to plant a tree was twenty years ago. The second best time is now.",
    author: "Chinese Proverb",
  },
  {
    text: "Stay ready so you don't have to get ready.",
    author: "Will Smith",
  },
  {
    text: "A man who wants to lead the orchestra must turn his back on the crowd.",
    author: "Max Lucado",
  },
  {
    text: "Don't count the days. Make the days count.",
    author: "Muhammad Ali",
  },
  {
    text: "The successful warrior is the average man, with laser-like focus.",
    author: "Bruce Lee",
  },
  {
    text: "He who is not courageous enough to take risks will accomplish nothing in life.",
    author: "Muhammad Ali",
  },
  {
    text: "Sweat more in practice, bleed less in war.",
    author: "Spartan Warrior Creed",
  },
];

export function todayQuote(): Quote {
  const day = Math.floor(Date.now() / 86400000);
  return QUOTES[day % QUOTES.length];
}
