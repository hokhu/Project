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

const isAuthenticated = (req, res, next) => {
    if (req.session.loggedin) {
        next();
    } else {
        res.redirect('/login');
    }
};

const isAdmin = (req, res, next) => {
    if (req.session.isAdmin) {
        next();
    } else {
        res.redirect('/taskList');
    }
};


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/views', 'register.html'));
});

app.post('/register', async (req, res) => {
    const { nombre, apellido, email, contraseña, telefono } = req.body;
    const regexLetras = /^[A-Za-z\s]+$/;  
    const regexNum = /^[1-9]+$/;         
    const regexEmail = /^[A-Za-z1-9._%+-]{4,}@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;  

  
    if (!regexLetras.test(nombre) || !regexLetras.test(apellido)) {
        return res.status(401).json({ message: 'Nombre y apellido solo deben contener letras.' });
    }
    if (nombre.length < 4 || apellido.length < 4) {
        return res.status(401).json({ message: 'Nombre y apellido deben tener al menos 5 caracteres.' });
    }
    if (!regexNum.test(telefono) || telefono.length < 10) {
        return res.status(401).json({ message: 'El teléfono debe contener solo números y tener al menos 10 caracteres.' });
    }
    if (!regexEmail.test(email)) {
        return res.status(401).json({ message: 'El correo debe tener minimo 4 caracteres' });
    }

    try {
        const hashedPassword = await bcrypt.hash(contraseña, 11);
        const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        
        if (result.rows.length > 0) {
            return res.status(401).json({ message: 'El email ya está registrado' });
        }

     
        const newUser = await db.query(
            'INSERT INTO usuarios (first_name, last_name, email, password, phone, is_admin) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, first_name, last_name, is_admin',
            [nombre, apellido, email, hashedPassword, telefono, false]
        );

       
        const user = newUser.rows[0];
        req.session.loggedin = true;
        req.session.nombre = user.first_name;
        req.session.apellido = user.last_name;
        req.session.userId = user.id;
        req.session.isAdmin = user.is_admin;

        return res.status(201).json({ 
            message: 'Usuario registrado exitosamente.',
            success: true
        });

    } catch (err) {
        console.error('Error during registration: ', err);
        return res.status(500).json({ 
            message: 'Error interno del servidor',
            success: false
        });
    }
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'views', 'login.html')); 
});

app.post('/login', async (req, res) => {
    const { email, contraseña } = req.body;
    try {
        const result = await db.query(
            'SELECT id, first_name, last_name, password, is_admin FROM usuarios WHERE email = $1',
            [email]
        );
        
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const match = await bcrypt.compare(contraseña, user.password);
            if (match) {
                req.session.loggedin = true;
                req.session.nombre = user.first_name;
                req.session.apellido = user.last_name;
                req.session.userId = user.id;
                req.session.isAdmin = user.is_admin;
                console.log('Sesión iniciada con expiración:', req.session.cookie);

                if (user.is_admin) {
                    res.redirect('/home');
                } else {
                    res.redirect('/taskList');
                }
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


app.get('/taskList', isAuthenticated, (req, res) => {
    if (req.session.isAdmin) {
        return res.redirect('/home');
    }
    res.sendFile(path.join(__dirname, 'public/views', 'taskList.html'));
});


app.get('/home', isAuthenticated, isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/views', 'home.html'));
});


app.get('/api/tareas', isAuthenticated, (req, res) => {
    db.query(
        'SELECT id, name, description, creation_date, due_date FROM Tareas WHERE user_id = $1',
        [req.session.userId],
        (err, result) => {
            if (err) {
                console.error('Error obteniendo las tareas:', err);
                return res.status(500).json({ error: 'Error interno del servidor' });
            }
            res.json(result.rows);
        }
    );
});

app.post('/api/tareas', isAuthenticated, async (req, res) => {
    const { name, description, dueDate } = req.body;

    try {
        const result = await db.query(
            'INSERT INTO Tareas (name, description, creation_date, due_date, user_id) VALUES ($1, $2, NOW(), $3, $4) RETURNING *',
            [name, description, dueDate, req.session.userId]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al crear la tarea:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
app.delete('/api/tareas/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const userId = req.session.userId;  
    const isAdmin = req.session.isAdmin; 
    try {
        let query, queryParams;

        if (isAdmin) {
           
            query = 'DELETE FROM Tareas WHERE id = $1 RETURNING *';
            queryParams = [id];
        } else {
           
            query = 'DELETE FROM Tareas WHERE id = $1 AND user_id = $2 RETURNING *';
            queryParams = [id, userId];
        }

        const result = await db.query(query, queryParams);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Tarea no encontrada o no tiene permisos para eliminarla' });
        }

        res.json({ message: 'Tarea eliminada exitosamente' });
    } catch (err) {
        console.error('Error al eliminar la tarea:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
app.get('/api/tareas/:id', isAuthenticated, isAdmin, async (req, res) => {
    const { id } = req.params;  
    
    try {
       
        const result = await db.query(
            `SELECT t.id, t.name, t.description, t.due_date, u.id AS user_id 
             FROM tareas t 
             LEFT JOIN usuarios u ON u.id = t.user_id 
             WHERE t.id = $1`,  
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Tarea no encontrada' });
        }

        res.json(result.rows[0]);  
    } catch (err) {
        console.error('Error al obtener la tarea:', err);
        res.status(500).json({ message: 'Error al obtener la tarea' });
    }
});

app.put('/api/editarTareas/:id', isAuthenticated,isAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, description, dueDate, userId } = req.body; 

    if (!name?.trim() || !description?.trim() || !dueDate) {
        return res.status(400).json({ 
            message: 'Nombre, descripción y fecha son campos requeridos' 
        });
    }

    try {
        const dueDateObj = new Date(dueDate);
        if (isNaN(dueDateObj.getTime())) {
            return res.status(400).json({ 
                message: 'Formato de fecha inválido' 
            });
        }

        let query;
        let queryParams;

        if (isAdmin) {
            query = `UPDATE tareas SET name = $1, description = $2, due_date = $3 
                     WHERE id = $4 RETURNING *`;
            queryParams = [name.trim(), description.trim(), dueDate, id];
        } else {
            query = `UPDATE tareas SET name = $1, description = $2, due_date = $3 
                     WHERE id = $4 AND user_id = $5 RETURNING *`;
            queryParams = [name.trim(), description.trim(), dueDate, id, userId];
        }

        const updateResult = await db.query(query, queryParams);

        if (updateResult.rows.length === 0) {
            return res.status(404).json({ 
                message: 'Tarea no encontrada o no tienes permiso para editarla' 
            });
        }

        res.json({
            message: 'Tarea actualizada exitosamente',
            tarea: updateResult.rows[0]
        });

    } catch (err) {
        console.error('Error al actualizar la tarea:', err);
        res.status(500).json({ 
            message: 'Error al actualizar la tarea',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

app.get('/api/users', isAuthenticated, async (req, res) => {
    const id = req.session.userId; 
    try {
        const result = await db.query('SELECT * FROM usuarios WHERE id = $1', [id]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]); 
        } else {
            res.status(404).json({ message: 'Usuario no encontrado' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error en la base de datos' });
    }
});



app.get('/api/admin/tareas', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT t.id, u.first_name, u.last_name, t.name, t.description, t.creation_date, t.due_date ' + 
            'FROM Usuarios u LEFT JOIN Tareas t ON u.id = t.user_id WHERE u.is_admin = FALSE;'
        );
         console.log(result.rows);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener todas las tareas:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.put('/api/users/:id', isAuthenticated, async (req, res) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneRegex = /^[0-9]{10}$/;
    
    const { id } = req.params;  
    const { email, phone, password } = req.body;

    if (phone && !phoneRegex.test(phone)) {
        return res.status(400).json({ message: 'El número de teléfono debe tener 10 dígitos y solo números.' });
    }

    if (email && !emailRegex.test(email)) {
        return res.status(400).json({ message: 'El correo electrónico no tiene un formato válido.' });
    }

    try {
        const result = await db.query('SELECT * FROM usuarios WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const updateFields = [];
        const updateValues = [];

        if (email) {
            updateFields.push('email');
            updateValues.push(email);
        }
        if (phone) {
            updateFields.push('phone');
            updateValues.push(phone);
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 11);
            updateFields.push('password');
            updateValues.push(hashedPassword);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No se proporcionaron datos para actualizar.' });
        }

        updateFields.push('id');
        updateValues.push(id);

        let queryStr = `UPDATE usuarios SET ${updateFields.map((field, idx) => `${field} = $${idx + 1}`).join(', ')} WHERE id = $${updateFields.length} RETURNING *`;

        const updatedUser = await db.query(queryStr, updateValues);

        res.json(updatedUser.rows[0]);

    } catch (err) {
        console.error('Error al actualizar el perfil', err);
        res.status(500).json({ message: 'Error al actualizar el perfil' });
    }
});


app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});