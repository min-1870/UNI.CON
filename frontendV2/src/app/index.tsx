// Import the Home component and export it as Index
import Home from './home';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Index() {
  return (
    <ProtectedRoute>
      <Home />
    </ProtectedRoute>
  );
}