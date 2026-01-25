---
name: firebase-auth
description: |
  Build with Firebase Authentication - email/password, OAuth providers, phone auth, and custom tokens. Use when: setting up auth flows, implementing sign-in/sign-up, managing user sessions, protecting routes, or troubleshooting auth/invalid-credential, auth/popup-closed, auth/user-not-found, or token refresh errors. Prevents 12 documented errors.
user-invocable: true
---

# Firebase Authentication

**Status**: Production Ready
**Last Updated**: 2026-01-25
**Dependencies**: None (standalone skill)
**Latest Versions**: firebase@12.8.0, firebase-admin@13.6.0

---

## Quick Start (5 Minutes)

### 1. Enable Auth Providers in Firebase Console

1. Go to Firebase Console > Authentication > Sign-in method
2. Enable desired providers (Email/Password, Google, etc.)
3. Configure OAuth providers with client ID/secret

### 2. Initialize Firebase Auth (Client)

```typescript
// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // ... other config
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

### 3. Initialize Firebase Admin (Server)

```typescript
// src/lib/firebase-admin.ts
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const adminAuth = getAuth();
```

---

## Email/Password Authentication

### Sign Up

```typescript
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import { auth } from './firebase';

async function signUp(email: string, password: string, displayName: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name
    await updateProfile(user, { displayName });

    // Send verification email
    await sendEmailVerification(user);

    return user;
  } catch (error: any) {
    switch (error.code) {
      case 'auth/email-already-in-use':
        throw new Error('Email already registered');
      case 'auth/invalid-email':
        throw new Error('Invalid email address');
      case 'auth/weak-password':
        throw new Error('Password must be at least 6 characters');
      default:
        throw new Error('Sign up failed');
    }
  }
}
```

### Sign In

```typescript
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

async function signIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        throw new Error('Invalid email or password');
      case 'auth/user-disabled':
        throw new Error('Account has been disabled');
      case 'auth/too-many-requests':
        throw new Error('Too many attempts. Try again later.');
      default:
        throw new Error('Sign in failed');
    }
  }
}
```

### Sign Out

```typescript
import { signOut } from 'firebase/auth';
import { auth } from './firebase';

async function handleSignOut() {
  await signOut(auth);
  // Redirect to login page
}
```

### Password Reset

```typescript
import { sendPasswordResetEmail, confirmPasswordReset } from 'firebase/auth';
import { auth } from './firebase';

// Send reset email
async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

// Confirm reset (from email link)
async function confirmReset(oobCode: string, newPassword: string) {
  await confirmPasswordReset(auth, oobCode, newPassword);
}
```

---

## OAuth Providers (Google, GitHub, etc.)

### Google Sign-In

```typescript
import { signInWithPopup, signInWithRedirect, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase';

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Popup method (recommended for desktop)
async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      // User closed popup - not an error
      return null;
    }
    if (error.code === 'auth/popup-blocked') {
      // Fallback to redirect
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw error;
  }
}

// Redirect method (for mobile or popup-blocked)
async function signInWithGoogleRedirect() {
  await signInWithRedirect(auth, googleProvider);
}
```

### Handle Redirect Result

```typescript
import { getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase';

// Call on page load
async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      return result.user;
    }
  } catch (error) {
    console.error('Redirect sign-in error:', error);
  }
  return null;
}
```

### Other OAuth Providers

```typescript
import {
  GithubAuthProvider,
  TwitterAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
} from 'firebase/auth';

// GitHub
const githubProvider = new GithubAuthProvider();
githubProvider.addScope('read:user');

// Microsoft
const microsoftProvider = new OAuthProvider('microsoft.com');
microsoftProvider.addScope('email');
microsoftProvider.addScope('profile');

// Apple
const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');
```

---

## Auth State Management

### Listen to Auth State Changes

```typescript
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';

// React hook example
function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}
```

### Auth Context Provider (React)

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

---

## Token Management

### Get ID Token (for API calls)

```typescript
import { auth } from './firebase';

async function getIdToken() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  // Force refresh to get fresh token
  const token = await user.getIdToken(/* forceRefresh */ true);
  return token;
}

// Use in API calls
async function callProtectedAPI() {
  const token = await getIdToken();

  const response = await fetch('/api/protected', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}
```

### Verify ID Token (Server-side)

```typescript
// API route (Next.js example)
import { adminAuth } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // User is authenticated, proceed with request
    return Response.json({ uid, message: 'Authenticated' });
  } catch (error) {
    return Response.json({ error: 'Invalid token' }, { status: 401 });
  }
}
```

### Session Cookies (Server-Side Rendering)

```typescript
import { adminAuth } from '@/lib/firebase-admin';

