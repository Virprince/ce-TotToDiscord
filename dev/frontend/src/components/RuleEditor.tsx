import { useState, useEffect } from 'react';
import { Rule, Config, DiscordWebhook } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';

interface RuleEditorProps {
  rule: Rule | null;
  config: Config;
  onSave: (rule: Rule) => void;
  onCancel: () => void;
}

export function RuleEditor({ rule, config, onSave, onCancel }: RuleEditorProps) {
  const [formData, setFormData] = useState<Rule>(
    rule || {
      id: `rule_${Date.now()}`,
      name: '',
      enabled: true,
      priority: 10,
      stopPropagation: false,
      trigger: {},
      actions: {
        discord: []
      }
    }
  );
  
  const [errors, setErrors] = useState<string[]>([]);
  
  // États locaux pour les champs de saisie avec virgules
  const [tagsInput, setTagsInput] = useState('');
  const [actionsInput, setActionsInput] = useState('');
  
  // Initialiser les états locaux quand les données changent
  useEffect(() => {
    setTagsInput(formData.trigger.parsed?.tags?.contains?.join(', ') || '');
    setActionsInput(formData.trigger.parsed?.action?.in?.join(', ') || '');
  }, [formData.trigger.parsed]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors: string[] = [];
    
    if (!formData.name.trim()) {
      validationErrors.push('Le nom de la règle est requis');
    }
    
    if (!formData.actions.log && (!formData.actions.discord || formData.actions.discord.length === 0)) {
      validationErrors.push('Au moins une action (log ou Discord) est requise');
    }
    
    if (formData.actions.discord) {
      formData.actions.discord.forEach((webhook, index) => {
        if (!webhook.webhook.startsWith('https://discord.com/api/webhooks/')) {
          validationErrors.push(`Webhook ${index + 1}: URL invalide`);
        }
        if (!webhook.message.trim()) {
          validationErrors.push(`Webhook ${index + 1}: Message requis`);
        }
      });
    }

    // on s'assure que les conditions sont valides en fonction de l'eventId
    if (formData.trigger.eventId === 'FlowChartLog') {
      if (!formData.trigger.parsed?.tags?.contains?.length) {
        validationErrors.push('Les tags sont requis');
      }
    }
    
    if (formData.trigger.eventId === 'RR_ABILITY_USE') {
      if (!formData.trigger.parsed?.action?.in?.length) {
        validationErrors.push('Les actions sont requises');
      }
    }
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Nettoyer les données selon le type d'événement
    const cleanedFormData = { ...formData };
    
    if (cleanedFormData.trigger.eventId === 'FlowChartLog') {
      // Pour FlowChartLog, on retire les actions (RR_ABILITY_USE)
      if (cleanedFormData.trigger.parsed?.action) {
        delete cleanedFormData.trigger.parsed.action;
      }
    } else if (cleanedFormData.trigger.eventId === 'RR_ABILITY_USE') {
      // Pour RR_ABILITY_USE, on retire les tags (FlowChartLog)
      if (cleanedFormData.trigger.parsed?.tags) {
        delete cleanedFormData.trigger.parsed.tags;
      }
    }
    
    onSave(cleanedFormData);
  };
  
  const addWebhook = () => {
    setFormData({
      ...formData,
      actions: {
        ...formData.actions,
        discord: [
          ...(formData.actions.discord || []),
          {
            id: `webhook_${Date.now()}`,
            name: '',
            webhook: '',
            message: '',
            webhookType: 'admin'
          }
        ]
      }
    });
  };
  
  const removeWebhook = (index: number) => {
    setFormData({
      ...formData,
      actions: {
        ...formData.actions,
        discord: formData.actions.discord?.filter((_, i) => i !== index)
      }
    });
  };
  
  const updateWebhook = (index: number, updates: Partial<DiscordWebhook>) => {
    if (!formData.actions.discord) return;
    
    const newWebhooks = [...formData.actions.discord];
    newWebhooks[index] = { ...newWebhooks[index], ...updates };
    
    setFormData({
      ...formData,
      actions: {
        ...formData.actions,
        discord: newWebhooks
      }
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {rule ? 'Modifier la règle' : 'Nouvelle règle'}
          </h1>
          <p className="text-muted-foreground mt-2">
            Configurez les conditions et actions de la règle
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
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Erreurs de validation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, i) => (
                <li key={i} className="text-sm text-destructive">{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      
      {/* Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
          <CardDescription>Nom et paramètres de base de la règle</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la règle *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Suivi des crimes"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Priorité</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Plus la priorité est élevée, plus la règle est évaluée en premier
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Règle activée</span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.stopPropagation}
                onChange={(e) => setFormData({ ...formData, stopPropagation: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Arrêter la propagation</span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowDuplicates || false}
                onChange={(e) => setFormData({ ...formData, allowDuplicates: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Autoriser les doublons</span>
            </label>
          </div>
        </CardContent>
      </Card>
      
      {/* Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Déclencheur</CardTitle>
          <CardDescription>Définissez quand cette règle doit s'appliquer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eventId">Event ID</Label>
            <select
              id="eventId"
              value={formData.trigger.eventId || ''}
              onChange={(e) => setFormData({
                ...formData,
                trigger: { ...formData.trigger, eventId: e.target.value || undefined }
              })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="">Tous les événements</option>
              <option value="RR_ABILITY_USE">RR_ABILITY_USE</option>
              <option value="FlowChartLog">FlowChartLog</option>
            </select>
          </div>
          
          {formData.trigger.eventId === 'FlowChartLog' && (
            <div className="space-y-2">
              <Label>Tags à rechercher</Label>
              <Input
                placeholder="Ex: CRIME, LOG (séparés par des virgules)"
                value={tagsInput}
                onChange={(e) => {
                  setTagsInput(e.target.value);
                }}
                onBlur={(e) => {
                  // Traitement final lors de la perte de focus
                  const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                  setFormData({
                    ...formData,
                    trigger: {
                      ...formData.trigger,
                      parsed: {
                        ...formData.trigger.parsed,
                        tags: { ...formData.trigger.parsed?.tags, contains: tags }
                      }
                    }
                  });
                }}
              />
            </div>
          )}
          
          {formData.trigger.eventId === 'RR_ABILITY_USE' && (
            <div className="space-y-2">
              <Label>Actions à surveiller</Label>
              <Input
                placeholder="Ex: Pickpocket, Lockpicking (séparés par des virgules)"
                value={actionsInput}
                onChange={(e) => {
                  setActionsInput(e.target.value);
                }}
                onBlur={(e) => {
                  // Traitement final lors de la perte de focus
                  const actions = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                  setFormData({
                    ...formData,
                    trigger: {
                      ...formData.trigger,
                      parsed: {
                        ...formData.trigger.parsed,
                        action: { in: actions }
                      }
                    }
                  });
                }}
              />
            </div>
          )}

        </CardContent>
      </Card>
      
      {/* Actions - Log */}
      <Card>
        <CardHeader>
          <CardTitle>Actions - Logs</CardTitle>
          <CardDescription>Enregistrer les événements dans des fichiers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.actions.log?.enabled || false}
              onChange={(e) => setFormData({
                ...formData,
                actions: {
                  ...formData.actions,
                  log: e.target.checked
                    ? { enabled: true, fileName: formData.id }
                    : undefined
                }
              })}
              className="rounded"
            />
            <span className="text-sm">Activer l'enregistrement dans les logs</span>
          </label>
          
          {formData.actions.log?.enabled && (
            <div className="space-y-2">
              <Label htmlFor="logFileName">Nom du fichier de log</Label>
              <Input
                id="logFileName"
                value={formData.actions.log.fileName}
                onChange={(e) => setFormData({
                  ...formData,
                  actions: {
                    ...formData.actions,
                    log: { ...formData.actions.log!, fileName: e.target.value }
                  }
                })}
                placeholder="Ex: crimes"
              />
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Actions - Discord */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Actions - Discord</CardTitle>
              <CardDescription>Envoyer des messages sur Discord via webhooks</CardDescription>
            </div>
            <Button type="button" size="sm" onClick={addWebhook}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un webhook
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {formData.actions.discord?.map((webhook, index) => (
            <div key={webhook.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Webhook {index + 1}</h4>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeWebhook(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label>Nom du webhook</Label>
                <Input
                  value={webhook.name}
                  onChange={(e) => updateWebhook(index, { name: e.target.value })}
                  placeholder="Ex: Suivi des crimes"
                />
              </div>

              <div className="space-y-2">
                <Label>URL du webhook Discord *</Label>
                <Input
                  value={webhook.webhook}
                  onChange={(e) => updateWebhook(index, { webhook: e.target.value })}
                  placeholder="https://discord.com/api/webhooks/..."
                />
              </div>

              <div className="space-y-2">
                <Label>Type de webhook</Label>
                <select
                  value={webhook.webhookType || 'admin'}
                  onChange={(e) => updateWebhook(index, { webhookType: e.target.value as any })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="admin">Admin (toutes les variables)</option>
                  <option value="public">Public (variables limitées)</option>
                </select>
                {webhook.webhookType === 'public' && (
                  <p className="text-xs text-amber-600 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Les variables sensibles (charName, steamId) ne seront pas remplacées
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Message *</Label>
                <textarea
                  value={webhook.message}
                  onChange={(e) => updateWebhook(index, { message: e.target.value })}
                  placeholder="Ex: 🚨 [[displayName]] a commis un crime !"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Variables disponibles : [[displayName]], [[charName]], [[steamId]], [[eventId]], [[params]], etc.
                </p>
              </div>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={webhook.allowMentions || false}
                  onChange={(e) => updateWebhook(index, { allowMentions: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Autoriser les mentions (@here, @everyone)</span>
              </label>

              <div className="space-y-2">
            <Label>Entités surveillées</Label>
            <div className="flex flex-wrap gap-2">
              {config.watchedEntities.map(entity => {
                const isSelected = webhook.conditions?.watchedEntity?.anyOf?.includes(entity.id);
                return (
                  <Badge
                    key={entity.id}
                    variant={isSelected ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      
                        const current = webhook.conditions?.watchedEntity?.anyOf || [] as string[];
                        const updated = isSelected
                          ? current.filter(id => id !== entity.id)
                          : [...current, entity.id];
                        
                        updateWebhook(index, { conditions: { ...webhook.conditions, watchedEntity: updated.length > 0 ? { anyOf: updated } : undefined } });
                    }}
                  >
                    {entity.name}
                  </Badge>
                );
              })}
              {config.watchedEntities.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Aucune entité surveillée configurée
                </p>
              )}
            </div>
          </div>
            </div>
          ))}
          
          {(!formData.actions.discord || formData.actions.discord.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucun webhook configuré. Cliquez sur "Ajouter un webhook" pour commencer.
            </p>
          )}
        </CardContent>
      </Card>
    </form>
  );
}