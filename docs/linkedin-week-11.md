# LinkedIn Post — Week 11

---

Week 11 of building the PPDM Elasticsearch Troubleshooter in public. 🔍

Two things shipped this week that I'm genuinely excited about.

**1. Prompt caching in AI Diagnose**

The AI Diagnose panel now sends the system prompt and tool schema with `anthropic-beta: prompt-caching-2024-07-31`. In practice, this means the first diagnosis call pays the full token cost — but every repeat check on the same session hits the cache instead. Round-trip times drop noticeably, and the cost per analysis goes down significantly for anyone running multiple checks in a session.

The implementation is a single header + a `cache_control` block on the system turn. Zero extra complexity, real measurable benefit. Exactly the kind of low-effort, high-impact change I look for.

**2. Mission control aesthetic**

The dashboard got a visual refresh: dark navy header, sky-blue diagnostic cards, tighter spacing. The goal was to make it feel less like a dev tool cobbled together over a weekend and more like something you'd actually hand to a field engineer on a stressful day.

Dark mode still works — CSS custom properties do the heavy lifting, no JS class juggling needed.

---

The project is now at **v1.4.0** — still zero dependencies, still opens as a single `index.html`, still no build step.

Running total:
- 10 diagnostic check modules
- 7 guided error-pattern workflows
- Live `/_cluster/health` fetch
- AI Diagnose powered by Claude Haiku 4.5 (with prompt caching)
- `/es-diagnose` + `/ppdm-check` Claude Code skills
- Playwright CI across Chromium, Firefox, WebKit

If you work with Dell PowerProtect Data Manager and Elasticsearch, the tool is open source and free to use:
👉 https://github.com/Moodswing9/ppdm-es-troubleshooter

---

What's next: looking at surfacing shard allocation explain output directly in the guided workflows — one click from "unassigned shards" to the exact `_cluster/allocation/explain` response. More next week.

#OpenSource #Elasticsearch #PowerProtect #PPDM #DevLog #BuildInPublic #ClaudeAI
