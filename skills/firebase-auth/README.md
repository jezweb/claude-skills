# Firebase Authentication Skill

Production-tested skill for implementing Firebase Authentication in web and mobile applications.

## Auto-Trigger Keywords

This skill activates when Claude detects these keywords:

### Technology Keywords
- firebase auth, firebase authentication
- firebase login, firebase sign in, firebase signup
- firebase user, firebase session
- firebase-admin auth
- firebase oauth, firebase social login

### Operation Keywords
- signInWithEmailAndPassword, createUserWithEmailAndPassword
- signInWithPopup, signInWithRedirect
- onAuthStateChanged, auth state
- getIdToken, verifyIdToken
- firebase session cookie
- firebase custom claims
- firebase phone auth, firebase mfa
- firebase password reset
- firebase email verification

### Provider Keywords
- firebase google sign in
- firebase github login
- firebase facebook auth
- firebase apple sign in
- firebase microsoft auth
- firebase twitter auth

### Error Keywords
- auth/invalid-credential
- auth/user-not-found
- auth/wrong-password
- auth/email-already-in-use
- auth/popup-closed-by-user
- auth/popup-blocked
- auth/requires-recent-login
- auth/too-many-requests
- firebase token expired
- firebase auth cors error

### Framework Keywords
- next.js firebase auth
- react firebase auth
- firebase auth middleware
- firebase protected route
- firebase auth context

## What This Skill Covers

- Email/password authentication
- OAuth providers (Google, GitHub, etc.)
- Phone authentication
- Multi-factor authentication (MFA)
- Auth state management
- Token management and verification
- Session cookies for SSR
- Custom claims and roles
- Protected routes
- Error handling best practices

## When to Use This Skill

Use when:
- Setting up authentication in a Firebase project
- Implementing sign-in/sign-up flows
- Adding social login providers
- Managing user sessions
- Protecting API routes and pages
- Implementing role-based access control
- Handling authentication errors
- Migrating to modular SDK (v9+)

## Related Skills

- `firebase-firestore` - Firebase Firestore database
- `firebase-storage` - Firebase Cloud Storage
- `clerk-auth` - Alternative: Clerk authentication
- `better-auth` - Alternative: Better Auth library
