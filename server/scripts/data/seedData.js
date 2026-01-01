/**
 * Seed Data - Realistic content for database seeding
 * Contains users, posts, comments, communities, and messages
 */

// ========================================
// USER DATA
// ========================================

const SEED_USERS = [
  // Power users (more active, more followers)
  { firstName: 'Ahmed', lastName: 'Hassan', specialization: 'Full Stack Developer', location: 'Cairo, Egypt', bio: 'Building web apps with React & Node.js. Open source enthusiast. Always learning.' },
  { firstName: 'Sarah', lastName: 'Mohamed', specialization: 'UI/UX Designer', location: 'Alexandria, Egypt', bio: 'Designing intuitive experiences. Figma lover. Coffee addict ☕' },
  { firstName: 'Omar', lastName: 'Khaled', specialization: 'Backend Engineer', location: 'Giza, Egypt', bio: 'Node.js | Python | MongoDB. Building scalable systems.' },
  { firstName: 'Nour', lastName: 'Ibrahim', specialization: 'Data Scientist', location: 'Cairo, Egypt', bio: 'Turning data into insights. ML/AI enthusiast. PhD candidate.' },
  { firstName: 'Youssef', lastName: 'Ali', specialization: 'DevOps Engineer', location: 'Mansoura, Egypt', bio: 'Cloud architecture | CI/CD | Kubernetes. Making deployments smooth.' },
  
  // Regular active users
  { firstName: 'Fatma', lastName: 'Mahmoud', specialization: 'Frontend Developer', location: 'Tanta, Egypt', bio: 'React.js developer. CSS enthusiast. Building beautiful UIs.' },
  { firstName: 'Mohamed', lastName: 'Samir', specialization: 'Mobile Developer', location: 'Aswan, Egypt', bio: 'Flutter & React Native. Cross-platform apps that shine.' },
  { firstName: 'Mariam', lastName: 'Ahmed', specialization: 'Product Manager', location: 'Cairo, Egypt', bio: 'Bridging tech and business. Agile certified. User-first mindset.' },
  { firstName: 'Karim', lastName: 'Nasser', specialization: 'Security Engineer', location: 'Alexandria, Egypt', bio: 'Ethical hacker. OSCP certified. Keeping systems safe.' },
  { firstName: 'Dina', lastName: 'Fathy', specialization: 'QA Engineer', location: 'Giza, Egypt', bio: 'Quality is not an act, it\'s a habit. Test automation specialist.' },
  
  { firstName: 'Hassan', lastName: 'Youssef', specialization: 'Cloud Architect', location: 'Cairo, Egypt', bio: 'AWS Solutions Architect. Multi-cloud expert. Cost optimization wizard.' },
  { firstName: 'Layla', lastName: 'Adel', specialization: 'AI Researcher', location: 'Cairo, Egypt', bio: 'Deep learning researcher. NLP specialist. Published in top conferences.' },
  { firstName: 'Tamer', lastName: 'Reda', specialization: 'Tech Lead', location: 'Mansoura, Egypt', bio: 'Leading engineering teams. Mentor. Clean code advocate.' },
  { firstName: 'Salma', lastName: 'Hany', specialization: 'Graphics Designer', location: 'Alexandria, Egypt', bio: 'Visual storyteller. Brand identity specialist. Adobe Creative Suite.' },
  { firstName: 'Khaled', lastName: 'Mostafa', specialization: 'System Administrator', location: 'Cairo, Egypt', bio: 'Linux enthusiast. Network security. Keeping servers running 24/7.' },
  
  { firstName: 'Rania', lastName: 'Ashraf', specialization: 'Business Analyst', location: 'Giza, Egypt', bio: 'Requirements engineering. Data-driven decisions. Stakeholder management.' },
  { firstName: 'Amr', lastName: 'Gamal', specialization: 'Embedded Systems', location: 'Tanta, Egypt', bio: 'IoT developer. Arduino & Raspberry Pi. Hardware meets software.' },
  { firstName: 'Yasmin', lastName: 'Tarek', specialization: 'Content Strategist', location: 'Cairo, Egypt', bio: 'SEO specialist. Technical writing. Making complex things simple.' },
  { firstName: 'Mahmoud', lastName: 'Sayed', specialization: 'Database Administrator', location: 'Alexandria, Egypt', bio: 'PostgreSQL | MongoDB | Redis. Performance tuning expert.' },
  { firstName: 'Heba', lastName: 'Magdy', specialization: 'Scrum Master', location: 'Cairo, Egypt', bio: 'Certified Scrum Master. Facilitating high-performing teams.' },
  
  // Moderate users
  { firstName: 'Ali', lastName: 'Hussein', specialization: 'Game Developer', location: 'Giza, Egypt', bio: 'Unity3D developer. Building immersive experiences.' },
  { firstName: 'Aya', lastName: 'Sameh', specialization: 'ML Engineer', location: 'Cairo, Egypt', bio: 'TensorFlow | PyTorch. Deploying ML models at scale.' },
  { firstName: 'Mostafa', lastName: 'Kamal', specialization: 'Blockchain Developer', location: 'Alexandria, Egypt', bio: 'Smart contracts. Web3 enthusiast. Solidity developer.' },
  { firstName: 'Mona', lastName: 'Raouf', specialization: 'Technical Writer', location: 'Cairo, Egypt', bio: 'Documentation specialist. API docs. Developer experience.' },
  { firstName: 'Yasser', lastName: 'Mahmoud', specialization: 'Network Engineer', location: 'Mansoura, Egypt', bio: 'CCNA certified. Network infrastructure. Troubleshooting expert.' },
  
  { firstName: 'Noha', lastName: 'Essam', specialization: 'iOS Developer', location: 'Cairo, Egypt', bio: 'Swift developer. Building beautiful iOS apps.' },
  { firstName: 'Walid', lastName: 'Fawzy', specialization: 'Android Developer', location: 'Giza, Egypt', bio: 'Kotlin | Jetpack Compose. Material Design advocate.' },
  { firstName: 'Eman', lastName: 'Sobhy', specialization: 'HR Manager', location: 'Cairo, Egypt', bio: 'Tech recruitment. Building diverse teams. Employee experience.' },
  { firstName: 'Tarek', lastName: 'Hamdy', specialization: 'Solutions Architect', location: 'Alexandria, Egypt', bio: 'Enterprise architecture. Microservices. System design.' },
  { firstName: 'Shaimaa', lastName: 'Wagdy', specialization: 'UX Researcher', location: 'Cairo, Egypt', bio: 'User interviews. Usability testing. Research-driven design.' },
  
  // Less active users
  { firstName: 'Adel', lastName: 'Farouk', specialization: 'Junior Developer', location: 'Tanta, Egypt', bio: 'Learning web development. React beginner. Always curious.' },
  { firstName: 'Nadia', lastName: 'Helmy', specialization: 'Intern', location: 'Cairo, Egypt', bio: 'Computer Science student. Eager to learn and grow.' },
  { firstName: 'Hazem', lastName: 'Salem', specialization: 'Freelancer', location: 'Alexandria, Egypt', bio: 'Freelance web developer. Available for projects.' },
  { firstName: 'Asmaa', lastName: 'Nabil', specialization: 'Student', location: 'Giza, Egypt', bio: 'ITI student. Learning full stack development.' },
  { firstName: 'Samy', lastName: 'Rashad', specialization: 'Career Changer', location: 'Cairo, Egypt', bio: 'Transitioning to tech. Former accountant learning to code.' },
  
  { firstName: 'Reem', lastName: 'Fouad', specialization: 'Marketing', location: 'Cairo, Egypt', bio: 'Digital marketing. Growth hacking. Analytics.' },
  { firstName: 'Fady', lastName: 'Atef', specialization: 'Support Engineer', location: 'Mansoura, Egypt', bio: 'Customer support. Technical troubleshooting.' },
  { firstName: 'Hana', lastName: 'Ossama', specialization: 'Junior QA', location: 'Alexandria, Egypt', bio: 'Learning test automation. Bug hunter.' },
  { firstName: 'Sherif', lastName: 'Badr', specialization: 'Graduate', location: 'Cairo, Egypt', bio: 'Fresh graduate. Looking for opportunities.' },
  { firstName: 'Marwa', lastName: 'Lotfy', specialization: 'Designer', location: 'Giza, Egypt', bio: 'Visual designer. Canva expert. Social media graphics.' }
];

