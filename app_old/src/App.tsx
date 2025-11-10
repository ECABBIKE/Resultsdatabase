import { HashRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Layout from './components/Layout';
import Home from './pages/Home';
import Competitions from './pages/Competitions';
import CompetitionDetail from './pages/CompetitionDetail';
import Series from './pages/Series';
import SeriesDetail from './pages/SeriesDetail';
import Cyclists from './pages/Cyclists';
import CyclistProfile from './pages/CyclistProfile';
import Calendar from './pages/Calendar';
import Statistics from './pages/Statistics';
import Admin from './pages/Admin';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="competitions" element={<Competitions />} />
            <Route path="competitions/:id" element={<CompetitionDetail />} />
            <Route path="series" element={<Series />} />
            <Route path="series/:id" element={<SeriesDetail />} />
            <Route path="cyclists" element={<Cyclists />} />
            <Route path="cyclists/:id" element={<CyclistProfile />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="statistics" element={<Statistics />} />
            <Route path="admin" element={<Admin />} />
          </Route>
        </Routes>
      </HashRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
