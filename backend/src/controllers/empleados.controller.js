const pool = require('../db');
const fs = require('fs');
const { parse } = require('@fast-csv/parse');

const send500 = (res, err) => res.status(500).json({ error: 'Database error', detail: err.code || err.message });

exports.list = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM empleados');
    res.json(rows);
  } catch (err) { send500(res, err); }
};

exports.getById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    const [rows] = await pool.query('SELECT * FROM empleados WHERE id_empleados = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'No existe ese empleado' });
    res.json(rows[0]);
  } catch (err) { send500(res, err); }
};

exports.create = async (req, res) => {
  try {
    const { name, lastname, email } = req.body;
    if (!name || !lastname || !email) return res.status(400).json({ error: 'name, lastname, email son obligatorios' });
    const [result] = await pool.query(
      'INSERT INTO empleados (name, lastname, email) VALUES (?, ?, ?)',
      [name, lastname, email]
    );
    res.status(201).json({ id: result.insertId, name, lastname, email });
  } catch (err) { send500(res, err); }
};

exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    const { name, lastname, email } = req.body;
    const [result] = await pool.query(
      'UPDATE empleados SET name = ?, lastname = ?, email = ? WHERE id_empleados = ?',
      [name, lastname, email, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'No existe ese empleado' });
    res.json({ message: 'Empleado actualizado' });
  } catch (err) { send500(res, err); }
};

exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    const [result] = await pool.query('DELETE FROM empleados WHERE id_empleados = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'No existe ese empleado' });
    res.json({ message: 'Empleado eliminado' });
  } catch (err) {
    send500(res, err);
  }
};

exports.importCsv = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Adjunta un archivo CSV en el campo "file"' });

    const rows = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(parse({ headers: true, ignoreEmpty: true, trim: true }))
        .on('error', reject)
        .on('data', (row) => {
          const name = (row.name || row.Nombre || row.nombre || '').toString().trim();
          const lastname = (row.lastname || row.Apellido || row.apellido || '').toString().trim();
          const email = (row.email || row.Email || row.correo || '').toString().trim();
          if (name && lastname && email) rows.push({ name, lastname, email });
        })
        .on('end', resolve);
    });

    if (!rows.length) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'El CSV no tiene filas válidas con columnas name, lastname, email' });
    }

    const conn = await pool.getConnection();
    let inserted = 0, updated = 0, skipped = 0;
    try {
      await conn.beginTransaction();
      for (const r of rows) {
        const [result] = await conn.query(
          `INSERT INTO empleados (name, lastname, email) VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE name = VALUES(name), lastname = VALUES(lastname)`,
          [r.name, r.lastname, r.email]
        );
        if (result.affectedRows === 1) inserted++;
        else if (result.affectedRows === 2) updated++;
        else skipped++;
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
      fs.unlink(req.file.path, () => {});
    }

    res.json({ total: rows.length, inserted, updated, skipped });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error procesando el CSV', detail: err.message });
  }
};