// ========================================
// POST DATA - High-value realistic content
// ========================================

const SEED_POSTS = [
  // Discussion posts
  {
    content: `Just finished migrating our monolith to microservices after 8 months of work. Here's what I learned:

1. Start with clear service boundaries - we spent 2 months just mapping our domain
2. Don't underestimate data migration - it took 40% of our total time
3. Invest in observability from day one - distributed tracing saved us countless debugging hours
4. Communication overhead is real - our Slack channels exploded

The result? 3x faster deployments and teams that can actually move independently.

Would love to hear about your microservices journey!`,
    tags: ['technology', 'Career'],
    intent: 'experience'
  },
  {
    content: `Question for senior devs: How do you handle imposter syndrome?

I've been coding for 5 years now, lead a team of 6, yet every code review I give, I second-guess myself. "Am I being too harsh?" "Did I miss something obvious?"

The funny thing is, my team seems to respect my feedback. But internally, I feel like I'm faking it.

Anyone else deal with this? How do you push through?`,
    tags: ['Career', 'Education'],
    intent: 'question'
  },
  {
    content: `Hot take: Most "clean code" discussions miss the point.

We debate tabs vs spaces, single vs double quotes, while shipping code that:
- Has no error handling
- Lacks proper logging
- Has zero documentation
- Ignores edge cases

Clean code isn't about aesthetics. It's about code that doesn't break at 3 AM.

What's your unpopular clean code opinion?`,
    tags: ['technology', 'Career'],
    intent: 'discussion'
  },
  
  // Insight posts
  {
    content: `After interviewing 200+ candidates this year, here are the red flags I look for:

🚩 Can't explain their own projects
🚩 Only talks about tools, not problems solved
🚩 Never asks questions about the team/culture
🚩 Gets defensive about code review feedback
🚩 Claims to "know everything"

Green flags? Curiosity, honesty about gaps, and asking thoughtful questions.

Hiring managers, what are your red flags?`,
    tags: ['Career', 'Business'],
    intent: 'insight'
  },
  {
    content: `The best debugging technique I've learned: Rubber Duck Debugging.

Sounds silly, but explaining your code line by line (even to an inanimate object) forces you to think clearly.

Last week, I spent 3 hours on a bug. Started explaining it to my colleague... solved it in 2 minutes before they even responded.

What's your go-to debugging technique?`,
    tags: ['technology', 'Education'],
    intent: 'insight'
  },
  {
    content: `Unpopular opinion: Junior developers should NOT start with React.

Hear me out. React abstracts away so much:
- DOM manipulation
- State management basics
- How browsers actually work

I've interviewed React devs who couldn't write vanilla JS event handlers.

Start with HTML, CSS, vanilla JS. Then frameworks make SO much more sense.

Agree or disagree?`,
    tags: ['technology', 'Education'],
    intent: 'discussion'
  },

  // Announcement posts
  {
    content: `🎉 Excited to share: I just passed the AWS Solutions Architect Professional exam!

This was my 4th attempt (yes, really). Failed 3 times in 2023.

What changed:
- Stopped just watching videos, started building
- Joined a study group for accountability  
- Did 500+ practice questions
- Built 3 real projects on AWS

If you're struggling with certifications, don't give up. The journey matters more than the timeline.`,
    tags: ['technology', 'Career'],
    intent: 'announcement'
  },
  {
    content: `📢 We're hiring! Looking for 3 mid-level developers to join our fintech startup in Cairo.

Stack: React, Node.js, PostgreSQL, AWS

What we offer:
- Competitive salary + equity
- Remote-first culture
- Learning budget
- Small team, big impact

DM me if interested or tag someone who might be!`,
    tags: ['Career', 'Business'],
    intent: 'announcement'
  },

  // Question posts
  {
    content: `Quick question: What's your preferred state management solution in 2024?

I've used:
- Redux (powerful but verbose)
- MobX (magical but hard to debug)
- Zustand (simple but limited?)
- React Query (for server state)

Building a new project and can't decide. What works best for a medium-sized app?`,
    tags: ['technology'],
    intent: 'question'
  },
  {
    content: `Struggling with a design decision. Need advice!

Building a notification system. Should I:
A) Poll every 30 seconds (simple but wasteful)
B) WebSockets (real-time but complex)
C) Server-Sent Events (middle ground?)

Scale: ~10k concurrent users expected.

What would you choose and why?`,
    tags: ['technology', 'Career'],
    intent: 'question'
  },

  // Experience posts
  {
    content: `6 months as a tech lead - honest reflection:

What I expected: Writing less code, more architecture
Reality: Writing MUCH less code, mostly in meetings 😅

What I expected: Team would need constant guidance
Reality: They're incredibly capable, I just remove blockers

What I expected: Missing coding
Reality: Seeing others grow is actually more fulfilling

Biggest lesson: Leadership isn't about being the smartest. It's about making others successful.`,
    tags: ['Career', 'Business'],
    intent: 'experience'
  },
  {
    content: `Story time: The worst production bug I ever shipped.

Pushed a "small fix" on Friday at 5 PM (first mistake). Didn't test edge cases (second mistake). No feature flag (third mistake).

Result: Our payment system double-charged 2,000 customers.

We spent the weekend:
1. Rolling back
2. Processing refunds
3. Sending apology emails
4. Writing post-mortem

Lessons: Never deploy on Fridays. Always test payment flows. Feature flags are not optional.

What's your worst production story?`,
    tags: ['technology', 'Career'],
    intent: 'experience'
  },

  // Tutorial/Learning posts
  {
    content: `Quick tip that saved me hours: Git worktrees.

Instead of stashing or creating new clones to work on multiple branches:

\`git worktree add ../feature-branch feature-branch\`

Now you have two separate folders, two branches, zero stashing.

Perfect for:
- Reviewing PRs while working on features
- Hotfixes without disrupting your flow
- Comparing implementations

Who else uses worktrees?`,
    tags: ['technology', 'Education'],
    intent: 'insight'
  },
  {
    content: `The one VSCode shortcut that 10x'd my productivity:

Ctrl+Shift+L (Cmd+Shift+L on Mac)

Select all occurrences of current selection.

Need to rename a variable in 20 places? One shortcut.
Need to change all "className" to "class"? One shortcut.
Need to add quotes around multiple strings? One shortcut.

What's YOUR most-used shortcut?`,
    tags: ['technology'],
    intent: 'insight'
  },

  // Community/Culture posts
  {
    content: `Can we talk about meeting culture in tech?

My calendar yesterday:
- 9:00 - Standup
- 10:00 - Sprint planning
- 11:30 - 1:1 with manager
- 13:00 - Design review
- 14:30 - Technical discussion
- 16:00 - All-hands

When exactly am I supposed to... code?

Seriously though, how do you protect your focus time?`,
    tags: ['Career', 'Business'],
    intent: 'discussion'
  },
  {
    content: `Appreciation post for my team 💙

Yesterday's deployment had an unexpected issue at 11 PM.

Without being asked:
- Backend lead jumped on the call
- DevOps fixed the infra in 20 minutes
- QA verified the fix immediately
- PM handled customer communication

Resolved by midnight. No blame, just teamwork.

This is what a healthy engineering culture looks like. Grateful to work with these people.`,
    tags: ['Career'],
    intent: 'experience'
  },

  // Learning journey posts
  {
    content: `Learning TypeScript after 4 years of JavaScript was humbling.

Week 1: "Why do I need types? This is so verbose!"
Week 2: "Okay, autocomplete is nice..."
Week 4: "How did I ever code without this?"
Week 8: "I can't imagine going back"

The type errors that annoyed me now save me hours of debugging.

Anyone else had this journey?`,
    tags: ['technology', 'Education'],
    intent: 'experience'
  },
  {
    content: `Just completed my first open source contribution! 🎉

It was just a documentation fix - correcting a typo and adding an example.

But the feeling when the maintainer merged it? Incredible.

Next goal: Actual code contribution.

Any tips for first-time open source contributors?`,
    tags: ['technology', 'Career'],
    intent: 'announcement'
  },

  // Technical deep-dive posts
  {
    content: `Why I stopped using console.log for debugging:

Instead, I use the debugger statement + Chrome DevTools.

Benefits:
- Inspect ALL variables at any point
- Step through code execution
- Set conditional breakpoints
- Watch expressions
- No cleanup needed (no removing logs)

Yes, there's a learning curve. But once you get it, you'll never go back.

What's your debugging setup?`,
    tags: ['technology'],
    intent: 'insight'
  },
  {
    content: `Database indexing explained simply:

Imagine a phone book with 1 million names.

Without index: Read every single page to find "Ahmed"
With index: Jump straight to "A" section

That's what database indexes do. They create a shortcut.

But too many indexes = slower writes (updating the shortcuts takes time).

Rule of thumb: Index columns you frequently search/filter by.

What's your indexing strategy?`,
    tags: ['technology', 'Education'],
    intent: 'insight'
  },

  // Career advice posts
  {
    content: `Salary negotiation tip that worked for me:

Instead of: "I want X amount"

Say: "Based on my research for this role in this market, considering my Y years of experience and Z specific skills, I'm looking at a range of X to X+20%"

The difference:
- Shows you've done homework
- Gives a range (easier to negotiate)
- Backs up with specifics

Negotiated 30% higher than initial offer using this approach.

What negotiation tips do you have?`,
    tags: ['Career', 'Business'],
    intent: 'insight'
  },
  {
    content: `Portfolio projects that actually got me interviews:

❌ Todo app
❌ Calculator
❌ Weather app (using free API)

✅ Full-stack e-commerce with payments
✅ Real-time chat with WebSockets
✅ Dashboard with actual data visualization
✅ Open source contribution links

The difference? Showing you can build COMPLETE features, not just follow tutorials.

What projects helped YOUR career?`,
    tags: ['Career', 'Education'],
    intent: 'insight'
  },

  // Design/UX posts
  {
    content: `UX tip: The best error messages tell you:

1. What happened
2. Why it happened  
3. How to fix it

Bad: "Error occurred"
Good: "Couldn't save your changes because you're offline. Check your connection and try again."

Bad: "Invalid input"
Good: "Password must be at least 8 characters. You entered 6."

Small changes, huge impact on user experience.`,
    tags: ['technology', 'arts'],
    intent: 'insight'
  },
  {
    content: `Design systems saved our startup.

Before: Every developer made their own button styles. 15 different shades of blue. Inconsistent spacing everywhere.

After implementing a design system:
- Development 40% faster (components ready to use)
- Perfect consistency across 12 screens
- Designers and devs speak same language

Investment: 3 weeks to set up
Return: Every sprint since

If you're not using a design system, you're wasting time.`,
    tags: ['technology', 'arts'],
    intent: 'experience'
  },

  // Remote work posts
  {
    content: `Hot take on remote work: It's not for everyone, and that's okay.

I LOVE working from home. No commute, flexible hours, deep focus.

But my colleague? She struggled for months. Missed the office energy, found it hard to disconnect, felt isolated.

She switched to hybrid and is thriving now.

Stop pushing one-size-fits-all solutions. Different people, different needs.`,
    tags: ['Career', 'Business'],
    intent: 'discussion'
  },
  {
    content: `Remote work productivity hack:

The "fake commute."

Before work: 15-minute walk around the block
After work: Same walk

Why it works:
- Creates mental boundary between work/life
- Gets you moving (WFH = lots of sitting)
- Fresh air clears the mind
- Signals brain "work time" and "rest time"

Simple but effective. Been doing this for 2 years.`,
    tags: ['Career', 'Health'],
    intent: 'insight'
  },

  // AI/Tech trends posts
  {
    content: `Hot take: AI won't replace developers. Developers who use AI will replace those who don't.

I use GitHub Copilot daily now. Does it write all my code? No.

But it:
- Autocompletes boilerplate 
- Suggests test cases I might miss
- Helps with regex (thank god)
- Speeds up documentation

Think of it as a very smart autocomplete, not a replacement.

How are you using AI in your workflow?`,
    tags: ['technology', 'Career'],
    intent: 'discussion'
  },
  {
    content: `The AI hype vs reality in 2024:

Hype: "AI will write all our code!"
Reality: Still debugging AI-generated code

Hype: "Replace all customer support!"
Reality: Chatbots still can't handle complex issues

Hype: "Perfect image generation!"
Reality: Still gives people 6 fingers sometimes

AI is powerful. But we're in the "useful tool" phase, not the "replacement" phase.

Stay curious, stay learning, but don't panic.`,
    tags: ['technology', 'Business'],
    intent: 'insight'
  },

  // Mental health/Burnout posts
  {
    content: `Took a mental health day yesterday. No guilt.

Signs I needed it:
- Staring at code but nothing making sense
- Snapping at colleagues in code reviews
- Dreading opening my laptop
- Couldn't sleep thinking about work

What I did instead: Walked in nature, cooked a real meal, slept 10 hours.

Today? Fresh perspective, actually productive.

It's not weakness. It's maintenance.`,
    tags: ['Career', 'Health'],
    intent: 'experience'
  },
  {
    content: `Burnout is not a badge of honor.

I used to brag about working 12-hour days. "Hustle culture." "Grind mode."

Then I crashed. Hard. Couldn't code for 3 months.

Now I:
- Work 8 hours max (with rare exceptions)
- Take all my vacation days
- Completely disconnect on weekends
- Exercise 3x per week

Productivity actually increased. Weird, right?

Take care of yourselves, folks.`,
    tags: ['Career', 'Health'],
    intent: 'experience'
  },

  // More technical posts
  {
    content: `API design mistake I see everywhere:

POST /createUser
POST /deleteUser  
POST /updateUser

vs

POST /users
DELETE /users/:id
PATCH /users/:id

RESTful design uses:
- HTTP methods for actions
- URLs for resources
- Status codes for results

Your future self (and other developers) will thank you.`,
    tags: ['technology', 'Education'],
    intent: 'insight'
  },
  {
    content: `The hardest part of programming isn't writing code.

It's:
- Understanding requirements that keep changing
- Estimating how long things take
- Communicating technical concepts to non-technical people
- Saying "no" to feature creep
- Maintaining code you wrote 6 months ago

Code is actually the easy part 😅`,
    tags: ['technology', 'Career'],
    intent: 'insight'
  },

  // Community building posts
  {
    content: `Started a coding study group 6 months ago.

What started as 4 friends meeting weekly on Zoom is now:
- 45 active members
- 3 landed new jobs
- 2 got promoted
- 1 launched a startup

The power of community is real.

If you're learning alone, find or create a group. It changes everything.`,
    tags: ['Education', 'Career'],
    intent: 'experience'
  },
  {
    content: `To the senior devs who take time to mentor juniors:

THANK YOU.

That "quick 30-minute call" you had with me 3 years ago? I still use the advice today.

That code review where you explained WHY, not just what? Changed how I think about code.

You might not remember, but we do.

Tag a mentor who made a difference in your career! 👇`,
    tags: ['Career', 'Education'],
    intent: 'experience'
  }
];

