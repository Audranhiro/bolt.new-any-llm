import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Home from "@/pages/Home";
import PatientSearch from "@/pages/PatientSearch";
import IntervenantDetail from "@/pages/IntervenantDetail";
import CallbackForm from "@/pages/CallbackForm";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import IntervenantDashboard from "@/pages/IntervenantDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import KitDocuments from "@/pages/KitDocuments";
import { Toaster } from "sonner";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/patient" element={<PatientSearch />} />
            <Route path="/patient/intervenant/:id" element={<IntervenantDetail />} />
            <Route path="/patient/callback/:id" element={<CallbackForm />} />
            <Route path="/intervenant/login" element={<Login mode="intervenant" />} />
            <Route path="/intervenant/register" element={<Register />} />
            <Route path="/intervenant/dashboard" element={<IntervenantDashboard />} />
            <Route path="/admin/login" element={<Login mode="admin" />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/kit-documents" element={<KitDocuments />} />
          </Routes>
          <Toaster position="top-center" />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
