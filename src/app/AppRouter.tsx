import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage, RequireInternal, RequireSession, useRole } from '@/features/auth';
import { BoardPage } from '@/features/board';
import { CatalogPage } from '@/features/catalog';
import { DashboardPage } from '@/features/dashboard';
import { ProblemsPage } from '@/features/problems';
import { SettingsPage } from '@/features/settings';
import { NewTicketPage, TicketDetailPage, TicketListPage } from '@/features/tickets';
import { AppLayout } from './layout/AppLayout';

function Home() {
  const { isInternal } = useRole();
  return <Navigate to={isInternal ? '/board' : '/tickets/new'} replace />;
}

const internal = (element: JSX.Element) => <RequireInternal>{element}</RequireInternal>;

/** HashRouter: works on GitHub Pages with no server rewrites. */
export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route
          element={
            <RequireSession>
              <AppLayout />
            </RequireSession>
          }
        >
          <Route index element={<Home />} />
          <Route path="tickets" element={<TicketListPage />} />
          <Route path="tickets/new" element={<NewTicketPage />} />
          <Route path="tickets/:id" element={<TicketDetailPage />} />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="board" element={internal(<BoardPage />)} />
          <Route path="problems" element={internal(<ProblemsPage />)} />
          <Route path="dashboard" element={internal(<DashboardPage />)} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
