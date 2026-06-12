import '../globals.css';
import AuthGuard from '../../components/AuthGuard';

export const metadata = {
  title: 'Giriş - Wex Entegrasyon Paneli',
  description: 'Login page without navigation sidebar',
};

export default function LoginLayout({ children }) {
  return (
    <>
      {/* AuthGuard can still protect the route if needed */}
      <AuthGuard>{children}</AuthGuard>
    </>
  );
}
