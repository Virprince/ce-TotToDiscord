import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Power, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { WatchedEntity } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function WatchedEntitiesPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [editingEntity, setEditingEntity] = useState<WatchedEntity | null>(null);
  const queryClient = useQueryClient();
  
  const { data: config, isLoading } = useQuery({
    queryKey: ['config'],
    queryFn: api.getConfig
  });
  
  const updateConfigMutation = useMutation({
    mutationFn: api.updateConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
      setIsEditing(false);
      setEditingEntity(null);
    }
  });
  
  const handleToggleEntity = (entityId: string) => {
    if (!config) return;
    
    const updatedConfig = {
      ...config,
      watchedEntities: config.watchedEntities.map(e =>
        e.id === entityId ? { ...e, enabled: !e.enabled } : e
      )
    };
    
    updateConfigMutation.mutate(updatedConfig);
  };
  
  const handleDeleteEntity = (entityId: string) => {
    if (!config) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entité surveillée ?')) return;
    
    const updatedConfig = {
      ...config,
      watchedEntities: config.watchedEntities.filter(e => e.id !== entityId)
    };
    
    updateConfigMutation.mutate(updatedConfig);
  };
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }
  
  if (!config) {
    return <div className="text-destructive">Erreur de chargement de la configuration</div>;
  }
  
  if (isEditing || editingEntity) {
    return (
      <EntityEditor
        entity={editingEntity}
        config={config}
        onSave={(entity) => {
          const existingIndex = config.watchedEntities.findIndex(e => e.id === entity.id);
          let updatedEntities;
          
          if (existingIndex >= 0) {
            updatedEntities = [...config.watchedEntities];
            updatedEntities[existingIndex] = entity;
          } else {
            updatedEntities = [...config.watchedEntities, entity];
          }
          
          updateConfigMutation.mutate({
            ...config,
            watchedEntities: updatedEntities
          });
        }}
        onCancel={() => {
          setIsEditing(false);
          setEditingEntity(null);
        }}
      />
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Entités surveillées</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les joueurs et personnages à surveiller
          </p>
        </div>
        <Button onClick={() => setIsEditing(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle entité
        </Button>
      </div>
      
      {config.watchedEntities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Aucune entité surveillée</p>
            <p className="text-sm text-muted-foreground mb-4">
              Ajoutez des joueurs ou personnages à surveiller
            </p>
            <Button onClick={() => setIsEditing(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une entité
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {config.watchedEntities.map(entity => (
            <Card key={entity.id} className={!entity.enabled ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <CardTitle>{entity.name}</CardTitle>
                      <Badge variant={entity.enabled ? 'default' : 'secondary'}>
                        {entity.enabled ? 'Activée' : 'Désactivée'}
                      </Badge>
                    </div>
                    <CardDescription>{entity.description || 'Aucune description'}</CardDescription>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleEntity(entity.id)}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingEntity(entity)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteEntity(entity.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <Badge variant="outline">
                    {entity.matchType === 'steamId' && '🎮 Steam ID'}
                    {entity.matchType === 'charName' && '👤 Personnage'}
                    {entity.matchType === 'actName' && '🎭 Alias'}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valeur</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs">{entity.value}</code>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Créée le</span>
                  <span className="text-xs">
                    {new Date(entity.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

interface EntityEditorProps {
  entity: WatchedEntity | null;
  config: any;
  onSave: (entity: WatchedEntity) => void;
  onCancel: () => void;
}

function EntityEditor({ entity, onSave, onCancel }: EntityEditorProps) {
  const [formData, setFormData] = useState<WatchedEntity>(
    entity || {
      id: `entity_${Date.now()}`,
      name: '',
      enabled: true,
      matchType: 'charName',
      value: '',
      description: '',
      createdAt: new Date().toISOString()
    }
  );
  
  const [errors, setErrors] = useState<string[]>([]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors: string[] = [];
    
    if (!formData.name.trim()) {
      validationErrors.push('Le nom est requis');
    }
    
    if (!formData.value.trim()) {
      validationErrors.push('La valeur est requise');
    }
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    onSave(formData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {entity ? 'Modifier l\'entité' : 'Nouvelle entité'}
          </h1>
          <p className="text-muted-foreground mt-2">
            Configurez une entité à surveiller
          </p>
        </div>
        <div className="flex space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit">
            Enregistrer
          </Button>
        </div>
      </div>
      
      {errors.length > 0 && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, i) => (
                <li key={i} className="text-sm text-destructive">{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Informations de l'entité</CardTitle>
          <CardDescription>Définissez le nom et le type de surveillance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Joueur suspect"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="matchType">Type de correspondance *</Label>
            <select
              id="matchType"
              value={formData.matchType}
              onChange={(e) => setFormData({ ...formData, matchType: e.target.value as any })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="charName">Nom du personnage (charName)</option>
              <option value="steamId">Steam ID (tous les personnages du joueur)</option>
              <option value="actName">Alias/Nom d'emprunt (actName)</option>
            </select>
            <p className="text-xs text-muted-foreground">
              {formData.matchType === 'steamId' && '🎮 Surveille tous les personnages de ce joueur'}
              {formData.matchType === 'charName' && '👤 Surveille uniquement ce personnage spécifique'}
              {formData.matchType === 'actName' && '🎭 Surveille tous ceux qui utilisent cet alias'}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="value">
              Valeur * 
              {formData.matchType === 'steamId' && ' (Steam ID)'}
              {formData.matchType === 'charName' && ' (Nom du personnage)'}
              {formData.matchType === 'actName' && ' (Alias)'}
            </Label>
            <Input
              id="value"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder={
                formData.matchType === 'steamId' 
                  ? 'Ex: 76561198018484513'
                  : formData.matchType === 'charName'
                  ? 'Ex: Nylath'
                  : 'Ex: Bandit'
              }
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Joueur suspect de grief"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              rows={3}
            />
          </div>
          
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Surveillance activée</span>
          </label>
        </CardContent>
      </Card>
    </form>
  );
}