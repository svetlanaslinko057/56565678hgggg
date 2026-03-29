'use client';

import React from 'react';
import { TgShell } from '@/components/tg';

export default function TgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TgShell>{children}</TgShell>;
}
