import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Copy, Power, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { Rule } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RuleEditor } from '@/components/RuleEditor';

export function RulesPage() {
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: config, isLoading } = useQuery({
    queryKey: ['config'],
    queryFn: api.getConfig
  });
  
  const updateConfigMutation = useMutation({
    mutationFn: api.updateConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
      setEditingRule(null);
      setIsCreating(false);
    }
  });
  
  const handleToggleRule = (ruleId: string) => {
    if (!config) return;
    
    const updatedConfig = {
      ...config,
      rules: config.rules.map(r =>
        r.id === ruleId ? { ...r, enabled: !r.enabled } : r
      )
    };
    
    updateConfigMutation.mutate(updatedConfig);
  };
  
  const handleDeleteRule = (ruleId: string) => {
    if (!config) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) return;
    
    const updatedConfig = {
      ...config,
      rules: config.rules.filter(r => r.id !== ruleId)
    };
    
    updateConfigMutation.mutate(updatedConfig);
  };
  
  const handleDuplicateRule = (rule: Rule) => {
    if (!config) return;
    
    const newRule: Rule = {
      ...rule,
      id: `${rule.id}_copy_${Date.now()}`,
      name: `${rule.name} (copie)`,
      enabled: false
    };
    
    const updatedConfig = {
      ...config,
      rules: [...config.rules, newRule]
    };
    
    updateConfigMutation.mutate(updatedConfig);
  };
  
  const handleSaveRule = (rule: Rule) => {
    if (!config) return;
    
    const existingIndex = config.rules.findIndex(r => r.id === rule.id);
    let updatedRules;
    
    if (existingIndex >= 0) {
      updatedRules = [...config.rules];
      updatedRules[existingIndex] = rule;
    } else {
      updatedRules = [...config.rules, rule];
    }
    
    const updatedConfig = {
      ...config,
      rules: updatedRules
    };
    
    updateConfigMutation.mutate(updatedConfig);
  };
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }
  
  if (!config) {
    return <div className="text-destructive">Erreur de chargement de la configuration</div>;
  }
  
  if (editingRule || isCreating) {
    return (
      <RuleEditor
        rule={editingRule}
        config={config}
        onSave={handleSaveRule}
        onCancel={() => {
          setEditingRule(null);
          setIsCreating(false);
        }}
      />
    );
  }
  
  const sortedRules = [...config.rules].sort((a, b) => b.priority - a.priority);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Règles</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les règles de traitement des événements
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle règle
        </Button>
      </div>
      
      {config.rules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Aucune règle configurée</p>
            <p className="text-sm text-muted-foreground mb-4">
              Créez votre première règle pour commencer à traiter les événements
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une règle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedRules.map(rule => (
            <Card key={rule.id} className={!rule.enabled ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <CardTitle>{rule.name}</CardTitle>
                      <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                        {rule.enabled ? 'Activée' : 'Désactivée'}
                      </Badge>
                      <Badge variant="outline">Priorité {rule.priority}</Badge>
                      {rule.stopPropagation && (
                        <Badge variant="destructive">Stop propagation</Badge>
                      )}
                    </div>
                    <CardDescription>ID: {rule.id}</CardDescription>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleRule(rule.id)}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDuplicateRule(rule)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingRule(rule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Conditions */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Déclencheur</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {rule.trigger.eventId && (
                      <div>Event ID: <code className="bg-muted px-1 py-0.5 rounded">{rule.trigger.eventId}</code></div>
                    )}
                    {rule.trigger.parsed?.tags && (
                      <div>
                        Tags: {rule.trigger.parsed.tags.contains?.map(tag => (
                          <Badge key={tag} variant="outline" className="ml-1">{tag}</Badge>
                        ))}
                      </div>
                    )}
                    {rule.trigger.parsed?.action && (
                      <div>
                        Actions: {rule.trigger.parsed.action.in?.map(action => (
                          <Badge key={action} variant="outline" className="ml-1">{action}</Badge>
                        ))}
                      </div>
                    )}

                  </div>
                </div>
                
                {/* Actions */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    {rule.actions.log?.enabled && (
                      <Badge variant="secondary">
                        📝 Log: {rule.actions.log.fileName}
                      </Badge>
                    )}
                    {rule.actions.discord?.map(webhook => (
                      <Badge key={webhook.id} variant="secondary">
                        💬 Discord : {webhook.name} ({webhook.webhookType || 'admin'})
                        {/* s'il y a des entités surveillées, on les affiche */}
                        {webhook.conditions?.watchedEntity && (
                          <div className="ml-2">
                             🕵️ : {webhook.conditions.watchedEntity.anyOf?.length || 0}
                          </div>
                        )}

                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}