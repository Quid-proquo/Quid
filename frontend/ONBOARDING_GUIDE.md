# Quid Onboarding Component - Implementation Guide

## Overview

The Quid Onboarding Component is a role-specific guided tour modal for first-time users. It displays step-by-step instructions and persists completion status using localStorage.

## Features Implemented

✅ **Role-Specific Content**
- Earner flow: Welcome → Find Jobs → Submit Work → Get Paid
- Business flow: Welcome → Post Jobs → Review Submissions → Release Payments

✅ **State Management**
- Step navigation (Previous/Next buttons)
- localStorage persistence (`hasOnboarded_${role}`)
- Only shows on first role selection

✅ **UI/UX**
- Centered modal with backdrop overlay
- Smooth animations and transitions
- Progress indicator (animated dots)
- Accessible icons for each step
- Responsive design (desktop & mobile)

✅ **Accessibility**
- ARIA labels and live regions
- Keyboard navigation support
- Keyboard-accessible buttons
- High contrast mode support
- Reduced motion support

✅ **Responsive Design**
- Desktop: Full-width optimized modal (500px max-width)
- Mobile: 95% width with optimized spacing
- Touch-friendly buttons and controls

## File Structure

```
src/
├── components/
│   ├── Onboarding.tsx          # Main component (step logic, state management)
│   ├── Onboarding.css          # Styles (modal, animations, responsive)
│   └── Icons.tsx               # SVG icons and ProgressDots component
└── app/
    └── page.tsx                # Integration and role selection UI
```

## Component Props

```typescript
interface OnboardingProps {
  role: 'earner' | 'business';  // Which role-specific flow to display
  onComplete: () => void;        // Callback when onboarding completes
}
```

## Usage

### Basic Integration

```tsx
import Onboarding from '@/components/Onboarding';

export default function MyApp() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'earner' | 'business' | null>(null);

  const handleRoleSelect = (role: 'earner' | 'business') => {
    setSelectedRole(role);
    
    // Check localStorage to see if onboarding was already completed
    const hasOnboarded = localStorage.getItem(`hasOnboarded_${role}`) === 'true';
    
    if (!hasOnboarded) {
      setShowOnboarding(true);
    }
  };

  return (
    <>
      {showOnboarding && selectedRole && (
        <Onboarding 
          role={selectedRole} 
          onComplete={() => setShowOnboarding(false)} 
        />
      )}
    </>
  );
}
```

## Testing Checklist

### ✅ First-Time User Flow (Earner)
1. Select "Earner" role
2. Onboarding modal appears with "Welcome to Quid!" step
3. Navigate through all 4 steps
4. Click "Let's Go!" on final step
5. Modal closes
6. Refresh page
7. Select "Earner" again
8. **Expected**: Onboarding does NOT appear (already completed)

### ✅ First-Time User Flow (Business)
1. Select "Business" role
2. Onboarding modal appears with "Welcome to Quid!" step
3. Navigate through all 4 steps
4. Click "Let's Go!" on final step
5. Modal closes
6. Refresh page
7. Select "Business" again
8. **Expected**: Onboarding does NOT appear (already completed)

### ✅ localStorage Verification
After completing onboarding for a role:
- Open browser DevTools (F12)
- Go to Storage → Local Storage → http://localhost:3000
- **Expected Keys:**
  - `hasOnboarded_earner` = `'true'` (if earner completed)
  - `hasOnboarded_business` = `'true'` (if business completed)

### ✅ Button Behavior
- **First step**: "Previous" button disabled
- **Middle steps**: Both buttons enabled
- **Last step**: "Next" button changes to "Let's Go!"

### ✅ Progress Indicator
- Current step dot: Larger, blue (width: w-6)
- Completed steps: Smaller, blue (width: w-2)
- Upcoming steps: Smaller, gray (width: w-2)

### ✅ Responsive Design
**Desktop (1024px+)**
- Modal: 500px width, centered
- Icons: 80px
- Title: 24px font
- Full button width: 100px

**Tablet (640px - 1024px)**
- Modal: 95% width
- Icons: 64px
- Title: 20px font
- Buttons: Stack side-by-side

**Mobile (< 640px)**
- Modal: 95% width, full height optimization
- Icons: 64px
- Title: 20px font
- Buttons: Stack vertically (reversed order for better UX)

### ✅ Accessibility
- Tab through all interactive elements
- All buttons have descriptive aria-labels
- Modal has `role="dialog"` and `aria-modal="true"`
- Close button accessible via Escape key (built-in browser behavior)
- Progress dots are decorative but labeled for screen readers

### ✅ Skip/Close Functionality
- Click the "✕" button (top-right) to skip onboarding
- Click the backdrop (dark area outside modal) to skip onboarding
- **Action**: Marks role as onboarded in localStorage

## localStorage Keys

```javascript
// After completing onboarding for Earner
localStorage.getItem('hasOnboarded_earner') // Returns: 'true'

// After completing onboarding for Business
localStorage.getItem('hasOnboarded_business') // Returns: 'true'

// Reset onboarding (for testing)
localStorage.removeItem('hasOnboarded_earner');
localStorage.removeItem('hasOnboarded_business');
```

## Step Content Details

