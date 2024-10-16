const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const config = require('./config.js');
const { Pool } = require('pg');

const app = express();
const db = new Pool(config);
const PORT = process.env.PORT || 3000;


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); 
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: '1234', 
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, 
        maxAge: 60 * 1000 
    }
}));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/home', (req, res) => {
    if (req.session.loggedin == false) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'views', 'home.html')); 
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/views', 'register.html'));
});

app.post('/register', async (req, res) => {
    const { nombre, apellido, email, contraseña, telefono } = req.body;
    const regexLetras = /^[A-Za-z\s]+$/;  
    const regexNum = /^[0-9]+$/;          

    // Validaciones
    if (!regexLetras.test(nombre) || !regexLetras.test(apellido)) {
        return res.status(400).json({ message: 'Nombre y apellido solo deben contener letras.' });
    }
    
    if (!regexNum.test(telefono)) {
        return res.status(400).json({ message: 'El teléfono solo puede contener números.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(contraseña, 10);
        const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        
        if (result.rows.length > 0) {
            return res.status(400).json({ message: 'El email ya está registrado' });
        } else {
            await db.query('INSERT INTO usuarios(first_name, last_name, email, password, phone) VALUES($1, $2, $3, $4, $5)',
                [nombre, apellido, email, hashedPassword, telefono]);
            return res.status(201).json({ message: 'Usuario registrado exitosamente.' });
        }
    } catch (err) {
        console.error('Error during registration: ', err);
        return res.status(500).send('Internal Server Error');
    }
});


app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'views', 'login.html')); 
});

app.post('/login', async (req, res) => {
    const { email, contraseña } = req.body;
    try {
        const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const match = await bcrypt.compare(contraseña, user.password);
            if (match) {
                req.session.loggedin = true;
                req.session.nombre = user.first_name;
                req.session.apellido = user.last_name;
                req.session.userId = user.id;
                console.log('Sesión iniciada con expiración:', req.session.cookie);

                res.redirect('/home'); 
            } else {
                res.redirect('/login?error=incorrect-password'); 
            }
        } else {
            res.redirect('/login?error=user-not-found');
        }
    } catch (err) {
        console.error('Error during Login', err);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});


app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
