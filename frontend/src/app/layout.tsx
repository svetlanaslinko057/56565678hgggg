import type { Metadata } from 'next';
import StyledComponentsRegistry from '@/lib/registry';
import { ArenaProvider } from '@/lib/api/ArenaContext';
import { Web3Provider } from '@/lib/wagmi';
import { ToastProvider } from '@/components/arena/ToastProvider';
import { NotificationToastListener } from '@/components/arena/useNotificationToasts';
import '@/app/globals.css';
import '@/index.css';

export const metadata: Metadata = {
  title: 'FOMO Arena',
  description: 'Prediction arena for TGEs and market events',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>
          <Web3Provider>
            <ArenaProvider>
              <ToastProvider>
                <NotificationToastListener />
                {children}
              </ToastProvider>
            </ArenaProvider>
          </Web3Provider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
