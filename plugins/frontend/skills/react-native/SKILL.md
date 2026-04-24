---
name: react-native
description: "React Native and Expo patterns for building performant mobile apps. Covers list performance, animations with Reanimated, navigation, UI patterns, state management, platform-specific code, and Expo workflows. Use when building or reviewing React Native code. Triggers: 'react native', 'expo', 'mobile app', 'react native performance', 'flatlist', 'reanimated', 'expo router', 'mobile development', 'ios app', 'android app'."
compatibility: Designed for Claude Code (or similar products)
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# React Native Patterns

Performance and architecture patterns for React Native + Expo apps. Rules ranked by impact — fix CRITICAL before touching MEDIUM.

This is a starting point. The skill will grow as you build more mobile apps.

## When to Apply

- Building new React Native or Expo apps
- Optimising list and scroll performance
- Implementing animations
- Reviewing mobile code for performance issues
- Setting up a new Expo project

## 1. List Performance (CRITICAL)

Lists are the #1 performance issue in React Native. A janky scroll kills the entire app experience.

| Pattern | Problem | Fix |
|---------|---------|-----|
| **ScrollView for data** | `<ScrollView>` renders all items at once | Use `<FlatList>` or `<FlashList>` — virtualised, only renders visible items |
| **Missing keyExtractor** | FlatList without `keyExtractor` → unnecessary re-renders | `keyExtractor={(item) => item.id}` — stable unique key per item |
| **Complex renderItem** | Expensive component in renderItem re-renders on every scroll | Wrap in `React.memo`, extract to separate component |
| **Inline functions in renderItem** | `renderItem={({ item }) => <Row onPress={() => nav(item.id)} />}` | Extract handler: `const handlePress = useCallback(...)` |
| **No getItemLayout** | FlatList measures every item on scroll (expensive) | Provide `getItemLayout` for fixed-height items: `(data, index) => ({ length: 80, offset: 80 * index, index })` |
| **FlashList** | FlatList is good, FlashList is better for large lists | `@shopify/flash-list` — drop-in replacement, recycling architecture |
| **Large images in lists** | Full-res images decoded on main thread | Use `expo-image` with placeholder + transition, specify dimensions |

### FlatList Checklist

Every FlatList should have:
```tsx
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={renderItem}           // Memoised component
  getItemLayout={getItemLayout}     // If items are fixed height
  initialNumToRender={10}           // Don't render 100 items on mount
  maxToRenderPerBatch={10}          // Batch size for off-screen rendering
  windowSize={5}                    // How many screens to keep in memory
  removeClippedSubviews={true}      // Unmount off-screen items (Android)
/>
```

## 2. Animations (HIGH)

Native animations run on the UI thread. JS animations block the JS thread and cause jank.

| Pattern | Problem | Fix |
|---------|---------|-----|
| **Animated API for complex animations** | `Animated` runs on JS thread, blocks interactions | Use `react-native-reanimated` — runs on UI thread |
| **Layout animation** | Item appears/disappears with no transition | `LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)` |
| **Shared element transitions** | Navigate between screens, element teleports | `react-native-reanimated` shared transitions or `expo-router` shared elements |
| **Gesture + animation** | Drag/swipe feels laggy | `react-native-gesture-handler` + `reanimated` worklets — all on UI thread |
| **Measuring layout** | `onLayout` fires too late, causes flash | Use `useAnimatedStyle` with shared values for instant response |

### Reanimated Basics

```tsx
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

function AnimatedBox() {
  const offset = useSharedValue(0);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(offset.value) }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.box, style]} />
    </GestureDetector>
  );
}
```

## 3. Navigation (HIGH)

| Pattern | Problem | Fix |
|---------|---------|-----|
| **Expo Router** | File-based routing (like Next.js) for React Native | `app/` directory with `_layout.tsx` files. Preferred for new Expo projects. |
| **Heavy screens on stack** | Every screen stays mounted in the stack | Use `unmountOnBlur: true` for screens that don't need to persist |
| **Deep linking** | App doesn't respond to URLs | Expo Router handles this automatically. For bare RN: `Linking` API config |
| **Tab badge updates** | Badge count doesn't update when tab is focused | Use `useIsFocused()` or refetch on focus: `useFocusEffect(useCallback(...))` |
| **Navigation state persistence** | App loses position on background/kill | `onStateChange` + `initialState` with AsyncStorage |

### Expo Router Structure

