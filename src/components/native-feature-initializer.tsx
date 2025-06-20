'use client';

import { useEffect } from 'react';
import { initNativeFeatures } from '@/lib/native-features';

export default function NativeFeatureInitializer() {
  useEffect(() => {
    initNativeFeatures().catch(console.error);
  }, []);

  // This component doesn't render anything
  return null;
}