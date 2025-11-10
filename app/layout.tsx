import '../styles/globals.css';
import Sidebar from '../components/layout/Sidebar';

export const metadata = {
  title: 'GravitySeries Results',
  description: 'Official GravitySeries race results'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <main style={{ flex: 1, padding: '24px' }}>{children}</main>
        </div>
      </body>
    </html>
  );
}