// ========================================
// COMMENT DATA - Contextual responses
// ========================================

const SEED_COMMENTS = {
  // Comments for different post types
  agreement: [
    "This resonates so much! Went through the exact same thing.",
    "100% agree. I've been saying this for years.",
    "Finally someone said it! This is spot on.",
    "Couldn't agree more. Thanks for sharing this perspective.",
    "This is exactly what I needed to hear today.",
    "Yes! This is the way. More people need to understand this.",
    "Absolutely. This should be required reading for every dev.",
    "You nailed it. This is so underrated advice.",
  ],
  
  disagreement: [
    "Interesting perspective, but I see it differently...",
    "Not sure I agree. In my experience...",
    "Valid points, but there's another side to consider.",
    "I get where you're coming from, but what about...",
    "Respectfully disagree. Here's my take...",
  ],
  
  question: [
    "Great post! Quick question - how do you handle...?",
    "Love this. Did you consider...?",
    "Super helpful! What about edge cases like...?",
    "Thanks for sharing! How long did it take you to...?",
    "Interesting approach. What tools do you use for...?",
    "This is helpful! Can you elaborate on...?",
  ],
  
  experience: [
    "I tried this and it worked great for us too!",
    "Similar experience here. We also found that...",
    "Been there! What helped us was...",
    "This is exactly what we did at my last company.",
    "We implemented something similar. The key was...",
  ],
  
  thanks: [
    "Thanks for sharing! Really helpful.",
    "Bookmarking this. Super valuable content.",
    "This is gold. Thank you!",
    "Exactly what I was looking for. Thanks!",
    "Saved! This will definitely help.",
    "Great content as always. Appreciate you sharing!",
  ],
  
  advice: [
    "Pro tip: also consider...",
    "One thing to add - don't forget to...",
    "Great advice! I'd also recommend...",
    "Building on this - another thing that helps is...",
    "Solid advice. Another approach is to...",
  ],
  
  technical: [
    "Have you tried using X instead? Might be more efficient.",
    "Good approach! For scale, you might also want to...",
    "Nice! One optimization could be...",
    "This is solid. For production, I'd also add...",
    "Great solution! We had similar issue and used...",
  ]
};

