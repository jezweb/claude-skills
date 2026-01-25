# Firebase Authentication Correction Rules

## SDK Version (firebase@12.8.0+)

Use the modular API (v9+), not the namespaced API:

```typescript
// CORRECT - Modular API
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

await signInWithEmailAndPassword(auth, email, password);

// WRONG - Namespaced API (deprecated)
import firebase from 'firebase/app';
await firebase.auth().signInWithEmailAndPassword(email, password);
```

## Auth State Listener

Always unsubscribe from `onAuthStateChanged`:

```typescript
// CORRECT - With cleanup
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    setUser(user);
  });
  return () => unsubscribe();  // Cleanup
}, []);

// WRONG - Memory leak
useEffect(() => {
  onAuthStateChanged(auth, (user) => {
    setUser(user);
  });
  // No cleanup!
}, []);
```

## ID Token Handling

Always get fresh token before API calls:

```typescript
// CORRECT - Get fresh token
const token = await user.getIdToken(/* forceRefresh */ true);

// WRONG - Use cached token (may be expired)
const token = await user.getIdToken();  // May return expired token
```

## Error Handling

Use same message for email/password errors (prevent enumeration):

```typescript
// CORRECT - Same message prevents enumeration
case 'auth/user-not-found':
case 'auth/wrong-password':
case 'auth/invalid-credential':
  return 'Invalid email or password';

// WRONG - Reveals which field is wrong
case 'auth/user-not-found':
  return 'Email not found';  // Reveals email doesn't exist
case 'auth/wrong-password':
  return 'Password incorrect';  // Reveals email exists
```

## Custom Claims

Force token refresh after setting claims:

```typescript
// CORRECT - Force refresh to get new claims
await adminAuth.setCustomUserClaims(uid, { admin: true });
// Client side: user must refresh token
const tokenResult = await user.getIdTokenResult(true);  // Force refresh

// WRONG - Claims won't be available immediately
await adminAuth.setCustomUserClaims(uid, { admin: true });
// User still has old token without admin claim
```

## OAuth Popup Handling

Handle popup-closed gracefully:

```typescript
// CORRECT - Handle user cancellation
try {
  await signInWithPopup(auth, provider);
} catch (error: any) {
  if (error.code === 'auth/popup-closed-by-user') {
    // User cancelled - not an error
    return;
  }
  throw error;
}

// WRONG - Shows error for user cancellation
try {
  await signInWithPopup(auth, provider);
} catch (error) {
  setError('Sign-in failed');  // Shows error even when user cancelled
}
```

## Session Cookies

Set secure cookie options in production:

```typescript
// CORRECT
cookies.set('session', sessionCookie, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: expiresIn / 1000,
});

// WRONG - Not secure
cookies.set('session', sessionCookie);  // Missing security options
```

## Private Key in Environment

Handle escaped newlines:

```typescript
// CORRECT
privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),

// WRONG - Will fail with "invalid_grant"
privateKey: process.env.FIREBASE_PRIVATE_KEY,
```

## Admin SDK Initialization

Check if already initialized:

```typescript
// CORRECT - Singleton pattern
import { getApps, initializeApp } from 'firebase-admin/app';

if (!getApps().length) {
  initializeApp(config);
}

// WRONG - May initialize multiple times
initializeApp(config);  // Crashes on second import
```

## Token Verification

Always verify tokens server-side:

```typescript
// CORRECT - Server-side verification
const decodedToken = await adminAuth.verifyIdToken(token);
const uid = decodedToken.uid;

// WRONG - Trusting client claims
const claims = JSON.parse(atob(token.split('.')[1]));  // Can be forged!
```

## Re-authentication for Sensitive Operations

```typescript
// CORRECT - Re-authenticate before sensitive operations
import { reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

const credential = EmailAuthProvider.credential(email, password);
await reauthenticateWithCredential(user, credential);
await user.delete();

// WRONG - Will throw auth/requires-recent-login
await user.delete();  // May fail if signed in too long ago
```
