import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Services from './pages/Services';
import NailCourse from './pages/NailCourse';
import Book from './pages/Book';
import BookingConfirmed from './pages/BookingConfirmed';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import Login from './pages/Login';

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/"                  element={<Home />} />
              <Route path="/services"          element={<Services />} />
              <Route path="/nail-course"       element={<NailCourse />} />
              <Route path="/book"              element={<Book />} />
              <Route path="/booking-confirmed" element={<BookingConfirmed />} />
              <Route path="/gallery"           element={<Gallery />} />
              <Route path="/contact"           element={<Contact />} />
              <Route path="/admin"             element={<Admin />} />
              <Route path="/login"             element={<Login />} />
              <Route path="*"                  element={<PageNotFound />} />
            </Route>
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
