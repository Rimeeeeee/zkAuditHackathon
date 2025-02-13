import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import CreateToken from "./pages/CreateNFT";
import SideBar from "./components/SideBar";
import TopBar from "./components/Header";
import AllNFT from "./pages/AllNFT";
import VerifyBidPage from "./pages/VerifyBid";
interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <div className="flex h-screen">
      {!isLoginPage && <SideBar />}
      <div className="flex flex-col flex-grow">
        {!isLoginPage && <TopBar />}
        <div className="flex-grow p-4 mt-16">{children}</div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout>{/* <Home /> */}</Layout>} />
        {/* <Route path="/auction" element={<Layout><Auction /></Layout>} /> */}
        <Route
          path="/create"
          element={
            <Layout>
              <CreateToken />
            </Layout>
          }
        />
        <Route
          path="/auction"
          element={
            <Layout>
              <AllNFT />
            </Layout>
          }
        />
         <Route
          path="/verify"
          element={
            <Layout>
              <VerifyBidPage />
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
