import express from "express";
import mongoose from "mongoose";
import bcpritpt from "bcript";
import jwt from "jsonwebtoken";
import User from "../models/User";

const router = express.Router()

router.post('/registro', async (req, res) =>{
    const {email, senha} = req.body

    try {
        const userExist = await User.findOne({email})
        if(userExist) return res.status(401).json({msg: 'Úsuario já existe'})

        const hashedPassword = await bcpritpt.hash(senha, 10) 
        const newUser = new User({email, senha: hashedPassword})   

        await newUser.save()
        res.status(201).json({msg: 'Úsuario registrado com sucesso!'})
    } catch(err){
        res.status(500).json({msg: 'Erro ao criar úsuario', err})
    }
})

router.post('/login', async (req, res)=>{
    const {email, senha} = req.body

    try{
        const user = await User.findOne({email})
        if(!user) return res.status(400).json({msg: 'Úsuario não encontrado'})

        
        const isMatch = await bcpritpt.compare(senha, user.senha)
        if(!isMatch) return res.status(400).json({msg: 'Senha Incorreta'})   
            
        const token = jwt.sign(
            {id: user._id},
            process.env.JWT_SECRET_KEY || 'chavepadrao123',
            {expiresIn: '1h'}
        )    

        res.json({token, user: {id: user._id, email: user.email}})
    } catch(err){
        res.status(500).json({error: err.message})
    }
})

export default router;