### Earner Steps (4 steps)
1. **Welcome** - Role confirmation and onboarding intro
2. **Find Jobs** - Browse opportunities explanation
3. **Submit Work** - Completion and submission process
4. **Get Paid** - Payment and instant withdrawal features

### Business Steps (4 steps)
1. **Welcome** - Role confirmation and onboarding intro
2. **Post Jobs** - Task creation and job listing process
3. **Review Submissions** - Quality evaluation workflow
4. **Release Payments** - Approval and payment distribution

## Styling & Customization

### Colors (Tailwind Classes Used)
- Primary: `bg-blue-600` (hover: `bg-blue-700`)
- Secondary: `bg-gray-300` (disabled actions)
- Backgrounds: `bg-blue-100` (light), `bg-green-100`, `bg-purple-100`, `bg-orange-100`
- Text: `text-gray-900` (primary), `text-gray-600` (secondary)

### CSS Classes
- `.onboarding-overlay` - Full screen backdrop container
- `.onboarding-modal` - Main modal container
- `.onboarding-content` - Inner content wrapper
- `.onboarding-icon` - Icon container with animation
- `.onboarding-title` - Step title
- `.onboarding-description` - Step description text
- `.onboarding-progress` - Progress indicator row
- `.onboarding-footer` - Buttons container
- `.onboarding-button` - Base button styles
- `.onboarding-button-primary` - Primary (action) button
- `.onboarding-button-secondary` - Secondary (back) button
- `.onboarding-counter` - Step counter display

## Animations

- **Modal Entry**: `slideUp + fadeInScale` (0.3s)
- **Modal Exit**: `slideDown + fadeOutScale` (0.3s)
- **Icon Entry**: `bounceIn` (0.5s)
- **Button Hover**: Scale + shadow effect
- **Progress Dot Transitions**: Smooth width/color changes

### Reduced Motion Support
All animations disable gracefully when `prefers-reduced-motion: reduce` is set.

## Dark Mode Support

The component includes complete dark mode styling:
- Modal background: `dark:bg-gray-800`
- Text colors: `dark:text-white`, `dark:text-gray-400`
- Button backgrounds: Darkened variants
- Border colors: `dark:border-gray-700`

## Git Workflow

### Create Feature Branch
```bash
git checkout -b feature/quid-onboarding-flow
```

### Commit Changes
```bash
git add src/components/Onboarding.tsx src/components/Icons.tsx src/components/Onboarding.css src/app/page.tsx

git commit -m "feat: implement Quid role-based onboarding modal with step navigation

- Add step-by-step guided tour for earner and business roles
- Implement localStorage persistence for onboarding completion
- Create role-specific step content with custom SVG icons
- Add smooth animations and accessibility features
- Implement responsive design for desktop and mobile
- Integrate role selection and onboarding in home page"
```

### Push and Create PR
```bash
git push origin feature/quid-onboarding-flow
```

### PR Description Template
```
## Description
Implements the user onboarding flow component for first-time Quid users.

## Related Issues
Closes #4

## Changes
- ✅ Created Onboarding.tsx with role-specific step navigation
- ✅ Added Icons.tsx with custom SVG icons and progress indicator
- ✅ Added Onboarding.css with responsive animations
- ✅ Integrated onboarding in page.tsx with role selection
- ✅ Implemented localStorage persistence
- ✅ Added accessibility features (ARIA labels, keyboard nav)

## Testing
- [x] Tested earner onboarding flow
- [x] Tested business onboarding flow
- [x] Verified localStorage persistence and refresh behavior
- [x] Tested mobile responsiveness
- [x] Tested accessibility (keyboard navigation, screen readers)
- [x] Verified smooth animations and transitions

## Screenshots
[Include screenshots of both roles]
```

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Considerations

- Component uses `'use client'` directive (client-side rendering)
- Minimal CSS (no animation on mobile if prefers-reduced-motion set)
- localStorage is lightweight and async
- SVG icons are inline (no HTTP requests)
- CSS animations use GPU-accelerated transforms

## Known Limitations

1. **Browser Storage**: localStorage limited to ~5-10MB per domain
2. **Cross-Device**: Onboarding status doesn't sync across devices (localStorage is per-device)
3. **Clear Data**: User clearing browser data will reset onboarding status

## Future Enhancements

- [ ] Add video tutorials for each step
- [ ] Implement analytics tracking (view duration, completion rate)
- [ ] Add skip confirmation dialog
- [ ] Support multiple languages (i18n)
- [ ] Add "re-run" option in settings
- [ ] Implement server-side persistence (user database)
- [ ] Add interactive tutorials (click-through overlays)

## Support & Troubleshooting

### Onboarding keeps appearing after completion
**Solution**: Check browser's localStorage settings. Clear and retry. Verify `hasOnboarded_${role}` key is set correctly.

### Modal not centered on mobile
**Solution**: Verify CSS media queries are applied. Check viewport meta tag in layout.tsx.

### Animations not smooth
**Solution**: Check browser performance. Disable if `prefers-reduced-motion: reduce` is detected (already implemented).

### Icons not displaying
**Solution**: Verify Icon.tsx is imported correctly. Check SVG viewBox and color properties.

---

**Last Updated**: January 22, 2026
**Component Version**: 1.0.0
**Status**: ✅ Production Ready
