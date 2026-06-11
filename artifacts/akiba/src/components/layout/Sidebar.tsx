import { Link, useLocation } from "wouter";
import { Users, LayoutDashboard, Wallet, Shield, PieChart } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "My Chamas", href: "/chamas", icon: Users },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="flex flex-col w-64 border-r bg-sidebar h-full shrink-0 sticky top-0">
      <div className="flex items-center h-16 px-6 border-b border-sidebar-border bg-sidebar-primary text-sidebar-primary-foreground">
        <Shield className="w-6 h-6 mr-3" />
        <span className="font-bold tracking-tight text-lg uppercase">Akiba</span>
      </div>
      <div className="flex flex-col flex-1 overflow-y-auto py-4">
        <nav className="px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <item.icon className="w-5 h-5 mr-3 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
            JD
          </div>
          <div>
            <p className="text-sm font-medium">John Doe</p>
            <p className="text-xs text-muted-foreground">Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
}
