# Preferences

Working preferences resumebot skills read at runtime. Edit freely.

## Batch sizes and cadence

- Apply-tabs per session: 5
- Packet-build batch cap: no cap (build everything pending at target tier)
- Email-sync lookback: 3 days (14 on first run)
- Scan report style: counts + top finds only (no full row dumps)

## Scan behavior

- Log gate-rejected roles as reject rows: no (drop silently)
- Boards to scan: LinkedIn, Indeed, Dice
- Logged-in browser available for recommended-jobs feeds: <yes/no>
- Employer-list scan cadence: weekly (list at Profile/employer-list.md, optional)

## Documents

- Resume format: docx, Calibri, 0.5" margins (build_resume.py default)
- Also render PDF spot-checks on large batches: yes

## Notifications

- Interview requests: surface immediately, top of any report
- Offers: surface immediately, never auto-change tracker status