```
app/
├── _layout.tsx          # Root layout (tab navigator)
├── index.tsx            # Home tab
├── (tabs)/
│   ├── _layout.tsx      # Tab bar config
│   ├── home.tsx
│   ├── search.tsx
│   └── profile.tsx
├── [id].tsx             # Dynamic route
└── modal.tsx            # Modal route
```

## 4. UI Patterns (HIGH)

| Pattern | Problem | Fix |
|---------|---------|-----|
| **Safe area** | Content under notch or home indicator | `<SafeAreaView>` or `useSafeAreaInsets()` from `react-native-safe-area-context` |
| **Keyboard avoidance** | Form fields hidden behind keyboard | `<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>` |
| **Platform-specific code** | iOS and Android need different behaviour | `Platform.select({ ios: ..., android: ... })` or `.ios.tsx` / `.android.tsx` files |
| **Status bar** | Status bar overlaps content or wrong colour | `<StatusBar style="auto" />` from `expo-status-bar` in root layout |
| **Touch targets** | Buttons too small to tap | Minimum 44x44pt. Use `hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}` |
| **Haptic feedback** | Taps feel dead | `expo-haptics` — `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` on important actions |

## 5. Images and Media (MEDIUM)

| Pattern | Problem | Fix |
|---------|---------|-----|
| **Image component** | `<Image>` from react-native is basic | Use `expo-image` — caching, placeholder, transition, blurhash |
| **Remote images without dimensions** | Layout shift when image loads | Always specify `width` and `height`, or use `aspectRatio` |
| **Large images** | OOM crashes on Android | Resize server-side or use `expo-image` which handles memory |
| **SVG** | SVG support isn't native | `react-native-svg` + `react-native-svg-transformer` for SVG imports |
| **Video** | Video playback | `expo-av` or `expo-video` (newer API) |

## 6. State and Data (MEDIUM)

| Pattern | Problem | Fix |
|---------|---------|-----|
| **AsyncStorage for complex data** | JSON parse/stringify on every read | Use MMKV (`react-native-mmkv`) — 30x faster than AsyncStorage |
| **Global state** | Redux/MobX boilerplate for simple state | Zustand — minimal, works great with React Native |
| **Server state** | Manual fetch + loading + error + cache | TanStack Query — same as web, works in React Native |
| **Offline first** | App unusable without network | TanStack Query `persistQueryClient` + MMKV, or WatermelonDB for complex offline |
| **Deep state updates** | Spread operator hell for nested objects | Immer via Zustand: `set(produce(state => { state.user.name = 'new' }))` |

## 7. Expo Workflow (MEDIUM)

| Pattern | When | How |
|---------|------|-----|
| **Development build** | Need native modules | `npx expo run:ios` or `eas build --profile development` |
| **Expo Go** | Quick prototyping, no native modules | `npx expo start` — scan QR code |
| **EAS Build** | CI/CD, app store builds | `eas build --platform ios --profile production` |
| **EAS Update** | Hot fix without app store review | `eas update --branch production --message "Fix bug"` |
| **Config plugins** | Modify native config without ejecting | `app.config.ts` with `expo-build-properties` or custom config plugin |
| **Environment variables** | Different configs per build | `eas.json` build profiles + `expo-constants` |

### New Project Setup

```bash
npx create-expo-app my-app --template tabs
cd my-app
npx expo install expo-image react-native-reanimated react-native-gesture-handler react-native-safe-area-context
```

## 8. Testing (LOW-MEDIUM)

| Tool | For | Setup |
|------|-----|-------|
| **Jest** | Unit tests, hook tests | Included with Expo by default |
| **React Native Testing Library** | Component tests | `@testing-library/react-native` |
| **Detox** | E2E tests on real devices/simulators | `detox` — Wix's testing framework |
| **Maestro** | E2E with YAML flows | `maestro test flow.yaml` — simpler than Detox |

## Common Gotchas

| Gotcha | Fix |
|--------|-----|
| Metro bundler cache | `npx expo start --clear` |
| Pod install issues (iOS) | `cd ios && pod install --repo-update` |
| Reanimated not working | Must be first import: `import 'react-native-reanimated'` in root |
| Expo SDK upgrade | `npx expo install --fix` after updating SDK version |
| Android build fails | Check `gradle.properties` for memory: `org.gradle.jvmargs=-Xmx4g` |
| iOS simulator slow | Use physical device for performance testing — simulator doesn't reflect real perf |
