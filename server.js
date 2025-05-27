import express from "express";
import router from "./routes/public.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { engine } from 'express-handlebars';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import User from "./models/User.js";
import PerfilUsuario from "./models/PerfilUsuario.js";

dotenv.config();
const app = express();

// Config bootstrap
app.use('/bootstrap', express.static('./node_modules/bootstrap/dist'));

// configuração do handlebars
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// conectando com banco de dados
mongoose.connect('mongodb://127.0.0.1:27017/usersjwt', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('✅ Conectado ao MongoDB');
  })
  .catch((err) => {
    console.log('❌ Erro ao se conectar ao MongoDB:', err);
  });

// Validando acesso via token
app.get('/user/validateToken', (req, res) => {
  const tokenHeaderKey = process.env.TOKEN_HEADER_KEY || 'Authorization';
  const jwtSecretKey = process.env.JWT_SECRET_KEY || 'entryLevelEy'; // ajuste conforme seu .env
  const token = req.header(tokenHeaderKey);

  if (!token) {
    return res.status(403).send("Token não fornecido");
  }

  try {
    const verified = jwt.verify(token, jwtSecretKey);
    return res.status(200).send({
      message: "Token verificado com sucesso!",
      data: verified
    });
  } catch (error) {
    return res.status(401).send({
      message: "Token inválido ou expirado",
      error: error.message
    });
  }
});

app.get('/', (req, res) => {
  res.render('forms');
});

app.get('/cadastro/perfil', (req, res) => {
  const { email } = req.query;
  res.render('perfilForm', { email }); 
});

// Usuário fake para teste de login
const SECRET_KEY = process.env.JWT_SECRET_KEY || 'entryLevelEy';

const userFake = {
  email: 'user@email.com',
  senhaHash: bcrypt.hashSync('123456', 10)
};

app.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('senha').isLength({ min: 6 }).withMessage('Senha muito curta')
], (req, res) => {
  const erros = validationResult(req);
  if (!erros.isEmpty()) {
    return res.status(400).json({ erros: erros.array() });
  }

  const { email, senha } = req.body;

  if (email !== userFake.email || !bcrypt.compareSync(senha, userFake.senhaHash)) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  const token = jwt.sign({ email: userFake.email }, SECRET_KEY, { expiresIn: '1h' });
  res.json({ token });
});

// Middleware para proteger rotas)
function autenticarJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ erro: 'Token não fornecido' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, SECRET_KEY, (err, usuario) => {
    if (err) return res.status(403).json({ erro: 'Token inválido' });
    req.usuario = usuario;
    next();
  });
}

app.post('/cadastro', async (req, res) => {
  const { email, nome, senha } = req.body;

  try {
    const senhaHash = bcrypt.hashSync(senha, 10);
    const novoUsuario = new User({ email, nome, senhaHash });
    await novoUsuario.save();

    
    return res.redirect(`/cadastro/perfil?email=${encodeURIComponent(email)}`);
  } catch (err) {
    console.error('Erro ao salvar usuário:', err);
    return res.status(500).json({ erro: "Erro ao salvar no banco", detalhes: err.message });
  }
});

app.post('/cadastro/perfil', async (req, res) => {
    try {
      const {
        consagracaoQuando,
        consagracaoData,
        formadorNome,
        motivacao,
        conversaoData,
        endereco,
        aceitaCelula,
        sairMotivo,
        ocupacao,
        tempoDisponivel,
        email
      } = req.body;
  
      
      const novoPerfil = new PerfilUsuario({
        consagracaoQuando,
        consagracaoData,
        formadorNome,
        motivacao,
        conversaoData,
        endereco,
        aceitaCelula,
        sairMotivo,
        ocupacao,
        tempoDisponivel,
        email
      });
  
      await novoPerfil.save();
  
      const usuario = await User.findOne({ email: email });
  
      if (!usuario) {
        return res.status(404).send('Usuário não encontrado');
      }
  
      res.render('sucesso', { nome: usuario.nome });
    } catch (err) {
      console.error('❌ Erro ao salvar perfil:', err.message);
      res.status(500).send('Erro ao salvar perfil.');
    }
  });
  

//  rota pública
app.use('/', router);

app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});