// ========================================
// REPLY DATA - Conversational follow-ups
// ========================================

const SEED_REPLIES = [
  "Good point! I hadn't considered that.",
  "Thanks for the feedback!",
  "Interesting, I'll try that approach.",
  "That makes sense. Thanks!",
  "Appreciate the insight!",
  "You're right, that's a good addition.",
  "Thanks for sharing your experience!",
  "Great suggestion, will look into it.",
  "Fair point, thanks for the perspective.",
  "That's helpful, thanks!",
  "Noted! Will keep that in mind.",
  "Makes sense. Thanks for clarifying!",
];

// ========================================
// COMMUNITY DATA
// ========================================

const SEED_COMMUNITIES = [
  {
    name: 'React Developers Egypt',
    description: 'A community for React developers in Egypt to share knowledge, discuss best practices, and help each other grow. From hooks to Next.js, all React topics welcome!',
    tags: ['technology']
  },
  {
    name: 'Backend Engineering',
    description: 'Deep dives into backend development. Node.js, Python, databases, APIs, microservices, and system design discussions.',
    tags: ['technology', 'Education']
  },
  {
    name: 'Career Growth & Development',
    description: 'Navigate your tech career with confidence. Job hunting tips, interview prep, salary negotiation, and career transitions discussed here.',
    tags: ['Career', 'Business']
  },
  {
    name: 'UI/UX Design Hub',
    description: 'Where designers meet. Share your work, get feedback, discuss design systems, accessibility, and user research.',
    tags: ['arts', 'technology']
  },
  {
    name: 'DevOps & Cloud',
    description: 'CI/CD pipelines, Kubernetes, AWS, GCP, Azure - all things DevOps and cloud infrastructure.',
    tags: ['technology']
  },
  {
    name: 'AI & Machine Learning',
    description: 'Exploring the future of AI. Deep learning, NLP, computer vision, and practical ML applications.',
    tags: ['technology', 'Science']
  },
  {
    name: 'Startup Founders',
    description: 'For tech entrepreneurs building the next big thing. Share experiences, seek advice, find co-founders.',
    tags: ['Business', 'Career']
  },
  {
    name: 'Code Review Corner',
    description: 'Get constructive feedback on your code. A supportive community for improving code quality together.',
    tags: ['technology', 'Education']
  },
  {
    name: 'Women in Tech Egypt',
    description: 'Empowering women in the Egyptian tech industry. Networking, mentorship, and support.',
    tags: ['Career', 'Education']
  },
  {
    name: 'Open Source Contributors',
    description: 'Connect with other open source enthusiasts. Find projects, get help with first contributions, share your work.',
    tags: ['technology', 'Hobbies']
  },
  {
    name: 'Mobile Development',
    description: 'iOS, Android, Flutter, React Native - everything mobile. Share tips, discuss frameworks, solve problems together.',
    tags: ['technology']
  },
  {
    name: 'Tech Interview Prep',
    description: 'Crack the coding interview. LeetCode discussions, system design prep, behavioral question tips.',
    tags: ['Career', 'Education']
  }
];

