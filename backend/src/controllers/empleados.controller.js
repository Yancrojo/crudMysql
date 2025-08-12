const pool = require('../db');
const fs = require('fs');
const { parse } = require('@fast-csv/parse');

const send500 = (res, err) => res.status(500).json({ error: 'Database error', detail: err.code || err.message });// esto es un comentario

exports.list = async (req, res) => { // Listar todos los empleados
  try {
    const [rows] = await pool.query('SELECT * FROM empleados'); // Obtener todos los empleados
    res.json(rows);
  } catch (err) { send500(res, err); }
};

exports.getById = async (req, res) => { // Obtener empleado por ID
  try {
    const id = Number(req.params.id); // Obtener el ID del parámetro de la solicitud
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' }); // ID no es un número
    const [rows] = await pool.query('SELECT * FROM empleados WHERE id_empleados = ?', [id]); // Obtener empleado por ID
    if (!rows.length) return res.status(404).json({ error: 'No existe ese empleado' });
    res.json(rows[0]);
  } catch (err) { send500(res, err); }
};

exports.create = async (req, res) => { // Crear un nuevo empleado
  try {
    const { name, lastname, email } = req.body;
    if (!name || !lastname || !email) return res.status(400).json({ error: 'name, lastname, email son obligatorios' }); // Validación de campos obligatorios
    const [result] = await pool.query(
      'INSERT INTO empleados (name, lastname, email) VALUES (?, ?, ?)',
      [name, lastname, email]
    );
    res.status(201).json({ id: result.insertId, name, lastname, email }); // Respuesta al crear un nuevo empleado
  } catch (err) { send500(res, err); }
};

exports.update = async (req, res) => { // Actualizar un empleado
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' }); // ID no es un número
    const { name, lastname, email } = req.body;
    const [result] = await pool.query(
      'UPDATE empleados SET name = ?, lastname = ?, email = ? WHERE id_empleados = ?',
      [name, lastname, email, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'No existe ese empleado' }); // Empleado no encontrado
    res.json({ message: 'Empleado actualizado' });
  } catch (err) { send500(res, err); }
};

exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' }); // ID no es un número
    await pool.query('DELETE FROM proyect_employee WHERE id_empleados = ?', [id]); // Eliminar de la tabla proyect_employee
    await pool.query('DELETE FROM task WHERE id_empleados = ?', [id]); // Eliminar de la tabla task
    const [result] = await pool.query('DELETE FROM empleados WHERE id_empleados = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'No existe ese empleado' }); // Empleado no encontrado
    res.json({ message: 'Empleado eliminado' });
  } catch (err) {
    send500(res, err);
  }
};

exports.importCsv = async (req, res) => { // Importar empleados desde un archivo CSV
  try {
    if (!req.file) return res.status(400).json({ error: 'Adjunta un archivo CSV en el campo "file"' }); // Validar archivo CSV

    const rows = [];
    await new Promise((resolve, reject) => { // Leer el archivo CSV
      fs.createReadStream(req.file.path)
        .pipe(parse({ headers: true, ignoreEmpty: true, trim: true })) // Analizar el archivo CSV
        .on('error', reject)
        .on('data', (row) => {
          const name = (row.name || row.Nombre || row.nombre || '').toString().trim(); // Obtener nombre
          const lastname = (row.lastname || row.Apellido || row.apellido || '').toString().trim(); // Obtener apellido
          const email = (row.email || row.Email || row.correo || '').toString().trim(); // Obtener correo
          if (name && lastname && email) rows.push({ name, lastname, email });
        })
        .on('end', resolve);
    });

    if (!rows.length) { // Validar filas CSV
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'El CSV no tiene filas válidas con columnas name, lastname, email' }); // Validar filas CSV
    }

    const conn = await pool.getConnection(); // Obtener conexión de la base de datos
    let inserted = 0, updated = 0, skipped = 0; // Contadores para estadísticas
    try {
      await conn.beginTransaction(); // Iniciar transacción
      for (const r of rows) {
        const [result] = await conn.query( // Ejecutar consulta
          `INSERT INTO empleados (name, lastname, email) VALUES (?, ?, ?) 
           ON DUPLICATE KEY UPDATE name = VALUES(name), lastname = VALUES(lastname)`,
          [r.name, r.lastname, r.email]
        );
        if (result.affectedRows === 1) inserted++; // Nuevo registro insertado
        else if (result.affectedRows === 2) updated++; // Registro actualizado
        else skipped++; // Registro omitido
      }
      await conn.commit(); // Confirmar transacción
    } catch (e) { // Manejar errores
      await conn.rollback(); // Revertir transacción
      throw e; // Lanzar error
    } finally { // Liberar recursos
      conn.release(); // Liberar conexión
      fs.unlink(req.file.path, () => {}); // Eliminar archivo temporal
    }

    res.json({ total: rows.length, inserted, updated, skipped }); // Respuesta final
  } catch (err) { // Manejar errores
    console.error(err);
    res.status(500).json({ error: 'Error procesando el CSV', detail: err.message });
  }
};
