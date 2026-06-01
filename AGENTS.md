<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:mcs-brand-rules -->
# MCS Brand Memory

For all future MCS work in this repository, preserve the established Melati Championship Series 1 branding. Use the canonical data in `src/data/mcs.ts` first, especially `event`, `brandColors`, `brandAssets`, `gallery`, `dashboardFootage`, `eventDescriptions`, `contact`, and `majors`.

Brand identity:
- Event: Melati Championship Series 1 (MCS 1)
- Theme: "The Genesis of Excellence"
- Slogan: "Every Play is a Story, Every Student is a Star."
- Organizer: OSIS & MPK SMKN 20 Jakarta
- Visual tone: sporty, professional, modern, competitive, energetic
- Core colors: navy blue, deep red, soft gold, white
- Logos: use the real SMKN 20, OSIS SMKN 20, and MPK SMKN 20 logos from `public/logos/`

Media rules:
- Do not generate AI images for MCS pages, dashboards, login screens, posters, or previews unless the user explicitly asks for AI-generated artwork.
- Prefer real MCS footage from `public/images/mcs-gallery/` and the `gallery` / `dashboardFootage` arrays in `src/data/mcs.ts`.
- Do not reintroduce old generated assets such as `mcs-hero-court.png` or `mcs-badminton-header.png`.
- If a new visual is needed, first reuse, crop, arrange, or restyle the real provided photos and logos.

Content rules:
- Keep landing page and dashboard aligned: the same footage, logos, event concept, school identity, contact info, and department data should be reusable across both.
- Avoid generic stock/event copy when MCS-specific copy exists in `src/data/mcs.ts`.
<!-- END:mcs-brand-rules -->