// ========================================
// MESSAGE DATA
// ========================================

const SEED_MESSAGE_THREADS = [
  {
    context: 'following_up_post',
    messages: [
      "Hey! Loved your post about microservices migration. We're about to start something similar.",
      "Thanks! Happy to chat about it. What's your current architecture?",
      "Mostly monolithic Django app. About 200k lines of code.",
      "That's substantial! We were around 150k. First thing I'd recommend is a solid domain mapping exercise.",
      "Makes sense. Any resources you'd recommend?",
      "I'll DM you some docs we created. Also, the book 'Building Microservices' by Sam Newman is excellent.",
      "Perfect, thanks so much! Really appreciate it."
    ]
  },
  {
    context: 'job_inquiry',
    messages: [
      "Hi! Saw your post about hiring React developers. Is the position still open?",
      "Hey! Yes, still looking. Have you sent your CV?",
      "Not yet, wanted to ask a few questions first. Is the role fully remote?",
      "Hybrid - 2 days in office (Maadi), 3 days remote. Does that work for you?",
      "That works! One more question - what's the team size?",
      "Currently 5 developers. You'd be working closely with 2 senior devs.",
      "Sounds great! Sending my CV now. Thanks for the info!"
    ]
  },
  {
    context: 'mentorship',
    messages: [
      "Hi! I'm a junior dev and really admire your work. Would you have time for a quick call sometime?",
      "Of course! I remember being in your shoes. What would you like to discuss?",
      "Mostly career direction. I'm torn between frontend and backend specialization.",
      "That's a common dilemma. Let's schedule a 30-min call. How's Thursday?",
      "Thursday works! Thank you so much. This means a lot.",
      "No problem at all. I'll send you a calendar invite."
    ]
  },
  {
    context: 'collaboration',
    messages: [
      "Hey! I'm building an open source project that could use a UI/UX perspective. Interested in collaborating?",
      "Sounds interesting! What's the project about?",
      "It's a developer tool for API documentation. Like Swagger but more interactive.",
      "Oh cool! I've been frustrated with existing tools. Would love to take a look.",
      "Great! Here's the GitHub repo. Let me know your thoughts.",
      "Will check it out this weekend and get back to you!",
      "Awesome, looking forward to your feedback!"
    ]
  },
  {
    context: 'casual',
    messages: [
      "That meme you shared in the comments was hilarious 😂",
      "Haha glad you liked it! Tech humor keeps us sane.",
      "For real. The debugging one yesterday was so accurate.",
      "We should have a meme channel in the community 😄",
      "I'd support that! Make it happen haha"
    ]
  }
];

module.exports = {
  SEED_USERS,
  SEED_POSTS,
  SEED_COMMENTS,
  SEED_REPLIES,
  SEED_COMMUNITIES,
  SEED_MESSAGE_THREADS
};
