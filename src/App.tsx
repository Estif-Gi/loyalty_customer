import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { AppProviders } from "@/app/providers/AppProviders";
import { AuthProvider } from "@/features/auth/components/AuthContext";
import { CustomerRealtimeManager } from "@/realtime/CustomerRealtimeManager";
import { PageLoading } from "@/components/feedback/PageLoading";
import { useAuthStore } from "@/features/auth/store/authStore";

// Existing routes
const Index = lazy(() => import("./pages/Index"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Home = lazy(() => import("./pages/Home"));
const Scan = lazy(() => import("./pages/Scan"));
const Restaurants = lazy(() => import("./pages/Restaurants"));
const RestaurantDetail = lazy(() => import("./pages/RestaurantDetail"));
const MenuView = lazy(() => import("./pages/MenuView"));
const Rewards = lazy(() => import("./pages/Rewards"));
const Profile = lazy(() => import("./pages/Profile"));
const ProgramDetail = lazy(() => import("./pages/programDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Dedicated Ordering Flow Routes
const OrderStart = lazy(() => import("./routes/order/start"));
const OrderMenu = lazy(() => import("./routes/order/menu"));
const OrderCart = lazy(() => import("./routes/order/cart"));
const OrderSuccess = lazy(() => import("./routes/order/success"));
const OrderHistory = lazy(() => import("./routes/order/history"));

const App = () => {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  if (!hasHydrated) {
    return <PageLoading message="Starting app..." />;
  }

  return (
    <AppProviders>
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <AuthProvider>
          <CustomerRealtimeManager />
          <Suspense fallback={<PageLoading message="Loading..." />}>
            <Routes>
              <Route element={<AppShell />}>
                <Route path="/" element={<Index />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/home" element={<Home />} />
                <Route path="/scan" element={<Scan />} />
                <Route path="/restaurants" element={<Restaurants />} />
                <Route path="/restaurant/:id" element={<RestaurantDetail />} />
                <Route path="/menu/:id" element={<MenuView />} />
                <Route path="/rewards" element={<Rewards />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/programDetail/:id" element={<ProgramDetail />} />

                {/* Ordering Flow Routes */}
                <Route path="/order/start" element={<OrderStart />} />
                <Route path="/order/menu" element={<OrderMenu />} />
                <Route path="/order/cart" element={<OrderCart />} />
                <Route path="/order/success/:orderId" element={<OrderSuccess />} />
                <Route path="/order/history" element={<OrderHistory />} />

                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </AppProviders>
  );
};

export default App;
