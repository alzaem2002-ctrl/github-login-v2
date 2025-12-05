# OJudge Educational Platform - Design Guidelines

## Design Approach
**System-Based Approach**: Material Design principles adapted for educational context, with RTL (right-to-left) layout support for Arabic interface. Drawing inspiration from educational platforms like Khan Academy and Codecademy for clarity and engagement.

## Core Design Principles
1. **Clarity First**: Educational content must be immediately scannable
2. **RTL Native**: All layouts flow right-to-left for Arabic reading
3. **Hierarchy Through Structure**: Clear visual separation between admin, student, and problem-solving areas
4. **Trust & Professionalism**: Clean, academic aesthetic that builds credibility

## Typography
- **Primary Font**: Cairo (Google Fonts) - excellent Arabic support with modern feel
- **Code Font**: JetBrains Mono - optimal for code display
- **Hierarchy**:
  - Page titles: text-3xl font-bold (Cairo)
  - Section headers: text-xl font-semibold
  - Problem titles: text-lg font-medium
  - Body text: text-base
  - Code snippets: text-sm (JetBrains Mono)
  - Metadata/timestamps: text-xs text-gray-600

## Layout System
**Spacing Units**: Consistent use of Tailwind units 4, 6, 8, 12, 16 for rhythm
- Component padding: p-6 or p-8
- Section spacing: space-y-6 or space-y-8
- Card gaps: gap-6
- Container max-width: max-w-7xl for main content, max-w-4xl for focused reading

**RTL Configuration**: 
- Use `dir="rtl"` on html element
- Use logical properties: `ps-` (padding-start), `me-` (margin-end) instead of left/right
- Navigation on right side, main content flows right-to-left

## Component Library

### Navigation
- **Top Navigation Bar**: Fixed header with site title on right, user menu on left
- Includes: Platform name, admin/student dashboard link, logout button
- Height: h-16, with border-b and subtle shadow
- Admin section has distinct badge/indicator

### Dashboard Layout
- **Two-Column Grid**: Sidebar (right side, w-64) + Main content area
- **Sidebar**: Problem list, categories, student progress (for admin)
- **Main Area**: Problem details, code editor, submission results

### Problem Cards
- Clean card design with rounded-lg and border
- Structure: Problem title → Description → Difficulty badge → "حل المسألة" button
- Spacing: p-6, hover:shadow-lg transition
- Include icon indicators for completion status (checkmark for solved)

### Code Editor Area
- **Editor Container**: Monaco Editor or CodeMirror integration
- Dark theme with syntax highlighting
- Min-height: min-h-96
- Includes: Language selector, Run button (prominent), Submit button
- Test results display below editor in expandable accordion

### Results Display
- **Test Cases**: Grid showing input → expected → actual output
- Success: Green checkmark with border-green-500
- Failure: Red X with border-red-500  
- Clear visual distinction between passed/failed cases

### Admin Dashboard
- **Statistics Cards**: Grid of metric cards (total students, problems, completion rate)
- **Student List**: Table with sortable columns
- **Problem Management**: CRUD interface with clear action buttons

### Forms (Login, Registration)
- Centered card on clean background
- Max-width: max-w-md
- Form inputs: Rounded borders, focus:ring-2 focus:ring-blue-500
- Submit buttons: Full width, prominent with py-3

## Page Layouts

### Login Page
- Single centered card (max-w-md)
- Platform logo/title at top
- Clean form with username/password fields
- Primary action button at bottom
- Link to student registration if enabled

### Student Dashboard
- Welcome header with student name
- Progress overview (problems solved, accuracy)
- Available problems grid (3 columns on desktop, 1 on mobile)
- Recent submissions list

### Problem Solving Page
- Two-column layout: Problem description (right 40%) + Code editor (left 60%)
- Problem panel: Title, description, examples, constraints
- Editor panel: Language selector, code area, action buttons
- Results section: Expands below showing all test case outcomes

### Admin Panel
- Three-tab interface: Students | Problems | Settings
- Each tab with appropriate data tables and forms
- Bulk action capabilities for managing students/problems

## Interactions & States
- **Buttons**: Solid backgrounds with hover:opacity-90, no complex animations
- **Cards**: hover:shadow-md transition-shadow
- **Form Inputs**: focus:outline-none focus:ring-2 focus:ring-blue-500
- **Loading States**: Simple spinner, no elaborate animations
- **Success Messages**: Toast notifications (top-center, 3 seconds)

## Icons
**Library**: Material Icons (via CDN)
- Dashboard: dashboard icon
- Problems: assignment icon  
- Code: code icon
- Submit: send icon
- Success: check_circle icon
- Error: error icon
- Admin: admin_panel_settings icon

## Images
**Hero Section**: Not applicable for this dashboard-style application. Use solid header with clear typography instead.

**Supporting Images**: Consider placeholder spots for:
- Platform logo/icon in navigation
- Empty state illustrations for "no problems yet" screens
- Success celebration graphics for completing problems

## Responsive Behavior
- **Desktop (lg:)**: Full sidebar + main content layout
- **Tablet (md:)**: Collapsible sidebar, problem cards in 2 columns  
- **Mobile (base)**: Hamburger menu, single column cards, stacked editor/description

## Accessibility
- ARIA labels for all interactive elements in Arabic
- Keyboard navigation for code editor
- Clear focus indicators (ring-2 ring-blue-500)
- Sufficient contrast ratios (WCAG AA minimum)
- Screen reader support for test results

## Key Constraints
- All text content in Arabic
- Support for code syntax in English within Arabic context
- Preserve code indentation and formatting
- Clear visual feedback for code execution status
- Admin areas clearly separated from student areas