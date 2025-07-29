import { Route, Routes } from "react-router-dom";
import { Home } from "./pages/Home.tsx";
import { Navbar } from "./components/Navbar";
import { Login } from "./pages/Login";
import { AdminLogin } from "./pages/AdminLogin";
import { AlumniLogin } from "./pages/AlumniLogin";
import { StudentLogin } from "./pages/StudentLogin";
import { Register } from "./pages/Register";
import { Profile } from "./pages/Profile";
import { Directory } from "./pages/Directory";
import { Connections } from "./pages/Connections";
import {AuthTest} from "./components/AuthTest"
import { Messages } from "./pages/Messages";
import { Announcements } from "./pages/Announcements";
import { Jobs } from "./pages/Jobs";
import { Events } from "./pages/Events";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AuthDebug } from "./components/AuthDebug";
import { SimpleAuthTest } from "./components/SimpleAuthTest";
// import { BrowserRouter } from "react-router-dom";
// import { CreatePostPage } from "./pages/CreatePostPage";
// import { PostPage } from "./pages/PostPage";
// import { CreateCommunityPage } from "./pages/CreateCommunityPage";
// import { CommunitiesPage } from "./pages/CommunitiesPage";
// import { CommunityPage } from "./pages/CommunityPage";

function App() {
  return (
    <div className="min-h-screen bg-black text-gray-100 transition-opacity duration-700 pt-20">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
      
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/debug" element={<AuthDebug />} />
          <Route path="/simple-test" element={<SimpleAuthTest />} />
          <Route path ="/auth-test" element = { <AuthTest/>} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/alumni-login" element={<AlumniLogin />} />
          <Route path="/student-login" element={<StudentLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/directory" element={<Directory />} />
          <Route path="/connections" element={<Connections />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/events" element={<Events />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Routes>
{/* </BrowserRouter> */}
      </div>
    </div>
  );
}

export default App;