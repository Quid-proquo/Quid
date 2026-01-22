# Quid Onboarding Component

A role-specific, guided tour modal component for first-time Quid users that provides a smooth onboarding experience with localStorage persistence.

## 🎯 Features

- **Role-Specific Content** - Separate onboarding flows for earners and businesses
- **Step Navigation** - Navigate between steps with Previous/Next buttons
- **Progress Indicator** - Visual progress dots showing current step
- **localStorage Persistence** - Remembers completion status per role
- **Fully Accessible** - ARIA labels, keyboard navigation, screen reader support
- **Responsive Design** - Optimized for desktop, tablet, and mobile
- **Smooth Animations** - CSS animations with reduced-motion support
- **Dark Mode Support** - Automatically adapts to dark mode preferences

## 📁 Files

```
src/components/
├── Onboarding.tsx          # Main component with state management
├── Onboarding.css          # Styles, animations, responsive design
└── Icons.tsx               # SVG icons and progress indicator
```

## 🚀 Quick Start

### Installation

The component is already integrated. Just ensure dependencies are installed:

```bash
npm install
```

### Basic Usage

```tsx
import Onboarding from '@/components/Onboarding';

export default function MyComponent() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  return (
    <>
      {showOnboarding && (
        <Onboarding 
          role="earner" 
          onComplete={() => setShowOnboarding(false)} 
        />
      )}
    </>
  );
}
```

## 📋 Props

```typescript
interface OnboardingProps {
  role: 'earner' | 'business';  // Which role's steps to display
  onComplete: () => void;        // Called when onboarding finishes
}
```

## 📖 Content

### Earner Onboarding (4 steps)
1. Welcome to Quid
2. Find Jobs
3. Submit Your Work  
4. Get Paid Instantly

### Business Onboarding (4 steps)
1. Welcome to Quid
2. Post Jobs
3. Review Submissions
4. Release Payments

## 💾 localStorage Keys

- `hasOnboarded_earner` - Set to `'true'` when earner completes
- `hasOnboarded_business` - Set to `'true'` when business completes

## ⌨️ Keyboard Navigation

- **Tab** - Move between buttons
- **Enter** - Activate buttons
- **Esc** - Close modal (if implemented in browser)

## 🎨 Styling

### Colors
- Primary: Blue-600
- Secondary: Gray-300
- Backgrounds: Blue-50, Green-100, Purple-100, Orange-100

### Animations
- Modal slides up and fades in (300ms)
- Modal slides down and fades out (300ms)
- Icons bounce in (500ms)
- Progress dots animate smoothly

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## ♿ Accessibility

- ✅ WCAG 2.1 AA compliant
- ✅ Full keyboard navigation
- ✅ Screen reader compatible
- ✅ High contrast mode support
- ✅ Reduced motion support
- ✅ Semantic HTML
- ✅ ARIA labels and roles

## 🧪 Testing

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive testing procedures.

### Quick Test
1. Select a role
2. Complete the onboarding flow
3. Refresh the page
4. Select the same role again
5. Modal should NOT appear

### Verify localStorage
Open DevTools → Storage → Local Storage and check for `hasOnboarded_${role}` keys.

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers

## 🔧 Development

### Running the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## 📚 Documentation

- [ONBOARDING_GUIDE.md](./ONBOARDING_GUIDE.md) - Detailed implementation guide
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Comprehensive testing procedures

## 🐛 Troubleshooting

### Modal doesn't appear
- Check localStorage isn't already set
- Verify `role` prop is either 'earner' or 'business'
- Check browser console for errors

### Animations not smooth
- Check if `prefers-reduced-motion` is enabled (intentional)
- Verify browser supports CSS animations
- Check device performance

### Mobile layout breaks
- Verify viewport meta tag is in `layout.tsx`
- Check CSS media queries are applied
- Test in responsive design mode

## 🎯 Acceptance Criteria

- ✅ Modal appears only on first role selection
- ✅ Correct steps display for each role
- ✅ Step navigation works (Next/Previous)
- ✅ Progress indicator updates correctly
- ✅ Completion saved in localStorage
- ✅ Modal is responsive (mobile/desktop)
- ✅ Smooth animations and transitions
- ✅ Fully accessible

## 📦 Dependencies

- Next.js 16.1.2
- React 19.2.3
- React DOM 19.2.3
- TypeScript 5
- Tailwind CSS 4

## 🚢 Deployment

The component is production-ready. No additional configuration needed.

1. Push to feature branch: `feature/quid-onboarding-flow`
2. Create pull request with screenshots
3. Pass code review
4. Merge to main
5. Deploy via your CI/CD pipeline

## 📝 Git Workflow

```bash
# Create feature branch
git checkout -b feature/quid-onboarding-flow

# Make changes and commit
git add .
git commit -m "feat: implement role-based onboarding modal"

# Push to remote
git push origin feature/quid-onboarding-flow

# Create pull request on GitHub
```

## 🎓 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Web Accessibility](https://www.w3.org/WAI/)

## 📞 Support

For issues or questions, open an issue on GitHub or contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: January 22, 2026  
**Status**: ✅ Production Ready
