# DayTech workspace design prototype

Run the app locally and open `/motion-prototype`. The prototype uses sample records and keeps edits in memory.

| Pattern | Use |
| --- | --- |
| Surface tokens | Use the workspace colour variables for canvas, panels, text, borders, accents and focus. Use translucent glass on the top bar and solid surfaces for charts, forms and tables. |
| Consistent navigation | Use the workspace shell for administration, the customer portal, HotelOS, POS and Schools. Give the corporate website the typography, tokens and buttons while retaining its public navigation. |
| Analytics | Compose metric cards and an accessible chart independently. Label data and comparison periods. Offer the chart values through keyboard-operable controls. |
| Motion | Prefer short opacity and transform transitions. Use 180 ms for controls and 320 ms for counters. Respect the OS preference through MotionConfig, reduced-motion variants and a CSS override. Avoid continuous motion. |
| Forms and overlays | Use labelled native controls and dialogs with Escape, focus restoration and visible focus. Include useful loading and empty-state copy. |
| Responsive tables | Keep heading associations and allow horizontal scrolling inside the table region. Use an empty state when filters return no results. |

Adopt these patterns incrementally. Separate each product's data adapter and permissions from the presentational components. Extend the prototype styles only after review of contrast, touch targets, keyboard operation and reduced motion for each production surface.
