import mongoose from 'mongoose';

const PerfilSchema = new mongoose.Schema({
  consagracaoQuando: Date,
  consagracaoData: Date,
  formadorNome: String,
  motivacao: String,
  conversaoData: Date,
  endereco: String,
  aceitaCelula: String,
  sairMotivo: String,
  ocupacao: String,
  tempoDisponivel: String,
  email: { type: String, required: true } 
});

export default mongoose.model('PerfilUsuario', PerfilSchema);