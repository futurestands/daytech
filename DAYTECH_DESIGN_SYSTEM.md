# DayTech design system

Use the published website’s navy, blue and cyan as the shared identity. Keep the workspace prototype on its review branch. The experimental palette and sample records are outside the release candidate.

| Pattern | Release standard |
| --- | --- |
| Typography | Plus Jakarta Sans for headings, DM Sans for body, JetBrains Mono for references and technical labels. Use system fallbacks, tabular numerals for comparisons and currency, and flexible line breaks. |
| Colour | Light canvas `#F8FAFC`, dark canvas `#0B1120`, stronger dark surface `#020617`, action blue `#2563EB` and dark-mode accent cyan `#06B6D4`. Pair every status colour with text. |
| Spacing | Use the existing 4 px rhythm, 16–24 px surface padding and 24–32 px section gaps. Preserve 44 px primary control targets. |
| Navigation and buttons | Use WorkspaceSectionButton for selection states in the admin and portal. Keep the full label in the accessibility tree in icon mode. Use an ordinary button for a local action and a link for a destination. |
| Forms and tables | Associate visible labels with inputs. Use existing validation and backend authorisation. Keep table headers associated with their rows and contain small-screen overflow inside the table region. |
| Charts | Chart authorised records already loaded for the view. Label the population and provide actual values as text and keyboard-operable controls. Leave unknown values unavailable. |
| Dialogs | Keep the current financial workflows. For new dialogs use a native focus-managed dialog with Escape, focus restoration and an explicit close action. |
| Feedback | Use WorkspaceNotice for outcomes and errors. Use a short loading message for pending data, show a recovery action for failures where available, and show empty states only after data resolves. |
| Motion | Use a 160 ms section entrance and 180 ms desktop sidebar transition. Adopt springs only in isolated product interactions where they communicate movement, with no overshoot for business controls. Suppress section and sidebar animation under reduced motion. |
| Responsive layouts and accessibility | Verify at 390 px and desktop widths, with keyboard and both themes. Maintain visible focus, readable contrast, correctly ordered headings and labelled controls. |

Reuse these tokens and components in the admin, customer portal and future product interfaces. Keep the public homepage’s content structure and use original, lightweight system illustrations. Keep motion libraries out of the shared homepage entry path.
