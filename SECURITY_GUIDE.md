# Firebase authentication and administrator provisioning

In Firebase Console, select project `daytech-bba8f`, open **Authentication → Sign-in method**, and confirm Google is enabled. Open **Authentication → Settings → Authorized domains** and add the exact host `daytech-lsw4g3h36-futurestands-projects.vercel.app` if that preview is still used. Add the verified stable production hostname separately. Use bare hostnames. For local Google sign-in, add `localhost` to the development Firebase project and use its web configuration locally.

Set `VITE_FEATURE_FIREBASE=true` in the applicable Vercel environment. If overriding the checked-in web settings, provide `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, and `VITE_FIREBASE_APP_ID` together. Use the same VITE settings for the server runtime and frontend build. Include `VITE_FIREBASE_DATABASE_ID` when the override uses a named database. Redeploy through the normal review process after changing build-time values. Test the Google popup, account creation and portal sign-in on each authorised hostname.

## Initial administrator

1. Verify the intended administrator's Google identity out of band. Have them sign in once so the platform creates a client profile.
2. Compare the verified email, enabled account state and UID in Firebase Authentication with the selected `users/{uid}` Firestore document in the same project and database.
3. An authorised Firebase operator updates only that active document's role to `super_admin` and sets `updatedAt` to a Firestore timestamp. Record the operator, target UID and reason in the change record. The operator action requires approval for production.
4. Ask the administrator to sign out and sign back in, then verify access. Review existing privileged UIDs and deployment history before applying the new rules because legacy roles may have been assigned through the previous bootstrap flow.

Staff APIs on production and Vercel require an active, verified Firebase staff account. Configure `QUOTATION_LINK_SECRET` independently with at least 32 random characters. Links issued using an earlier key must be reissued after key replacement. Signed links grant read access to anyone holding the link until expiry. Quotation acceptance still requires the assigned active customer account.
