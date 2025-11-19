import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { v4 as uuidv4 } from 'uuid';

// Simulação temporária em memória
const clientes: any[] = [];

@Injectable()
export class ClientesService {
  async findAll() {
    return clientes;
  }

  async findOne(id: string) {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    return cliente;
  }

  async create(dto: CreateClienteDto) {
    const novoCliente = {
      id: uuidv4(),
      ...dto,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    clientes.push(novoCliente);
    return novoCliente;
  }
}
