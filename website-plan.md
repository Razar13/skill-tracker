Your idea is actually a very good candidate for a first full-stack project because the scope is small, but it still covers authentication, CRUD operations, file uploads, calendars, and data visualization.

MVP (Version 1)

I would keep the first version extremely simple.

Main entities
User
User
- id
- email
- password_hash
- created_at
Skill
Skill
- id
- user_id
- name
- color
- created_at

Examples:

Piano
English
Programming
Drawing
Practice Session
PracticeSession
- id
- skill_id
- date
- title
- description
- duration_minutes
- created_at

Examples:

Skill: English
Title: Watched a movie in English
Duration: 45 min
Attachment
Attachment
- id
- practice_session_id
- file_url
- file_type
User flow
Dashboard

When the user logs in:

Today
-----------------------
✓ English
✗ Piano
✓ Programming
✗ Drawing

Quick buttons:

[Log practice]
[View calendar]
[Add skill]
Add a skill

Simple form:

Skill name:
[ English ]

Color:
[ Blue ]

[ Save ]
Log practice

Form:

Skill:
[ English ]

Date:
[ 2026-09-01 ]

Title:
[ Vocabulary review ]

Description:
[ Studied 50 new words ]

Duration:
[ 45 ] minutes

Attachments:
[ Upload ]

Save.

Calendar view

A GitHub-style contribution calendar would work very well.

Example:

Mon Tue Wed Thu Fri Sat Sun

🟩 🟩 ⬜ 🟩 🟩 🟩 ⬜
🟩 🟩 🟩 🟩 ⬜ 🟩 🟩

Click a day:

September 1

English - 45 min
Programming - 90 min
Statistics page

Very useful and not difficult.

For each skill:

English
----------------
Total time: 120 h
Sessions: 340
Current streak: 18 days
Longest streak: 42 days

And charts:

hours this week
hours this month
hours this year
Suggested database schema
users
skills
practice_sessions
attachments

Relationships:

User
 └── Skills
        └── Practice Sessions
                 └── Attachments

That's enough for V1.

Tech stack recommendation

Since this is a personal project and you want something modern:

Frontend
Next.js
TypeScript
Tailwind CSS
Backend

Use Next.js API routes initially.

Database
PostgreSQL
ORM
Prisma
Authentication
NextAuth/Auth.js
File storage

Start with:

local storage during development

Then later:

AWS S3
Cloudflare R2
Future features (V2)

After the MVP works:

Goals
English
Goal: 30 min/day
Streaks
Current streak: 23 days
Tags
Reading
Speaking
Grammar
Listening
Skill categories
Languages
Music
Sports
Programming
Weekly reports
This week:
English: 5h
Programming: 8h
Drawing: 2h
Skill evolution timeline
English

2025 -> Beginner
2026 -> Intermediate
2027 -> Advanced

# What I would build first

1. Authentication
2. Create skills
3. Create practice sessions
4. Calendar page
5. Statistics page
6. File uploads
7. Goals and streaks