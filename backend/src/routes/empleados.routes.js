const router = require('express').Router();
const ctrl = require('../controllers/empleados.controller');

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);


const upload = require('../middleware/upload');
router.post('/import', upload.single('file'), ctrl.importCsv);

module.exports = router;
