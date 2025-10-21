import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function TestingPage() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookMessage, setWebhookMessage] = useState('🧪 Test de webhook depuis CE - Tot To Discord');
  const [webhookResult, setWebhookResult] = useState<{ success: boolean; error?: string } | null>(null);
  
  const [template, setTemplate] = useState('🚨 [[displayName]] a commis un crime !');
  const [webhookType, setWebhookType] = useState<'public' | 'admin'>('admin');
  const [sampleEvent, setSampleEvent] = useState({
    date: '2024-10-18 14:30:00',
    steamId: '76561198018484513',
    charName: 'Nylath',
    actName: 'Bandit',
    eventId: 'FlowChartLog',
    eventCategory: 'Admin',
    eventType: 'FlowChart',
    params: '[[CRIME]] Vol de 100 pièces'
  });
  const [templateResult, setTemplateResult] = useState<string | null>(null);
  
  const testWebhookMutation = useMutation({
    mutationFn: ({ webhook, message }: { webhook: string; message: string }) =>
      api.testWebhook(webhook, message),
    onSuccess: (data) => {
      setWebhookResult(data);
    },
    onError: (error: any) => {
      setWebhookResult({ success: false, error: error.message });
    }
  });
  
  const testTemplateMutation = useMutation({
    mutationFn: ({ template, sampleEvent, webhookType }: any) =>
      api.testTemplate(template, sampleEvent, webhookType),
    onSuccess: (data) => {
      setTemplateResult(data.result);
    }
  });
  
  const handleTestWebhook = () => {
    setWebhookResult(null);
    testWebhookMutation.mutate({ webhook: webhookUrl, message: webhookMessage });
  };
  
  const handleTestTemplate = () => {
    setTemplateResult(null);
    testTemplateMutation.mutate({ template, sampleEvent, webhookType });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tests</h1>
        <p className="text-muted-foreground mt-2">
          Testez vos webhooks Discord et vos templates de messages
        </p>
      </div>
      
      {/* Test Webhook */}
      <Card>
        <CardHeader>
          <CardTitle>Test de webhook Discord</CardTitle>
          <CardDescription>
            Envoyez un message de test à un webhook Discord pour vérifier qu'il fonctionne
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">URL du webhook *</Label>
            <Input
              id="webhookUrl"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="webhookMessage">Message de test *</Label>
            <textarea
              id="webhookMessage"
              value={webhookMessage}
              onChange={(e) => setWebhookMessage(e.target.value)}
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              rows={3}
            />
          </div>
          
          <Button
            onClick={handleTestWebhook}
            disabled={!webhookUrl || !webhookMessage || testWebhookMutation.isPending}
          >
            {testWebhookMutation.isPending ? (
              'Envoi en cours...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Envoyer le test
              </>
            )}
          </Button>
          
          {webhookResult && (
            <Card className={webhookResult.success ? 'border-green-500' : 'border-destructive'}>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  {webhookResult.success ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="font-medium text-green-500">Test réussi !</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-destructive" />
                      <span className="font-medium text-destructive">
                        Échec : {webhookResult.error}
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
      
      {/* Test Template */}
      <Card>
        <CardHeader>
          <CardTitle>Test de template</CardTitle>
          <CardDescription>
            Testez vos templates de messages avec des données d'exemple
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template">Template *</Label>
            <textarea
              id="template"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              rows={3}
              placeholder="Ex: [[displayName]] a fait [[parsed.action]]"
            />
            <p className="text-xs text-muted-foreground">
              Variables disponibles : [[displayName]], [[charName]], [[steamId]], [[fullIdentity]], 
              [[eventId]], [[params]], [[parsed.action]], [[parsed.tags.0]], etc.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="webhookType">Type de webhook</Label>
            <select
              id="webhookType"
              value={webhookType}
              onChange={(e) => setWebhookType(e.target.value as any)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="admin">Admin (toutes les variables)</option>
              <option value="public">Public (variables limitées)</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <Label>Événement d'exemple</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="charName" className="text-xs">Nom du personnage</Label>
                <Input
                  id="charName"
                  value={sampleEvent.charName}
                  onChange={(e) => setSampleEvent({ ...sampleEvent, charName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actName" className="text-xs">Alias (actName)</Label>
                <Input
                  id="actName"
                  value={sampleEvent.actName}
                  onChange={(e) => setSampleEvent({ ...sampleEvent, actName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="steamId" className="text-xs">Steam ID</Label>
                <Input
                  id="steamId"
                  value={sampleEvent.steamId}
                  onChange={(e) => setSampleEvent({ ...sampleEvent, steamId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventId" className="text-xs">Event ID</Label>
                <select
                  id="eventId"
                  value={sampleEvent.eventId}
                  onChange={(e) => setSampleEvent({ ...sampleEvent, eventId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="FlowChartLog">FlowChartLog</option>
                  <option value="RR_ABILITY_USE">RR_ABILITY_USE</option>
                </select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="params" className="text-xs">Params</Label>
                <Input
                  id="params"
                  value={sampleEvent.params}
                  onChange={(e) => setSampleEvent({ ...sampleEvent, params: e.target.value })}
                  placeholder={
                    sampleEvent.eventId === 'FlowChartLog'
                      ? '[[CRIME]] Vol de 100 pièces'
                      : 'Pickpocket|Victim (Success)'
                  }
                />
              </div>
            </div>
          </div>
          
          <Button
            onClick={handleTestTemplate}
            disabled={!template || testTemplateMutation.isPending}
          >
            {testTemplateMutation.isPending ? (
              'Test en cours...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Tester le template
              </>
            )}
          </Button>
          
          {templateResult && (
            <Card className="border-green-500">
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  Résultat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4">
                  <pre className="text-sm whitespace-pre-wrap">{templateResult}</pre>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
      
      {/* Variables disponibles */}
      <Card>
        <CardHeader>
          <CardTitle>Variables disponibles</CardTitle>
          <CardDescription>
            Liste complète des variables utilisables dans les templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Variables standard</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <code className="bg-muted px-2 py-1 rounded">[[date]]</code>
                  <span className="text-muted-foreground">Date de l'événement</span>
                </div>
                <div className="flex justify-between">
                  <code className="bg-muted px-2 py-1 rounded">[[eventId]]</code>
                  <span className="text-muted-foreground">ID de l'événement</span>
                </div>
                <div className="flex justify-between">
                  <code className="bg-muted px-2 py-1 rounded">[[eventType]]</code>
                  <span className="text-muted-foreground">Type d'événement</span>
                </div>
                <div className="flex justify-between">
                  <code className="bg-muted px-2 py-1 rounded">[[params]]</code>
                  <span className="text-muted-foreground">Paramètres bruts</span>
                </div>
                <div className="flex justify-between">
                  <code className="bg-muted px-2 py-1 rounded">[[displayName]]</code>
                  <Badge variant="default" className="text-xs">Public safe</Badge>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Variables admin uniquement</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <code className="bg-muted px-2 py-1 rounded">[[charName]]</code>
                  <Badge variant="destructive" className="text-xs">Admin</Badge>
                </div>
                <div className="flex justify-between">
                  <code className="bg-muted px-2 py-1 rounded">[[actName]]</code>
                  <Badge variant="destructive" className="text-xs">Admin</Badge>
                </div>
                <div className="flex justify-between">
                  <code className="bg-muted px-2 py-1 rounded">[[steamId]]</code>
                  <Badge variant="destructive" className="text-xs">Admin</Badge>
                </div>
                <div className="flex justify-between">
                  <code className="bg-muted px-2 py-1 rounded">[[fullIdentity]]</code>
                  <Badge variant="destructive" className="text-xs">Admin</Badge>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Variables parsées (RR_ABILITY_USE)</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <code className="bg-muted px-2 py-1 rounded">[[parsed.action]]</code>
                  <span className="text-muted-foreground">Nom de l'action</span>
                </div>
                <div className="flex justify-between">
                  <code className="bg-muted px-2 py-1 rounded">[[parsed.target]]</code>
                  <span className="text-muted-foreground">Cible</span>
                </div>
                <div className="flex justify-between">
                  <code className="bg-muted px-2 py-1 rounded">[[parsed.result]]</code>
                  <span className="text-muted-foreground">Résultat</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Variables parsées (FlowChartLog)</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <code className="bg-muted px-2 py-1 rounded">[[parsed.tagsFormatted]]</code>
                  <span className="text-muted-foreground">Tags formatés</span>
                </div>
                <div className="flex justify-between">
                  <code className="bg-muted px-2 py-1 rounded">[[parsed.tags.0]]</code>
                  <span className="text-muted-foreground">Premier tag</span>
                </div>
                <div className="flex justify-between">
                  <code className="bg-muted px-2 py-1 rounded">[[parsed.tags.1]]</code>
                  <span className="text-muted-foreground">Deuxième tag</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}