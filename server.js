import express from "express";
import router from "./routes/public.js";
import mongoose from "mongoose";
import jwt  from "jsonwebtoken";
import dotenv from "dotenv";
import { engine } from 'express-handlebars';
import bcrypt from 'bcrypt'
const { body, validationResult } = require('express-validator');

dotenv.config()
const app = express()

// Config bootstrap
app.use('/bootstrap', express.static('./node_modules/bootstrap/dist'))

// configuração do handlebars
app.engine('handlebars', engine())
app.set('view engine', 'handlebars')
app.set('views', './views')

app.use(express.json())
// conectando com banco de dados
mongoose.connect('mongodb://127.0.0.1:27017/acessojwt', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ Conectado ao MongoDB');
  })
  .catch((err) => {
    console.log('❌ Erro ao se conectar ao MongoDB:', err);
});

const token = jwt.sign(
    { userId: 123 }, 
    'chavepadrao123', 
    { expiresIn: '1h' }
  );
  
  console.log(token);
// Validando acesso
app.get('/user/validateToken', (req, res) =>{
    const tokenHeaderKey = process.env.TOKEN_HEADER_KEY;
    const jwtSecretKey = process.env.JWT_SECRET_KEY;
    
    const token = req.header(tokenHeaderKey)

    if(!token){
        return res.status(403).send("Token não fornecido")
    }

    try {
        const verified = jwt.verify(token, jwtSecretKey);
        return res.status(200).send({
            message: "Token verificado com sucesso!",
            data: verified
        })
    } catch (error) {
        return res.status(401).send({
            message: "Token Inavlido ou expirado",
            error: error.message
        })
    }
})

app.get('/', (req, res)=>{
    res.render('forms')
})

const SECRET_KEY = 'entryLevelEy';

const userFake = {
    email: 'user@emial.com',
    senhaHash: bcrypt.hashSync('123456', 10)
}

app.post('/login',[
    body('email').isEmail().withMessage('Email inválido'),
    body('senha').isLength({min: 6}).withMessage('Senha muito curta')
], (req, res)=>{
    const erros = validationResult(req)
    if(!erros.isEmpty()){
        return res.status(400).json({erros: erros.array()})
    }

    const {email, senha} = req.body

    if(email !== userFake.email || !bcrypt.compareSync(senha, usuerFake.senhaHash)){
      return res.status(401).json({ erro: 'Credenciais Inválidas'})  
    }

    const token = jwt.sign({email: userFake.email},SECRET_KEY,{expiresIn:'1h'})
    res.json({token})

})



// app.get('/', (req, res)=>{  
//     res.send("🚀 Deu bom!")
// })

app.use('/', router)

// public
// app.use(express.static(path.join(__dirname, 'public')));


app.listen(3000, ()=>{console.log("Servidor rodando")})

