import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [hasChanges, setHasChanges] = useState(false);
  
  const { data: config, isLoading } = useQuery({
    queryKey: ['config'],
    queryFn: api.getConfig
  });
  
  const [formData, setFormData] = useState(config?.global);
  
  const updateConfigMutation = useMutation({
    mutationFn: api.updateConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
      setHasChanges(false);
      alert('Configuration mise à jour avec succès !');
    },
    onError: (error: any) => {
      alert(`Erreur : ${error.message}`);
    }
  });
  
  const handleSave = () => {
    if (!config || !formData) return;
    
    updateConfigMutation.mutate({
      ...config,
      global: formData
    });
  };
  
  const updateField = (field: string, value: any) => {
    if (!formData) return;
    
    const updated = { ...formData, [field]: value };
    setFormData(updated as any);
    setHasChanges(true);
  };
  
  const updateNestedField = (parent: string, field: string, value: any) => {
    if (!formData) return;
    
    const updated = {
      ...formData,
      [parent]: {
        ...(formData as any)[parent],
        [field]: value
      }
    };
    setFormData(updated as any);
    setHasChanges(true);
  };
  
  if (isLoading || !config || !formData) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Paramètres</h1>
          <p className="text-muted-foreground mt-2">
            Configuration globale du système
          </p>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} disabled={updateConfigMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateConfigMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        )}
      </div>
      
      {hasChanges && (
        <Card className="border-amber-500">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Vous avez des modifications non enregistrées</span>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration des logs</CardTitle>
          <CardDescription>Paramètres d'enregistrement des fichiers de logs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logDirectory">Répertoire des logs</Label>
            <Input
              id="logDirectory"
              value={formData.logDirectory}
              onChange={(e) => updateField('logDirectory', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="logRotation">Rotation des logs</Label>
            <select
              id="logRotation"
              value={formData.logRotation}
              onChange={(e) => updateField('logRotation', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="daily">Quotidienne</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="monthly">Mensuelle</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="logDateFormat">Format de date</Label>
            <Input
              id="logDateFormat"
              value={formData.logDateFormat}
              onChange={(e) => updateField('logDateFormat', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Format moment.js (ex: YYYY-MM-DD HH:mm:ss)
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="logMessageTemplate">Template de message par défaut</Label>
            <textarea
              id="logMessageTemplate"
              value={formData.logMessageTemplate}
              onChange={(e) => updateField('logMessageTemplate', e.target.value)}
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Template utilisé si non spécifié dans une règle
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Discord Rate Limiting */}
      <Card>
        <CardHeader>
          <CardTitle>Rate limiting Discord</CardTitle>
          <CardDescription>
            Configuration de la gestion de la file d'attente des webhooks Discord
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="requestsPerSecond">Requêtes par seconde</Label>
            <Input
              id="requestsPerSecond"
              type="number"
              min="1"
              max="10"
              value={formData.discordRateLimit.requestsPerSecond}
              onChange={(e) => updateNestedField('discordRateLimit', 'requestsPerSecond', parseInt(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Recommandé : 4-5 req/s (Discord limite à ~5 req/s)
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="maxQueueSize">Taille maximale de la queue</Label>
            <Input
              id="maxQueueSize"
              type="number"
              min="100"
              max="10000"
              value={formData.discordRateLimit.maxQueueSize}
              onChange={(e) => updateNestedField('discordRateLimit', 'maxQueueSize', parseInt(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Nombre maximum de messages en attente
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="onQueueFull">Comportement si queue pleine</Label>
            <select
              id="onQueueFull"
              value={formData.discordRateLimit.onQueueFull}
              onChange={(e) => updateNestedField('discordRateLimit', 'onQueueFull', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="drop">Drop (supprimer les anciens messages)</option>
              <option value="wait">Wait (attendre qu'il y ait de la place)</option>
            </select>
          </div>
        </CardContent>
      </Card>
      
      {/* Métadonnées */}
      <Card>
        <CardHeader>
          <CardTitle>Informations système</CardTitle>
          <CardDescription>Métadonnées de la configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Version</span>
            <span className="text-sm font-mono">{config.meta.version}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Dernière modification</span>
            <span className="text-sm">
              {new Date(config.meta.lastModified).toLocaleString('fr-FR')}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}