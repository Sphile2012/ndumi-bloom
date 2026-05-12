import { useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";

const COLORS = ["#8b4a52", "#c4818a", "#e8b4b8", "#f3d5cc", "#d4956a", "#a06040"];

function Card({ title, children }) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
      <h3 className="font-heading text-base font-semibold text-foreground mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function AdminAnalytics({ bookings }) {
  const now = new Date();

  // Last 3 months range
  const months = [2, 1, 0].map((offset) => {
    const d = subMonths(now, offset);
    return {
      label: format(d, "MMM yyyy"),
      start: startOfMonth(d),
      end: endOfMonth(d),
    };
  });

  // Revenue trend per month
  const revenueData = useMemo(() =>
    months.map(({ label, start, end }) => {
      const monthBookings = bookings.filter((b) => {
        if (!b.preferred_date || b.status === "cancelled") return false;
        try {
          return isWithinInterval(parseISO(b.preferred_date), { start, end });
        } catch { return false; }
      });
      return {
        month: label,
        revenue: monthBookings.reduce((sum, b) => sum + (b.price || 0), 0),
        bookings: monthBookings.length,
      };
    }), [bookings]);

  // Most popular services
  const serviceData = useMemo(() => {
    const cutoff = subMonths(now, 3);
    const counts = {};
    bookings.forEach((b) => {
      if (!b.preferred_date || b.status === "cancelled") return;
      try {
        if (parseISO(b.preferred_date) < cutoff) return;
      } catch { return; }
      const key = b.service_category || "Other";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [bookings]);

  // Peak booking times (hour of day — based on preferred_time)
  const peakData = useMemo(() => {
    const slots = {};
    bookings.forEach((b) => {
      if (!b.preferred_time || b.status === "cancelled") return;
      const time = b.preferred_time;
      slots[time] = (slots[time] || 0) + 1;
    });
    return Object.entries(slots)
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => {
        // sort by time string
        const toMins = (t) => {
          const [h, rest] = t.split(":");
          const [m, period] = rest ? rest.split(" ") : ["00", ""];
          let hr = parseInt(h);
          if (period === "PM" && hr !== 12) hr += 12;
          if (period === "AM" && hr === 12) hr = 0;
          return hr * 60 + parseInt(m || 0);
        };
        return toMins(a.time) - toMins(b.time);
      });
  }, [bookings]);

  // Summary stats
  const threeMonthsAgo = subMonths(now, 3);
  const recentBookings = bookings.filter((b) => {
    if (!b.preferred_date) return false;
    try { return parseISO(b.preferred_date) >= threeMonthsAgo; } catch { return false; }
  });
  const totalRevenue = recentBookings.filter(b => b.status !== "cancelled").reduce((s, b) => s + (b.price || 0), 0);
  const completionRate = recentBookings.length
    ? Math.round((recentBookings.filter(b => b.status === "completed").length / recentBookings.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "3-Month Revenue", value: `R${totalRevenue.toLocaleString()}`, color: "text-primary" },
          { label: "Total Bookings", value: recentBookings.length, color: "text-blue-600" },
          { label: "Completion Rate", value: `${completionRate}%`, color: "text-green-600" },
          { label: "Services Offered", value: serviceData.length, color: "text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border/50 rounded-2xl p-4">
            <p className={`font-heading text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue Trend */}
      <Card title="📈 Revenue Trend (Last 3 Months)">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ddd9" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R${v}`} />
            <Tooltip formatter={(v) => [`R${v}`, "Revenue"]} />
            <Line type="monotone" dataKey="revenue" stroke="#8b4a52" strokeWidth={2.5} dot={{ r: 5, fill: "#8b4a52" }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Popular Services */}
        <Card title="💅 Most Popular Services">
          {serviceData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={serviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name.split(" ")[0]} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {serviceData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Peak Booking Times */}
        <Card title="⏰ Peak Booking Times">
          {peakData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={peakData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ddd9" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, "Bookings"]} />
                <Bar dataKey="count" fill="#8b4a52" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Bookings per month bar */}
      <Card title="📅 Bookings Per Month">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ddd9" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip formatter={(v) => [v, "Bookings"]} />
            <Bar dataKey="bookings" fill="#c4818a" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}