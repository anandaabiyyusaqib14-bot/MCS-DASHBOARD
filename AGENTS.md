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
- MCS 1 does not have its own standalone logo. Do not create, generate, or fake an "MCS" logo; show "MCS 1" only as event text beside the official school/OSIS/MPK logos.

Media rules:
- Do not generate AI images for MCS pages, dashboards, login screens, posters, or previews unless the user explicitly asks for AI-generated artwork.
- Prefer real MCS footage from `public/images/mcs-gallery/` and the `gallery` / `dashboardFootage` arrays in `src/data/mcs.ts`.
- Do not reintroduce old generated assets such as `mcs-hero-court.png` or `mcs-badminton-header.png`.
- If a new visual is needed, first reuse, crop, arrange, or restyle the real provided photos and logos.

Content rules:
- Keep landing page and dashboard aligned: the same footage, logos, event concept, school identity, contact info, and department data should be reusable across both.
- Avoid generic stock/event copy when MCS-specific copy exists in `src/data/mcs.ts`.
- Do not create fictional content, placeholder event content, fake teams, fake participants, fake schedules, fake statistics, fake committee data, fake results, fake announcements, or fake media to make the UI look complete.
- If owner-provided data is unavailable, display an empty state, placeholder status, `No Data Available`, `Data Not Published Yet`, or `Match data not available.` as appropriate.
- Official MCS 1 competition scope is limited to Futsal, Basket 3x3, Voli, Badminton, Mobile Legends, Canvas Drawing, Solo Vokal, Best News Card, and Best News Video.
- Official departments are limited to Bisnis Digital, Rekayasa Perangkat Lunak, Manajemen Perkantoran, Akuntansi, Bisnis Retail, and Layanan Perbankan Syariah.
<!-- END:mcs-brand-rules -->
