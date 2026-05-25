// server/database/seedData.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const CompanyDataset = require('../models/CompanyDataset');

// ─────────────────────────────────────────────────────────
// COMPREHENSIVE QUESTION DATASET
// Sources: GeeksforGeeks, LeetCode Discussions,
//          Glassdoor Interview Experiences, Kaggle Datasets
// ─────────────────────────────────────────────────────────

const questions = [

  // ══════════════════════════════════════════════════════
  // FRONTEND — GENERAL
  // Source: GeeksforGeeks Frontend Interview Questions
  // ══════════════════════════════════════════════════════
  {
    company: 'general', role: 'frontend', difficulty: 'easy',
    source: 'geeksforgeeks', tags: ['html', 'basics'], qualityScore: 9,
    question: 'What is the difference between HTML, CSS, and JavaScript? Explain with a simple example of how they work together on a webpage.',
  },
  {
    company: 'general', role: 'frontend', difficulty: 'easy',
    source: 'geeksforgeeks', tags: ['css', 'box-model'], qualityScore: 9,
    question: 'Explain the CSS Box Model. What are the differences between margin, padding, and border?',
  },
  {
    company: 'general', role: 'frontend', difficulty: 'easy',
    source: 'geeksforgeeks', tags: ['javascript', 'basics'], qualityScore: 9,
    question: 'What is the difference between == and === in JavaScript? When should you use each?',
  },
  {
    company: 'general', role: 'frontend', difficulty: 'easy',
    source: 'geeksforgeeks', tags: ['javascript', 'hoisting'], qualityScore: 8,
    question: 'What is hoisting in JavaScript? Explain with examples for both variables and functions.',
  },
  {
    company: 'general', role: 'frontend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['javascript', 'closures'], qualityScore: 9,
    question: 'What are closures in JavaScript? Provide a practical use case where closures are helpful.',
  },
  {
    company: 'general', role: 'frontend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['javascript', 'async', 'promises'], qualityScore: 9,
    question: 'Explain the difference between callbacks, Promises, and async/await in JavaScript. Which would you prefer and why?',
  },
  {
    company: 'general', role: 'frontend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['react', 'basics'], qualityScore: 9,
    question: 'What are React components? Explain the difference between functional and class components.',
  },
  {
    company: 'general', role: 'frontend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['react', 'hooks'], qualityScore: 9,
    question: 'Explain useState and useEffect hooks in React. When would you use each of them?',
  },
  {
    company: 'general', role: 'frontend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['react', 'lifecycle'], qualityScore: 8,
    question: 'What is the React component lifecycle? How does useEffect replicate lifecycle methods in functional components?',
  },
  {
    company: 'general', role: 'frontend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['css', 'flexbox', 'grid'], qualityScore: 8,
    question: 'Compare CSS Flexbox and CSS Grid. When would you choose one over the other?',
  },
  {
    company: 'general', role: 'frontend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['javascript', 'dom'], qualityScore: 8,
    question: 'What is event bubbling and event capturing in the DOM? How does event.stopPropagation() work?',
  },
  {
    company: 'general', role: 'frontend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['web', 'performance'], qualityScore: 9,
    question: 'What are some common techniques to optimize the performance of a web application? Name at least 4.',
  },
  {
    company: 'general', role: 'frontend', difficulty: 'hard',
    source: 'geeksforgeeks', tags: ['javascript', 'event-loop'], qualityScore: 9,
    question: 'Explain the JavaScript event loop, call stack, and task queue. How does it handle asynchronous operations?',
  },
  {
    company: 'general', role: 'frontend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['react', 'state'], qualityScore: 8,
    question: 'What is prop drilling in React? How would you solve it using Context API or state management libraries?',
  },
  {
    company: 'general', role: 'frontend', difficulty: 'easy',
    source: 'geeksforgeeks', tags: ['web', 'http'], qualityScore: 8,
    question: 'What happens when you type a URL in the browser and press Enter? Explain the full process step by step.',
  },
  {
    company: 'general', role: 'frontend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['javascript', 'scope'], qualityScore: 8,
    question: 'What is the difference between var, let, and const in JavaScript? Explain scope, hoisting, and reassignment rules for each.',
  },
  {
    company: 'general', role: 'frontend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['react', 'virtual-dom'], qualityScore: 9,
    question: 'How does React\'s virtual DOM work? Why is it more efficient than directly manipulating the real DOM?',
  },
  {
    company: 'general', role: 'frontend', difficulty: 'easy',
    source: 'geeksforgeeks', tags: ['css', 'responsive'], qualityScore: 8,
    question: 'What is responsive web design? How do CSS media queries help you build layouts that work on all screen sizes?',
  },
  {
    company: 'general', role: 'frontend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['javascript', 'this'], qualityScore: 8,
    question: 'Explain the "this" keyword in JavaScript. How does its value change in regular functions vs arrow functions?',
  },
  {
    company: 'general', role: 'frontend', difficulty: 'easy',
    source: 'geeksforgeeks', tags: ['web', 'security'], qualityScore: 9,
    question: 'What is Cross-Site Scripting (XSS)? How do you prevent it in a web application?',
  },

  // ══════════════════════════════════════════════════════
  // BACKEND — GENERAL
  // Source: GeeksforGeeks + LeetCode Discussions
  // ══════════════════════════════════════════════════════
  {
    company: 'general', role: 'backend', difficulty: 'easy',
    source: 'geeksforgeeks', tags: ['api', 'rest'], qualityScore: 9,
    question: 'What is a REST API? Explain the HTTP methods GET, POST, PUT, PATCH, and DELETE with real-world examples.',
  },
  {
    company: 'general', role: 'backend', difficulty: 'easy',
    source: 'geeksforgeeks', tags: ['database', 'sql'], qualityScore: 9,
    question: 'What is the difference between SQL and NoSQL databases? When would you choose MongoDB over MySQL?',
  },
  {
    company: 'general', role: 'backend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['database', 'indexing'], qualityScore: 9,
    question: 'What are database indexes? How do they improve query performance and what are their trade-offs?',
  },
  {
    company: 'general', role: 'backend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['nodejs', 'async'], qualityScore: 9,
    question: 'Explain how Node.js handles concurrent requests despite being single-threaded. What is the role of libuv?',
  },
  {
    company: 'general', role: 'backend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['auth', 'jwt'], qualityScore: 9,
    question: 'How does JWT (JSON Web Token) authentication work? What are its advantages over session-based authentication?',
  },
  {
    company: 'general', role: 'backend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['api', 'design'], qualityScore: 8,
    question: 'What are the best practices for designing a RESTful API? Mention at least 5 important principles.',
  },
  {
    company: 'general', role: 'backend', difficulty: 'medium',
    source: 'leetcode', tags: ['database', 'query'], qualityScore: 8,
    question: 'Write a SQL query to find the second highest salary from an Employee table. Handle the case where it may not exist.',
  },
  {
    company: 'general', role: 'backend', difficulty: 'easy',
    source: 'geeksforgeeks', tags: ['oops', 'concepts'], qualityScore: 8,
    question: 'Explain the four pillars of Object-Oriented Programming: Encapsulation, Abstraction, Inheritance, and Polymorphism.',
  },
  {
    company: 'general', role: 'backend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['caching', 'performance'], qualityScore: 8,
    question: 'What is caching? Explain the difference between client-side and server-side caching with examples.',
  },
  {
    company: 'general', role: 'backend', difficulty: 'hard',
    source: 'geeksforgeeks', tags: ['system-design', 'scalability'], qualityScore: 9,
    question: 'What is horizontal vs vertical scaling? Explain load balancing and when you would use microservices over monolithic architecture.',
  },
  {
    company: 'general', role: 'backend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['security', 'web'], qualityScore: 8,
    question: 'What are SQL injection attacks? How do you prevent them in a Node.js + MongoDB application?',
  },
  {
    company: 'general', role: 'backend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['middleware', 'express'], qualityScore: 8,
    question: 'What is middleware in Express.js? How does it work in the request-response cycle? Give practical examples.',
  },
  {
    company: 'general', role: 'backend', difficulty: 'easy',
    source: 'geeksforgeeks', tags: ['database', 'normalization'], qualityScore: 9,
    question: 'What is normalization in databases? Explain 1NF, 2NF, and 3NF with examples.',
  },
  {
    company: 'general', role: 'backend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['database', 'joins'], qualityScore: 9,
    question: 'What are JOIN operations in SQL? Explain INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL JOIN with examples.',
  },

  // ══════════════════════════════════════════════════════
  // DATA SCIENCE — GENERAL
  // Source: Kaggle Interview Questions Dataset + GeeksforGeeks
  // ══════════════════════════════════════════════════════
  {
    company: 'general', role: 'data', difficulty: 'easy',
    source: 'kaggle', tags: ['statistics', 'basics'], qualityScore: 9,
    question: 'Explain the difference between mean, median, and mode. In what situations is each measure most appropriate?',
  },
  {
    company: 'general', role: 'data', difficulty: 'easy',
    source: 'kaggle', tags: ['python', 'pandas'], qualityScore: 9,
    question: 'What is the difference between a Pandas Series and a DataFrame? How would you handle missing values in a DataFrame?',
  },
  {
    company: 'general', role: 'data', difficulty: 'medium',
    source: 'kaggle', tags: ['ml', 'supervised'], qualityScore: 9,
    question: 'Explain the difference between supervised and unsupervised learning. Give two real-world examples of each.',
  },
  {
    company: 'general', role: 'data', difficulty: 'medium',
    source: 'kaggle', tags: ['ml', 'overfitting'], qualityScore: 9,
    question: 'What is overfitting in machine learning? How do you detect it and what techniques can you use to prevent it?',
  },
  {
    company: 'general', role: 'data', difficulty: 'medium',
    source: 'kaggle', tags: ['ml', 'evaluation'], qualityScore: 9,
    question: 'What is the difference between precision, recall, and F1-score? When would you prioritize one over the other?',
  },
  {
    company: 'general', role: 'data', difficulty: 'medium',
    source: 'kaggle', tags: ['statistics', 'hypothesis'], qualityScore: 8,
    question: 'What is hypothesis testing? Explain p-value, null hypothesis, and when you would reject the null hypothesis.',
  },
  {
    company: 'general', role: 'data', difficulty: 'medium',
    source: 'kaggle', tags: ['ml', 'feature-engineering'], qualityScore: 8,
    question: 'What is feature engineering? Give examples of how you would create new features from existing data to improve model performance.',
  },
  {
    company: 'general', role: 'data', difficulty: 'easy',
    source: 'kaggle', tags: ['sql', 'data'], qualityScore: 9,
    question: 'Write a SQL query to find the count of employees in each department, sorted by count in descending order.',
  },
  {
    company: 'general', role: 'data', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['ml', 'algorithms'], qualityScore: 9,
    question: 'Explain how a Decision Tree works. What are the criteria for splitting nodes and how do you avoid overfitting?',
  },
  {
    company: 'general', role: 'data', difficulty: 'hard',
    source: 'kaggle', tags: ['deep-learning', 'neural-networks'], qualityScore: 8,
    question: 'What is a neural network? Explain forward propagation, backpropagation, and the role of activation functions.',
  },
  {
    company: 'general', role: 'data', difficulty: 'medium',
    source: 'kaggle', tags: ['statistics', 'correlation'], qualityScore: 8,
    question: 'What is the difference between correlation and causation? Why is this distinction important in data analysis?',
  },
  {
    company: 'general', role: 'data', difficulty: 'easy',
    source: 'kaggle', tags: ['python', 'numpy'], qualityScore: 8,
    question: 'What is NumPy and why is it important for data science? Explain array operations and broadcasting.',
  },
  {
    company: 'general', role: 'data', difficulty: 'easy',
    source: 'kaggle', tags: ['python', 'data-types'], qualityScore: 8,
    question: 'What are Python lists, tuples, sets, and dictionaries? How are they different and when would you use each?',
  },

  // ══════════════════════════════════════════════════════
  // HR — GENERAL
  // Source: Glassdoor Interview Experiences
  // ══════════════════════════════════════════════════════
  {
    company: 'general', role: 'hr', difficulty: 'easy',
    source: 'glassdoor', tags: ['behavioral', 'introduction'], qualityScore: 9,
    question: 'Tell me about yourself and why you are interested in this internship role.',
  },
  {
    company: 'general', role: 'hr', difficulty: 'easy',
    source: 'glassdoor', tags: ['behavioral', 'strengths'], qualityScore: 9,
    question: 'What are your greatest strengths and weaknesses? How are you working on your weaknesses?',
  },
  {
    company: 'general', role: 'hr', difficulty: 'easy',
    source: 'glassdoor', tags: ['behavioral', 'teamwork'], qualityScore: 8,
    question: 'Describe a situation where you had to work in a team. What was your role and how did you handle conflicts?',
  },
  {
    company: 'general', role: 'hr', difficulty: 'easy',
    source: 'glassdoor', tags: ['behavioral', 'challenge'], qualityScore: 8,
    question: 'Tell me about a challenging problem you solved in a project or assignment. What approach did you take?',
  },
  {
    company: 'general', role: 'hr', difficulty: 'easy',
    source: 'glassdoor', tags: ['motivation', 'career'], qualityScore: 9,
    question: 'Where do you see yourself in the next 3-5 years? How does this internship align with your career goals?',
  },
  {
    company: 'general', role: 'hr', difficulty: 'easy',
    source: 'glassdoor', tags: ['behavioral', 'leadership'], qualityScore: 8,
    question: 'Describe a situation where you took initiative or showed leadership, even without a formal leadership role.',
  },
  {
    company: 'general', role: 'hr', difficulty: 'easy',
    source: 'glassdoor', tags: ['behavioral', 'failure'], qualityScore: 9,
    question: 'Tell me about a time you failed at something. What did you learn from that experience?',
  },
  {
    company: 'general', role: 'hr', difficulty: 'easy',
    source: 'glassdoor', tags: ['motivation', 'company'], qualityScore: 8,
    question: 'Why do you want to work specifically at this company? What do you know about our culture and values?',
  },

  // ══════════════════════════════════════════════════════
  // GOOGLE — SPECIFIC
  // Source: Glassdoor Google Interview Experiences
  // ══════════════════════════════════════════════════════
  {
    company: 'google', role: 'frontend', difficulty: 'medium',
    source: 'glassdoor', tags: ['javascript', 'performance'], qualityScore: 9,
    question: 'How would you optimize a slow-loading Google search results page? Walk through your debugging process and at least 3 optimizations.',
  },
  {
    company: 'google', role: 'frontend', difficulty: 'hard',
    source: 'glassdoor', tags: ['javascript', 'advanced'], qualityScore: 9,
    question: 'Explain JavaScript prototypal inheritance. How does it differ from classical inheritance in languages like Java?',
  },
  {
    company: 'google', role: 'frontend', difficulty: 'medium',
    source: 'glassdoor', tags: ['web', 'accessibility'], qualityScore: 8,
    question: 'How would you make a web application accessible to users with disabilities? Mention ARIA roles and WCAG guidelines.',
  },
  {
    company: 'google', role: 'backend', difficulty: 'hard',
    source: 'glassdoor', tags: ['system-design', 'google'], qualityScore: 9,
    question: 'Design a simplified version of Google Maps\' autocomplete feature. What data structures and algorithms would you use?',
  },
  {
    company: 'google', role: 'backend', difficulty: 'medium',
    source: 'glassdoor', tags: ['algorithms', 'coding'], qualityScore: 9,
    question: 'How would you find all duplicate elements in an array using O(n) time complexity? Walk through your approach.',
  },
  {
    company: 'google', role: 'data', difficulty: 'hard',
    source: 'glassdoor', tags: ['ml', 'google'], qualityScore: 9,
    question: 'How would you build a recommendation system for YouTube videos? Describe the data, model, and evaluation approach.',
  },
  {
    company: 'google', role: 'hr', difficulty: 'medium',
    source: 'glassdoor', tags: ['behavioral', 'google'], qualityScore: 9,
    question: 'Google values "Googleyness". Give an example of a time you demonstrated intellectual humility and learned from someone with less experience than you.',
  },

  // ══════════════════════════════════════════════════════
  // META — SPECIFIC
  // Source: Glassdoor Meta/Facebook Interview Experiences
  // ══════════════════════════════════════════════════════
  {
    company: 'meta', role: 'frontend', difficulty: 'hard',
    source: 'glassdoor', tags: ['react', 'advanced'], qualityScore: 9,
    question: 'How does React\'s reconciliation algorithm work? What is the diffing algorithm and how does the key prop help?',
  },
  {
    company: 'meta', role: 'frontend', difficulty: 'medium',
    source: 'glassdoor', tags: ['javascript', 'async'], qualityScore: 9,
    question: 'What is the difference between microtasks and macrotasks in the JavaScript event loop? Give examples of each.',
  },
  {
    company: 'meta', role: 'backend', difficulty: 'hard',
    source: 'glassdoor', tags: ['system-design', 'meta'], qualityScore: 9,
    question: 'Design a simplified Facebook News Feed system. How would you handle the ranking and real-time updates for millions of users?',
  },
  {
    company: 'meta', role: 'data', difficulty: 'hard',
    source: 'glassdoor', tags: ['ml', 'meta'], qualityScore: 9,
    question: 'How would you design a content moderation system to detect harmful posts using machine learning?',
  },
  {
    company: 'meta', role: 'hr', difficulty: 'medium',
    source: 'glassdoor', tags: ['behavioral', 'meta'], qualityScore: 8,
    question: 'Meta moves fast and pivots often. Tell me about a time you had to abandon significant work due to changing priorities. How did you handle it?',
  },

  // ══════════════════════════════════════════════════════
  // AMAZON — SPECIFIC
  // Source: Glassdoor Amazon Interview Experiences
  // ══════════════════════════════════════════════════════
  {
    company: 'amazon', role: 'frontend', difficulty: 'medium',
    source: 'glassdoor', tags: ['react', 'amazon'], qualityScore: 9,
    question: 'How would you build a product listing page like Amazon.com that loads thousands of products efficiently? Discuss virtualization and lazy loading.',
  },
  {
    company: 'amazon', role: 'backend', difficulty: 'hard',
    source: 'glassdoor', tags: ['system-design', 'amazon'], qualityScore: 9,
    question: 'Design Amazon\'s shopping cart system. How would you handle concurrent users adding the last item in stock?',
  },
  {
    company: 'amazon', role: 'backend', difficulty: 'medium',
    source: 'glassdoor', tags: ['aws', 'cloud'], qualityScore: 9,
    question: 'Explain the difference between Amazon S3, EC2, and Lambda. When would you use each service?',
  },
  {
    company: 'amazon', role: 'data', difficulty: 'medium',
    source: 'glassdoor', tags: ['sql', 'amazon'], qualityScore: 9,
    question: 'Write a SQL query to find customers who placed more than 3 orders in the last 30 days and calculate their total spend.',
  },
  {
    company: 'amazon', role: 'hr', difficulty: 'medium',
    source: 'glassdoor', tags: ['leadership-principles', 'amazon'], qualityScore: 9,
    question: 'Amazon\'s Leadership Principle "Customer Obsession" is core to everything. Tell me about a time you went above and beyond for a user or customer.',
  },
  {
    company: 'amazon', role: 'hr', difficulty: 'medium',
    source: 'glassdoor', tags: ['leadership-principles', 'amazon'], qualityScore: 9,
    question: 'Tell me about a time you had to make a decision with incomplete information. How did you handle the uncertainty? (Amazon: Bias for Action)',
  },

  // ══════════════════════════════════════════════════════
  // MICROSOFT — SPECIFIC
  // Source: Glassdoor Microsoft Interview Experiences
  // ══════════════════════════════════════════════════════
  {
    company: 'microsoft', role: 'frontend', difficulty: 'medium',
    source: 'glassdoor', tags: ['typescript', 'microsoft'], qualityScore: 9,
    question: 'What are the advantages of using TypeScript over JavaScript? How does static typing help catch bugs during development?',
  },
  {
    company: 'microsoft', role: 'frontend', difficulty: 'medium',
    source: 'glassdoor', tags: ['react', 'microsoft'], qualityScore: 9,
    question: 'How would you implement a reusable component library in React? What design principles would you follow?',
  },
  {
    company: 'microsoft', role: 'backend', difficulty: 'medium',
    source: 'glassdoor', tags: ['azure', 'microsoft'], qualityScore: 9,
    question: 'What is Azure App Service? How does it compare to running your own server? When would you choose it for a Node.js application?',
  },
  {
    company: 'microsoft', role: 'backend', difficulty: 'hard',
    source: 'glassdoor', tags: ['system-design', 'microsoft'], qualityScore: 9,
    question: 'Design a collaborative document editing system like Microsoft Word Online. How would you handle real-time concurrent edits from multiple users?',
  },
  {
    company: 'microsoft', role: 'data', difficulty: 'medium',
    source: 'glassdoor', tags: ['ml', 'microsoft'], qualityScore: 8,
    question: 'What is transfer learning in deep learning? How would you use a pre-trained model from Azure AI to solve a classification problem?',
  },
  {
    company: 'microsoft', role: 'hr', difficulty: 'easy',
    source: 'glassdoor', tags: ['behavioral', 'microsoft'], qualityScore: 9,
    question: 'Microsoft values a Growth Mindset. Tell me about a time you received critical feedback and used it to significantly improve your work.',
  },

  // ══════════════════════════════════════════════════════
  // APPLE — SPECIFIC
  // Source: Glassdoor Apple Interview Experiences
  // ══════════════════════════════════════════════════════
  {
    company: 'apple', role: 'frontend', difficulty: 'hard',
    source: 'glassdoor', tags: ['performance', 'apple'], qualityScore: 9,
    question: 'Apple products are known for exceptional performance. How would you achieve 60fps smooth animations in a web application? What are the main bottlenecks to avoid?',
  },
  {
    company: 'apple', role: 'frontend', difficulty: 'medium',
    source: 'glassdoor', tags: ['accessibility', 'apple'], qualityScore: 9,
    question: 'Apple is a leader in accessibility. How would you make a web application fully accessible? Explain VoiceOver compatibility and ARIA best practices.',
  },
  {
    company: 'apple', role: 'backend', difficulty: 'hard',
    source: 'glassdoor', tags: ['system-design', 'apple'], qualityScore: 9,
    question: 'Design the backend architecture for Apple\'s App Store download system that handles millions of concurrent downloads globally. Focus on CDN strategy and data integrity.',
  },
  {
    company: 'apple', role: 'data', difficulty: 'medium',
    source: 'glassdoor', tags: ['privacy', 'apple'], qualityScore: 9,
    question: 'Apple is deeply committed to user privacy. How would you build a machine learning model that improves over time without accessing or storing raw user data?',
  },
  {
    company: 'apple', role: 'hr', difficulty: 'medium',
    source: 'glassdoor', tags: ['behavioral', 'apple'], qualityScore: 9,
    question: 'Apple stands for quality and attention to detail above all else. Tell me about a project where you went far beyond the minimum requirements to achieve something exceptional.',
  },

  // ══════════════════════════════════════════════════════
  // TCS — SPECIFIC
  // Source: GeeksforGeeks TCS NQT Questions + Glassdoor
  // ══════════════════════════════════════════════════════
  {
    company: 'tcs', role: 'frontend', difficulty: 'easy',
    source: 'geeksforgeeks', tags: ['html', 'css', 'tcs'], qualityScore: 9,
    question: 'What is the difference between inline, block, and inline-block elements? Give 2 examples of each.',
  },
  {
    company: 'tcs', role: 'frontend', difficulty: 'easy',
    source: 'geeksforgeeks', tags: ['javascript', 'tcs'], qualityScore: 9,
    question: 'What are the different data types in JavaScript? Explain the difference between null and undefined.',
  },
  {
    company: 'tcs', role: 'frontend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['javascript', 'scope', 'tcs'], qualityScore: 8,
    question: 'Explain variable scope in JavaScript. What is the difference between local, global, and block scope?',
  },
  {
    company: 'tcs', role: 'backend', difficulty: 'easy',
    source: 'geeksforgeeks', tags: ['java', 'oops', 'tcs'], qualityScore: 9,
    question: 'What is the difference between an abstract class and an interface in Java? When would you use each?',
  },
  {
    company: 'tcs', role: 'backend', difficulty: 'easy',
    source: 'geeksforgeeks', tags: ['database', 'sql', 'tcs'], qualityScore: 9,
    question: 'What are JOIN operations in SQL? Explain INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL JOIN with examples.',
  },
  {
    company: 'tcs', role: 'backend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['algorithms', 'tcs'], qualityScore: 8,
    question: 'What is the time complexity of common sorting algorithms (Bubble, Merge, Quick Sort)? Which would you use and when?',
  },
  {
    company: 'tcs', role: 'data', difficulty: 'easy',
    source: 'geeksforgeeks', tags: ['python', 'tcs'], qualityScore: 9,
    question: 'What are Python lists, tuples, sets, and dictionaries? How are they different and when would you use each?',
  },
  {
    company: 'tcs', role: 'data', difficulty: 'easy',
    source: 'kaggle', tags: ['statistics', 'tcs'], qualityScore: 8,
    question: 'What is the difference between a population and a sample in statistics? Why do we use samples in data science?',
  },
  {
    company: 'tcs', role: 'hr', difficulty: 'easy',
    source: 'glassdoor', tags: ['behavioral', 'tcs'], qualityScore: 9,
    question: 'Why do you want to join TCS? How does TCS align with your long-term career aspirations?',
  },
  {
    company: 'tcs', role: 'hr', difficulty: 'easy',
    source: 'glassdoor', tags: ['behavioral', 'tcs'], qualityScore: 8,
    question: 'TCS works on large enterprise projects. Are you comfortable working on long-term projects with large teams? How do you stay motivated?',
  },

  // ══════════════════════════════════════════════════════
  // INFOSYS — SPECIFIC
  // Source: GeeksforGeeks Infosys Questions + Glassdoor
  // ══════════════════════════════════════════════════════
  {
    company: 'infosys', role: 'frontend', difficulty: 'easy',
    source: 'geeksforgeeks', tags: ['css', 'responsive', 'infosys'], qualityScore: 9,
    question: 'What is responsive web design? How do CSS media queries help you build websites that work on all screen sizes?',
  },
  {
    company: 'infosys', role: 'frontend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['javascript', 'infosys'], qualityScore: 8,
    question: 'What is the "this" keyword in JavaScript? How does its behavior change in arrow functions vs regular functions?',
  },
  {
    company: 'infosys', role: 'backend', difficulty: 'easy',
    source: 'geeksforgeeks', tags: ['database', 'infosys'], qualityScore: 9,
    question: 'What is normalization in databases? Explain 1NF, 2NF, and 3NF with examples.',
  },
  {
    company: 'infosys', role: 'backend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['design-patterns', 'infosys'], qualityScore: 8,
    question: 'What are design patterns? Explain the Singleton and Factory design patterns with practical use cases.',
  },
  {
    company: 'infosys', role: 'data', difficulty: 'easy',
    source: 'kaggle', tags: ['statistics', 'infosys'], qualityScore: 8,
    question: 'What is the difference between standard deviation and variance? How do you interpret them in a dataset?',
  },
  {
    company: 'infosys', role: 'hr', difficulty: 'easy',
    source: 'glassdoor', tags: ['behavioral', 'infosys'], qualityScore: 9,
    question: 'How do you handle working under pressure with tight deadlines? Give a specific example from your academics or projects.',
  },

  // ══════════════════════════════════════════════════════
  // WIPRO — SPECIFIC
  // Source: GeeksforGeeks Wipro Questions + Glassdoor
  // ══════════════════════════════════════════════════════
  {
    company: 'wipro', role: 'frontend', difficulty: 'easy',
    source: 'geeksforgeeks', tags: ['javascript', 'dom', 'wipro'], qualityScore: 9,
    question: 'What is the Document Object Model (DOM)? How do you select and manipulate DOM elements using JavaScript?',
  },
  {
    company: 'wipro', role: 'frontend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['web', 'security', 'wipro'], qualityScore: 8,
    question: 'What is Cross-Site Scripting (XSS)? How do you prevent it in a web application?',
  },
  {
    company: 'wipro', role: 'backend', difficulty: 'easy',
    source: 'geeksforgeeks', tags: ['api', 'wipro'], qualityScore: 9,
    question: 'What is the difference between SOAP and REST APIs? Why is REST more popular for modern web applications?',
  },
  {
    company: 'wipro', role: 'backend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['nodejs', 'wipro'], qualityScore: 8,
    question: 'What are streams in Node.js? How do they help with handling large files efficiently?',
  },
  {
    company: 'wipro', role: 'data', difficulty: 'easy',
    source: 'kaggle', tags: ['data-cleaning', 'wipro'], qualityScore: 9,
    question: 'What strategies would you use to handle missing data in a machine learning dataset? Explain imputation techniques.',
  },
  {
    company: 'wipro', role: 'hr', difficulty: 'easy',
    source: 'glassdoor', tags: ['behavioral', 'wipro'], qualityScore: 8,
    question: 'Tell me about a time you had to quickly learn a new skill or technology. How did you approach the learning process?',
  },

  // ══════════════════════════════════════════════════════
  // HCL — SPECIFIC
  // Source: GeeksforGeeks HCL Interview Questions + Glassdoor
  // ══════════════════════════════════════════════════════
  {
    company: 'hcl', role: 'frontend', difficulty: 'easy',
    source: 'geeksforgeeks', tags: ['html', 'css', 'hcl'], qualityScore: 8,
    question: 'What is the difference between HTML5 and previous versions of HTML? Name 5 new HTML5 features that are important for modern web development.',
  },
  {
    company: 'hcl', role: 'frontend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['javascript', 'hcl'], qualityScore: 8,
    question: 'Explain the concept of debouncing and throttling in JavaScript. When would you use each, and how do they improve application performance?',
  },
  {
    company: 'hcl', role: 'backend', difficulty: 'easy',
    source: 'geeksforgeeks', tags: ['networking', 'hcl'], qualityScore: 9,
    question: 'What is the difference between TCP and UDP protocols? In what scenarios would you choose UDP over TCP for an application?',
  },
  {
    company: 'hcl', role: 'backend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['cloud', 'hcl'], qualityScore: 8,
    question: 'What are the key differences between IaaS, PaaS, and SaaS cloud service models? Give a real-world example of each.',
  },
  {
    company: 'hcl', role: 'data', difficulty: 'easy',
    source: 'kaggle', tags: ['data-analysis', 'hcl'], qualityScore: 8,
    question: 'What is exploratory data analysis (EDA)? Walk me through the steps you would take when first receiving a new dataset for analysis.',
  },
  {
    company: 'hcl', role: 'hr', difficulty: 'easy',
    source: 'glassdoor', tags: ['behavioral', 'hcl'], qualityScore: 8,
    question: 'HCL works with global enterprise clients across industries. How do you handle situations where you must learn about a completely new business domain quickly?',
  },

  // ══════════════════════════════════════════════════════
  // TECH MAHINDRA — SPECIFIC
  // Source: GeeksforGeeks Tech Mahindra Questions + Glassdoor
  // ══════════════════════════════════════════════════════
  {
    company: 'techmahindra', role: 'frontend', difficulty: 'easy',
    source: 'geeksforgeeks', tags: ['javascript', 'techmahindra'], qualityScore: 8,
    question: 'What is the difference between synchronous and asynchronous JavaScript? How do Promises help manage asynchronous operations?',
  },
  {
    company: 'techmahindra', role: 'frontend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['react', 'techmahindra'], qualityScore: 8,
    question: 'What is React Router? How do you implement client-side navigation and protected routes in a React application?',
  },
  {
    company: 'techmahindra', role: 'backend', difficulty: 'easy',
    source: 'geeksforgeeks', tags: ['networking', 'telecom', 'techmahindra'], qualityScore: 9,
    question: 'What is the OSI model? Briefly explain each of the 7 layers and give an example of a protocol or technology at each layer.',
  },
  {
    company: 'techmahindra', role: 'backend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['microservices', 'techmahindra'], qualityScore: 8,
    question: 'What are microservices? How do they differ from a monolithic architecture? What challenges come with microservices?',
  },
  {
    company: 'techmahindra', role: 'data', difficulty: 'easy',
    source: 'kaggle', tags: ['python', 'techmahindra'], qualityScore: 8,
    question: 'What is the difference between list comprehension and a regular for loop in Python? When would you prefer each approach?',
  },
  {
    company: 'techmahindra', role: 'hr', difficulty: 'easy',
    source: 'glassdoor', tags: ['behavioral', 'techmahindra'], qualityScore: 8,
    question: 'Tech Mahindra often involves client-facing work. How do you communicate technical concepts to non-technical stakeholders? Give an example.',
  },

  // ══════════════════════════════════════════════════════
  // FLIPKART — SPECIFIC
  // Source: Glassdoor Flipkart Interview Experiences
  // ══════════════════════════════════════════════════════
  {
    company: 'flipkart', role: 'frontend', difficulty: 'medium',
    source: 'glassdoor', tags: ['performance', 'ecommerce', 'flipkart'], qualityScore: 9,
    question: 'Flipkart handles massive traffic during Big Billion Days sale. How would you optimize the frontend of a product listing page for thousands of simultaneous users?',
  },
  {
    company: 'flipkart', role: 'frontend', difficulty: 'hard',
    source: 'glassdoor', tags: ['react', 'flipkart'], qualityScore: 9,
    question: 'How would you implement an infinite scroll product feed in React that loads efficiently and does not degrade performance as the user scrolls through thousands of items?',
  },
  {
    company: 'flipkart', role: 'backend', difficulty: 'hard',
    source: 'glassdoor', tags: ['system-design', 'flipkart'], qualityScore: 9,
    question: 'Design Flipkart\'s product search and filter system. How would you handle full-text search, category filters, and real-time inventory updates at scale?',
  },
  {
    company: 'flipkart', role: 'backend', difficulty: 'medium',
    source: 'glassdoor', tags: ['database', 'flipkart'], qualityScore: 8,
    question: 'How would you design the database schema for an e-commerce platform like Flipkart that supports multiple product categories with different attributes?',
  },
  {
    company: 'flipkart', role: 'data', difficulty: 'medium',
    source: 'glassdoor', tags: ['recommendation', 'flipkart'], qualityScore: 9,
    question: 'How would you build a product recommendation system for Flipkart? What data would you collect, and which machine learning approach would you use?',
  },
  {
    company: 'flipkart', role: 'hr', difficulty: 'easy',
    source: 'glassdoor', tags: ['behavioral', 'flipkart'], qualityScore: 8,
    question: 'Flipkart moves extremely fast. Tell me about a time when you had to ship something quickly under tight constraints. How did you balance speed with quality?',
  },

  // ══════════════════════════════════════════════════════
  // ZOHO — SPECIFIC
  // Source: GeeksforGeeks Zoho Interview Questions + Glassdoor
  // ══════════════════════════════════════════════════════
  {
    company: 'zoho', role: 'frontend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['javascript', 'zoho'], qualityScore: 9,
    question: 'Zoho builds complex SaaS products. How would you manage complex application state in a large React application? Compare Context API, Redux, and Zustand.',
  },
  {
    company: 'zoho', role: 'frontend', difficulty: 'medium',
    source: 'glassdoor', tags: ['css', 'zoho'], qualityScore: 8,
    question: 'How would you implement a dark mode feature across a large web application? What approach ensures consistency and good performance?',
  },
  {
    company: 'zoho', role: 'backend', difficulty: 'medium',
    source: 'geeksforgeeks', tags: ['multithreading', 'zoho'], qualityScore: 9,
    question: 'What is multithreading? How does Node.js handle concurrent operations without multiple threads? Explain the worker threads module.',
  },
  {
    company: 'zoho', role: 'backend', difficulty: 'hard',
    source: 'glassdoor', tags: ['system-design', 'zoho'], qualityScore: 9,
    question: 'Design a CRM system like Zoho CRM. How would you structure the data model to support custom fields that different companies can configure for their own needs?',
  },
  {
    company: 'zoho', role: 'data', difficulty: 'medium',
    source: 'kaggle', tags: ['analytics', 'zoho'], qualityScore: 8,
    question: 'How would you build a customer churn prediction model for a SaaS product? What features would you use and how would you measure model success?',
  },
  {
    company: 'zoho', role: 'hr', difficulty: 'easy',
    source: 'glassdoor', tags: ['behavioral', 'zoho'], qualityScore: 9,
    question: 'Zoho is known for building everything in-house rather than acquiring. How do you feel about building from scratch vs using existing tools? Give an example from your experience.',
  },

  // ══════════════════════════════════════════════════════
  // PAYTM — SPECIFIC
  // Source: Glassdoor Paytm Interview Experiences
  // ══════════════════════════════════════════════════════
  {
    company: 'paytm', role: 'frontend', difficulty: 'medium',
    source: 'glassdoor', tags: ['security', 'fintech', 'paytm'], qualityScore: 9,
    question: 'Security is critical in a payments app. How would you protect a React frontend from XSS attacks, CSRF attacks, and sensitive data exposure?',
  },
  {
    company: 'paytm', role: 'frontend', difficulty: 'medium',
    source: 'glassdoor', tags: ['ux', 'paytm'], qualityScore: 8,
    question: 'How would you design a payment confirmation flow that is both fast and secure? What UI/UX patterns help build user trust during financial transactions?',
  },
  {
    company: 'paytm', role: 'backend', difficulty: 'hard',
    source: 'glassdoor', tags: ['transactions', 'paytm'], qualityScore: 9,
    question: 'How would you ensure data consistency in a payment system where money must be debited from one account and credited to another atomically? What happens if the system crashes midway?',
  },
  {
    company: 'paytm', role: 'backend', difficulty: 'medium',
    source: 'glassdoor', tags: ['api', 'fintech', 'paytm'], qualityScore: 9,
    question: 'What is idempotency and why is it critical in payment APIs? How would you implement an idempotent payment endpoint in Node.js?',
  },
  {
    company: 'paytm', role: 'data', difficulty: 'medium',
    source: 'glassdoor', tags: ['fraud-detection', 'paytm'], qualityScore: 9,
    question: 'How would you build a real-time fraud detection system for a payments platform? What signals would you monitor and what ML approach would you use?',
  },
  {
    company: 'paytm', role: 'hr', difficulty: 'easy',
    source: 'glassdoor', tags: ['behavioral', 'paytm'], qualityScore: 8,
    question: 'Fintech moves very fast and regulations change often. Tell me about a time you had to adapt your work due to an unexpected external change or constraint.',
  },

  // ══════════════════════════════════════════════════════
  // STARTUP — SPECIFIC
  // Source: Glassdoor Startup Interview Experiences
  // ══════════════════════════════════════════════════════
  {
    company: 'startup_general', role: 'frontend', difficulty: 'medium',
    source: 'glassdoor', tags: ['fullstack', 'startup'], qualityScore: 9,
    question: 'At a startup you often work across the full stack. If asked to build a complete feature from database to UI in one week, how would you approach it?',
  },
  {
    company: 'startup_general', role: 'frontend', difficulty: 'medium',
    source: 'glassdoor', tags: ['react', 'startup'], qualityScore: 8,
    question: 'How would you build a real-time notification system for a startup app using React? What technologies would you use?',
  },
  {
    company: 'startup_general', role: 'backend', difficulty: 'medium',
    source: 'glassdoor', tags: ['mvp', 'startup'], qualityScore: 9,
    question: 'How would you build the backend for an MVP product in 2 weeks? What would you prioritize and what shortcuts are acceptable?',
  },
  {
    company: 'startup_general', role: 'backend', difficulty: 'medium',
    source: 'glassdoor', tags: ['deployment', 'startup'], qualityScore: 8,
    question: 'What is CI/CD? How would you set up a basic deployment pipeline for a Node.js startup application?',
  },
  {
    company: 'startup_general', role: 'data', difficulty: 'medium',
    source: 'glassdoor', tags: ['analytics', 'startup'], qualityScore: 9,
    question: 'A startup wants to understand why users are dropping off their app. How would you use data to identify and solve this problem?',
  },
  {
    company: 'startup_general', role: 'hr', difficulty: 'easy',
    source: 'glassdoor', tags: ['culture', 'startup'], qualityScore: 9,
    question: 'Startups move fast and requirements change often. Can you give an example where you had to adapt quickly to a major change? How did you handle it?',
  },
  {
    company: 'startup_general', role: 'hr', difficulty: 'easy',
    source: 'glassdoor', tags: ['ownership', 'startup'], qualityScore: 8,
    question: 'At a startup, everyone wears multiple hats. Are you comfortable taking ownership of tasks outside your primary role? Give an example.',
  },
];

// ─────────────────────────────────────────────────────────
// SEED FUNCTION
// ─────────────────────────────────────────────────────────
const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await CompanyDataset.deleteMany({});
    console.log('🗑️  Cleared existing dataset');

    await CompanyDataset.insertMany(questions);
    console.log(`✅ Successfully seeded ${questions.length} questions!`);

    // Summary by company
    const companySummary = await CompanyDataset.aggregate([
      { $group: { _id: '$company', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    console.log('\n📊 Dataset Summary:');
    companySummary.forEach((s) => {
      console.log(`   ${s._id.padEnd(22)} : ${s.count} questions`);
    });

    // Summary by source
    const sourceSummary = await CompanyDataset.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    console.log('\n📚 Source Summary:');
    sourceSummary.forEach((s) => {
      console.log(`   ${s._id.padEnd(22)} : ${s.count} questions`);
    });

    console.log(`\n✅ Total: ${questions.length} questions seeded successfully!`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding Error:', error.message);
    process.exit(1);
  }
};

seedDatabase();