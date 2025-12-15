import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  Eye, 
  MousePointer,
  Calendar as CalendarIcon,
  Download,
  RefreshCw,
  ArrowRight
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  FunnelChart,
  Funnel,
  LabelList
} from "recharts";

type DateRange = {
  from: Date;
  to: Date;
};

type PeriodPreset = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'all' | 'custom';

interface EventStats {
  total_events: number;
  unique_users: number;
  unique_sessions: number;
  events_by_type: Record<string, number>;
  events_by_category: Record<string, number>;
  daily_events: { date: string; count: number }[];
  top_pages: { page: string; count: number }[];
  funnel_data: { step: string; count: number; rate: number }[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export const AdminAdvancedAnalyticsTab = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<PeriodPreset>('7d');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 7),
    to: new Date()
  });
  const [stats, setStats] = useState<EventStats | null>(null);
  const [previousStats, setPreviousStats] = useState<EventStats | null>(null);

  const getDateRangeFromPeriod = (p: PeriodPreset): DateRange => {
    const now = new Date();
    switch (p) {
      case 'today':
        return { from: startOfDay(now), to: endOfDay(now) };
      case 'yesterday':
        return { from: startOfDay(subDays(now, 1)), to: endOfDay(subDays(now, 1)) };
      case '7d':
        return { from: startOfDay(subDays(now, 7)), to: endOfDay(now) };
      case '30d':
        return { from: startOfDay(subDays(now, 30)), to: endOfDay(now) };
      case '90d':
        return { from: startOfDay(subDays(now, 90)), to: endOfDay(now) };
      case 'all':
        return { from: new Date('2024-01-01'), to: endOfDay(now) };
      default:
        return dateRange;
    }
  };

  const fetchAnalytics = async (range: DateRange, setPrevious = true) => {
    setLoading(true);
    try {
      const { data: events, error } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', range.from.toISOString())
        .lte('created_at', range.to.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Calculate stats
      const eventsByType: Record<string, number> = {};
      const eventsByCategory: Record<string, number> = {};
      const dailyMap: Record<string, number> = {};
      const pageMap: Record<string, number> = {};
      const uniqueUsers = new Set<string>();
      const uniqueSessions = new Set<string>();

      // Funnel tracking
      const funnelSteps = {
        'page_view': 0,
        'restaurant_view': 0,
        'menu_item_detail_open': 0,
        'cart_add': 0,
        'checkout_start': 0,
        'checkout_complete': 0
      };

      events?.forEach(event => {
        // By type
        eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1;
        
        // By category
        eventsByCategory[event.event_category] = (eventsByCategory[event.event_category] || 0) + 1;
        
        // Daily
        const day = format(new Date(event.created_at), 'yyyy-MM-dd');
        dailyMap[day] = (dailyMap[day] || 0) + 1;
        
        // Pages
        if (event.page_url) {
          const path = new URL(event.page_url).pathname;
          pageMap[path] = (pageMap[path] || 0) + 1;
        }
        
        // Unique users
        if (event.user_id) uniqueUsers.add(event.user_id);
        if (event.session_id) uniqueSessions.add(event.session_id);

        // Funnel
        if (event.event_type in funnelSteps) {
          funnelSteps[event.event_type as keyof typeof funnelSteps]++;
        }
      });

      const dailyEvents = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));
      const topPages = Object.entries(pageMap)
        .map(([page, count]) => ({ page, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate funnel rates
      const funnelData = [
        { step: 'Visite page', count: funnelSteps['page_view'], rate: 100 },
        { step: 'Vue restaurant', count: funnelSteps['restaurant_view'], rate: funnelSteps['page_view'] ? (funnelSteps['restaurant_view'] / funnelSteps['page_view']) * 100 : 0 },
        { step: 'Vue plat', count: funnelSteps['menu_item_detail_open'], rate: funnelSteps['restaurant_view'] ? (funnelSteps['menu_item_detail_open'] / funnelSteps['restaurant_view']) * 100 : 0 },
        { step: 'Ajout panier', count: funnelSteps['cart_add'], rate: funnelSteps['menu_item_detail_open'] ? (funnelSteps['cart_add'] / funnelSteps['menu_item_detail_open']) * 100 : 0 },
        { step: 'Checkout', count: funnelSteps['checkout_start'], rate: funnelSteps['cart_add'] ? (funnelSteps['checkout_start'] / funnelSteps['cart_add']) * 100 : 0 },
        { step: 'Commande', count: funnelSteps['checkout_complete'], rate: funnelSteps['checkout_start'] ? (funnelSteps['checkout_complete'] / funnelSteps['checkout_start']) * 100 : 0 }
      ];

      const newStats: EventStats = {
        total_events: events?.length || 0,
        unique_users: uniqueUsers.size,
        unique_sessions: uniqueSessions.size,
        events_by_type: eventsByType,
        events_by_category: eventsByCategory,
        daily_events: dailyEvents,
        top_pages: topPages,
        funnel_data: funnelData
      };

      setStats(newStats);

      // Fetch previous period for comparison
      if (setPrevious) {
        const daysDiff = differenceInDays(range.to, range.from);
        const prevRange = {
          from: subDays(range.from, daysDiff + 1),
          to: subDays(range.from, 1)
        };
        
        const { data: prevEvents } = await supabase
          .from('analytics_events')
          .select('*')
          .gte('created_at', prevRange.from.toISOString())
          .lte('created_at', prevRange.to.toISOString());

        if (prevEvents) {
          const prevUniqueUsers = new Set<string>();
          const prevUniqueSessions = new Set<string>();
          prevEvents.forEach(e => {
            if (e.user_id) prevUniqueUsers.add(e.user_id);
            if (e.session_id) prevUniqueSessions.add(e.session_id);
          });

          setPreviousStats({
            total_events: prevEvents.length,
            unique_users: prevUniqueUsers.size,
            unique_sessions: prevUniqueSessions.size,
            events_by_type: {},
            events_by_category: {},
            daily_events: [],
            top_pages: [],
            funnel_data: []
          });
        }
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const range = getDateRangeFromPeriod(period);
    setDateRange(range);
    fetchAnalytics(range);
  }, [period]);

  const handleCustomDateChange = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setDateRange(range);
      setPeriod('custom');
      fetchAnalytics(range);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics(dateRange);
  };

  const calculateChange = (current: number, previous: number): { value: number; positive: boolean } => {
    if (previous === 0) return { value: current > 0 ? 100 : 0, positive: current > 0 };
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(change), positive: change >= 0 };
  };

  const exportCSV = () => {
    if (!stats) return;
    
    const rows = [
      ['Métrique', 'Valeur'],
      ['Total événements', stats.total_events.toString()],
      ['Utilisateurs uniques', stats.unique_users.toString()],
      ['Sessions uniques', stats.unique_sessions.toString()],
      [''],
      ['Type événement', 'Nombre'],
      ...Object.entries(stats.events_by_type).map(([type, count]) => [type, count.toString()]),
      [''],
      ['Page', 'Vues'],
      ...stats.top_pages.map(p => [p.page, p.count.toString()])
    ];

    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${format(dateRange.from, 'yyyy-MM-dd')}_${format(dateRange.to, 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const categoryData = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.events_by_category).map(([name, value]) => ({ name, value }));
  }, [stats]);

  if (loading && !stats) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <h2 className="text-lg font-semibold">Analytics Avancés</h2>
        <div className="flex flex-wrap gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodPreset)}>
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="yesterday">Hier</SelectItem>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
              <SelectItem value="all">Tout</SelectItem>
              <SelectItem value="custom">Personnalisé</SelectItem>
            </SelectContent>
          </Select>

          {period === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 text-xs gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  {format(dateRange.from, 'dd/MM/yy')} - {format(dateRange.to, 'dd/MM/yy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => handleCustomDateChange(range as DateRange)}
                  locale={fr}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}

          <Button variant="outline" size="sm" className="h-9" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>

          <Button variant="outline" size="sm" className="h-9 text-xs gap-1" onClick={exportCSV}>
            <Download className="w-3 h-3" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Événements</p>
                <p className="text-xl font-bold">{stats?.total_events.toLocaleString()}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-primary/20" />
            </div>
            {previousStats && (
              <div className="flex items-center gap-1 mt-2">
                {calculateChange(stats?.total_events || 0, previousStats.total_events).positive ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className={`text-xs ${calculateChange(stats?.total_events || 0, previousStats.total_events).positive ? 'text-green-500' : 'text-red-500'}`}>
                  {calculateChange(stats?.total_events || 0, previousStats.total_events).value.toFixed(1)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Utilisateurs</p>
                <p className="text-xl font-bold">{stats?.unique_users.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-primary/20" />
            </div>
            {previousStats && (
              <div className="flex items-center gap-1 mt-2">
                {calculateChange(stats?.unique_users || 0, previousStats.unique_users).positive ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className={`text-xs ${calculateChange(stats?.unique_users || 0, previousStats.unique_users).positive ? 'text-green-500' : 'text-red-500'}`}>
                  {calculateChange(stats?.unique_users || 0, previousStats.unique_users).value.toFixed(1)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Sessions</p>
                <p className="text-xl font-bold">{stats?.unique_sessions.toLocaleString()}</p>
              </div>
              <Eye className="w-8 h-8 text-primary/20" />
            </div>
            {previousStats && (
              <div className="flex items-center gap-1 mt-2">
                {calculateChange(stats?.unique_sessions || 0, previousStats.unique_sessions).positive ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className={`text-xs ${calculateChange(stats?.unique_sessions || 0, previousStats.unique_sessions).positive ? 'text-green-500' : 'text-red-500'}`}>
                  {calculateChange(stats?.unique_sessions || 0, previousStats.unique_sessions).value.toFixed(1)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Taux conversion</p>
                <p className="text-xl font-bold">
                  {stats?.funnel_data[5]?.rate.toFixed(1) || 0}%
                </p>
              </div>
              <ShoppingCart className="w-8 h-8 text-primary/20" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Checkout → Commande</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Events */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Événements par jour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.daily_events || []}>
                  <defs>
                    <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(v) => format(new Date(v), 'dd/MM')}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip 
                    labelFormatter={(v) => format(new Date(v), 'dd MMM yyyy', { locale: fr })}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    fill="url(#colorEvents)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Events by Category */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Funnel de conversion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {stats?.funnel_data.map((step, index) => (
              <div key={step.step} className="flex items-center">
                <div className="flex flex-col items-center min-w-[100px]">
                  <div 
                    className="w-full h-16 rounded-lg flex items-center justify-center text-white font-medium text-sm"
                    style={{ 
                      backgroundColor: COLORS[index % COLORS.length],
                      opacity: 0.3 + (step.rate / 100) * 0.7
                    }}
                  >
                    {step.count}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-center">{step.step}</p>
                  <Badge variant="outline" className="text-xs mt-1">
                    {step.rate.toFixed(1)}%
                  </Badge>
                </div>
                {index < (stats?.funnel_data.length || 0) - 1 && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground mx-1 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Pages & Event Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pages les plus visitées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats?.top_pages.slice(0, 8).map((page, i) => (
                <div key={page.page} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                    <span className="text-xs truncate max-w-[200px]">{page.page}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">{page.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Types d'événements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={Object.entries(stats?.events_by_type || {}).slice(0, 8).map(([name, value]) => ({ name, value }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={9}
                    tickFormatter={(v) => v.replace(/_/g, ' ')}
                  />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAdvancedAnalyticsTab;
