import { useQuery } from '@tanstack/react-query';
import { Activity, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function Dashboard() {
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['config'],
    queryFn: api.getConfig
  });
  
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: api.getStats,
    refetchInterval: 2000
  });
  
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: api.getHealth,
    refetchInterval: 5000
  });
  
  if (configLoading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }
  
  if (!config) {
    return <div className="text-destructive">Erreur de chargement de la configuration</div>;
  }
  
  const activeRules = config.rules.filter(r => r.enabled).length;
  const totalRules = config.rules.length;
  const activeEntities = config.watchedEntities.filter(e => e.enabled).length;
  const totalEntities = config.watchedEntities.length;
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Vue d'ensemble du système de tracking
        </p>
      </div>
      
      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statut</CardTitle>
            {health?.status === 'ok' ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health?.status === 'ok' ? 'Opérationnel' : 'Hors ligne'}
            </div>
            <p className="text-xs text-muted-foreground">
              {health?.timestamp && new Date(health.timestamp).toLocaleString('fr-FR')}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Règles actives</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRules}</div>
            <p className="text-xs text-muted-foreground">
              sur {totalRules} règle{totalRules > 1 ? 's' : ''} au total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entités surveillées</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEntities}</div>
            <p className="text-xs text-muted-foreground">
              sur {totalEntities} entité{totalEntities > 1 ? 's' : ''} au total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Discord</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.size || 0}</div>
            <p className="text-xs text-muted-foreground">
              messages en attente (max: {stats?.maxSize || 0})
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Configuration Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Paramètres globaux du système</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Version</span>
              <Badge>{config.meta.version}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Rotation des logs</span>
              <Badge variant="outline">{config.global.logRotation}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Rate limit Discord</span>
              <Badge variant="outline">{config.global.discordRateLimit.requestsPerSecond} req/s</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Dernière modification</span>
              <span className="text-sm">
                {new Date(config.meta.lastModified).toLocaleString('fr-FR')}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Règles par priorité</CardTitle>
            <CardDescription>Distribution des règles actives</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {config.rules
                .filter(r => r.enabled)
                .sort((a, b) => b.priority - a.priority)
                .slice(0, 5)
                .map(rule => (
                  <div key={rule.id} className="flex items-center justify-between">
                    <span className="text-sm truncate max-w-[200px]">{rule.name}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">P{rule.priority}</Badge>
                      {rule.stopPropagation && (
                        <Badge variant="outline" className="text-xs">Stop</Badge>
                      )}
                    </div>
                  </div>
                ))}
              {config.rules.filter(r => r.enabled).length === 0 && (
                <p className="text-sm text-muted-foreground">Aucune règle active</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>Accès rapide aux fonctionnalités courantes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <a
              href="/rules"
              className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-accent transition-colors"
            >
              <Activity className="h-8 w-8 mb-2 text-primary" />
              <span className="font-medium">Gérer les règles</span>
              <span className="text-xs text-muted-foreground mt-1">
                Créer et modifier des règles
              </span>
            </a>
            
            <a
              href="/entities"
              className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-accent transition-colors"
            >
              <Activity className="h-8 w-8 mb-2 text-primary" />
              <span className="font-medium">Entités surveillées</span>
              <span className="text-xs text-muted-foreground mt-1">
                Ajouter des joueurs à surveiller
              </span>
            </a>
            
            <a
              href="/testing"
              className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-accent transition-colors"
            >
              <Activity className="h-8 w-8 mb-2 text-primary" />
              <span className="font-medium">Tester les webhooks</span>
              <span className="text-xs text-muted-foreground mt-1">
                Vérifier la configuration Discord
              </span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}