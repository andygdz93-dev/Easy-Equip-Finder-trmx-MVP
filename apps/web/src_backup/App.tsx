import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";
import { RequireAuth } from "./components/RequireAuth";
import { RequireEnterprise } from "./components/RequireEnterprise";
import { RequireLiveNda } from "./components/RequireLiveNda";
import { Landing } from "./pages/Landing";
import { Listings } from "./pages/app/Listings";
import { ListingDetail } from "./pages/app/ListingDetail";
import { Watchlist } from "./pages/app/Watchlist";
import { ScoringConfigs } from "./pages/app/ScoringConfigs";
import { Offers } from "./pages/app/Offers";
import { SellerListings } from "./pages/app/SellerListings";
import { SellerAdd } from "./pages/app/SellerAdd";
import SellerEdit from "./pages/app/SellerEdit";
import { SellerUpload } from "./pages/app/SellerUpload";
import { SellerDashboard } from "./pages/app/SellerDashboard";
import SellerInquiries from "./pages/app/SellerInquiries";
import SellerInquiryThread from "./pages/app/SellerInquiryThread";
import SellerPipeline from "./pages/app/SellerPipeline";
import { Settings } from "./pages/app/Settings";
import { Upgrade } from "./pages/app/Upgrade";
import { Nda } from "./pages/app/Nda";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { DemoTour } from "./pages/demo/Tour";
import { DemoLayout } from "./layouts/DemoLayout";
import { LiveLayout } from "./layouts/LiveLayout";
import { NdaProvider } from "./lib/nda";
import { useAuth } from "./lib/auth";
import { SelectRole } from "./pages/app/SelectRole";
import { Billing } from "./pages/app/Billing";
import RequireSellerUploadAccess from "./components/RequireSellerUploadAccess";
import AdminLayout from "./layouts/AdminLayout";
import AdminOverview from "./pages/app/admin/AdminOverview";
import AdminUsers from "./pages/app/admin/AdminUsers";
import AdminListings from "./pages/app/admin/AdminListings";
import AdminInquiries from "./pages/app/admin/AdminInquiries";
import AdminAudit from "./pages/app/admin/AdminAudit";
import AdminSources from "./pages/app/admin/AdminSources";
import AdminSettings from "./pages/app/admin/AdminSettings";

const LegacyListingRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/app/listings/${id ?? ""}`} replace />;
};

const DashboardRedirect = () => {
  const { user } = useAuth();

  if (user?.role === "seller") {
    return <Navigate to="/app/seller/dashboard" replace />;
  }

  if (user?.role === "enterprise") {
    return <Navigate to="/app/settings" replace />;
  }

  if (user?.role === "admin") {
    return <Navigate to="/app/admin" replace />;
  }

  return <Navigate to="/app/listings" replace />;
};

const roleRedirectPath = (role: string | null | undefined) => {
  if (role === "seller") return "/app/seller/dashboard";
  return "/app/listings";
};

const RequireRoles = ({
  allowed,
  children,
}: {
  allowed: Array<"buyer" | "seller" | "enterprise" | "admin">;
  children?: React.ReactNode;
}) => {
  const { user, isUserLoading } = useAuth();
  const location = useLocation();

  if (isUserLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-400">
        Checking access...
      </div>
    );
  }

  if (!user || !allowed.includes(user.role as (typeof allowed)[number])) {
    return (
      <Navigate
        to={roleRedirectPath(user?.role)}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <>{children ?? <Outlet />}</>;
};

const RequireRoleSelection = ({ children }: { children?: React.ReactNode }) => {
  const { user, isUserLoading } = useAuth();
  const location = useLocation();

  if (isUserLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-400">
        Loading account...
      </div>
    );
  }

  if (user && user.role === null && location.pathname !== "/app/select-role") {
    return (
      <Navigate
        to="/app/select-role"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <>{children ?? <Outlet />}</>;
};

const UpgradeRouteGuard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <Upgrade />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/app/login" element={<Login />} />
      <Route path="/admin/*" element={<Navigate to="/app/admin" replace />} />
      <Route path="/app/register" element={<Register />} />
      <Route
        path="/listings"
        element={<Navigate to="/app/listings" replace />}
      />
      <Route path="/listings/:id" element={<LegacyListingRedirect />} />
      <Route
        path="/watchlist"
        element={<Navigate to="/app/watchlist" replace />}
      />
      

      <Route path="/scoring" element={<Navigate to="/app/scoring" replace />} />
      <Route
        path="/seller"
        element={<Navigate to="/app/seller/listings" replace />}
      />
      <Route path="/upgrade" element={<Navigate to="/app/upgrade" replace />} />
      <Route path="/nda" element={<Navigate to="/app/nda" replace />} />

      <Route
        path="/app/*"
        element={
          <RequireAuth>
            <RequireRoleSelection>
              <NdaProvider>
                <Outlet />
              </NdaProvider>
            </RequireRoleSelection>
          </RequireAuth>
        }
      >
        <Route path="select-role" element={<SelectRole />} />
        <Route element={<RequireLiveNda />}>
          <Route
            element={
              <LiveLayout>
                <Outlet />
              </LiveLayout>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="billing" element={<Billing />} />
            <Route path="dashboard" element={<DashboardRedirect />} />
            <Route
              element={
                <RequireRoles allowed={["buyer", "enterprise", "admin"]}>
                  <Outlet />
                </RequireRoles>
              }
            >
              <Route path="listings" element={<Listings />} />
              <Route path="listings/:id" element={<ListingDetail />} />
              <Route path="watchlist" element={<Watchlist />} />
              <Route path="scoring" element={<ScoringConfigs />} />
              <Route path="offers" element={<Offers />} />
            </Route>
            <Route
              path="admin"
              element={
                <RequireRoles allowed={["admin"]}>
                  <AdminLayout />
                </RequireRoles>
              }
            >
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="listings" element={<AdminListings />} />
              <Route path="inquiries" element={<AdminInquiries />} />
              <Route path="offers" element={<Offers />} />
              <Route path="scoring" element={<ScoringConfigs />} />
              <Route path="audit" element={<AdminAudit />} />
              <Route path="sources" element={<AdminSources />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            <Route
              element={
                <RequireRoles allowed={["seller", "admin"]}>
                  <Outlet />
                </RequireRoles>
              }
            >
              <Route
                path="seller"
                element={<Navigate to="seller/listings" replace />}
              />
              <Route path="seller/dashboard" element={<SellerDashboard />} />
              <Route path="seller/listings" element={<SellerListings />} />
              <Route path="seller/inquiries" element={<SellerInquiries />} />
              <Route path="seller/inquiries/:inquiryId" element={<SellerInquiryThread />} />
              <Route path="seller/pipeline" element={<SellerPipeline />} />
              <Route path="seller/add" element={<SellerAdd />} />
              <Route path="seller/listings/:id/edit" element={<SellerEdit />} />
              <Route
                path="seller/upload"
                element={
                  <RequireSellerUploadAccess>
                    <SellerUpload />
                  </RequireSellerUploadAccess>
                }
              />
            </Route>
            <Route
              path="settings"
              element={
                <RequireEnterprise>
                  <Settings />
                </RequireEnterprise>
              }
            />
            <Route path="upgrade" element={<UpgradeRouteGuard />} />
            <Route path="nda" element={<Nda />} />
          </Route>
        </Route>
      </Route>

      <Route
        path="/demo/*"
        element={
          <DemoLayout>
            <Outlet />
          </DemoLayout>
        }
      >
        <Route index element={<Navigate to="tour" replace />} />
        <Route path="listings" element={<Navigate to="/demo/tour" replace />} />
        <Route
          path="listings/:id"
          element={<Navigate to="/demo/tour" replace />}
        />
        <Route
          path="watchlist"
          element={<Navigate to="/demo/tour" replace />}
        />
        <Route path="tour" element={<DemoTour />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
