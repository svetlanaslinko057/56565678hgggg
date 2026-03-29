import ArenaLayoutClient from '@/components/layout/ArenaLayoutClient';

export default function ArenaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ArenaLayoutClient>{children}</ArenaLayoutClient>;
}
