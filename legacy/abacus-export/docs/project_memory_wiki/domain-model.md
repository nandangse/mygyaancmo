---
name: "Domain Model"
description: "Key entities and how they relate: leads, lead scoring, industries, segments."
---

- Lead scoring: every contact gets a score showing how warm the lead is, so the team knows which leads are warm.
- Industry is a first-class entity, and each industry gets its own detailed page.
- Industries apply to segments as well as contacts.
- Industry and Segment are many-to-many: one industry can sit in multiple segments.
- Contact and Industry are many-to-many: a contact can have multiple industries and inherits them.
- Lead score is 0-100, AI-computed, with bands: hot >=75, warm >=50, cool >=25, else cold.