// Create session cookie
async function createSessionCookie(idToken: string) {
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn,
  });

  return sessionCookie;
}

// Verify session cookie
async function verifySessionCookie(sessionCookie: string) {
  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedClaims;
  } catch (error) {
    return null;
  }
}

// Revoke session
async function revokeSession(uid: string) {
  await adminAuth.revokeRefreshTokens(uid);
}
```

---

## Custom Claims & Roles

### Set Custom Claims (Admin SDK)

```typescript
import { adminAuth } from '@/lib/firebase-admin';

// Set admin role
async function setAdminRole(uid: string) {
  await adminAuth.setCustomUserClaims(uid, {
    admin: true,
    role: 'admin',
  });
}

// Set custom permissions
async function setUserPermissions(uid: string, permissions: string[]) {
  await adminAuth.setCustomUserClaims(uid, {
    permissions,
  });
}
```

### Check Custom Claims (Client)

```typescript
import { auth } from './firebase';

async function checkAdminStatus() {
  const user = auth.currentUser;
  if (!user) return false;

  // Force token refresh to get latest claims
  const tokenResult = await user.getIdTokenResult(true);
  return tokenResult.claims.admin === true;
}

// In component
const isAdmin = await checkAdminStatus();
```

**CRITICAL:** Custom claims are cached in the ID token. After setting claims, the user must:
1. Sign out and sign in again, OR
2. Force refresh the token with `getIdTokenResult(true)`

---

## Phone Authentication

```typescript
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
} from 'firebase/auth';
import { auth } from './firebase';

let confirmationResult: ConfirmationResult;

// Step 1: Setup reCAPTCHA (required)
function setupRecaptcha() {
  window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'normal',
    callback: () => {
      // reCAPTCHA solved
    },
  });
}

// Step 2: Send verification code
async function sendVerificationCode(phoneNumber: string) {
  const appVerifier = window.recaptchaVerifier;
  confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
}

// Step 3: Verify code
async function verifyCode(code: string) {
  const result = await confirmationResult.confirm(code);
  return result.user;
}
```

---

## Multi-Factor Authentication (MFA)

```typescript
import {
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  getMultiFactorResolver,
} from 'firebase/auth';
import { auth } from './firebase';

// Enroll phone as second factor
async function enrollPhoneMFA(phoneNumber: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const multiFactorSession = await multiFactor(user).getSession();

  const phoneAuthProvider = new PhoneAuthProvider(auth);
  const verificationId = await phoneAuthProvider.verifyPhoneNumber(
    { phoneNumber, session: multiFactorSession },
    window.recaptchaVerifier
  );

  // Return verificationId to complete enrollment after user enters code
  return verificationId;
}

// Complete enrollment
async function completeEnrollment(verificationId: string, verificationCode: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
  const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(credential);

  await multiFactor(user).enroll(multiFactorAssertion, 'Phone Number');
}

// Handle MFA during sign-in
async function handleMFASignIn(error: any) {
  if (error.code !== 'auth/multi-factor-auth-required') {
    throw error;
  }

  const resolver = getMultiFactorResolver(auth, error);
  // Show UI to select MFA method and enter code
  return resolver;
}
```

---

## Protected Routes (Next.js)

### Middleware Protection

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;

  // Protect /dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect authenticated users away from /login
  if (request.nextUrl.pathname === '/login') {
    if (sessionCookie) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
```

### Client-Side Route Guard

```typescript
// components/ProtectedRoute.tsx
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
```

---

## Error Handling

### Common Auth Errors

| Error Code | Description | User-Friendly Message |
|------------|-------------|----------------------|
| `auth/invalid-credential` | Wrong email/password | Invalid email or password |
| `auth/user-not-found` | Email not registered | Invalid email or password |
| `auth/wrong-password` | Incorrect password | Invalid email or password |
| `auth/email-already-in-use` | Email registered | This email is already registered |
| `auth/weak-password` | Password < 6 chars | Password must be at least 6 characters |
| `auth/invalid-email` | Malformed email | Please enter a valid email |
| `auth/user-disabled` | Account disabled | Your account has been disabled |
| `auth/too-many-requests` | Rate limited | Too many attempts. Try again later |
| `auth/popup-closed-by-user` | User closed popup | Sign-in cancelled |
| `auth/popup-blocked` | Browser blocked popup | Please allow popups |
| `auth/requires-recent-login` | Sensitive operation | Please sign in again |
| `auth/network-request-failed` | Network error | Please check your connection |

### Error Handler Utility

