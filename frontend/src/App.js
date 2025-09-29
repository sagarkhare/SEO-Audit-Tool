import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import About from './pages/About';
import Contact from './pages/Contact';
import Dashboard from './pages/Dashboard';
import Audit from './pages/Audit';
import AuditHistory from './pages/AuditHistory';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Profile from './pages/Profile';
import ComingSoon from './pages/ComingSoon';
import FreeAuditResults from './pages/FreeAuditResults';
import AuditReport from './pages/AuditReport';
import ProtectedRoute from './components/common/ProtectedRoute';
import PublicRoute from './components/common/PublicRoute';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="features" element={<Features />} />
              <Route path="pricing" element={<Pricing />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              
              {/* Free Audit Route */}
              <Route path="free-audit" element={<FreeAuditResults />} />
              
              {/* Auth routes */}
              <Route path="login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              <Route path="register" element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } />
              <Route path="forgot-password" element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              } />
              <Route path="reset-password/:token" element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              } />
              <Route path="verify-email/:token" element={
                <PublicRoute>
                  <VerifyEmail />
                </PublicRoute>
              } />
              
                     {/* Protected routes */}
                     <Route path="dashboard" element={
                       <ProtectedRoute>
                         <Dashboard />
                       </ProtectedRoute>
                     } />
                     <Route path="audit/:id" element={
                       <ProtectedRoute>
                         <Audit />
                       </ProtectedRoute>
                     } />
                     <Route path="audit-report" element={
                       <ProtectedRoute>
                         <AuditReport />
                       </ProtectedRoute>
                     } />
              <Route path="history" element={
                <ProtectedRoute>
                  <AuditHistory />
                </ProtectedRoute>
              } />
              <Route path="profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              
              {/* Coming Soon Pages */}
              <Route path="api" element={<ComingSoon title="API Documentation" description="Our comprehensive API documentation is coming soon. Developers will be able to integrate our SEO audit tools directly into their applications." />} />
              <Route path="docs" element={<ComingSoon title="Documentation" description="Detailed documentation and guides are being prepared to help you get the most out of our SEO audit tools." />} />
              <Route path="blog" element={<ComingSoon title="Blog" description="Stay tuned for insightful articles about SEO best practices, industry trends, and optimization tips." />} />
              <Route path="careers" element={<ComingSoon title="Careers" description="We're growing! Career opportunities will be posted here soon. Join our team and help us build the future of SEO tools." />} />
              <Route path="help" element={<ComingSoon title="Help Center" description="Our comprehensive help center with FAQs, tutorials, and support resources is coming soon." />} />
              <Route path="community" element={<ComingSoon title="Community" description="Join our growing community of SEO professionals. Forums, discussions, and networking opportunities coming soon." />} />
              <Route path="status" element={<ComingSoon title="Service Status" description="Real-time service status and uptime information will be available here soon." />} />
              <Route path="updates" element={<ComingSoon title="Product Updates" description="Stay informed about new features, improvements, and product announcements." />} />
              <Route path="privacy" element={<ComingSoon title="Privacy Policy" description="Our privacy policy is being finalized. We're committed to protecting your data and being transparent about how we use it." />} />
              <Route path="terms" element={<ComingSoon title="Terms of Service" description="Our terms of service are being prepared. These will outline the rules and guidelines for using our platform." />} />
              <Route path="cookies" element={<ComingSoon title="Cookie Policy" description="Information about how we use cookies and similar technologies will be available here soon." />} />
              <Route path="gdpr" element={<ComingSoon title="GDPR Compliance" description="Details about our GDPR compliance and your data protection rights are being prepared." />} />
            </Route>
          </Routes>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
