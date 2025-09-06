import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  Default
} from "sequelize-typescript";
import Empresa from "./Empresa";
import Contato from "./Contato";
import User from "./User";

@Table({ tableName: "Negocios" })
class Negocio extends Model<Negocio> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column(DataType.STRING)
  title: string;

  @Column(DataType.DECIMAL(10, 2))
  value: number;

  @Default("INICIO")
  @Column(DataType.STRING)
  pipe: string; // Ex: 'Pipe Vendas', 'Pipe Suporte'

  @Default("OPORTUNIDADE")
  @Column(DataType.STRING)
  stage: string; // Ex: 'Oportunidade', 'Proposta Enviada', 'Ganhos'

  @ForeignKey(() => Empresa)
  @Column
  empresaId: number;

  @BelongsTo(() => Empresa)
  empresa: Empresa;

  @ForeignKey(() => Contato)
  @Column
  contatoId: number;

  @BelongsTo(() => Contato)
  contato: Contato;

  @ForeignKey(() => User)
  @Column
  userId: number; // Usuário responsável pelo negócio

  @BelongsTo(() => User)
  user: User;

  @Column
  createdAt: Date;

  @Column
  updatedAt: Date;
}

export default Negocio;
