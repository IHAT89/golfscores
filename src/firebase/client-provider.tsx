'use client';

import React, { ReactNode } from 'react';
import { FirebaseProvider } from './provider';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { initializeFirebase } from './index';

// Initialize Firebase once on the client at the module level
const { firebaseApp, firestore, auth } = initializeFirebase();

export function FirebaseClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <FirebaseProvider firebaseApp={firebaseApp} firestore={firestore} auth={auth}>
      <FirebaseErrorListener />
      {children}
    </FirebaseProvider>
  );
}
