import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, Gift, User, QrCode, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/restaurants", label: "Spots", icon: Store },
  { to: "/rewards", label: "Rewards", icon: Gift },
  { to: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const isScan = location.pathname === "/scan";

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-gradient-to-t from-[#7B3E19]/80 via-[#2A1C14]/0 to-transparent pointer-events-none "
>
      <div className="relative mx-auto max-w-md px-4 pb-2">
        <div className="pointer-events-auto bg-card/95 backdrop-blur-xl border border-border shadow-card rounded-3xl h-16 grid grid-cols-5 items-center">
          {items.slice(0, 2).map((it) => (
            <NavItem key={it.to} {...it} />
          ))}
          <div /> {/* FAB slot */}
          {items.slice(2).map((it) => (
            <NavItem key={it.to} {...it} />
          ))}
        </div>

        {/* Center FAB */}
        <button
          aria-label="Scan QR"
          onClick={() => navigate("/scan")}
          className={cn(
            "pointer-events-auto absolute left-1/2 -translate-x-1/2 -top-4",
            "h-16 w-16 rounded-full gradient-primary text-primary-foreground shadow-fab",
            "flex items-center justify-center tap-scale border-4 border-background",
            isScan && "ring-4 ring-primary/30"
          )}
        >
          <QrCode className="h-7 w-7" strokeWidth={2.5} />
        </button>
      </div>
    </nav>
  );
}

function NavItem({ to, label, icon: Icon }: { to: string; label: string; icon: typeof Home }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex flex-col items-center justify-center gap-0.5 h-full text-[10px] font-medium tap-scale",
          isActive ? "text-primary" : "text-muted-foreground"
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} strokeWidth={isActive ? 2.5 : 2} />
          <span className="uppercase tracking-wide">{label}</span>
        </>
      )}
    </NavLink>
  );
}
