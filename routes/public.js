import express from 'express'

const router = express.Router()

router.get('/', (req, res) =>{
    res.send('chegou no public!')
})

router.post("/cadastro", (req, res) => {
    res.status(201).json({ message: "Usuário criado com sucesso" });
  });

export default router