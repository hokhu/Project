const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();
const config = require('./config.js');
const { Pool } = require('pg');
const db = new Pool(config);

const PORT = process.env.PORT || 3000;

app.set('views', path.join(__dirname, '/public/views'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index', {nombre: req.session.nombre});
});
app.get('/register',(req, res)=>{
    res.render('register');
})

app.post('/register', async (req,res)=>{
    const {nombre,apellido,email,contraseña} = req.body;
    const hashedPassword = await bcrypt.hash(contraseña,10);
    try{
        const result = await db.query('Select * from usuarios where email = $1',[email]);
        if(result.rows.length > 0){
            return res.send('El email ya esta registrado');
        }else{
            await db.query('INSERT INTO usuarios(first_name,last_name,email,password) VALUES($1,$2,$3,$4)',
                [nombre,apellido,email,hashedPassword]);
            res.redirect('/public/index');
        }
    }catch (err){
        console.error('Error during registration: ', err);
        res.status(500).send('Internal Server Error');
    }
});



app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