```typescript
export function getAuthErrorMessage(error: any): string {
  const errorMessages: Record<string, string> = {
    'auth/invalid-credential': 'Invalid email or password',
    'auth/user-not-found': 'Invalid email or password',
    'auth/wrong-password': 'Invalid email or password',
    'auth/email-already-in-use': 'This email is already registered',
    'auth/weak-password': 'Password must be at least 6 characters',
    'auth/invalid-email': 'Please enter a valid email address',
    'auth/user-disabled': 'Your account has been disabled',
    'auth/too-many-requests': 'Too many attempts. Please try again later',
    'auth/popup-closed-by-user': 'Sign-in was cancelled',
    'auth/network-request-failed': 'Network error. Please check your connection',
  };

  return errorMessages[error.code] || 'An unexpected error occurred';
}
```

---

## Known Issues Prevention

This skill prevents **12** documented Firebase Auth errors:

| Issue # | Error/Issue | Description | How to Avoid | Source |
|---------|-------------|-------------|--------------|--------|
| **#1** | `auth/invalid-credential` | Generic error for wrong email/password | Show generic "invalid email or password" message | Common |
| **#2** | `auth/popup-blocked` | Browser blocks OAuth popup | Implement redirect fallback | [Docs](https://firebase.google.com/docs/auth/web/google-signin#redirect-mode) |
| **#3** | `auth/requires-recent-login` | Sensitive operations need fresh login | Re-authenticate before password change, delete | [Docs](https://firebase.google.com/docs/auth/web/manage-users#re-authenticate_a_user) |
| **#4** | Custom claims not updating | Claims cached in ID token | Force token refresh after setting claims | [Docs](https://firebase.google.com/docs/auth/admin/custom-claims) |
| **#5** | Token expiration | ID tokens expire after 1 hour | Always call `getIdToken()` before API calls | Common |
| **#6** | Memory leak from auth listener | Not unsubscribing from `onAuthStateChanged` | Return cleanup function in useEffect | Common |
| **#7** | CORS errors on localhost | Auth domain mismatch | Add localhost to authorized domains in console | Common |
| **#8** | Private key newline issue | Escaped `\n` in env var | Use `.replace(/\\n/g, '\n')` | Common |
| **#9** | Session cookie not persisting | Cookie settings wrong | Set `secure: true`, `sameSite: 'lax'` in production | Common |
| **#10** | OAuth state mismatch | User navigates away during OAuth | Handle `auth/popup-closed-by-user` gracefully | Common |
| **#11** | Rate limiting | Too many auth attempts | Implement exponential backoff | [Docs](https://firebase.google.com/docs/auth/limits) |
| **#12** | Email enumeration | Different errors for existing/non-existing emails | Use same message for both | Security best practice |

---

## Security Best Practices

### Always Do

1. **Use HTTPS in production** - Required for secure cookies
2. **Validate tokens server-side** - Never trust client claims alone
3. **Handle token expiration** - Refresh before API calls
4. **Implement rate limiting** - Prevent brute force attacks
5. **Use same error message** for wrong email/password - Prevent enumeration
6. **Enable email verification** - Verify user owns email
7. **Use session cookies for SSR** - More secure than ID tokens in cookies
8. **Revoke tokens on password change** - Invalidate old sessions

### Never Do

1. **Never expose private key** in client code
2. **Never trust client-provided claims** - Always verify server-side
3. **Never store ID tokens in localStorage** - Use httpOnly cookies
4. **Never disable email enumeration protection** in production
5. **Never skip CORS configuration** for your domains

---

## Firebase CLI Commands

```bash
# Initialize Firebase project
firebase init

# Enable auth emulator
firebase emulators:start --only auth

# Export auth users
firebase auth:export users.json --format=json

# Import auth users
firebase auth:import users.json
```

---

## Package Versions (Verified 2026-01-25)

```json
{
  "dependencies": {
    "firebase": "^12.8.0"
  },
  "devDependencies": {
    "firebase-admin": "^13.6.0"
  }
}
```

---

## Official Documentation

- **Firebase Auth Overview**: https://firebase.google.com/docs/auth
- **Web Get Started**: https://firebase.google.com/docs/auth/web/start
- **Admin Auth**: https://firebase.google.com/docs/auth/admin
- **Custom Claims**: https://firebase.google.com/docs/auth/admin/custom-claims
- **Session Cookies**: https://firebase.google.com/docs/auth/admin/manage-cookies
- **Security Rules**: https://firebase.google.com/docs/rules

---

**Last verified**: 2026-01-25 | **Skill version**: 1.0.0
