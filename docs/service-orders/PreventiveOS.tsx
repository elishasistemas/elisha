import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Package,
  User,
  Wrench,
  AlertCircle,
  Check,
  Ban,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { EvidenceButtons } from "../EvidenceButtons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import {
  PreventiveOSData,
  ElevatorState,
  ChecklistItem,
  HistoryEntry,
} from "./types";

interface PreventiveOSProps {
  data: PreventiveOSData;
  history: HistoryEntry[];
  onCheckout?: (elevatorState: ElevatorState, clientName: string) => void;
  onChecklistChange?: (items: ChecklistItem[]) => void;
}

/**
 * Componente de OS Preventiva
 * 
 * Características únicas:
 * - Possui checklist obrigatório
 * - Campo de observações com evidências
 * - Sem laudo técnico
 * - Sem descrição do cliente
 * - Cronograma mensal gerenciado no backend
 */
export function PreventiveOS({
  data,
  history,
  onCheckout,
  onChecklistChange,
}: PreventiveOSProps) {
  const [elevatorState, setElevatorState] = useState<ElevatorState>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(
    data.checklist
  );
  const [clientName, setClientName] = useState("");

  const handleChecklistChange = (
    id: number,
    newStatus: "conforme" | "nao-conforme" | "na"
  ) => {
    const updatedItems = checklistItems.map((item) =>
      item.id === id ? { ...item, status: newStatus } : item
    );
    setChecklistItems(updatedItems);
    onChecklistChange?.(updatedItems);
  };

  const completedCount = checklistItems.filter(
    (item) => item.status === "conforme"
  ).length;

  const handleCheckoutClick = () => {
    if (elevatorState && clientName) {
      onCheckout?.(elevatorState, clientName);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        <div className="px-4 py-4 bg-gray-50 border-b border-gray-200">
          <div className="max-w-[1000px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-xl">{data.osNumber}</h1>
                  <div className="flex gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className="border-gray-300 text-gray-700"
                    >
                      Preventiva
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-green-300 bg-green-50 text-green-700"
                    >
                      {data.status}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Cliente: {data.clientName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>Equipamento: {data.equipment}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    <span>Técnico: {data.technician}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-8">
        <div className="max-w-[1000px] mx-auto">
          {/* Desktop: Timeline */}
          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gray-200" />

              <div className="space-y-6">
                {/* Step 1: Checklist */}
                <div className="relative flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm z-10">
                      1
                    </div>
                  </div>
                  <Card className="flex-1 p-6 border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-5 h-5 text-gray-900" />
                      <h2 className="text-lg">Checklist de Atendimento</h2>
                      <Badge variant="outline" className="ml-auto">
                        {completedCount}/{checklistItems.length} conforme
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Marque cada item conforme as normas e boas práticas da
                      empresa
                    </p>
                    <div className="space-y-3">
                      {checklistItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50"
                        >
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">{item.label}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={
                                item.status === "conforme" ? "default" : "outline"
                              }
                              className={`text-xs ${
                                item.status === "conforme"
                                  ? "bg-green-600 hover:bg-green-700 text-white"
                                  : "text-gray-600"
                              }`}
                              onClick={() =>
                                handleChecklistChange(item.id, "conforme")
                              }
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Conforme
                            </Button>
                            <Button
                              size="sm"
                              variant={
                                item.status === "nao-conforme"
                                  ? "default"
                                  : "outline"
                              }
                              className={`text-xs ${
                                item.status === "nao-conforme"
                                  ? "bg-red-600 hover:bg-red-700 text-white"
                                  : "text-gray-600"
                              }`}
                              onClick={() =>
                                handleChecklistChange(item.id, "nao-conforme")
                              }
                            >
                              <Ban className="w-3 h-3 mr-1" />
                              Não Conforme
                            </Button>
                            <Button
                              size="sm"
                              variant={item.status === "na" ? "default" : "outline"}
                              className={`text-xs ${
                                item.status === "na"
                                  ? "bg-gray-600 hover:bg-gray-700 text-white"
                                  : "text-gray-600"
                              }`}
                              onClick={() => handleChecklistChange(item.id, "na")}
                            >
                              N/A
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Step 2: Observações */}
                <div className="relative flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm z-10">
                      2
                    </div>
                  </div>
                  <Card className="flex-1 p-6 border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-5 h-5 text-gray-900" />
                      <h2 className="text-lg">Observações</h2>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Textarea
                          placeholder="Observações sobre a manutenção preventiva..."
                          className="min-h-[80px] resize-none border-gray-200"
                          defaultValue={data.observations}
                        />
                      </div>

                      <Separator className="my-4" />

                      <div>
                        <label className="block text-sm text-gray-700 mb-3">
                          Evidências (Fotos, Vídeos, Áudios)
                        </label>
                        <EvidenceButtons />
                        <p className="text-sm text-gray-500 text-center mt-3">
                          Nenhuma evidência adicionada ainda
                        </p>
                      </div>

                      <p className="text-xs text-gray-500">
                        Salvamento automático a cada 2 segundos
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Step 3: Próximos Passos */}
                <div className="relative flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm z-10">
                      3
                    </div>
                  </div>
                  <Card className="flex-1 p-6 border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertCircle className="w-5 h-5 text-gray-900" />
                      <h2 className="text-lg">Próximos Passos</h2>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-sm mb-2">
                          Estado do elevador:
                        </label>
                        <Select
                          value={elevatorState || undefined}
                          onValueChange={(value) =>
                            setElevatorState(value as ElevatorState)
                          }
                        >
                          <SelectTrigger className="w-full bg-white">
                            <SelectValue placeholder="Selecione o estado do elevador" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="funcionando">
                              Funcionando normal
                            </SelectItem>
                            <SelectItem value="dependendo-corretiva">
                              Funcionando, dependendo de corretiva
                            </SelectItem>
                            <SelectItem value="parado">Parado</SelectItem>
                          </SelectContent>
                        </Select>
                        {elevatorState === "funcionando" && (
                          <p className="text-sm text-green-600 mt-2">
                            ✓ No checkout a OS será fechada normalmente
                          </p>
                        )}
                        {elevatorState === "dependendo-corretiva" && (
                          <p className="text-sm text-amber-600 mt-2">
                            ⚠️ Será criada uma OS do tipo Corretiva Programada
                          </p>
                        )}
                        {elevatorState === "parado" && (
                          <p className="text-sm text-red-600 mt-2">
                            🚨 Será criada uma OS do tipo Urgência (Corretiva com
                            status Parado)
                          </p>
                        )}
                      </div>

                      <Separator />

                      <div>
                        <label className="block text-sm text-gray-700 mb-2">
                          Nome do Cliente
                        </label>
                        <Input
                          placeholder="Nome completo do cliente"
                          className="bg-white"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-700 mb-2">
                          Assinatura do Cliente
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-white text-center cursor-pointer hover:bg-gray-50 transition-colors">
                          <p className="text-sm text-gray-500">
                            Clique para coletar assinatura
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <Button
                      className="w-full bg-black hover:bg-gray-800"
                      disabled={!elevatorState || !clientName}
                      onClick={handleCheckoutClick}
                    >
                      Realizar Checkout
                    </Button>
                  </Card>
                </div>

                {/* Step 4: Histórico */}
                <div className="relative flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-sm z-10">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>
                  <Card className="flex-1 p-6 border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-5 h-5 text-gray-900" />
                      <h2 className="text-lg">Histórico do Equipamento</h2>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Todas as interações anteriores com este equipamento
                    </p>

                    <div className="space-y-4">
                      {history.map((entry, index) => (
                        <div
                          key={index}
                          className="border-b border-gray-200 pb-5 last:pb-0 last:border-none"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm">
                                <span className="text-gray-900">{entry.date}</span>
                                <span className="text-gray-500">
                                  {" "}
                                  às {entry.time}
                                </span>
                              </p>
                              <p className="text-xs text-gray-500">
                                Técnico: {entry.technician}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-900 mb-1">
                            {entry.summary}
                          </p>
                          <p className="text-sm text-gray-600">{entry.details}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile: Tabs */}
          <div className="md:hidden">
            <Tabs defaultValue="checklist" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="checklist" className="text-xs">
                  <div className="flex flex-col items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Checklist</span>
                  </div>
                </TabsTrigger>

                <TabsTrigger value="observacao" className="text-xs">
                  <div className="flex flex-col items-center gap-1">
                    <FileText className="w-4 h-4" />
                    <span>Observação</span>
                  </div>
                </TabsTrigger>

                <TabsTrigger value="concluir" className="text-xs">
                  <div className="flex flex-col items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>Concluir</span>
                  </div>
                </TabsTrigger>

                <TabsTrigger value="historico" className="text-xs">
                  <div className="flex flex-col items-center gap-1">
                    <FileText className="w-4 h-4" />
                    <span>Histórico</span>
                  </div>
                </TabsTrigger>
              </TabsList>

              {/* Mobile content - Similar structure to desktop */}
              <TabsContent value="checklist">
                <Card className="p-6 border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-5 h-5 text-gray-900" />
                    <h2 className="text-lg">Checklist de Atendimento</h2>
                    <Badge variant="outline" className="ml-auto">
                      {completedCount}/{checklistItems.length}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Marque cada item conforme as normas e boas práticas
                  </p>
                  <div className="space-y-3">
                    {checklistItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-3 p-3 border rounded-lg bg-gray-50"
                      >
                        <p className="text-sm text-gray-900">{item.label}</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={
                              item.status === "conforme" ? "default" : "outline"
                            }
                            className={`text-xs flex-1 ${
                              item.status === "conforme"
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : "text-gray-600"
                            }`}
                            onClick={() =>
                              handleChecklistChange(item.id, "conforme")
                            }
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Conforme
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              item.status === "nao-conforme" ? "default" : "outline"
                            }
                            className={`text-xs flex-1 ${
                              item.status === "nao-conforme"
                                ? "bg-red-600 hover:bg-red-700 text-white"
                                : "text-gray-600"
                            }`}
                            onClick={() =>
                              handleChecklistChange(item.id, "nao-conforme")
                            }
                          >
                            <Ban className="w-3 h-3 mr-1" />
                            Não Conf.
                          </Button>
                          <Button
                            size="sm"
                            variant={item.status === "na" ? "default" : "outline"}
                            className={`text-xs ${
                              item.status === "na"
                                ? "bg-gray-600 hover:bg-gray-700 text-white"
                                : "text-gray-600"
                            }`}
                            onClick={() => handleChecklistChange(item.id, "na")}
                          >
                            N/A
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="observacao">
                <Card className="p-6 border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-gray-900" />
                    <h2 className="text-lg">Observações</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Textarea
                        placeholder="Observações sobre a manutenção preventiva..."
                        className="min-h-[100px] resize-none border-gray-200"
                        defaultValue={data.observations}
                      />
                    </div>

                    <Separator className="my-4" />

                    <div>
                      <label className="block text-sm text-gray-700 mb-3">
                        Evidências (Fotos, Vídeos, Áudios)
                      </label>
                      <EvidenceButtons />
                      <p className="text-sm text-gray-500 text-center mt-3">
                        Nenhuma evidência adicionada ainda
                      </p>
                    </div>

                    <p className="text-xs text-gray-500">
                      Salvamento automático a cada 2 segundos
                    </p>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="concluir">
                <Card className="p-6 border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-gray-900" />
                    <h2 className="text-lg">Próximos Passos</h2>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm mb-2">
                        Estado do elevador:
                      </label>
                      <Select
                        value={elevatorState || undefined}
                        onValueChange={(value) =>
                          setElevatorState(value as ElevatorState)
                        }
                      >
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="Selecione o estado do elevador" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="funcionando">
                            Funcionando normal
                          </SelectItem>
                          <SelectItem value="dependendo-corretiva">
                            Funcionando, dependendo de corretiva
                          </SelectItem>
                          <SelectItem value="parado">Parado</SelectItem>
                        </SelectContent>
                      </Select>
                      {elevatorState === "funcionando" && (
                        <p className="text-sm text-green-600 mt-2">
                          ✓ No checkout a OS será fechada normalmente
                        </p>
                      )}
                      {elevatorState === "dependendo-corretiva" && (
                        <p className="text-sm text-amber-600 mt-2">
                          ⚠️ Será criada uma OS do tipo Corretiva Programada
                        </p>
                      )}
                      {elevatorState === "parado" && (
                        <p className="text-sm text-red-600 mt-2">
                          🚨 Será criada uma OS do tipo Urgência (Corretiva com
                          status Parado)
                        </p>
                      )}
                    </div>

                    <Separator />

                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Nome do Cliente
                      </label>
                      <Input
                        placeholder="Nome completo do cliente"
                        className="bg-white"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Assinatura do Cliente
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-white text-center">
                        <p className="text-sm text-gray-500">
                          Clique para coletar assinatura
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <Button
                    className="w-full bg-black hover:bg-gray-800"
                    disabled={!elevatorState || !clientName}
                    onClick={handleCheckoutClick}
                  >
                    Realizar Checkout
                  </Button>
                </Card>
              </TabsContent>

              <TabsContent value="historico">
                <Card className="p-6 border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-gray-900" />
                    <h2 className="text-lg">Histórico do Equipamento</h2>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Todas as interações anteriores com este equipamento
                  </p>

                  <div className="space-y-4">
                    {history.map((entry, index) => (
                      <div
                        key={index}
                        className="border-b border-gray-200 pb-4 last:pb-0 last:border-none"
                      >
                        <div className="mb-2">
                          <p className="text-sm">
                            <span className="text-gray-900">{entry.date}</span>
                            <span className="text-gray-500">
                              {" "}
                              às {entry.time}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500">
                            Técnico: {entry.technician}
                          </p>
                        </div>
                        <p className="text-sm text-gray-900 mb-1">
                          {entry.summary}
                        </p>
                        <p className="text-sm text-gray-600">{entry.details}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
