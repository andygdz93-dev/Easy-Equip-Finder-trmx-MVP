import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Layout }       from "./components/Layout";
import { DemoLayout }   from "./components/DemoLayout";
import { AppShell }     from "./components/AppShell";

import { Landing }          from "./pages/Landing";
import { Login }            from "./pages/Login";
import { Register }         from "./pages/Register";
import { Listings }         from "./pages/Listings";
import { ListingDetail }    from "./pages/ListingDetail";
import { Watchlist }        from "./pages/Watchlist";
import { ScoringConfigs }   from "./pages/ScoringConfigs";
import { SellerDashboard }  from "./pages/SellerDashboard";
import { AdminSources }     from "./pages/AdminSources";
import { Upgrade }          from "./pages/Upgrade";
import { Demo }             from "./pages/Demo";
import { DemoListingDetail } from "./pages/DemoListingDetail";
import { DemoWatchlist }    from "./pages/DemoWatchlist";
import { BrokerChat }      from "./pages/BrokerChat";

const App = () => (
  <Routes>
    {/* Public */}
    <Route path="/"         element={<Landing />} />
    <Route path="/login"    element={<Login />} />
    <Route path="/register" element={<Register />} />

    {/* Authenticated app */}
    <Route element={<AppShell><Layout><Outlet /></Layout></AppShell>}>
      <Route path="/listings"          element={<Listings />} />
      <Route path="/listings/:id"      element={<ListingDetail />} />
      <Route path="/watchlist"         element={<Watchlist />} />
      <Route path="/scoring"           element={<ScoringConfigs />} />
      <Route path="/seller"            element={<SellerDashboard />} />
      <Route path="/admin/sources"     element={<AdminSources />} />
      <Route path="/upgrade"           element={<Upgrade />} />
    </Route>

    {/* Demo mode */}
    <Route element={<DemoLayout><Outlet /></DemoLayout>}>
      <Route path="/demo"                element={<Demo />} />
      <Route path="/demo/listings/:id"   element={<DemoListingDetail />} />
      <Route path="/demo/watchlist"      element={<DemoWatchlist />} />
      <Route path="/demo/broker"         element={<BrokerChat />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
