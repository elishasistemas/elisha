import { useState } from "react";
import {
  ArrowLeft,
  FileText,
  Package,
  User,
  Wrench,
  AlertCircle,
  Phone,
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
import { CorrectiveOSData, ElevatorState, HistoryEntry } from "./types";

interface CorrectiveOSProps {
  data: CorrectiveOSData;
  history: HistoryEntry[];
  onCheckout?: (elevatorState: ElevatorState, clientName: string) => void;
}

/**
 * Componente de OS Corretiva
 * 
 * Características únicas:
 * - Sem checklist
 * - Possui descrição do cliente + solicitante + telefone
 * - Possui laudo técnico completo
 * - Estado do elevador obrigatório antes do checkout
 * - Estrutura idêntica ao Chamado (mas lógica de negócio diferente)
 */
export function CorrectiveOS({ data, history, onCheckout }: CorrectiveOSProps) {
  const [elevatorState, setElevatorState] = useState<ElevatorState>(null);
  const [clientName, setClientName] = useState("");

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
                      Corretiva
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
                {/* Step 1: Descrição do Cliente */}
                <div className="relative flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm z-10">
                      1
                    </div>
                  </div>
                  <Card className="flex-1 p-6 border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-5 h-5 text-gray-900" />
                      <h2 className="text-lg">Descrição do Cliente</h2>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Problema relatado pelo cliente
                    </p>
                    <div className="space-y-4">
                      <div>
                        <Textarea
                          placeholder="Descreva o problema informado pelo cliente..."
                          className="min-h-[80px] resize-none border-gray-200"
                          defaultValue={data.clientDescription}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-700 mb-2">
                            <User className="w-4 h-4 inline mr-1" />
                            Nome do Solicitante
                          </label>
                          <Input
                            placeholder="Nome completo"
                            defaultValue={data.requesterName}
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 mb-2">
                            <Phone className="w-4 h-4 inline mr-1" />
                            Telefone
                          </label>
                          <Input
                            placeholder="(00) 00000-0000"
                            defaultValue={data.requesterPhone}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Step 2: Laudo Técnico */}
                <div className="relative flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm z-10">
                      2
                    </div>
                  </div>
                  <Card className="flex-1 p-6 border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-5 h-5 text-gray-900" />
                      <h2 className="text-lg">Laudo Técnico</h2>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Documente o que foi feito e adicione evidências
                    </p>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-700 mb-2">
                          O que foi feito
                        </label>
                        <Textarea
                          placeholder="Descreva o que foi realizado..."
                          className="min-h-[80px] resize-none border-gray-200"
                          defaultValue={data.technicalReport?.workDone}
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-700 mb-2">
                          Observação
                        </label>
                        <Textarea
                          placeholder="Observações adicionais..."
                          className="min-h-[80px] resize-none border-gray-200"
                          defaultValue={data.technicalReport?.observations}
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
            <Tabs defaultValue="descricao" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="descricao" className="text-xs">
                  <div className="flex flex-col items-center gap-1">
                    <FileText className="w-4 h-4" />
                    <span>Descrição</span>
                  </div>
                </TabsTrigger>

                <TabsTrigger value="laudo" className="text-xs">
                  <div className="flex flex-col items-center gap-1">
                    <FileText className="w-4 h-4" />
                    <span>Laudo</span>
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

              <TabsContent value="descricao">
                <Card className="p-6 border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-gray-900" />
                    <h2 className="text-lg">Descrição do Cliente</h2>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Problema relatado pelo cliente
                  </p>
                  <div className="space-y-4">
                    <div>
                      <Textarea
                        placeholder="Descreva o problema informado pelo cliente..."
                        className="min-h-[100px] resize-none border-gray-200"
                        defaultValue={data.clientDescription}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        Nome do Solicitante
                      </label>
                      <Input
                        placeholder="Nome completo"
                        defaultValue={data.requesterName}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        <Phone className="w-4 h-4 inline mr-1" />
                        Telefone
                      </label>
                      <Input
                        placeholder="(00) 00000-0000"
                        defaultValue={data.requesterPhone}
                      />
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="laudo">
                <Card className="p-6 border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-gray-900" />
                    <h2 className="text-lg">Laudo Técnico</h2>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Documente o que foi feito e adicione evidências
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        O que foi feito
                      </label>
                      <Textarea
                        placeholder="Descreva o que foi realizado..."
                        className="min-h-[80px] resize-none border-gray-200"
                        defaultValue={data.technicalReport?.workDone}
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Observação
                      </label>
                      <Textarea
                        placeholder="Observações adicionais..."
                        className="min-h-[80px] resize-none border-gray-200"
                        defaultValue={data.technicalReport?.observations}
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
